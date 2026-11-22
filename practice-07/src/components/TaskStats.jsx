
export default function TaskStats({ stats }) {
  return (
    <section aria-label="Статистика задач">
      <h2>Статистика</h2>

      <div className="task-stats">
        <p>
          Всего: <strong>{stats.total}</strong>
        </p>

        <p>
          Выполнено: <strong>{stats.completed}</strong>
        </p>

        <p>
          В работе: <strong>{stats.active}</strong>
        </p>
      </div>
    </section>
  );
}
