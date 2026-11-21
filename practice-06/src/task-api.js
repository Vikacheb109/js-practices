
import { ApiError } from "./api-client.js";

const PRIORITIES = new Set(["low", "medium", "high"]);

const FILTERS = new Set([
  "completed",
  "priority",
  "categoryId",
  "q"
]);

function validId(id) {
  return Number.isSafeInteger(id) && id > 0;
}

function invalidResponse(message) {
  return new ApiError(message, {
    kind: "invalid-response"
  });
}

export function isTask(task) {
  return Boolean(
    task &&
    typeof task === "object" &&
    !Array.isArray(task) &&
    validId(task.id) &&
    typeof task.title === "string" &&
    task.title.trim().length >= 1 &&
    task.title.trim().length <= 100 &&
    typeof task.completed === "boolean" &&
    PRIORITIES.has(task.priority) &&
    validId(task.categoryId)
  );
}

export function isCategory(category) {
  return Boolean(
    category &&
    typeof category === "object" &&
    !Array.isArray(category) &&
    validId(category.id) &&
    typeof category.name === "string" &&
    category.name.trim().length >= 1 &&
    category.name.trim().length <= 100
  );
}

function checkList(payload, checker) {
  if (
    !payload ||
    typeof payload !== "object" ||
    Array.isArray(payload) ||
    !Array.isArray(payload.data) ||
    !payload.data.every(checker) ||
    !payload.meta ||
    typeof payload.meta !== "object" ||
    !Number.isSafeInteger(payload.meta.total) ||
    payload.meta.total !== payload.data.length
  ) {
    throw invalidResponse("Некорректный список от API");
  }

  const ids = payload.data.map(item => item.id);

  if (new Set(ids).size !== ids.length) {
    throw invalidResponse("В списке повторяются ID");
  }

  return payload;
}

function checkOne(payload, checker) {
  if (!payload || !checker(payload.data)) {
    throw invalidResponse("Некорректная запись от API");
  }

  return payload.data;
}

function normalizeFilters(filters) {
  if (
    filters === null ||
    typeof filters !== "object" ||
    Array.isArray(filters)
  ) {
    throw new TypeError("Фильтры должны быть объектом");
  }

  const result = {};

  for (const [key, value] of Object.entries(filters)) {
    if (!FILTERS.has(key)) {
      throw new TypeError(`Неизвестный фильтр: ${key}`);
    }

    if (key === "completed") {
      if (typeof value !== "boolean") {
        throw new TypeError("Неверный фильтр completed");
      }
    }

    if (key === "priority" && !PRIORITIES.has(value)) {
      throw new TypeError("Неверный приоритет");
    }

    if (key === "categoryId" && !validId(value)) {
      throw new TypeError("Неверная категория");
    }

    if (key === "q") {
      if (typeof value !== "string" || value.trim().length > 100) {
        throw new TypeError("Неверный поисковый запрос");
      }
    }

    result[key] = key === "q" ? value.trim() : value;
  }

  return result;
}

export function createTaskApi(client) {
  if (!client || typeof client.requestJson !== "function") {
    throw new TypeError("Нужен клиент с requestJson");
  }

  // Получить список задач
  async function getTasks(filters = {}, options = {}) {
    const payload = await client.requestJson("/tasks", {
      query: normalizeFilters(filters),
      ...options
    });

    checkList(payload, isTask);

    return {
      tasks: payload.data,
      meta: payload.meta
    };
  }

  // Получить одну задачу
  async function getTaskById(id, options = {}) {
    if (!validId(id)) {
      throw new TypeError("Некорректный ID задачи");
    }

    const payload = await client.requestJson(`/tasks/${id}`, options);

    return checkOne(payload, isTask);
  }

  // Получить категории
  async function getCategories(options = {}) {
    const payload = await client.requestJson("/categories", options);

    checkList(payload, isCategory);

    return payload.data;
  }

  // Получить список и категории одновременно
  async function loadInitialData(filters = {}, options = {}) {
    const tasksPromise = getTasks(filters, options);
    const categoriesPromise = getCategories(options);

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

  // Создать задачу
  async function createTask(draft, options = {}) {
    const payload = await client.requestJson("/tasks", {
      ...options,
      method: "POST",
      body: {
        title: draft.title,
        priority: draft.priority,
        categoryId: draft.categoryId
      }
    });

    return checkOne(payload, isTask);
  }

  // Изменить задачу
  async function updateTask(id, changes, options = {}) {
    if (!validId(id)) {
      throw new TypeError("Некорректный ID задачи");
    }

    const payload = await client.requestJson(`/tasks/${id}`, {
      ...options,
      method: "PATCH",
      body: changes
    });

    return checkOne(payload, isTask);
  }

  // Установить новый статус
  async function setTaskCompleted(id, completed, options = {}) {
    if (!validId(id)) {
      throw new TypeError("Некорректный ID задачи");
    }

    if (typeof completed !== "boolean") {
      throw new TypeError("Статус должен быть true или false");
    }

    return updateTask(id, { completed }, options);
  }

  // Удалить задачу
  async function deleteTask(id, options = {}) {
    if (!validId(id)) {
      throw new TypeError("Некорректный ID задачи");
    }

    const result = await client.requestJson(`/tasks/${id}`, {
      ...options,
      method: "DELETE"
    });

    if (result !== null) {
      throw invalidResponse("DELETE должен вернуть пустой ответ");
    }

    return null;
  }

  // Восстановить учебный набор
  async function resetDemoData(options = {}) {
    const payload = await client.requestJson("/debug/reset", {
      ...options,
      method: "POST"
    });

    if (
      !payload ||
      !payload.data ||
      payload.data.reset !== true ||
      !Number.isSafeInteger(payload.data.total)
    ) {
      throw invalidResponse("Некорректный ответ сброса");
    }

    return payload.data;
  }

  return {
    getTasks,
    getTaskById,
    getCategories,
    loadInitialData,
    createTask,
    updateTask,
    setTaskCompleted,
    deleteTask,
    resetDemoData
  };
}
