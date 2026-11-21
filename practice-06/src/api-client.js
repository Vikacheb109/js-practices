
export class ApiError extends Error {
  constructor(message, {
    kind,
    status = null,
    code = null,
    details = null,
    url = null,
    cause
  } = {}) {
    super(message, cause === undefined ? undefined : { cause });

    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.code = code;
    this.details = details;
    this.url = url;
  }
}

function normalizeBaseUrl(baseUrl) {
  if (typeof baseUrl !== "string") {
    throw new TypeError("baseUrl должен быть строкой");
  }

  let parsed;

  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new TypeError("Требуется абсолютный адрес API");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new TypeError("Допускаются только HTTP и HTTPS");
  }

  if (parsed.search || parsed.hash) {
    throw new TypeError("В baseUrl не должно быть query или hash");
  }

  return parsed.href.replace(/\/+$/, "");
}

export function buildUrl(baseUrl, path, query = {}) {
  const base = normalizeBaseUrl(baseUrl);

  if (typeof path !== "string" || !path.trim()) {
    throw new TypeError("Путь должен быть непустой строкой");
  }

  if (
    path.includes("?") ||
    path.includes("#") ||
    path.startsWith("//") ||
    /^[a-z][a-z\d+.-]*:/i.test(path)
  ) {
    throw new TypeError("Некорректный относительный путь");
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

export function createApiClient({
  baseUrl,
  fetchFn = globalThis.fetch,
  timeoutMs = 3000
} = {}) {
  const base = normalizeBaseUrl(baseUrl);

  if (typeof fetchFn !== "function") {
    throw new TypeError("fetchFn должен быть функцией");
  }

  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) {
    throw new TypeError("Некорректный timeoutMs");
  }

  async function requestJson(path, {
    method = "GET",
    query = {},
    body,
    signal,
    timeoutMs: requestTimeoutMs = timeoutMs
  } = {}) {
    if (typeof method !== "string") {
      throw new TypeError("HTTP-метод должен быть строкой");
    }

    const normalizedMethod = method.toUpperCase();

    if (!["GET", "POST", "PATCH", "DELETE"].includes(normalizedMethod)) {
      throw new TypeError("Неподдерживаемый HTTP-метод");
    }

    if (normalizedMethod === "GET" && body !== undefined) {
      throw new TypeError("GET-запрос не может иметь body");
    }

    if (
      !Number.isSafeInteger(requestTimeoutMs) ||
      requestTimeoutMs <= 0
    ) {
      throw new TypeError("Некорректное время ожидания");
    }

    const url = buildUrl(base, path, query);

    const headers = {
      Accept: "application/json"
    };

    const options = {
      method: normalizedMethod,
      headers
    };

    if (body !== undefined) {
      options.body = JSON.stringify(body);
      headers["Content-Type"] = "application/json";
    }

    const timeoutSignal = AbortSignal.timeout(requestTimeoutMs);

    options.signal = signal === undefined
      ? timeoutSignal
      : AbortSignal.any([signal, timeoutSignal]);

    let response;

    // Ошибки получения ответа
    try {
      response = await fetchFn(url, options);
    } catch (error) {
      if (signal?.aborted) {
        throw new ApiError("Запрос отменён", {
          kind: "aborted",
          url,
          cause: error
        });
      }

      if (timeoutSignal.aborted) {
        throw new ApiError("Превышено время ожидания", {
          kind: "timeout",
          url,
          cause: error
        });
      }

      throw new ApiError("Ошибка соединения с API", {
        kind: "network",
        url,
        cause: error
      });
    }

    if (!(response instanceof Response)) {
      throw new ApiError("Неверный объект ответа", {
        kind: "invalid-response",
        url
      });
    }

    // HTTP-ошибки обрабатываются отдельно
    if (!response.ok) {
      let message = `HTTP ${response.status}`;
      let code = null;
      let details = null;

      try {
        const contentType =
          response.headers.get("content-type") ?? "";

        if (contentType.toLowerCase().includes("application/json")) {
          const payload = await response.json();

          if (payload?.error && typeof payload.error === "object") {
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
        // Даже при неправильном теле сохраняем HTTP-статус
      }

      throw new ApiError(message, {
        kind: "http",
        status: response.status,
        code,
        details,
        url
      });
    }

    // DELETE может вернуть успешный ответ без тела
    if (response.status === 204) {
      return null;
    }

    const contentType =
      response.headers.get("content-type") ?? "";

    if (!contentType.toLowerCase().includes("application/json")) {
      throw new ApiError("Ожидался JSON-ответ", {
        kind: "invalid-response",
        url
      });
    }

    try {
      return await response.json();
    } catch (error) {
      throw new ApiError("Ошибка разбора JSON", {
        kind: "invalid-response",
        url,
        cause: error
      });
    }
  }

  return { requestJson };
}
