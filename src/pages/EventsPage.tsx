import React, { useState } from "react";
import { useWorkspace } from "../context/WorkspaceContext";
import { EventCard } from "../components/EventCard";
import { CreateEventModal } from "../components/CreateEventModal";
import { Calendar, Plus } from "lucide-react";
import type { EventItem } from "../types";

export const EventsPage: React.FC = () => {
  const { events, startPreparation, deleteEvent } = useWorkspace();
  const [editingEvent, setEditingEvent] = useState<EventItem | undefined>();
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="page-container" data-testid="events-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Google Calendar Events</h1>
          <p className="page-subtitle">
            Manage your schedule, exams, and project milestones.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
          data-testid="create-event-page-btn"
        >
          <Plus size={16} />
          <span>New Event</span>
        </button>
      </div>

      <div className="events-grid">
        {events.length === 0 ? (
          <div className="empty-state">
            <Calendar size={32} className="text-muted mb-2" />
            <p>No events scheduled. Create one to get started.</p>
          </div>
        ) : (
          events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onPrepare={startPreparation}
              onEdit={setEditingEvent}
              onDelete={deleteEvent}
            />
          ))
        )}
      </div>

      {showCreateModal && (
        <CreateEventModal onClose={() => setShowCreateModal(false)} />
      )}
      {editingEvent && (
        <CreateEventModal
          event={editingEvent}
          onClose={() => setEditingEvent(undefined)}
        />
      )}
    </div>
  );
};
