
import { validateTaskDraft } from "./src/form-validation.js";

// Преподаватель требует пустой массив задач
const tasks = [];

// Проверка 1: правильное название
const draft1 = {
  id: "20",
  title: " Изучить localStorage ",
  priority: "high"
};

const result1 = validateTaskDraft(draft1, tasks);

console.log("ПРОВЕРКА 1: правильное название");
console.log("ok:", result1.ok);
console.log("value.title:", result1.value?.title);
console.log("errors:", JSON.stringify(result1.errors ?? {}));

console.log("----------------------------");

// Проверка 2: название из одного пробела
const draft2 = {
  id: "20",
  title: " ",
  priority: "high"
};

const result2 = validateTaskDraft(draft2, tasks);

console.log("ПРОВЕРКА 2: название из пробела");
console.log("ok:", result2.ok);
console.log("errors.title:", result2.errors?.title);
