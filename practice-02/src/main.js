
import {
  demoTasks,
  variantNumber,
  variantTasks
} from "./data.js";

import {
  findTaskById,
  getPendingTasks,
  getTaskTitles,
  getTaskStats,
  addTask,
  setTaskCompleted,
  renameTask,
  removeTask
} from "./task-service.js";


// Показываем текущий список и статистику
function showState(label, tasks) {
  console.log(`\n=== ${label} ===`);

  console.table(tasks);
  console.log("Названия:", getTaskTitles(tasks));
  console.log(
    "Невыполненные ID:",
    getPendingTasks(tasks).map(task => task.id)
  );

  const { total, completed, pending, progress } =
    getTaskStats(tasks);

  console.log(`Всего: ${total}`);
  console.log(`Выполнено: ${completed}`);
  console.log(`Осталось: ${pending}`);

  if (total === 0) {
    console.log("Задач пока нет");
  } else {
    console.log(`Прогресс: ${progress.toFixed(1)}%`);
  }
}


// Обрабатываем успех или ошибку
function applyResult(tasks, result, label) {
  if (!result.ok) {
    console.log(`${label}: Ошибка — ${result.error}`);
    return tasks;
  }

  console.log(`${label}: успешно`);
  return result.tasks;
}


// ОБЩИЙ СЦЕНАРИЙ

console.log("===== ОБЩИЙ СЦЕНАРИЙ =====");

const originalDemo = JSON.stringify(demoTasks);
let currentTasks = demoTasks;

showState("Исходные задачи", currentTasks);

console.log(
  "Найдена задача №4:",
  findTaskById(currentTasks, 4)
);

// Добавляем новую задачу №20
currentTasks = applyResult(
  currentTasks,
  addTask(currentTasks, 20, "Добавить проверку", "high"),
  "Добавление задачи"
);

showState("После добавления", currentTasks);

// Отмечаем задачу №4 выполненной
currentTasks = applyResult(
  currentTasks,
  setTaskCompleted(currentTasks, 4, true),
  "Изменение статуса"
);

showState("После изменения статуса", currentTasks);

// Переименовываем задачу №10
currentTasks = applyResult(
  currentTasks,
  renameTask(currentTasks, 10, "Подготовить инструкцию запуска"),
  "Переименование"
);

showState("После переименования", currentTasks);

// Удаляем задачу №7
currentTasks = applyResult(
  currentTasks,
  removeTask(currentTasks, 7),
  "Удаление"
);

showState("После удаления", currentTasks);

// Проверяем обработку ошибки
const demoBeforeError = JSON.stringify(currentTasks);

currentTasks = applyResult(
  currentTasks,
  addTask(currentTasks, 20, "Дубликат"),
  "Повторное добавление"
);

console.log(
  "После ошибки список не изменился:",
  JSON.stringify(currentTasks) === demoBeforeError
);

console.log(
  "Исходный demoTasks не изменился:",
  JSON.stringify(demoTasks) === originalDemo
);


// ИНДИВИДУАЛЬНЫЙ СЦЕНАРИЙ

console.log(`\n===== ВАРИАНТ №${variantNumber} =====`);

const priorityFor80 = [
  "high", "medium", "low", "high",
  "medium", "low", "high", "low"
][variantNumber - 1];

const originalVariant = JSON.stringify(variantTasks);
let ownTasks = variantTasks;

showState("Исходный вариант", ownTasks);

// Добавляем задачу №80
ownTasks = applyResult(
  ownTasks,
  addTask(ownTasks, 80, "Финальная проверка проекта", priorityFor80),
  "Добавление №80"
);

showState("После добавления", ownTasks);

// Выполняем задачу №11
ownTasks = applyResult(
  ownTasks,
  setTaskCompleted(ownTasks, 11, true),
  "Выполнение №11"
);

showState("После изменения статуса", ownTasks);

// Переименовываем задачу №23
ownTasks = applyResult(
  ownTasks,
  renameTask(ownTasks, 23, "Обновить план работы"),
  "Переименование №23"
);

showState("После переименования", ownTasks);

// Удаляем задачу №37
ownTasks = applyResult(
  ownTasks,
  removeTask(ownTasks, 37),
  "Удаление №37"
);

showState("Итог индивидуального варианта", ownTasks);

// Проверяем повторный ID
const variantBeforeError = JSON.stringify(ownTasks);

ownTasks = applyResult(
  ownTasks,
  addTask(ownTasks, 80, "Дубликат", priorityFor80),
  "Повторное добавление №80"
);

console.log(
  "Отказ не изменил список:",
  JSON.stringify(ownTasks) === variantBeforeError
);

console.log(
  "Исходный variantTasks не изменился:",
  JSON.stringify(variantTasks) === originalVariant
);
