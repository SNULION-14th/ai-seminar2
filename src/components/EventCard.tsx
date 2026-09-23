import React from "react";
import type { EventItem } from "../types";
import {
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Trash2,
  Pencil,
} from "lucide-react";

interface EventCardProps {
  event: EventItem;
  onPrepare: (id: string) => void;
  onEdit?: (event: EventItem) => void;
  onDelete?: (id: string) => void;
  isSelected?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onPrepare,
  onEdit,
  onDelete,
  isSelected,
}) => {
  return (
    <div
      className={`event-card ${isSelected ? "selected" : ""}`}
      data-testid={`event-card-${event.id}`}
    >
      <div className="event-card-header">
        <div className="event-badge">
          <Calendar size={13} />
          <span>{event.date}</span>
          {event.time && (
            <span className="event-time">
              <Clock size={12} /> {event.time}
            </span>
          )}
        </div>
        {(onEdit || onDelete) && (
          <div className="event-card-actions">
            {onEdit && (
              <button
                className="icon-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(event);
                }}
                title="Edit Event"
                data-testid={`edit-event-btn-${event.id}`}
              >
                <Pencil size={14} />
              </button>
            )}
            {onDelete && (
              <button
                className="icon-btn delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  if (
                    window.confirm(
                      `Delete "${event.title}"? Linked tasks will be kept without this event.`,
                    )
                  ) {
                    onDelete(event.id);
                  }
                }}
                title="Delete Event"
                data-testid={`delete-event-btn-${event.id}`}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      <h3 className="event-title">{event.title}</h3>

      {event.description && <p className="event-desc">{event.description}</p>}

      {event.location && (
        <div className="event-meta">
          <MapPin size={13} />
          <span>{event.location}</span>
        </div>
      )}

      <div className="event-card-footer">
        {event.needsPreparation ? (
          <button
            className="btn btn-prepare"
            onClick={() => onPrepare(event.id)}
            data-testid={`prepare-btn-${event.id}`}
          >
            <Sparkles size={14} />
            <span>Prepare</span>
          </button>
        ) : (
          <div className="no-prep-tag" data-testid={`no-prep-tag-${event.id}`}>
            No prep needed
          </div>
        )}
      </div>
    </div>
  );
};
