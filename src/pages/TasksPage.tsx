import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { TaskCard } from '../components/TaskCard';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { CheckSquare, Plus } from 'lucide-react';

export const TasksPage: React.FC = () => {
  const { tasks, toggleTask, deleteTask } = useWorkspace();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  return (
    <div className="page-container" data-testid="tasks-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Google Tasks</h1>
          <p className="page-subtitle">
            Track and complete actions originated from your calendar events.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
          data-testid="create-task-page-btn"
        >
          <Plus size={16} />
          <span>New Task</span>
        </button>
      </div>

      <div className="filter-tabs">
        <button
          className={`tab-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({tasks.length})
        </button>
        <button
          className={`tab-btn ${filter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter('active')}
        >
          Active ({tasks.filter((t) => !t.completed).length})
        </button>
        <button
          className={`tab-btn ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed ({tasks.filter((t) => t.completed).length})
        </button>
      </div>

      <div className="tasks-list-stack">
        {filteredTasks.length === 0 ? (
          <div className="empty-state">
            <CheckSquare size={32} className="text-muted mb-2" />
            <p>No tasks found for this view.</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={toggleTask}
              onDelete={deleteTask}
            />
          ))
        )}
      </div>

      {showCreateModal && (
        <CreateTaskModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
};
