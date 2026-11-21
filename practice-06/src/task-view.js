
const PRIORITY_LABELS = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий"
};

export function createTaskElement(task, category) {
  // Основной элемент карточки
  const card = document.createElement("li");

  card.className = "task-card";
  card.dataset.taskId = String(task.id);

  card.classList.toggle("is-completed", task.completed);

  // Название
  const title = document.createElement("h3");
  title.className = "task-title";
  title.textContent = task.title;

  // Статус
  const status = document.createElement("p");
  status.className = "task-status";
  status.textContent = task.completed
    ? "Выполнена"
    : "В работе";

  // Приоритет
  const priority = document.createElement("p");
  priority.className = "task-priority";
  priority.textContent = PRIORITY_LABELS[task.priority];

  // Категория
  const categoryLabel = document.createElement("p");
  categoryLabel.className = "task-category";
  categoryLabel.textContent = category?.name ?? "Без категории";

  // Контейнер кнопок
  const actions = document.createElement("div");
  actions.className = "task-actions";

  // Создание одной кнопки
  function makeButton(action, label) {
    const button = document.createElement("button");

    button.type = "button";
    button.dataset.action = action;

    const span = document.createElement("span");
    span.className = "action-label";
    span.textContent = label;

    button.append(span);

    return button;
  }

  // Кнопка изменения статуса
  const toggleButton = makeButton(
    "toggle",
    "Выполнена"
  );

  toggleButton.setAttribute(
    "aria-pressed",
    String(task.completed)
  );

  // Кнопка редактирования
  const editButton = makeButton(
    "edit",
    "Изменить"
  );

  // Кнопка удаления
  const deleteButton = makeButton(
    "delete",
    "Удалить"
  );

  actions.append(toggleButton, editButton, deleteButton);

  card.append(
    title,
    status,
    priority,
    categoryLabel,
    actions
  );

  return card;
}

export function renderTaskList(list, tasks, categories) {
  const cards = tasks.map(task => {
    const category = categories.find(
      item => item.id === task.categoryId
    );

    return createTaskElement(task, category);
  });

  list.replaceChildren(...cards);
}
