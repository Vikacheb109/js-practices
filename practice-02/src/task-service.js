
/* ВСПОМОГАТЕЛЬНЫЕ ПРОВЕРКИ */

function isValidId(id) {
  return Number.isSafeInteger(id) && id > 0;
}

function checkTitle(title) {
  if (typeof title !== "string") {
    return { ok: false, error: "Название должно быть строкой" };
  }

  const value = title.trim();

  if (value.length < 1 || value.length > 100) {
    return {
      ok: false,
      error: "Длина названия должна быть от 1 до 100 символов"
    };
  }

  return { ok: true, title: value };
}


/* 1. СОЗДАНИЕ ЗАДАЧИ */

export function createTask(id, title, priority = "medium") {
  if (!isValidId(id)) {
    return { ok: false, error: "Некорректный ID" };
  }

  const name = checkTitle(title);

  if (!name.ok) {
    return name;
  }

  if (!["low", "medium", "high"].includes(priority)) {
    return { ok: false, error: "Некорректный приоритет" };
  }

  return {
    ok: true,
    task: {
      id,
      title: name.title,
      completed: false,
      priority
    }
  };
}


/* 2. ПОИСК ЗАДАЧИ */

export function findTaskById(tasks, id) {
  return tasks.find(task => task.id === id);
}


/* 3. НЕВЫПОЛНЕННЫЕ ЗАДАЧИ */

export function getPendingTasks(tasks) {
  return tasks.filter(task => task.completed === false);
}


/* 4. НАЗВАНИЯ ЗАДАЧ */

export function getTaskTitles(tasks) {
  return tasks.map(task => task.title);
}


/* 5. СТАТИСТИКА */

export function getTaskStats(tasks) {
  const total = tasks.length;

  const completed = tasks.filter(
    task => task.completed === true
  ).length;

  const pending = total - completed;

  const progress = total === 0
    ? 0
    : completed / total * 100;

  return { total, completed, pending, progress };
}


/* 6. ДОБАВЛЕНИЕ ЗАДАЧИ */

export function addTask(tasks, id, title, priority = "medium") {
  const result = createTask(id, title, priority);

  if (!result.ok) {
    return result;
  }

  if (findTaskById(tasks, id) !== undefined) {
    return { ok: false, error: "Такой ID уже существует" };
  }

  return {
    ok: true,
    tasks: [...tasks, result.task]
  };
}


/* 7. ИЗМЕНЕНИЕ СТАТУСА */

export function setTaskCompleted(tasks, id, completed) {
  if (!isValidId(id)) {
    return { ok: false, error: "Некорректный ID" };
  }

  if (typeof completed !== "boolean") {
    return {
      ok: false,
      error: "Статус должен быть true или false"
    };
  }

  if (findTaskById(tasks, id) === undefined) {
    return { ok: false, error: "Задача не найдена" };
  }

  const updated = tasks.map(task =>
    task.id === id ? { ...task, completed } : task
  );

  return { ok: true, tasks: updated };
}


/* 8. ПЕРЕИМЕНОВАНИЕ ЗАДАЧИ */

export function renameTask(tasks, id, title) {
  if (!isValidId(id)) {
    return { ok: false, error: "Некорректный ID" };
  }

  const name = checkTitle(title);

  if (!name.ok) {
    return name;
  }

  if (findTaskById(tasks, id) === undefined) {
    return { ok: false, error: "Задача не найдена" };
  }

  const updated = tasks.map(task =>
    task.id === id
      ? { ...task, title: name.title }
      : task
  );

  return { ok: true, tasks: updated };
}


/* 9. УДАЛЕНИЕ ЗАДАЧИ */

export function removeTask(tasks, id) {
  if (!isValidId(id)) {
    return { ok: false, error: "Некорректный ID" };
  }

  if (findTaskById(tasks, id) === undefined) {
    return { ok: false, error: "Задача не найдена" };
  }

  return {
    ok: true,
    tasks: tasks.filter(task => task.id !== id)
  };
}
