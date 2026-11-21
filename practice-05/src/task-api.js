
import { ApiError } from "./api-client.js";

const ALLOWED_PRIORITIES = new Set([
  "low",
  "medium",
  "high"
]);

const ALLOWED_FILTERS = new Set([
  "completed",
  "priority",
  "categoryId",
  "q"
]);


// Проверка положительного ID
function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}


// Ошибка неверной структуры ответа
function invalidResponse(message) {
  return new ApiError(message, {
    kind: "invalid-response"
  });
}


// Проверяем одну задачу
function isTask(value) {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    isPositiveSafeInteger(value.id) &&
    typeof value.title === "string" &&
    value.title.trim().length >= 1 &&
    value.title.trim().length <= 100 &&
    typeof value.completed === "boolean" &&
    ALLOWED_PRIORITIES.has(value.priority) &&
    isPositiveSafeInteger(value.categoryId)
  );
}


// Проверяем одну категорию
function isCategory(value) {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    isPositiveSafeInteger(value.id) &&
    typeof value.name === "string" &&
    value.name.trim().length >= 1 &&
    value.name.trim().length <= 100
  );
}


// Проверяем список и отсутствие повторяющихся ID
function isValidCollection(items, checker) {
  if (!Array.isArray(items)) return false;

  const ids = new Set();

  for (const item of items) {
    if (!checker(item)) return false;

    if (ids.has(item.id)) return false;

    ids.add(item.id);
  }

  return true;
}


// Проверяем обёртку ответа со списком
function checkCollectionPayload(payload, checker) {
  if (
    payload === null ||
    typeof payload !== "object" ||
    Array.isArray(payload) ||
    !isValidCollection(payload.data, checker) ||
    payload.meta === null ||
    typeof payload.meta !== "object" ||
    Array.isArray(payload.meta) ||
    !Number.isSafeInteger(payload.meta.total) ||
    payload.meta.total !== payload.data.length
  ) {
    throw invalidResponse("Неверная структура списка от API");
  }

  return payload;
}


// Проверяем и нормализуем фильтры
function normalizeFilters(filters) {
  if (
    filters === null ||
    typeof filters !== "object" ||
    Array.isArray(filters)
  ) {
    throw new TypeError("Фильтры должны быть объектом");
  }

  const result = {};

  for (const [name, value] of Object.entries(filters)) {
    if (!ALLOWED_FILTERS.has(name)) {
      throw new TypeError(`Неизвестный фильтр: ${name}`);
    }

    if (name === "completed") {
      if (typeof value !== "boolean") {
        throw new TypeError("completed должен быть true или false");
      }

      result.completed = value;
    }

    if (name === "priority") {
      if (!ALLOWED_PRIORITIES.has(value)) {
        throw new TypeError("Недопустимый приоритет");
      }

      result.priority = value;
    }

    if (name === "categoryId") {
      if (!isPositiveSafeInteger(value)) {
        throw new TypeError("Некорректный ID категории");
      }

      result.categoryId = value;
    }

    if (name === "q") {
      if (typeof value !== "string") {
        throw new TypeError("Поиск должен быть строкой");
      }

      const cleaned = value.trim();

      if (cleaned.length > 100) {
        throw new TypeError(
          "Поисковая строка слишком длинная"
        );
      }

      result.q = cleaned;
    }
  }

  return result;
}


// Создаём предметный API
export function createTaskApi(client) {

  if (
    !client ||
    typeof client.requestJson !== "function"
  ) {
    throw new TypeError(
      "Клиент должен иметь функцию requestJson"
    );
  }


  // 1. Загрузка списка задач
  async function getTasks(filters = {}) {
    const normalized = normalizeFilters(filters);

    const payload = await client.requestJson("/tasks", {
      query: normalized
    });

    checkCollectionPayload(payload, isTask);

    return {
      tasks: payload.data,
      meta: payload.meta
    };
  }


  // 2. Загрузка одной задачи
  async function getTaskById(id) {
    if (!isPositiveSafeInteger(id)) {
      throw new TypeError("Некорректный ID задачи");
    }

    const payload = await client.requestJson(
      `/tasks/${id}`
    );

    if (
      payload === null ||
      typeof payload !== "object" ||
      Array.isArray(payload) ||
      !isTask(payload.data)
    ) {
      throw invalidResponse(
        "Сервер вернул неверную задачу"
      );
    }

    return payload.data;
  }


  // 3. Загрузка категорий
  async function getCategories() {
    const payload = await client.requestJson(
      "/categories"
    );

    checkCollectionPayload(payload, isCategory);

    return payload.data;
  }


  // 4. Параллельная загрузка задач и категорий
  async function loadInitialData(filters = {}) {

    // Оба запроса запускаются до общего await
    const tasksPromise = getTasks(filters);
    const categoriesPromise = getCategories();

    const [taskResult, categories] = await Promise.all([
      tasksPromise,
      categoriesPromise
    ]);

    return {
      tasks: taskResult.tasks,
      categories,
      meta: taskResult.meta
    };
  }


  return {
    getTasks,
    getTaskById,
    getCategories,
    loadInitialData
  };
}
