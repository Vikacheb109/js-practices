
import {
  demoTasks,
  variantTasks,
  variantNumber
} from "./data.js";

import {
  findTaskById,
  setTaskCompleted,
  removeTask
} from "./task-service.js";

import { getVisibleTasks } from "./task-selectors.js";

import {
  renderTaskList,
  renderSummary,
  renderEmptyState
} from "./task-view.js";


// Находим элементы страницы
const elements = {
  list: document.querySelector("#task-list"),
  filters: document.querySelector("#task-filters"),
  summary: document.querySelector("#task-summary"),
  empty: document.querySelector("#empty-message"),
  message: document.querySelector("#operation-message"),
  datasetLabel: document.querySelector("#dataset-label")
};


// Выбираем общий или индивидуальный набор
const isVariant =
  new URLSearchParams(window.location.search)
    .get("dataset") === "variant";

const initialTasks = isVariant ? variantTasks : demoTasks;

// Текущий список — копия исходных данных
let currentTasks = initialTasks.map(task => ({ ...task }));

// По умолчанию показываем все задачи
let currentFilter = "all";

elements.datasetLabel.textContent = isVariant
  ? `Индивидуальный вариант: ${variantNumber ?? "не указан"}`
  : "Общий контрольный набор";


// 1. ОБНОВЛЕНИЕ ВСЕГО ИНТЕРФЕЙСА
function renderApp() {

  // Получаем задачи по выбранному фильтру
  const visibleTasks = getVisibleTasks(
    currentTasks,
    currentFilter
  );

  // Обновляем карточки
  renderTaskList(elements.list, visibleTasks);

  // Статистика считается по полному списку
  renderSummary(
    elements.summary,
    currentTasks,
    visibleTasks.length
  );

  // Показываем или скрываем сообщение
  renderEmptyState(
    elements.empty,
    currentTasks.length,
    visibleTasks.length
  );

  // Отмечаем активный фильтр
  for (const button of elements.filters.querySelectorAll(
    "button[data-filter]"
  )) {
    const active = button.dataset.filter === currentFilter;

    button.classList.toggle("is-active", active);

    button.setAttribute(
      "aria-pressed",
      String(active)
    );
  }
}


// 2. ОБРАБОТКА КЛИКОВ ПО КАРТОЧКАМ
function handleTaskListClick(event) {

  // Проверяем, что нажатие произошло по элементу
  if (!(event.target instanceof Element)) return;

  // Находим ближайшую кнопку действия
  const button = event.target.closest(
    "button[data-action]"
  );

  if (!button || !elements.list.contains(button)) return;

  const action = button.dataset.action;

  // Разрешаем только два действия
  if (action !== "toggle" && action !== "delete") return;

  // Находим карточку задачи
  const card = button.closest("li[data-task-id]");

  if (!card || !elements.list.contains(card)) return;

  // Читаем и преобразуем ID
  const rawId = card.dataset.taskId;
  const id = Number(rawId);

  // Проверяем ID
  if (!Number.isSafeInteger(id) || id <= 0) {
    elements.message.textContent =
      "Ошибка: некорректный ID задачи";
    return;
  }

  // Ищем задачу в текущем массиве
  const task = findTaskById(currentTasks, id);

  if (task === undefined) {
    elements.message.textContent =
      `Ошибка: задача с ID ${id} не найдена`;
    return;
  }

  // Вызываем нужную функцию из ПР2
  const result = action === "toggle"
    ? setTaskCompleted(currentTasks, id, !task.completed)
    : removeTask(currentTasks, id);

  // Если операция не удалась
  if (!result.ok) {
    elements.message.textContent =
      `Ошибка: ${result.error}`;
    return;
  }

  // Сохраняем обновлённый список
  currentTasks = result.tasks;

  // Очищаем сообщение и обновляем страницу
  elements.message.textContent = "";

  renderApp();

  // Возвращаем фокус на нужную кнопку
  restoreTaskFocus(id, action);
}


// 3. ОБРАБОТКА ФИЛЬТРОВ
function handleFilterClick(event) {

  if (!(event.target instanceof Element)) return;

  const button = event.target.closest(
    "button[data-filter]"
  );

  if (!button || !elements.filters.contains(button)) return;

  const filter = button.dataset.filter;

  // Принимаем только известные фильтры
  if (!["all", "pending", "completed"].includes(filter)) {
    return;
  }

  // Меняем выбранный фильтр, но не задачи
  currentFilter = filter;

  elements.message.textContent = "";

  renderApp();
}


// 4. ВОССТАНОВЛЕНИЕ ФОКУСА
function restoreTaskFocus(id, action) {

  const actionButton = elements.list.querySelector(
    `[data-task-id="${id}"] button[data-action="${action}"]`
  );

  const filterButton = elements.filters.querySelector(
    `[data-filter="${currentFilter}"]`
  );

  (actionButton ?? filterButton)?.focus();
}


// Назначаем обработчики только один раз
elements.list.addEventListener(
  "click",
  handleTaskListClick
);

elements.filters.addEventListener(
  "click",
  handleFilterClick
);


// Первый запуск интерфейса
try {
  renderApp();
} catch (error) {
  elements.message.textContent =
    `Ошибка запуска: ${error.message}`;

  console.error(error);
}
