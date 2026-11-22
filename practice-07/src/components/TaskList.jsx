
import TaskItem from "./TaskItem.jsx";

export default function TaskList({
  tasks,
  categories,
  onToggle,
  onEdit,
  onDelete
}) {
  return (
    <section aria-label="Список задач">
      <h2>Список задач</h2>

      <p>Найдено задач: {tasks.length}</p>

      {tasks.length === 0 ? (
        <p role="status">
          По выбранным условиям задач нет.
        </p>
      ) : (
        <ul className="task-list">
          {tasks.map(task => {
            const category = categories.find(
              item => item.id === task.categoryId
            );

            return (
              <TaskItem
                key={task.id}
                task={task}
                categoryName={category?.name ?? "Неизвестная категория"}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            );
          })}
        </ul>
      )}
    </section>
  );
}
