
// Отбор задач по фильтрам
export function selectTasks(tasks, filters = {}) {
  const completed = filters.completed ?? null;
  const priority = filters.priority ?? null;
  const categoryId = filters.categoryId ?? null;

  const query = (filters.q ?? "")
    .trim()
    .toLocaleLowerCase("ru-RU");

  return tasks.filter(task => {

    // Фильтр по выполнению
    if (
      completed !== null &&
      task.completed !== completed
    ) {
      return false;
    }

    // Фильтр по приоритету
    if (
      priority !== null &&
      task.priority !== priority
    ) {
      return false;
    }

    // Фильтр по категории
    if (
      categoryId !== null &&
      task.categoryId !== categoryId
    ) {
      return false;
    }

    // Поиск по названию
    if (
      query !== "" &&
      !task.title.toLocaleLowerCase("ru-RU").includes(query)
    ) {
      return false;
    }

    return true;
  });
}


// Поиск одной задачи по её ID
export function findTask(tasks, id) {
  return tasks.find(task => task.id === id) ?? null;
}
