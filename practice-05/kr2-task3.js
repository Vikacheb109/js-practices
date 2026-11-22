
import { createApiClient } from "./src/api-client.js";
import { createTaskApi } from "./src/task-api.js";

// Настраиваем соединение с сервером
const client = createApiClient({
  baseUrl: "http://127.0.0.1:5505/api",
  timeoutMs: 2000
});

// Создаём API задач
const api = createTaskApi(client);

// Отправляем запрос с двумя фильтрами
const result = await api.getTasks({
  completed: false,
  priority: "high"
});

// Получаем номера задач
const ids = result.tasks.map(task => task.id);

// Показываем результат
console.log("ПРОВЕРКА 3. Получение задач с сервера");
console.log("ID задач:", JSON.stringify(ids));
console.log("meta.total:", result.meta.total);
