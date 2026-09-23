import React, { useState } from "react";
import { useWorkspace } from "../context/WorkspaceContext";
import { CalendarGrid } from "../components/CalendarGrid";
import { TasksSidebar } from "../components/TasksSidebar";
import { EventActionContextView } from "../components/EventActionContextView";
import { CreateEventModal } from "../components/CreateEventModal";
import { CreateTaskModal } from "../components/CreateTaskModal";
import type { EventItem, TaskItem } from "../types";
import { Calendar as CalendarIcon, GitFork, CheckCircle2 } from "lucide-react";

export const WorkspacePage: React.FC = () => {
  const {
    events,
    tasks,
    startPreparation,
    preparationStatus,
    preparationError,
    deleteEvent,
    toggleTask,
    deleteTask,
    addTask,
  } = useWorkspace();

  const [activeTab, setActiveTab] = useState<"calendar" | "relationship">(
    "calendar",
  );
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [createEventDate, setCreateEventDate] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<EventItem | undefined>();
  const [editingTask, setEditingTask] = useState<TaskItem | undefined>();
  const [mobilePane, setMobilePane] = useState<"calendar" | "tasks">(
    "calendar",
  );

  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const activeTaskCount = tasks.filter((t) => !t.completed).length;

  const handleOpenCreateEventWithDate = (dateStr?: string) => {
    const fallbackDate = new Date().toISOString().split("T")[0];
    setCreateEventDate(dateStr || fallbackDate);
  };

  const handleAddTask = (
    title: string,
    eventId?: string,
    eventTitle?: string,
  ) => {
    addTask({
      title,
      completed: false,
      eventId,
      eventTitle,
    });
  };

  return (
    <div className="workspace-page" data-testid="workspace-page">
      {/* Workspace Hero & View Switcher */}
      <div className="workspace-hero">
        <div className="hero-text">
          <h1 className="hero-title">Calendar & Tasks</h1>
          <p className="hero-desc">
            Organize calendar events and execute decomposed tasks linked with
            Notion.
          </p>
          {(preparationStatus === "loading" || preparationError) && (
            <p className="integration-notice" role="status">
              {preparationStatus === "loading"
                ? "Generating an editable action-plan suggestion…"
                : preparationError}
            </p>
          )}
        </div>

        <div className="view-mode-tabs">
          <button
            className={`tab-pill ${activeTab === "calendar" ? "active" : ""}`}
            onClick={() => setActiveTab("calendar")}
            data-testid="tab-calendar-view"
          >
            <CalendarIcon size={14} />
            <span>Calendar View</span>
          </button>
          <button
            className={`tab-pill ${activeTab === "relationship" ? "active" : ""}`}
            onClick={() => setActiveTab("relationship")}
            data-testid="tab-relationship-view"
          >
            <GitFork size={14} />
            <span>Event → Action Tree</span>
          </button>
        </div>
      </div>

      {activeTab === "calendar" ? (
        <>
          {/* Mobile Pane Switcher (Visible only on screens <= 768px) */}
          <div
            className="mobile-pane-switcher"
            role="tablist"
            aria-label="Mobile view switcher"
          >
            <button
              className={`mobile-pane-btn ${mobilePane === "calendar" ? "active" : ""}`}
              onClick={() => setMobilePane("calendar")}
              data-testid="mobile-tab-calendar"
            >
              <CalendarIcon size={14} />
              <span>Calendar</span>
            </button>
            <button
              className={`mobile-pane-btn ${mobilePane === "tasks" ? "active" : ""}`}
              onClick={() => setMobilePane("tasks")}
              data-testid="mobile-tab-tasks"
            >
              <CheckCircle2 size={14} />
              <span>Tasks</span>
              <span className="mobile-badge">{activeTaskCount}</span>
            </button>
          </div>

          <div
            className={`calendar-workspace-layout mobile-view-${mobilePane}`}
          >
            {/* Main Calendar Grid */}
            <div className="calendar-main-pane">
              <CalendarGrid
                events={events}
                tasks={tasks}
                selectedEventId={selectedEventId}
                onSelectEvent={setSelectedEventId}
                onPrepareEvent={startPreparation}
                onOpenCreateEvent={handleOpenCreateEventWithDate}
                onEditEvent={setEditingEvent}
                onDeleteEvent={deleteEvent}
                onToggleTask={toggleTask}
              />
            </div>

            {/* Right Tasks Side Panel */}
            <div className="calendar-side-pane">
              <TasksSidebar
                tasks={tasks}
                selectedEventId={selectedEventId}
                selectedEventTitle={selectedEvent?.title}
                onClearSelectedEvent={() => setSelectedEventId(null)}
                onToggleTask={toggleTask}
                onEditTask={setEditingTask}
                onDeleteTask={deleteTask}
                onAddTask={handleAddTask}
              />
            </div>
          </div>
        </>
      ) : (
        <section className="relationship-view-wrap">
          <EventActionContextView events={events} tasks={tasks} />
        </section>
      )}

      {/* Date-specific Create Event Modal */}
      {createEventDate && (
        <CreateEventModal
          onClose={() => setCreateEventDate(null)}
          initialDate={createEventDate}
        />
      )}
      {editingEvent && (
        <CreateEventModal
          event={editingEvent}
          onClose={() => setEditingEvent(undefined)}
        />
      )}
      {editingTask && (
        <CreateTaskModal
          task={editingTask}
          onClose={() => setEditingTask(undefined)}
        />
      )}
    </div>
  );
};
