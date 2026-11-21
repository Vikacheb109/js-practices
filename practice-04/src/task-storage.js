
export const STORAGE_VERSION = 1;

// Создаём независимые копии задач
function copyTasks(tasks) {
  return tasks.map(task => ({ ...task }));
}

// 1. Проверяем весь список
export function isValidTaskList(value) {
  if (!Array.isArray(value)) return false;

  const ids = new Set();

  for (const task of value) {
    if (task === null || typeof task !== "object" || Array.isArray(task)) {
      return false;
    }

    if (!Number.isSafeInteger(task.id) || task.id <= 0) {
      return false;
    }

    if (ids.has(task.id)) return false;
    ids.add(task.id);

    if (
      typeof task.title !== "string" ||
      task.title.trim() !== task.title ||
      task.title.length < 1 ||
      task.title.length > 100
    ) {
      return false;
    }

    if (typeof task.completed !== "boolean") {
      return false;
    }

    if (!["low", "medium", "high"].includes(task.priority)) {
      return false;
    }
  }

  return true;
}

// 2. Загружаем задачи
export function loadTasks(storage, key, fallbackTasks) {
  const fallback = copyTasks(fallbackTasks);

  try {
    const raw = storage.getItem(key);

    if (raw === null) {
      return {
        ok: true,
        source: "initial",
        tasks: fallback
      };
    }

    const data = JSON.parse(raw);

    if (
      data === null ||
      typeof data !== "object" ||
      Array.isArray(data) ||
      data.version !== STORAGE_VERSION ||
      !isValidTaskList(data.tasks)
    ) {
      return {
        ok: false,
        source: "fallback",
        tasks: fallback,
        error: "Сохранённые данные повреждены или имеют неверную версию"
      };
    }

    return {
      ok: true,
      source: "storage",
      tasks: copyTasks(data.tasks)
    };
  } catch (error) {
    return {
      ok: false,
      source: "fallback",
      tasks: fallback,
      error: `Ошибка загрузки: ${error.message}`
    };
  }
}

// 3. Сохраняем задачи
export function saveTasks(storage, key, tasks) {
  if (!isValidTaskList(tasks)) {
    return {
      ok: false,
      error: "Нельзя сохранить некорректный список задач"
    };
  }

  try {
    storage.setItem(
      key,
      JSON.stringify({
        version: STORAGE_VERSION,
        tasks
      })
    );

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: `Ошибка сохранения: ${error.message}`
    };
  }
}

// 4. Удаляем сохранённый набор
export function removeSavedTasks(storage, key) {
  try {
    storage.removeItem(key);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: `Ошибка сброса: ${error.message}`
    };
  }
}
