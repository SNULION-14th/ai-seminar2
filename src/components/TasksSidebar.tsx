import React, { useState, useMemo } from "react";
import type { TaskItem } from "../types";
import { TaskCard } from "./TaskCard";
import {
  Plus,
  CheckCircle2,
  ListFilter,
  X,
  Calendar,
  Layers,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface TasksSidebarProps {
  tasks: TaskItem[];
  selectedEventId: string | null;
  selectedEventTitle?: string;
  onClearSelectedEvent?: () => void;
  onToggleTask: (taskId: string) => void;
  onEditTask: (task: TaskItem) => void;
  onDeleteTask: (taskId: string) => void;
  onAddTask: (title: string, eventId?: string, eventTitle?: string) => void;
}

export const TasksSidebar: React.FC<TasksSidebarProps> = ({
  tasks,
  selectedEventId,
  selectedEventTitle,
  onClearSelectedEvent,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onAddTask,
}) => {
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [viewMode, setViewMode] = useState<"date" | "event">("date");
  const [quickTitle, setQuickTitle] = useState("");

  const now = new Date();
  const referenceDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  // Tasks relevant to current selected event (or all tasks)
  const relevantTasks = useMemo(() => {
    if (!selectedEventId) return tasks;
    return tasks.filter((t) => t.eventId === selectedEventId);
  }, [tasks, selectedEventId]);

  // Counts for each tab state
  const allCount = relevantTasks.length;
  const activeCount = relevantTasks.filter((t) => !t.completed).length;
  const doneCount = relevantTasks.filter((t) => t.completed).length;

  // Filtered tasks based on status
  const displayedTasks = useMemo(() => {
    return relevantTasks.filter((t) => {
      if (filter === "active") return !t.completed;
      if (filter === "completed") return t.completed;
      return true;
    });
  }, [relevantTasks, filter]);

  // Group by Due Date (Upcoming with Overdue on top)
  const dateGroups = useMemo(() => {
    const overdue: TaskItem[] = [];
    const upcoming: TaskItem[] = [];
    const noDate: TaskItem[] = [];

    displayedTasks.forEach((t) => {
      if (!t.completed && t.dueDate && t.dueDate < referenceDate) {
        overdue.push(t);
      } else if (t.dueDate) {
        upcoming.push(t);
      } else {
        noDate.push(t);
      }
    });

    overdue.sort((a, b) => (a.dueDate! > b.dueDate! ? 1 : -1));
    upcoming.sort((a, b) => (a.dueDate! > b.dueDate! ? 1 : -1));

    return { overdue, upcoming, noDate };
  }, [displayedTasks, referenceDate]);

  // Group by Event
  const eventGroups = useMemo(() => {
    const groups: Record<string, { title: string; tasks: TaskItem[] }> = {};
    const unassigned: TaskItem[] = [];

    displayedTasks.forEach((t) => {
      if (t.eventId) {
        if (!groups[t.eventId]) {
          groups[t.eventId] = {
            title: t.eventTitle || "Linked Event",
            tasks: [],
          };
        }
        groups[t.eventId].tasks.push(t);
      } else {
        unassigned.push(t);
      }
    });

    return { groups: Object.values(groups), unassigned };
  }, [displayedTasks]);

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    onAddTask(
      quickTitle.trim(),
      selectedEventId || undefined,
      selectedEventTitle || undefined,
    );
    setQuickTitle("");
  };

  return (
    <aside className="tasks-sidebar" data-testid="tasks-sidebar">
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="sidebar-title-row">
          <div className="sidebar-title-group">
            <CheckCircle2 size={16} className="text-main" />
            <h3 className="sidebar-title">Tasks</h3>
            <span className="count-chip">{activeCount} pending</span>
          </div>
        </div>

        {/* Clear High-Contrast Segmented Filter Control */}
        <div
          className="segmented-filter-bar"
          role="tablist"
          aria-label="Task status filter"
        >
          <button
            className={`segmented-filter-tab ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
            role="tab"
            aria-selected={filter === "all"}
            data-testid="filter-all-btn"
          >
            <span>All</span>
            <span className="tab-count-badge">{allCount}</span>
          </button>
          <button
            className={`segmented-filter-tab ${filter === "active" ? "active" : ""}`}
            onClick={() => setFilter("active")}
            role="tab"
            aria-selected={filter === "active"}
            data-testid="filter-active-btn"
          >
            <span>Active</span>
            <span className="tab-count-badge">{activeCount}</span>
          </button>
          <button
            className={`segmented-filter-tab ${filter === "completed" ? "active" : ""}`}
            onClick={() => setFilter("completed")}
            role="tab"
            aria-selected={filter === "completed"}
            data-testid="filter-done-btn"
          >
            <span>Done</span>
            <span className="tab-count-badge">{doneCount}</span>
          </button>
        </div>

        {/* View Mode Switcher: By Date vs By Event */}
        <div className="tasks-grouping-switcher">
          <button
            className={`group-switch-btn ${viewMode === "date" ? "active" : ""}`}
            onClick={() => setViewMode("date")}
            data-testid="group-mode-date"
          >
            <Calendar size={11} />
            <span>By Date</span>
          </button>
          <button
            className={`group-switch-btn ${viewMode === "event" ? "active" : ""}`}
            onClick={() => setViewMode("event")}
            data-testid="group-mode-event"
          >
            <Layers size={11} />
            <span>By Event</span>
          </button>
        </div>

        {/* Selected Event Filter Banner - Refined Minimal Design */}
        {selectedEventId && (
          <div
            className="active-event-filter-bar"
            data-testid="active-event-filter"
          >
            <div className="filter-event-info">
              <span className="filter-indicator-dot" />
              <div className="filter-text-group">
                <span className="filter-eyebrow">Filtering by event</span>
                <span className="filter-event-name" title={selectedEventTitle}>
                  {selectedEventTitle || "Selected Event"}
                </span>
              </div>
            </div>
            {onClearSelectedEvent && (
              <button
                className="filter-clear-btn"
                onClick={onClearSelectedEvent}
                title="Clear filter and show all tasks"
                data-testid="clear-event-filter-btn"
                aria-label="Clear filter"
              >
                <X size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Quick Add Form */}
      <form onSubmit={handleQuickAdd} className="quick-add-task-form">
        <input
          type="text"
          className="quick-add-input"
          placeholder={
            selectedEventTitle
              ? `+ Add task for ${selectedEventTitle}...`
              : "+ Add a task..."
          }
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          data-testid="quick-add-task-input"
        />
        {quickTitle.trim() && (
          <button
            type="submit"
            className="icon-btn quick-submit-btn"
            title="Create task"
            data-testid="quick-add-task-submit"
          >
            <Plus size={15} />
          </button>
        )}
      </form>

      {/* Tasks List */}
      <div className="sidebar-tasks-scroll">
        {displayedTasks.length === 0 ? (
          <div className="empty-state-card" data-testid="tasks-empty-state">
            {filter === "completed" ? (
              <>
                <CheckCircle size={22} className="empty-state-icon" />
                <p className="empty-state-title">No completed tasks yet</p>
                <p className="empty-state-desc">
                  Check off items on your list as you accomplish them.
                </p>
              </>
            ) : filter === "active" ? (
              <>
                <CheckCircle2
                  size={22}
                  className="empty-state-icon text-success"
                />
                <p className="empty-state-title">All tasks completed!</p>
                <p className="empty-state-desc">
                  You are all caught up. Add a new task anytime.
                </p>
              </>
            ) : selectedEventId ? (
              <>
                <ListFilter size={22} className="empty-state-icon" />
                <p className="empty-state-title">
                  No tasks linked to this event
                </p>
                <p className="empty-state-desc">
                  Use the input above or generate an Action Plan to add tasks.
                </p>
              </>
            ) : (
              <>
                <Calendar size={22} className="empty-state-icon" />
                <p className="empty-state-title">No tasks found</p>
                <p className="empty-state-desc">
                  Create your first task to start organizing your work.
                </p>
              </>
            )}
          </div>
        ) : viewMode === "date" ? (
          /* View 1: Sorted by Due Date (Overdue first, then upcoming) */
          <div className="sidebar-tasks-list">
            {/* Overdue Section */}
            {dateGroups.overdue.length > 0 && (
              <div className="task-subgroup overdue-subgroup">
                <div className="subgroup-header overdue-header">
                  <AlertCircle size={12} />
                  <span>Overdue ({dateGroups.overdue.length})</span>
                </div>
                <div className="subgroup-items">
                  {dateGroups.overdue.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggle={onToggleTask}
                      onEdit={onEditTask}
                      onDelete={onDeleteTask}
                      showEventTitle={!selectedEventId}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Section */}
            {dateGroups.upcoming.length > 0 && (
              <div className="task-subgroup">
                {dateGroups.overdue.length > 0 && (
                  <div className="subgroup-header">
                    <span>Upcoming</span>
                  </div>
                )}
                <div className="subgroup-items">
                  {dateGroups.upcoming.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggle={onToggleTask}
                      onEdit={onEditTask}
                      onDelete={onDeleteTask}
                      showEventTitle={!selectedEventId}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* No Date Section */}
            {dateGroups.noDate.length > 0 && (
              <div className="task-subgroup">
                <div className="subgroup-header">
                  <span>No Due Date</span>
                </div>
                <div className="subgroup-items">
                  {dateGroups.noDate.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggle={onToggleTask}
                      onEdit={onEditTask}
                      onDelete={onDeleteTask}
                      showEventTitle={!selectedEventId}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* View 2: Grouped by Event */
          <div className="sidebar-tasks-list">
            {eventGroups.groups.map((group) => (
              <div key={group.title} className="task-subgroup">
                <div className="subgroup-header event-group-header">
                  <span className="event-group-title">{group.title}</span>
                  <span className="subgroup-count">{group.tasks.length}</span>
                </div>
                <div className="subgroup-items">
                  {group.tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggle={onToggleTask}
                      onEdit={onEditTask}
                      onDelete={onDeleteTask}
                      showEventTitle={false}
                    />
                  ))}
                </div>
              </div>
            ))}

            {eventGroups.unassigned.length > 0 && (
              <div className="task-subgroup">
                <div className="subgroup-header event-group-header">
                  <span className="event-group-title">Other Tasks</span>
                  <span className="subgroup-count">
                    {eventGroups.unassigned.length}
                  </span>
                </div>
                <div className="subgroup-items">
                  {eventGroups.unassigned.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggle={onToggleTask}
                      onDelete={onDeleteTask}
                      showEventTitle={false}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
