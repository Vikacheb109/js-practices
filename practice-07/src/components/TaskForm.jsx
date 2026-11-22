
import { useState } from "react";
import { validateTaskDraft } from "../domain/task-service.js";

function makeDraft(task, categories) {
  return {
    title: task?.title ?? "",
    priority: task?.priority ?? "medium",
    categoryId: task
      ? String(task.categoryId)
      : String(categories[0]?.id ?? "")
  };
}

export default function TaskForm({
  categories,
  initialTask = null,
  onSave,
  onCancel
}) {
  const [draft, setDraft] = useState(
    () => makeDraft(initialTask, categories)
  );

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");

  const editing = initialTask !== null;

  function changeField(name, value) {
    setDraft(previous => ({
      ...previous,
      [name]: value
    }));

    setErrors(previous => ({
      ...previous,
      [name]: ""
    }));

    setMessage("");
  }

  function submitForm(event) {
    event.preventDefault();

    const result = validateTaskDraft(draft, categories);

    if (!result.valid) {
      setErrors(result.errors);
      setMessage("");
      return;
    }

    setErrors({});

    try {
      const saved = onSave(result.value);

      if (saved === true) {
        if (!editing) {
          setDraft(makeDraft(null, categories));
          setMessage("Задача успешно добавлена.");
        }
      } else {
        setMessage("Не удалось сохранить задачу.");
      }
    } catch {
      setMessage("Не удалось сохранить задачу.");
    }
  }

  return (
    <section aria-label="Форма задачи">
      <h2>
        {editing ? "Редактирование задачи" : "Добавление задачи"}
      </h2>

      {editing && (
        <p>Редактируется задача №{initialTask.id}</p>
      )}

      <form onSubmit={submitForm} noValidate>
        <div>
          <label htmlFor="task-title">Название задачи</label>
          <input
            id="task-title"
            name="title"
            type="text"
            value={draft.title}
            onChange={event =>
              changeField("title", event.target.value)
            }
            aria-invalid={Boolean(errors.title)}
            aria-describedby="error-title"
          />
          <p id="error-title" role={errors.title ? "alert" : undefined}>
            {errors.title ?? ""}
          </p>
        </div>

        <div>
          <label htmlFor="task-priority">Приоритет</label>
          <select
            id="task-priority"
            name="priority"
            value={draft.priority}
            onChange={event =>
              changeField("priority", event.target.value)
            }
            aria-invalid={Boolean(errors.priority)}
            aria-describedby="error-priority"
          >
            <option value="low">Низкий</option>
            <option value="medium">Средний</option>
            <option value="high">Высокий</option>
          </select>
          <p
            id="error-priority"
            role={errors.priority ? "alert" : undefined}
          >
            {errors.priority ?? ""}
          </p>
        </div>

        <div>
          <label htmlFor="task-category">Категория</label>
          <select
            id="task-category"
            name="categoryId"
            value={draft.categoryId}
            onChange={event =>
              changeField("categoryId", event.target.value)
            }
            aria-invalid={Boolean(errors.categoryId)}
            aria-describedby="error-categoryId"
          >
            <option value="">Выберите категорию</option>
            {categories.map(category => (
              <option
                key={category.id}
                value={String(category.id)}
              >
                {category.name}
              </option>
            ))}
          </select>
          <p
            id="error-categoryId"
            role={errors.categoryId ? "alert" : undefined}
          >
            {errors.categoryId ?? ""}
          </p>
        </div>

        <button type="submit">
          {editing ? "Сохранить изменения" : "Добавить задачу"}
        </button>

        {editing && (
          <button type="button" onClick={onCancel}>
            Отменить редактирование
          </button>
        )}

        {message && (
          <p role="alert">{message}</p>
        )}
      </form>
    </section>
  );
}
