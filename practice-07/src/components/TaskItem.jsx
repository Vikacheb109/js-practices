
const PRIORITIES = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий"
};

export default function TaskItem({
  task,
  categoryName,
  onToggle,
  onEdit,
  onDelete
}) {
  return (
    <li className={`task-card ${task.completed ? "is-completed" : ""}`}>
      <h3 className="task-title">{task.title}</h3>

      <p className="task-status">
        Статус: {task.completed ? "Выполнена" : "В работе"}
      </p>

      <p className="task-priority">
        Приоритет: {PRIORITIES[task.priority]}
      </p>

      <p className="task-category">
        Категория: {categoryName}
      </p>

      <div className="task-actions">
        <button
          type="button"
          onClick={() => onToggle(task.id)}
          aria-pressed={task.completed}
        >
          {task.completed ? "Вернуть в работу" : "Выполнена"}
        </button>

        <button
          type="button"
          onClick={() => onEdit(task.id)}
        >
          Изменить
        </button>

        <button
          type="button"
          onClick={() => onDelete(task.id)}
        >
          Удалить
        </button>
      </div>
    </li>
  );
}
