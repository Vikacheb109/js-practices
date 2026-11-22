
const EMPTY_FILTERS = {
  q: "",
  completed: "",
  priority: "",
  categoryId: ""
};

export default function TaskFilters({
  filters,
  categories,
  onChange
}) {
  function changeField(name, value) {
    onChange({
      ...filters,
      [name]: value
    });
  }

  function resetFilters() {
    onChange({ ...EMPTY_FILTERS });
  }

  return (
    <section aria-label="Фильтры задач">
      <h2>Поиск и фильтры</h2>

      <div className="task-filters">
        <label htmlFor="filter-q">Поиск по названию</label>
        <input
          id="filter-q"
          type="search"
          value={filters.q}
          onChange={event =>
            changeField("q", event.target.value)
          }
        />

        <label htmlFor="filter-completed">Статус</label>
        <select
          id="filter-completed"
          value={filters.completed}
          onChange={event =>
            changeField("completed", event.target.value)
          }
        >
          <option value="">Все статусы</option>
          <option value="false">В работе</option>
          <option value="true">Выполненные</option>
        </select>

        <label htmlFor="filter-priority">Приоритет</label>
        <select
          id="filter-priority"
          value={filters.priority}
          onChange={event =>
            changeField("priority", event.target.value)
          }
        >
          <option value="">Все приоритеты</option>
          <option value="low">Низкий</option>
          <option value="medium">Средний</option>
          <option value="high">Высокий</option>
        </select>

        <label htmlFor="filter-category">Категория</label>
        <select
          id="filter-category"
          value={filters.categoryId}
          onChange={event =>
            changeField("categoryId", event.target.value)
          }
        >
          <option value="">Все категории</option>
          {categories.map(category => (
            <option key={category.id} value={String(category.id)}>
              {category.name}
            </option>
          ))}
        </select>

        <button type="button" onClick={resetFilters}>
          Сбросить фильтры
        </button>
      </div>
    </section>
  );
}
