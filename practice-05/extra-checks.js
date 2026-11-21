
import {
  createApiClient,
  ApiError
} from "./src/api-client.js";

import { createTaskApi } from "./src/task-api.js";

const client = createApiClient({
  baseUrl: "http://127.0.0.1:5505/api",
  timeoutMs: 2000
});

const api = createTaskApi(client);


// 1. Своя комбинация фильтров
console.log("\nПРОВЕРКА 1. Свои фильтры");

try {
  const result = await api.getTasks({
    completed: false,
    priority: "high",
    categoryId: 2
  });

  console.log(
    "Получены ID:",
    result.tasks.map(task => task.id)
  );

  console.log("Всего:", result.meta.total);
} catch (error) {
  console.log("Ошибка:", error.message);
}


// 2. Дополнительная HTTP-ошибка
console.log("\nПРОВЕРКА 2. Ошибка HTTP 503");

try {
  await client.requestJson("/debug/error");
} catch (error) {
  if (error instanceof ApiError) {
    console.log("Тип ошибки:", error.kind);
    console.log("HTTP-статус:", error.status);
    console.log("Код API:", error.code);
  } else {
    console.log(error.message);
  }
}


// 3. Слишком долгое ожидание
console.log("\nПРОВЕРКА 3. Тайм-аут");

try {
  await client.requestJson("/debug/delay", {
    query: { ms: 150 },
    timeoutMs: 20
  });
} catch (error) {
  console.log("Тип ошибки:", error.kind);
}


// 4. Отмена пользователем
console.log("\nПРОВЕРКА 4. Явная отмена");

const controller = new AbortController();

const pending = client.requestJson("/debug/delay", {
  query: { ms: 150 },
  signal: controller.signal,
  timeoutMs: 1000
});

controller.abort();

try {
  await pending;
} catch (error) {
  console.log("Тип ошибки:", error.kind);
}


// 5. Сочетание поиска, статуса и приоритета
console.log("\nСВОЯ ПРОВЕРКА 1. Три фильтра");

try {
  const result = await api.getTasks({
    q: "провер",
    completed: false,
    priority: "low"
  });

  console.log("ID:", result.tasks.map(task => task.id));
  console.log("Количество:", result.meta.total);
} catch (error) {
  console.log("Ошибка:", error.message);
}


// 6. Несуществующая категория
console.log("\nСВОЯ ПРОВЕРКА 2. Категория 999");

try {
  await client.requestJson("/categories/999");
} catch (error) {
  console.log("Тип:", error.kind);
  console.log("Статус:", error.status);
  console.log("Код:", error.code);
}


// 7. Некорректный параметр сервера
console.log("\nСВОЯ ПРОВЕРКА 3. categoryId=0");

try {
  await client.requestJson("/tasks", {
    query: { categoryId: 0 }
  });
} catch (error) {
  console.log("Тип:", error.kind);
  console.log("Статус:", error.status);
  console.log("Код:", error.code);
}
