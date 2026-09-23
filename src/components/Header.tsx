import React from "react";
import { NavLink } from "react-router-dom";
import { Calendar, Layers, Plus } from "lucide-react";

interface HeaderProps {
  onOpenCreateEvent?: () => void;
  onOpenCreateTask?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCreateEvent,
  onOpenCreateTask,
}) => {
  return (
    <header className="app-header">
      <div className="header-left">
        <div className="brand">
          <Layers className="brand-icon" size={20} />
          <span className="brand-name">EventToAction</span>
        </div>
        <nav className="header-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            Workspace
          </NavLink>
        </nav>
      </div>

      <div className="header-actions">
        {onOpenCreateEvent && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={onOpenCreateEvent}
            aria-label="Create event"
            data-testid="header-add-event-btn"
          >
            <Calendar size={14} />
            <span>+ Event</span>
          </button>
        )}
        {onOpenCreateTask && (
          <button
            className="btn btn-primary btn-sm"
            onClick={onOpenCreateTask}
            aria-label="Create task"
            data-testid="header-add-task-btn"
          >
            <Plus size={14} />
            <span>+ Task</span>
          </button>
        )}
      </div>
    </header>
  );
};
