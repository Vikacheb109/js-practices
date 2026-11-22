
import { useEffect, useRef, useState } from "react";

export function useTaskData({ api, filters }) {
  // Последние успешно загруженные данные
  const [snapshot, setSnapshot] = useState({
    tasks: [],
    categories: [],
    meta: { total: 0 }
  });

  // Состояние загрузки
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  // Ошибка изменения задачи
  const [mutationError, setMutationError] = useState(null);

  // Выполняется ли создание, изменение или удаление
  const [pending, setPending] = useState(false);

  // Счётчик принудительных обновлений
  const [revision, setRevision] = useState(0);

  // Служебные ссылки
  const mountedRef = useRef(false);
  const mutationRef = useRef(null);

  // Берём отдельные значения фильтров
  const q = filters.q ?? "";
  const completed = filters.completed ?? "";
  const priority = filters.priority ?? "";
  const categoryId = filters.categoryId ?? "";

  // 1. ОТСЛЕЖИВАНИЕ МОНТИРОВАНИЯ
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      // При закрытии компонента отменяем мутацию
      mutationRef.current?.abort();
      mutationRef.current = null;
    };
  }, []);

  // 2. ЗАГРУЗКА ДАННЫХ С СЕРВЕРА
  useEffect(() => {
    let active = true;

    const controller = new AbortController();

    setStatus("loading");
    setError(null);

    async function loadData() {
      try {
        const result = await api.loadInitialData(
          {
            q,
            completed,
            priority,
            categoryId
          },
          {
            signal: controller.signal
          }
        );

        // Не принимаем устаревший ответ
        if (
          !active ||
          controller.signal.aborted ||
          !mountedRef.current
        ) {
          return;
        }

        // Сохраняем новый успешный результат
        setSnapshot(result);
        setStatus("ready");
        setError(null);
      } catch (caughtError) {
        // Отмена запроса не считается ошибкой
        if (
          !active ||
          controller.signal.aborted ||
          !mountedRef.current ||
          caughtError?.kind === "aborted"
        ) {
          return;
        }

        // Старый успешный снимок сохраняется
        setError(caughtError);
        setStatus("error");
      }
    }

    void loadData();

    // Очистка предыдущего запроса
    return () => {
      active = false;
      controller.abort();
    };
  }, [
    api,
    q,
    completed,
    priority,
    categoryId,
    revision
  ]);

  // 3. ПОВТОРНАЯ ЗАГРУЗКА
  function refresh() {
    if (!mountedRef.current) return;

    setRevision(previous => previous + 1);
  }

  // 4. ОБЩАЯ ФУНКЦИЯ ИЗМЕНЕНИЯ ДАННЫХ
  async function mutate(operation) {
    // Не запускаем операцию после размонтирования
    if (!mountedRef.current) {
      return false;
    }

    // Не разрешаем два одновременных изменения
    if (mutationRef.current !== null) {
      return false;
    }

    const controller = new AbortController();

    // Блокировку устанавливаем ДО await
    mutationRef.current = controller;

    setPending(true);
    setMutationError(null);

    try {
      await operation(controller.signal);

      // Если компонент закрыт или операция отменена
      if (
        !mountedRef.current ||
        controller.signal.aborted
      ) {
        return false;
      }

      // Успех операции уже подтверждён сервером
      // Запрашиваем свежий список
      setRevision(previous => previous + 1);

      return true;
    } catch (caughtError) {
      if (
        !mountedRef.current ||
        controller.signal.aborted
      ) {
        return false;
      }

      // Ошибка изменения не является ошибкой загрузки
      setMutationError(caughtError);

      return false;
    } finally {
      // Освобождаем блокировку только своей операции
      if (mutationRef.current === controller) {
        mutationRef.current = null;

        if (mountedRef.current) {
          setPending(false);
        }
      }
    }
  }

  // 5. СОЗДАНИЕ И РЕДАКТИРОВАНИЕ
  function saveTask(id, value) {
    if (id === null) {
      return mutate(signal =>
        api.createTask(value, { signal })
      );
    }

    return mutate(signal =>
      api.updateTask(id, value, { signal })
    );
  }

  // 6. ПЕРЕКЛЮЧЕНИЕ СТАТУСА
  function toggleTask(task) {
    return mutate(signal =>
      api.setTaskCompleted(
        task.id,
        !task.completed,
        { signal }
      )
    );
  }

  // 7. УДАЛЕНИЕ
  function deleteTask(id) {
    return mutate(signal =>
      api.deleteTask(id, { signal })
    );
  }

  // 8. ВОССТАНОВЛЕНИЕ НАБОРА
  function resetData() {
    return mutate(signal =>
      api.resetDemoData({ signal })
    );
  }



  // 9. ВОЗВРАЩАЕМ ДАННЫЕ И МЕТОДЫ
  return {
    snapshot,
    status,
    error,
    mutationError,
    pending,

    refresh,
    saveTask,
    toggleTask,
    deleteTask,
    resetData
  };
}


