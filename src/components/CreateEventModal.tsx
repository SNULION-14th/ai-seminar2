import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { X, Calendar as CalendarIcon } from 'lucide-react';

interface CreateEventModalProps {
  onClose: () => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({ onClose }) => {
  const { addEvent } = useWorkspace();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('14:00');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [needsPreparation, setNeedsPreparation] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;
    addEvent({
      title: title.trim(),
      date,
      time: time || undefined,
      location: location.trim() || undefined,
      description: description.trim() || undefined,
      needsPreparation
    });
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content small-modal" data-testid="create-event-modal">
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge">
              <CalendarIcon size={18} />
            </div>
            <h3 className="modal-title">Create Calendar Event</h3>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <label className="form-label">Event Title *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Distributed Systems Lab Presentation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              data-testid="event-title-input"
            />

            <div className="form-row mt-3">
              <div className="form-col">
                <label className="form-label">Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-col">
                <label className="form-label">Time</label>
                <input
                  type="time"
                  className="form-input"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>

            <label className="form-label mt-3">Location</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Zoom or Room 302"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />

            <label className="form-label mt-3">Description</label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="Brief summary or requirements..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div className="form-checkbox-row mt-3">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={needsPreparation}
                  onChange={(e) => setNeedsPreparation(e.target.checked)}
                />
                <span>Requires task preparation (Action Plan)</span>
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={!title.trim() || !date}
              data-testid="submit-create-event-btn"
            >
              Create Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
