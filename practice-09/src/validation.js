
import { ApiError } from "./errors.js";

// Проверка идентификатора задачи или категории
export function parsePositiveId(raw) {
  if (typeof raw !== "string") {
    return null;
  }

  // Только цифры, первая цифра от 1 до 9
  if (!/^[1-9]\d*$/.test(raw)) {
    return null;
  }

  const id = Number(raw);

  // Число должно быть безопасным целым
  if (!Number.isSafeInteger(id) || id <= 0) {
    return null;
  }

  return id;
}


// Проверка фильтров списка задач
export function parseFilters(searchParams) {
  const allowedNames = new Set([
    "completed",
    "priority",
    "categoryId",
    "q"
  ]);

  const result = {
    completed: null,
    priority: null,
    categoryId: null,
    q: ""
  };

  // 1. Проверяем имена параметров и повторения
  const seenNames = new Set();

  for (const [name] of searchParams) {
    if (!allowedNames.has(name)) {
      throw new ApiError(
        400,
        "INVALID_QUERY",
        `Неизвестный параметр: ${name}`
      );
    }

    if (seenNames.has(name)) {
      throw new ApiError(
        400,
        "INVALID_QUERY",
        `Параметр ${name} повторяется`
      );
    }

    seenNames.add(name);
  }

  // 2. Проверяем completed
  if (searchParams.has("completed")) {
    const raw = searchParams.get("completed");

    if (raw !== "true" && raw !== "false") {
      throw new ApiError(
        400,
        "INVALID_QUERY",
        "completed должен быть true или false"
      );
    }

    result.completed = raw === "true";
  }

  // 3. Проверяем priority
  if (searchParams.has("priority")) {
    const raw = searchParams.get("priority");

    if (!["low", "medium", "high"].includes(raw)) {
      throw new ApiError(
        400,
        "INVALID_QUERY",
        "Некорректный приоритет"
      );
    }

    result.priority = raw;
  }

  // 4. Проверяем categoryId
  if (searchParams.has("categoryId")) {
    const raw = searchParams.get("categoryId");
    const id = parsePositiveId(raw);

    if (id === null) {
      throw new ApiError(
        400,
        "INVALID_QUERY",
        "Некорректный идентификатор категории"
      );
    }

    result.categoryId = id;
  }

  // 5. Проверяем текст поиска
  if (searchParams.has("q")) {
    const raw = searchParams.get("q");
    const q = raw.trim();

    if (q.length > 100) {
      throw new ApiError(
        400,
        "INVALID_QUERY",
        "Поисковый запрос длиннее 100 символов"
      );
    }

    result.q = q;
  }

  return result;
}


export function validateTaskTitle(title) {
  if (typeof title !== "string") {
    return {
      ok: false,
      error: "Название задачи должно быть строкой"
    };
  }

  const cleanedTitle = title.trim();

  if (cleanedTitle.length === 0) {
    return {
      ok: false,
      error: "Название задачи не должно быть пустым"
    };
  }

  return {
    ok: true,
    title: cleanedTitle
  };
}
