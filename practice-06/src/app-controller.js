
import { ApiError } from "./api-client.js";
import { validateTaskDraft } from "./form-validation.js";

export function messageForError(error) {
  if (!(error instanceof ApiError)) {
    return "Не удалось выполнить операцию.";
  }

  if (error.kind === "timeout") {
    return "Сервер не ответил вовремя. Попробуйте ещё раз.";
  }

  if (error.kind === "network") {
    return "Нет соединения с учебным API. Проверьте npm start.";
  }

  if (error.kind === "invalid-response") {
    return "Сервер вернул ответ неожиданного формата.";
  }

  if (error.kind === "http" && error.status === 404) {
    return "Запись уже отсутствует на сервере. Обновите список.";
  }

  if (error.kind === "http") {
    return error.message || `Ошибка HTTP ${error.status}`;
  }

  return "Не удалось выполнить операцию.";
}

export function createAppController({
  api,
  view,
  validateDraft = validateTaskDraft
} = {}) {
  const requiredApiMethods = [
  "loadInitialData",
  "getTasks",
  "createTask",
  "updateTask",
  "setTaskCompleted",
  "deleteTask",
  "resetDemoData"
];

const requiredViewMethods = [
  "setListState",
  "setTasks",
  "setCategories",
  "setTotal",
  "setFormTask",
  "showFormErrors",
  "setMutationPending",
  "notify"
];

if (
  !api ||
  !view ||
  typeof validateDraft !== "function" ||
  requiredApiMethods.some(name => typeof api[name] !== "function") ||
  requiredViewMethods.some(name => typeof view[name] !== "function")
) {
  throw new TypeError("Некорректные зависимости контроллера");
}

  let tasks = [];
  let categories = [];
  let filters = {};
  let editingId = null;

  let loadController = null;
  let loadNumber = 0;
  let destroyed = false;
  let mutationPending = false;

  // Проверка ID
  function validId(id) {
    return Number.isSafeInteger(id) && id > 0;
  }

  // Применяем успешно полученные данные
  function showTasks(result) {
    tasks = result.tasks;

    view.setTasks(tasks, categories);
    view.setTotal(result.meta.total);

    if (tasks.length === 0) {
      view.setListState("empty");
    } else {
      view.setListState("ready");
    }
  }

  // Одна общая функция загрузки
  async function loadCurrentTasks() {
    if (destroyed) return;

    // Отменяем предыдущую загрузку
    loadController?.abort();

    loadController = new AbortController();

    const controller = loadController;
    const currentNumber = ++loadNumber;

    view.setListState("loading");

    try {
      // Пока категорий нет, загружаем всё сразу
      if (categories.length === 0) {
        const result = await api.loadInitialData(filters, {
          signal: controller.signal
        });

        // Не принимаем устаревший ответ
        if (
          destroyed ||
          controller.signal.aborted ||
          currentNumber !== loadNumber
        ) {
          return;
        }

        categories = result.categories;

        view.setCategories(categories);
        view.setFilters?.(filters);

        showTasks(result);
      } else {
        const result = await api.getTasks(filters, {
          signal: controller.signal
        });

        if (
          destroyed ||
          controller.signal.aborted ||
          currentNumber !== loadNumber
        ) {
          return;
        }

        showTasks(result);
      }
    } catch (error) {
      // Отмена старого запроса — не ошибка для пользователя
      if (
        destroyed ||
        controller.signal.aborted ||
        currentNumber !== loadNumber ||
        error?.kind === "aborted"
      ) {
        return;
      }

      view.setListState("error", messageForError(error));
    } finally {
      if (currentNumber === loadNumber) {
        loadController = null;
      }
    }
  }

  // Первая загрузка
  function start(initialFilters = {}) {
    filters = { ...initialFilters };

    view.setFilters?.(filters);
    view.setFormTask(null);
    view.showFormErrors({});

    return loadCurrentTasks();
  }

  // Пользователь выбрал фильтры
  function applyFilters(newFilters = {}) {
    filters = { ...newFilters };

    view.setFilters?.(filters);

    return loadCurrentTasks();
  }

  // Кнопка обновления или повтора
  function refresh() {
    return loadCurrentTasks();
  }

  // Переход в режим редактирования
  function beginEdit(id) {
    if (!validId(id)) {
      view.notify("Некорректный ID задачи", "error");
      return;
    }

    const task = tasks.find(item => item.id === id);

    if (!task) {
      view.notify("Задача не найдена", "error");
      return;
    }

    editingId = id;

    view.setFormTask(task);
    view.showFormErrors({});
    view.notify("");
  }

  // Отмена редактирования
  function cancelEdit() {
    editingId = null;

    view.setFormTask(null);
    view.showFormErrors({});
  }

  // Общая обёртка изменяющих операций
  async function runMutation(operation, successMessage) {
    if (destroyed || mutationPending) return;

    mutationPending = true;
    view.setMutationPending(true);

    try {
      await operation();

      if (destroyed) return;

      view.notify(successMessage, "success");

      // После изменения снова получаем данные с сервера
      await loadCurrentTasks();
    } catch (error) {
      if (!destroyed) {
        view.notify(messageForError(error), "error");
      }
    } finally {
      mutationPending = false;

      if (!destroyed) {
        view.setMutationPending(false);
      }
    }
  }

  // Добавление или редактирование через форму
  async function submit(draft) {
    if (destroyed || mutationPending) return;

    const validation = validateDraft(draft, categories);

    if (!validation.valid) {
      view.showFormErrors(validation.errors);
      return;
    }

    view.showFormErrors({});

    const value = validation.value;

    await runMutation(async () => {
      if (editingId === null) {
        await api.createTask(value);
      } else {
        await api.updateTask(editingId, value);
      }

      cancelEdit();
    }, "Задача успешно сохранена.");
  }

  // Переключение статуса
  async function toggleTask(id) {
    if (destroyed || mutationPending) return;

    const task = tasks.find(item => item.id === id);

    if (!task) {
      view.notify("Задача не найдена", "error");
      return;
    }

    await runMutation(
      () => api.setTaskCompleted(id, !task.completed),
      "Статус задачи изменён."
    );
  }

  // Удаление задачи
  async function deleteTask(id) {
    if (destroyed || mutationPending) return;

    if (!validId(id)) {
      view.notify("Некорректный ID задачи", "error");
      return;
    }

    await runMutation(async () => {
      await api.deleteTask(id);

      if (editingId === id) {
        cancelEdit();
      }
    }, "Задача удалена.");
  }

  // Восстановление исходного набора на сервере
  async function resetData() {
    if (destroyed || mutationPending) return;

    await runMutation(async () => {
      await api.resetDemoData();

      cancelEdit();
    }, "Исходные данные восстановлены.");
  }

  // Завершение работы контроллера
  function destroy() {
    destroyed = true;
    loadNumber += 1;

    loadController?.abort();
    loadController = null;
  }

  return {
    start,
    applyFilters,
    refresh,
    submit,
    beginEdit,
    cancelEdit,
    toggleTask,
    deleteTask,
    resetData,
    destroy
  };
}
