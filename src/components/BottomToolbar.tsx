import React, { useState } from 'react';
import type { FilterType, Priority } from '../types/todo';
import plusIcon from '../assets/figma/plus-icon.svg';
import addArrowIcon from '../assets/figma/add-arrow.svg';
import filterAllIcon from '../assets/figma/filter-all.svg';
import filterFocusIcon from '../assets/figma/filter-focus.svg';
import filterCompletedIcon from '../assets/figma/filter-completed.svg';

interface BottomToolbarProps {
  currentFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  onAddTask: (title: string, priority: Priority) => void;
}

export const BottomToolbar: React.FC<BottomToolbarProps> = ({
  currentFilter,
  onFilterChange,
  onAddTask,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<Priority>('High');
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;

    onAddTask(inputValue.trim(), selectedPriority);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const hasText = inputValue.trim().length > 0;

  return (
    <div className="bottom-toolbar-container">
      <div className="bottom-toolbar">
        {/* Task Input Box */}
        <form className="task-input-box" onSubmit={handleSubmit}>
          <img src={plusIcon} alt="" className="input-plus-icon" />

          <input
            type="text"
            className="task-text-input"
            placeholder="What is your main focus today?"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <div className="input-actions-group">
            {/* Priority Selector Pill */}
            <div className="priority-select-wrapper">
              <button
                type="button"
                className={`priority-select-btn priority-${selectedPriority.toLowerCase()}`}
                onClick={() => setShowPriorityMenu(!showPriorityMenu)}
                title="Select priority"
              >
                {selectedPriority}
              </button>

              {showPriorityMenu && (
                <div className="priority-menu-dropdown">
                  {(['High', 'Medium', 'Low'] as Priority[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`priority-menu-item priority-${p.toLowerCase()} ${
                        selectedPriority === p ? 'active' : ''
                      }`}
                      onClick={() => {
                        setSelectedPriority(p);
                        setShowPriorityMenu(false);
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span className="enter-badge" onClick={() => handleSubmit()} title="Press Enter to add">
              + Enter
            </span>

            <button
              type="submit"
              className={`add-submit-btn ${hasText ? 'active' : ''}`}
              disabled={!hasText}
              aria-label="Add task"
            >
              <img src={addArrowIcon} alt="" className="add-arrow-svg" />
            </button>
          </div>
        </form>

        {/* Filter Segmented Control */}
        <div className="filter-segmented-control" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={currentFilter === 'all'}
            className={`filter-tab-btn ${currentFilter === 'all' ? 'active' : ''}`}
            onClick={() => onFilterChange('all')}
          >
            <img src={filterAllIcon} alt="" className="filter-icon" />
            <span>All</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={currentFilter === 'focus'}
            className={`filter-tab-btn ${currentFilter === 'focus' ? 'active' : ''}`}
            onClick={() => onFilterChange('focus')}
          >
            <img src={filterFocusIcon} alt="" className="filter-icon" />
            <span>Focus</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={currentFilter === 'completed'}
            className={`filter-tab-btn ${currentFilter === 'completed' ? 'active' : ''}`}
            onClick={() => onFilterChange('completed')}
          >
            <img src={filterCompletedIcon} alt="" className="filter-icon" />
            <span>Completed</span>
          </button>
        </div>
      </div>
    </div>
  );
};
