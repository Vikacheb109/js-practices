
const PRIORITIES = new Set(["low", "medium", "high"]);

export function validateTaskDraft(draft, categories) {
  const errors = {};

  // Проверяем название
  let title = "";

  if (typeof draft?.title !== "string") {
    errors.title = "Введите название задачи";
  } else {
    title = draft.title.trim();

    if (title.length < 1 || title.length > 100) {
      errors.title = "Название должно содержать от 1 до 100 символов";
    }
  }

  // Проверяем приоритет
  const priority = draft?.priority;

  if (!PRIORITIES.has(priority)) {
    errors.priority = "Выберите правильный приоритет";
  }

  // Проверяем категорию
  const rawCategoryId = draft?.categoryId;

  let categoryId = Number(rawCategoryId);

  if (
    rawCategoryId === "" ||
    rawCategoryId === null ||
    rawCategoryId === undefined ||
    (typeof rawCategoryId === "string" &&
      rawCategoryId.trim() === "") ||
    !Number.isSafeInteger(categoryId) ||
    categoryId <= 0 ||
    !Array.isArray(categories) ||
    !categories.some(category => category.id === categoryId)
  ) {
    errors.categoryId = "Выберите существующую категорию";
  }

  if (Object.keys(errors).length > 0) {
    return {
      valid: false,
      value: null,
      errors
    };
  }

  return {
    valid: true,
    value: {
      title,
      priority,
      categoryId
    },
    errors: {}
  };
}
