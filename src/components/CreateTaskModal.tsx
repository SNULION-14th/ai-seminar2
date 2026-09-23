import React, { useState } from "react";
import { useWorkspace } from "../context/WorkspaceContext";
import type { TaskItem } from "../types";
import { X, CheckSquare } from "lucide-react";

interface CreateTaskModalProps {
  onClose: () => void;
  task?: TaskItem;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  onClose,
  task,
}) => {
  const { addTask, updateTask, events } = useWorkspace();
  const [title, setTitle] = useState(task?.title || "");
  const [eventId, setEventId] = useState<string>(task?.eventId || "");
  const [dueDate, setDueDate] = useState(task?.dueDate || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const matchedEvent = events.find((ev) => ev.id === eventId);

    const taskData = {
      title: title.trim(),
      completed: task?.completed || false,
      eventId: eventId || undefined,
      eventTitle: matchedEvent?.title || undefined,
      dueDate: dueDate || undefined,
    };
    if (task) {
      updateTask(task.id, taskData);
    } else {
      addTask(taskData);
    }
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div
        className="modal-content small-modal"
        data-testid="create-task-modal"
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge">
              <CheckSquare size={18} />
            </div>
            <h3 className="modal-title">
              {task ? "Edit Google Task" : "Create Google Task"}
            </h3>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <label className="form-label">Task Title *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Write test suites for cache simulator"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              data-testid="task-title-input"
            />

            <label className="form-label mt-3">
              Associate with Event (Optional)
            </label>
            <select
              className="form-input"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
            >
              <option value="">-- No Linked Event --</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title} ({e.date})
                </option>
              ))}
            </select>

            <label className="form-label mt-3">Due Date (Optional)</label>
            <input
              type="date"
              className="form-input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={!title.trim()}
              data-testid="submit-create-task-btn"
            >
              {task ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
