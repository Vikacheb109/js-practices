
const PRIORITIES = ["low", "medium", "high"];

// Проверка данных новой или редактируемой задачи
export function validateTaskDraft(draft, categories) {
  const errors = {};

  let title = "";

  if (typeof draft?.title !== "string") {
    errors.title = "Название должно быть строкой";
  } else {
    title = draft.title.trim();

    if (title.length < 1 || title.length > 100) {
      errors.title =
        "Название должно содержать от 1 до 100 символов";
    }
  }

  const priority = draft?.priority;

  if (!PRIORITIES.includes(priority)) {
    errors.priority = "Выберите корректный приоритет";
  }

  const rawCategoryId = draft?.categoryId;
  const categoryId = Number(rawCategoryId);

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


// Выбор задач по фильтрам
export function selectTasks(tasks, filters = {}) {
  const query = String(filters.q ?? "").trim().toLowerCase();

  return tasks.filter(task => {
    if (!task.title.toLowerCase().includes(query)) {
      return false;
    }

    if (
      filters.completed === "true" &&
      task.completed !== true
    ) {
      return false;
    }

    if (
      filters.completed === "false" &&
      task.completed !== false
    ) {
      return false;
    }

    if (
      filters.priority &&
      task.priority !== filters.priority
    ) {
      return false;
    }

    if (
      filters.categoryId !== "" &&
      filters.categoryId !== undefined &&
      filters.categoryId !== null &&
      task.categoryId !== Number(filters.categoryId)
    ) {
      return false;
    }

    return true;
  });
}


// Общая статистика
export function getTaskStats(tasks) {
  const total = tasks.length;

  const completed = tasks.filter(
    task => task.completed === true
  ).length;

  return {
    total,
    completed,
    active: total - completed
  };
}


// Добавление задачи
export function addTask(tasks, value, id) {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("Некорректный ID");
  }

  if (tasks.some(task => task.id === id)) {
    throw new Error("Такой ID уже существует");
  }

  const newTask = {
    id,
    title: value.title,
    completed: false,
    priority: value.priority,
    categoryId: value.categoryId
  };

  return [...tasks, newTask];
}


// Изменение названия, приоритета и категории
export function updateTask(tasks, id, value) {
  if (!tasks.some(task => task.id === id)) {
    return tasks;
  }

  return tasks.map(task =>
    task.id === id
      ? {
          ...task,
          title: value.title,
          priority: value.priority,
          categoryId: value.categoryId
        }
      : task
  );
}


// Переключение выполненного статуса
export function toggleTask(tasks, id) {
  if (!tasks.some(task => task.id === id)) {
    return tasks;
  }

  return tasks.map(task =>
    task.id === id
      ? { ...task, completed: !task.completed }
      : task
  );
}


// Удаление задачи
export function removeTask(tasks, id) {
  if (!tasks.some(task => task.id === id)) {
    return tasks;
  }

  return tasks.filter(task => task.id !== id);
}
