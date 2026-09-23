import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { X, CheckSquare } from 'lucide-react';

interface CreateTaskModalProps {
  onClose: () => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ onClose }) => {
  const { addTask, events } = useWorkspace();
  const [title, setTitle] = useState('');
  const [eventId, setEventId] = useState<string>('');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const matchedEvent = events.find(ev => ev.id === eventId);

    addTask({
      title: title.trim(),
      completed: false,
      eventId: eventId || undefined,
      eventTitle: matchedEvent?.title || undefined,
      dueDate: dueDate || undefined
    });
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content small-modal" data-testid="create-task-modal">
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge">
              <CheckSquare size={18} />
            </div>
            <h3 className="modal-title">Create Google Task</h3>
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

            <label className="form-label mt-3">Associate with Event (Optional)</label>
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
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={!title.trim()}
              data-testid="submit-create-task-btn"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
