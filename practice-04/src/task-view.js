
import { getTaskStats } from "./task-service.js";


// 1. СОЗДАНИЕ КАРТОЧКИ ЗАДАЧИ
export function createTaskElement(task) {

  const card = document.createElement("li");

  card.classList.add("task-card");
  card.classList.toggle("is-completed", task.completed);
  card.dataset.taskId = String(task.id);


  // Название задачи
  const title = document.createElement("h3");
  title.className = "task-title";
  title.textContent = task.title;


  // Статус задачи
  const status = document.createElement("p");
  status.className = "task-status";
  status.textContent = task.completed
    ? "Выполнена"
    : "В работе";


  // Приоритет задачи
  const priority = document.createElement("p");
  priority.className = "task-priority";

  const priorityNames = {
    low: "Низкий",
    medium: "Средний",
    high: "Высокий"
  };

  priority.textContent = priorityNames[task.priority];


  // Контейнер для кнопок
  const actions = document.createElement("div");
  actions.className = "task-actions";


  // Кнопка изменения статуса
  const toggleButton = document.createElement("button");

  // Кнопка редактирования
const editButton = document.createElement("button");
editButton.type = "button";
editButton.dataset.action = "edit";

const editLabel = document.createElement("span");
editLabel.className = "action-label";
editLabel.textContent = "Изменить";

editButton.append(editLabel);
  toggleButton.type = "button";
  toggleButton.dataset.action = "toggle";

  toggleButton.setAttribute(
    "aria-pressed",
    String(task.completed)
  );

  const toggleLabel = document.createElement("span");
  toggleLabel.className = "action-label";
  toggleLabel.textContent = "Выполнена";

  toggleButton.append(toggleLabel);


  // Кнопка удаления
  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.dataset.action = "delete";

  const deleteLabel = document.createElement("span");
  deleteLabel.className = "action-label";
  deleteLabel.textContent = "Удалить";

  deleteButton.append(deleteLabel);


  // Собираем карточку
  actions.append(toggleButton, editButton, deleteButton);  card.append(title, status, priority, actions);

  return card;
}


// 2. ОТРИСОВКА СПИСКА
export function renderTaskList(listElement, tasks) {

  const cards = tasks.map(createTaskElement);

  listElement.replaceChildren(...cards);
}


// 3. ОБНОВЛЕНИЕ СТАТИСТИКИ
export function renderSummary(summaryElement, tasks, visibleCount) {

  const { total, completed, pending, progress } =
    getTaskStats(tasks);

  const values = {
    total,
    completed,
    pending,
    progress: `${progress.toFixed(1)}%`,
    visible: visibleCount
  };

  for (const [name, value] of Object.entries(values)) {
    const field = summaryElement.querySelector(
      `[data-stat="${name}"]`
    );

    if (field) {
      field.textContent = String(value);
    }
  }
}


// 4. СООБЩЕНИЕ О ПУСТОМ СПИСКЕ
export function renderEmptyState(messageElement, total, visibleCount) {

  if (visibleCount > 0) {
    messageElement.textContent = "";
    messageElement.hidden = true;
  } else {
    messageElement.textContent = total === 0
      ? "Список задач пуст."
      : "Нет задач по выбранному фильтру.";

    messageElement.hidden = false;
  }
}
