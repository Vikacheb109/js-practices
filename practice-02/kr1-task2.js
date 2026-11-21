
import { demoTasks } from "./src/data.js";

import { getPendingTasks } from "./src/task-service.js";

// Проверка 1. Обычный список
console.log("Проверка 1: исходный demoTasks");

const pendingTasks = getPendingTasks(demoTasks);

const pendingIds = pendingTasks.map(task => task.id);

console.log(
  "Невыполненные ID:",
  JSON.stringify(pendingIds)
);

// Проверка 2. Пустой список
console.log("Проверка 2: пустой массив []");

const emptyResult = getPendingTasks([]);

console.log(
  "Результат:",
  JSON.stringify(emptyResult)
);
