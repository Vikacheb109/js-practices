
import { Router } from "express";

import { ApiError } from "./errors.js";

import {
  parsePositiveId,
  parseFilters
} from "./validation.js";


export function createRouter(store) {
  const router = Router({ caseSensitive: true });


  // 1. Состояние сервера
  router.get("/health", (req, res) => {
    return res.status(200).json({
      data: {
        status: "ok"
      }
    });
  });


  // 2. Список категорий
  router.get("/categories", (req, res) => {
    const categories = store.listCategories();

    return res.status(200).json({
      data: categories,
      meta: {
        total: categories.length
      }
    });
  });


  // 3. Список задач с фильтрацией
  router.get("/tasks", (req, res) => {

    // Читаем параметры исходного URL
    const url = new URL(
      req.originalUrl,
      "http://localhost"
    );

    // Проверяем и преобразуем фильтры
    const filters = parseFilters(url.searchParams);

    // Получаем задачи из хранилища
    const tasks = store.listTasks(filters);

    // Возвращаем JSON
    return res.status(200).json({
      data: tasks,
      meta: {
        total: tasks.length,
        filters
      }
    });
  });


  // 4. Получение одной задачи
  router.get("/tasks/:id", (req, res) => {

    // Проверяем ID из адреса
    const id = parsePositiveId(req.params.id);

    if (id === null) {
      throw new ApiError(
        400,
        "INVALID_ID",
        "Некорректный идентификатор задачи"
      );
    }

    // Ищем задачу в хранилище
    const task = store.getTask(id);

    if (task === null) {
      throw new ApiError(
        404,
        "TASK_NOT_FOUND",
        "Задача не найдена.",
        { id }
      );
    }

    return res.status(200).json({
      data: task
    });
  });


  // 5. Запрет изменяющих методов
  // Эти маршруты должны находиться ПОСЛЕ GET

  const knownPaths = [
    "/health",
    "/categories",
    "/tasks",
    "/tasks/:id"
  ];

  for (const path of knownPaths) {
    router.all(path, (req, res) => {
      res.set(
        "Allow",
        "GET, HEAD, OPTIONS"
      );

      throw new ApiError(
        405,
        "METHOD_NOT_ALLOWED",
        "HTTP-метод не поддерживается для этого маршрута"
      );
    });
  }

  return router;
}

