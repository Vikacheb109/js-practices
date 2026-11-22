
import { useState } from "react";

import {
  tasks as initialTasks,
  categories
} from "./data.js";

import { createInitialFilters } from "./variant.js";

import {
  selectTasks,
  getTaskStats,
  addTask,
  updateTask,
  toggleTask,
  removeTask
} from "./domain/task-service.js";

import TaskForm from "./components/TaskForm.jsx";
import TaskFilters from "./components/TaskFilters.jsx";
import TaskList from "./components/TaskList.jsx";
import TaskStats from "./components/TaskStats.jsx";

export default function App() {
  // Все задачи
  const [tasks, setTasks] = useState(
    () => initialTasks.map(task => ({ ...task }))
  );

  // Текущие фильтры
  const [filters, setFilters] = useState(createInitialFilters);

  // ID редактируемой задачи
  const [editingId, setEditingId] = useState(null);

  // Сообщение о действиях
  const [message, setMessage] = useState("");

  // Данные для отображения
  const visibleTasks = selectTasks(tasks, filters);
  const stats = getTaskStats(tasks);

  const editingTask = tasks.find(
    task => task.id === editingId
  ) ?? null;

  // Изменить статус задачи
  function handleToggle(id) {
    setTasks(previous => toggleTask(previous, id));

    setMessage("Статус задачи изменён.");
  }

  // Открыть редактирование
  function handleEdit(id) {
    const task = tasks.find(item => item.id === id);

    if (!task) {
      setMessage("Задача не найдена.");
      return;
    }

    setEditingId(id);
    setMessage("");
  }

  // Удаление с подтверждением
  function handleDelete(id) {
    const confirmed = window.confirm(
      "Удалить выбранную задачу?"
    );

    if (!confirmed) return;

    setTasks(previous => removeTask(previous, id));

    if (editingId === id) {
      setEditingId(null);
    }

    setMessage("Задача удалена.");
  }

  // Добавление или сохранение изменений
  function handleSave(value) {
    if (editingId === null) {
      setTasks(previous => {
        const nextId = previous.length === 0
          ? 1
          : Math.max(...previous.map(task => task.id)) + 1;

        return addTask(previous, value, nextId);
      });

      setMessage("Новая задача добавлена.");

      return true;
    }

    const exists = tasks.some(
      task => task.id === editingId
    );

    if (!exists) {
      setMessage("Редактируемая задача не найдена.");
      return false;
    }

    setTasks(previous =>
      updateTask(previous, editingId, value)
    );

    setEditingId(null);
    setMessage("Изменения сохранены.");

    return true;
  }

  // Отмена редактирования
  function handleCancel() {
    setEditingId(null);
    setMessage("");
  }

  return (
    <main>
      <h1>Задачи на React</h1>

      <p>
        Практическая работа №7.
        Данные хранятся в памяти страницы.
      </p>

      <p role="status">{message}</p>

      <TaskStats stats={stats} />

      <TaskFilters
        filters={filters}
        categories={categories}
        onChange={setFilters}
      />

      <TaskForm
        key={editingId ?? "new"}
        categories={categories}
        initialTask={editingTask}
        onSave={handleSave}
        onCancel={handleCancel}
      />

      <TaskList
        tasks={visibleTasks}
        categories={categories}
        onToggle={handleToggle}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </main>
  );
}
