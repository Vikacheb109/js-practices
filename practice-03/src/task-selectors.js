
export function getVisibleTasks(tasks, filter = "all") {

  // Если выбран фильтр "В работе"
  if (filter === "pending") {
    return tasks.filter(task => task.completed === false);
  }

  // Если выбран фильтр "Выполненные"
  if (filter === "completed") {
    return tasks.filter(task => task.completed === true);
  }

  // Иначе показываем все задачи
  return [...tasks];
}
