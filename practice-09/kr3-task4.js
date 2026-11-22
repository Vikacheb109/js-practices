
import express from "express";

import { ApiError, errorHandler } from "./src/errors.js";

import { validateTaskTitle } from "./src/validation.js";

const app = express();

// Разрешаем серверу читать JSON из тела запроса
app.use(express.json());

// Обработчик POST-запроса
app.post("/api/tasks", (req, res, next) => {
  const title = req.body?.title;

  const validation = validateTaskTitle(title);

  // Если название неправильное — ошибка 400
  if (!validation.ok) {
    return next(
      new ApiError(
        400,
        "INVALID_BODY",
        validation.error
      )
    );
  }

  // В КР3 демонстрируем только валидацию.
  // Создание задачи здесь не реализуем.
  return res.status(501).json({
    error: {
      code: "NOT_IMPLEMENTED",
      message: "Создание задач не входит в эту демонстрацию"
    }
  });
});

// Общий обработчик ошибок из ПР9
app.use(errorHandler);

// Отдельный порт, чтобы не конфликтовать с ПР9
app.listen(5515, "127.0.0.1", () => {
  console.log(
    "Сервер КР3: http://127.0.0.1:5515/api/tasks"
  );
});
