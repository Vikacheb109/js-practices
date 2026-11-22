
console.log("ЗАДАНИЕ №4. ПРОВЕРКА НАЗВАНИЯ");

// Отправляем неправильную задачу на сервер
const response = await fetch(
  "http://127.0.0.1:5515/api/tasks",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      title: "   "
    })
  }
);

// Читаем ответ сервера
const result = await response.json();

// Показываем результат
console.log("HTTP-статус:", response.status);
console.log("Статус:", response.statusText);

console.log("Ответ сервера:");
console.log(JSON.stringify(result, null, 2));


