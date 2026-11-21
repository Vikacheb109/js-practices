
import { demoTasks } from "./src/data.js";

import {
  findTaskById,
  setTaskCompleted
} from "./src/task-service.js";


// Запоминаем исходный массив
const originalData = JSON.stringify(demoTasks);


// ПРОВЕРКА 1. Успешное изменение статуса
console.log("Проверка 1: id=4, completed=true");

const originalTask = findTaskById(demoTasks, 4);

console.log(
  "Исходный статус до изменения:",
  originalTask.completed
);

const result = setTaskCompleted(demoTasks, 4, true);

console.log("Успех операции:", result.ok);

const updatedTask = findTaskById(result.tasks, 4);

console.log(
  "Статус в новом массиве:",
  updatedTask.completed
);

console.log(
  "Статус в исходном массиве:",
  originalTask.completed
);

console.log(
  "Создан новый массив:",
  result.tasks !== demoTasks
);

console.log(
  "Создан новый объект задачи:",
  updatedTask !== originalTask
);


// ПРОВЕРКА 2. Отсутствующий ID
console.log("\nПроверка 2: id=777, completed=true");

const errorResult = setTaskCompleted(demoTasks, 777, true);

console.log("Успех операции:", errorResult.ok);

console.log("Сообщение:", errorResult.error);

console.log(
  "Исходные данные сохранились:",
  JSON.stringify(demoTasks) === originalData
);
