
const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);

export function validateTaskDraft(draft, tasks, editingId = null) {
  const errors = {};

  let id;

  // Создание новой задачи
  if (editingId === null) {
    const rawId = draft.id;

    if (
      rawId === "" ||
      rawId === null ||
      rawId === undefined ||
      (typeof rawId === "string" && rawId.trim() === "")
    ) {
      errors.id = "Введите ID задачи";
    } else {
      id = Number(rawId);

      if (!Number.isSafeInteger(id) || id <= 0) {
        errors.id = "ID должен быть положительным целым числом";
      } else if (tasks.some(task => task.id === id)) {
        errors.id = "Задача с таким ID уже существует";
      }
    }
  } else {
    // Редактирование существующей задачи
    id = editingId;

    if (!Number.isSafeInteger(id) || id <= 0) {
      errors.id = "Некорректный ID";
    } else if (!tasks.some(task => task.id === id)) {
      errors.id = "Задача для редактирования не найдена";
    }
  }

  // Проверяем название
  let title = "";

  if (typeof draft.title !== "string") {
    errors.title = "Название должно быть строкой";
  } else {
    title = draft.title.trim();

    if (title.length < 1 || title.length > 100) {
      errors.title = "Название должно содержать от 1 до 100 символов";
    }
  }

  // Проверяем приоритет
  const priority = draft.priority;

  if (!ALLOWED_PRIORITIES.has(priority)) {
    errors.priority = "Выберите правильный приоритет";
  }

  // Если есть хотя бы одна ошибка
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: { id, title, priority }
  };
}
