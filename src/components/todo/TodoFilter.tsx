import React from 'react';
import type { FilterType } from '../../types/todo';
import filterIcon from '../../assets/figma/filter-icon.svg';

interface TodoFilterProps {
  activeCount: number;
  completedCount: number;
  currentFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  onClearCompleted: () => void;
}

export const TodoFilter: React.FC<TodoFilterProps> = ({
  activeCount,
  completedCount,
  currentFilter,
  onFilterChange,
  onClearCompleted,
}) => {
  return (
    <footer className="dashboard-footer">
      <div className="footer-left">
        <span className="items-left-count">
          {activeCount} {activeCount === 1 ? 'item' : 'items'} left
        </span>
      </div>

      <div className="footer-right">
        {/* Filter Pills Group */}
        <div className="filter-group" role="tablist" aria-label="Todo filter tabs">
          <div className="filter-icon-wrapper" aria-hidden="true">
            <img src={filterIcon} alt="Filter" width="14" height="14" />
          </div>

          <button
            type="button"
            role="tab"
            aria-selected={currentFilter === 'all'}
            className={`filter-btn ${currentFilter === 'all' ? 'active' : ''}`}
            onClick={() => onFilterChange('all')}
          >
            All
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={currentFilter === 'active'}
            className={`filter-btn ${currentFilter === 'active' ? 'active' : ''}`}
            onClick={() => onFilterChange('active')}
          >
            Active
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={currentFilter === 'completed'}
            className={`filter-btn ${currentFilter === 'completed' ? 'active' : ''}`}
            onClick={() => onFilterChange('completed')}
          >
            Completed
          </button>
        </div>

        {/* Clear Completed Button */}
        {completedCount > 0 && (
          <button
            type="button"
            className="clear-completed-btn"
            onClick={onClearCompleted}
            title="완료된 할 일 일괄 정리"
          >
            Clear completed
          </button>
        )}
      </div>
    </footer>
  );
};
