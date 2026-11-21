
/*
 * Общий клиент для GET-запросов.
 * Он не знает, что такое задача или категория.
 */

// Единый класс ошибок API
export class ApiError extends Error {
  constructor(message, {
    kind,
    status = null,
    code = null,
    details = null,
    url = null,
    cause
  } = {}) {
    super(
      message,
      cause === undefined ? undefined : { cause }
    );

    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.code = code;
    this.details = details;
    this.url = url;
  }
}


// Проверяем и подготавливаем адрес сервера
function normalizeBaseUrl(baseUrl) {
  if (typeof baseUrl !== "string") {
    throw new TypeError("baseUrl должен быть строкой");
  }

  let url;

  try {
    url = new URL(baseUrl);
  } catch {
    throw new TypeError("baseUrl должен быть абсолютным URL");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new TypeError("Допускается только http или https");
  }

  if (url.search || url.hash) {
    throw new TypeError(
      "baseUrl не должен содержать query или hash"
    );
  }

  return url.href.replace(/\/+$/, "");
}


// 1. ФОРМИРОВАНИЕ URL
export function buildUrl(baseUrl, path, query = {}) {
  const base = normalizeBaseUrl(baseUrl);

  if (typeof path !== "string" || !path.trim()) {
    throw new TypeError("Путь должен быть непустой строкой");
  }

  if (
    path.includes("?") ||
    path.includes("#") ||
    /^[a-z][a-z\d+.-]*:/i.test(path) ||
    path.startsWith("//")
  ) {
    throw new TypeError("Ожидается относительный путь без query");
  }

  if (
    query === null ||
    typeof query !== "object" ||
    Array.isArray(query)
  ) {
    throw new TypeError("query должен быть объектом");
  }

  const cleanPath = path.replace(/^\/+|\/+$/g, "");

  if (!cleanPath) {
    throw new TypeError("Путь не должен быть пустым");
  }

  const url = new URL(`${base}/${cleanPath}`);

  for (const [name, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    url.searchParams.set(name, String(value));
  }

  return url.href;
}


// 2. СОЗДАНИЕ HTTP-КЛИЕНТА
export function createApiClient({
  baseUrl,
  fetchFn = globalThis.fetch,
  timeoutMs = 2000
} = {}) {

  // Проверяем настройки заранее
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

  if (typeof fetchFn !== "function") {
    throw new TypeError("fetchFn должен быть функцией");
  }

  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) {
    throw new TypeError(
      "timeoutMs должен быть положительным целым числом"
    );
  }

  // Отправка одного GET-запроса
  async function requestJson(path, {
    query = {},
    signal,
    timeoutMs: requestTimeoutMs = timeoutMs
  } = {}) {

    if (
      !Number.isSafeInteger(requestTimeoutMs) ||
      requestTimeoutMs <= 0
    ) {
      throw new TypeError("Некорректное время ожидания");
    }

    const url = buildUrl(normalizedBaseUrl, path, query);

    const timeoutSignal = AbortSignal.timeout(requestTimeoutMs);

    const combinedSignal = signal === undefined
      ? timeoutSignal
      : AbortSignal.any([signal, timeoutSignal]);

    let response;

    // Сетевой этап: отдельно от проверки HTTP-ответа
    try {
      response = await fetchFn(url, {
        method: "GET",
        headers: {
          Accept: "application/json"
        },
        signal: combinedSignal
      });
    } catch (error) {
      // Внешняя отмена имеет приоритет
      if (signal?.aborted) {
        throw new ApiError("Запрос отменён", {
          kind: "aborted",
          url,
          cause: error
        });
      }

      // Истечение времени
      if (timeoutSignal.aborted) {
        throw new ApiError("Превышено время ожидания", {
          kind: "timeout",
          url,
          cause: error
        });
      }

      // Остальные отказы при получении ответа
      throw new ApiError("Сетевая ошибка запроса", {
        kind: "network",
        url,
        cause: error
      });
    }

    // Проверяем, что fetch вернул настоящий Response
    if (!(response instanceof Response)) {
      throw new ApiError("Получен неверный объект ответа", {
        kind: "invalid-response",
        url
      });
    }

    // HTTP-ошибку обрабатываем раньше успешного JSON
    if (!response.ok) {
      let code = null;
      let details = null;
      let message = `HTTP ${response.status}`;

      try {
        const contentType =
          response.headers.get("content-type") ?? "";

        if (contentType.toLowerCase().includes("application/json")) {
          const payload = await response.json();

          if (
            payload &&
            typeof payload === "object" &&
            payload.error &&
            typeof payload.error === "object"
          ) {
            if (typeof payload.error.message === "string") {
              message = payload.error.message;
            }

            if (typeof payload.error.code === "string") {
              code = payload.error.code;
            }

            if (payload.error.details !== undefined) {
              details = payload.error.details;
            }
          }
        }
      } catch {
        // Даже с повреждённым телом сохраняем HTTP-статус
      }

      throw new ApiError(message, {
        kind: "http",
        status: response.status,
        code,
        details,
        url
      });
    }

    // У ответа 204 нет тела
    if (response.status === 204) {
      return null;
    }

    // Успешный ответ должен быть JSON
    const contentType =
      response.headers.get("content-type") ?? "";

    if (!contentType.toLowerCase().includes("application/json")) {
      throw new ApiError(
        "Сервер вернул данные не в формате JSON",
        {
          kind: "invalid-response",
          url
        }
      );
    }

    // Читаем JSON успешного ответа
    try {
      return await response.json();
    } catch (error) {
      throw new ApiError("Не удалось разобрать JSON", {
        kind: "invalid-response",
        url,
        cause: error
      });
    }
  }

  return { requestJson };
}
