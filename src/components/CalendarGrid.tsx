import React, { useState } from "react";
import type { EventItem, TaskItem } from "../types";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Trash2,
  X,
  Pencil,
  CheckCircle2,
} from "lucide-react";

interface CalendarGridProps {
  events: EventItem[];
  tasks: TaskItem[];
  selectedEventId: string | null;
  onSelectEvent: (eventId: string | null) => void;
  onPrepareEvent: (eventId: string) => void;
  onOpenCreateEvent: (dateStr?: string) => void;
  onEditEvent?: (event: EventItem) => void;
  onDeleteEvent?: (eventId: string) => void;
  onToggleTask: (taskId: string) => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  events,
  tasks,
  selectedEventId,
  onSelectEvent,
  onPrepareEvent,
  onOpenCreateEvent,
  onEditEvent,
  onDeleteEvent,
  onToggleTask,
}) => {
  const today = new Date();
  const upcomingEvent = [...events]
    .filter((event) => event.date >= today.toISOString().slice(0, 10))
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const initialDate = upcomingEvent
    ? new Date(`${upcomingEvent.date}T12:00:00`)
    : today;
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  const [showEvents, setShowEvents] = useState(true);
  const [showTasks, setShowTasks] = useState(true);
  const referenceToday = `${today.getFullYear()}-${String(
    today.getMonth() + 1,
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const handlePrevMonth = () => {
    onSelectEvent(null);
    if (currentMonth === 0) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    onSelectEvent(null);
    if (currentMonth === 11) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const monthLabel = `${monthNames[currentMonth]} ${currentYear}`;

  // Calendar math
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const cells: Array<{
    dateStr: string;
    dayNum: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    events: EventItem[];
    tasks: TaskItem[];
  }> = [];

  // Prev month padding
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const m = currentMonth === 0 ? 12 : currentMonth;
    const y = currentMonth === 0 ? currentYear - 1 : currentYear;
    const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({
      dateStr,
      dayNum: day,
      isCurrentMonth: false,
      isToday: dateStr === referenceToday,
      events: showEvents ? events.filter((e) => e.date === dateStr) : [],
      tasks: showTasks ? tasks.filter((task) => task.dueDate === dateStr) : [],
    });
  }

  // Current month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(
      day,
    ).padStart(2, "0")}`;
    cells.push({
      dateStr,
      dayNum: day,
      isCurrentMonth: true,
      isToday: dateStr === referenceToday,
      events: showEvents ? events.filter((e) => e.date === dateStr) : [],
      tasks: showTasks ? tasks.filter((task) => task.dueDate === dateStr) : [],
    });
  }

  // Next month padding to fill grid
  const remaining = (7 - (cells.length % 7)) % 7;
  for (let day = 1; day <= remaining; day++) {
    const m = currentMonth === 11 ? 1 : currentMonth + 2;
    const y = currentMonth === 11 ? currentYear + 1 : currentYear;
    const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({
      dateStr,
      dayNum: day,
      isCurrentMonth: false,
      isToday: dateStr === referenceToday,
      events: showEvents ? events.filter((e) => e.date === dateStr) : [],
      tasks: showTasks ? tasks.filter((task) => task.dueDate === dateStr) : [],
    });
  }

  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const mobileAgendaDays = cells.filter(
    (cell) => cell.isCurrentMonth && (cell.events.length > 0 || cell.tasks.length > 0),
  );
  const hasVisibleItems = cells.some(
    (cell) => cell.events.length > 0 || cell.tasks.length > 0,
  );

  return (
    <div className="calendar-container">
      {/* Calendar Controls Bar */}
      <div className="calendar-top-bar">
        <div className="cal-nav-group">
          <h2 className="calendar-month-heading">{monthLabel}</h2>
          <div className="cal-nav-btns">
            <button
              className="icon-btn"
              onClick={handlePrevMonth}
              title="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className="icon-btn"
              onClick={handleNextMonth}
              title="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <button
          className="btn btn-primary btn-sm"
          onClick={() => onOpenCreateEvent()}
          data-testid="add-event-btn"
        >
          <Plus size={14} />
          <span>New Event</span>
        </button>
        <div className="calendar-display-filters" role="group" aria-label="Calendar items to display">
          <button
            type="button"
            className={`calendar-display-filter ${showEvents ? "active" : ""}`}
            aria-pressed={showEvents}
            onClick={() => setShowEvents((visible) => !visible)}
            data-testid="calendar-toggle-events"
          >
            Events
          </button>
          <button
            type="button"
            className={`calendar-display-filter ${showTasks ? "active" : ""}`}
            aria-pressed={showTasks}
            onClick={() => setShowTasks((visible) => !visible)}
            data-testid="calendar-toggle-tasks"
          >
            Tasks
          </button>
        </div>
      </div>

      {/* Weekday Labels Header */}
      <div className="calendar-grid-header">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="calendar-header-cell">
            {d}
          </div>
        ))}
      </div>

      {/* Monthly Cells Grid */}
      <div className="calendar-grid-body">
        {cells.map((cell, idx) => (
          <div
            key={idx}
            className={`calendar-cell ${!cell.isCurrentMonth ? "other-month" : ""} ${
              cell.isToday ? "cell-today" : ""
            }`}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest(".calendar-event-chip, .calendar-task-chip"))
                return;
              onOpenCreateEvent(cell.dateStr);
            }}
            title={`Click to add event on ${cell.dateStr}`}
          >
            <div className="cell-top">
              <div className="cell-top-left">
                {cell.isToday && <span className="today-badge">Today</span>}
              </div>
              <div className="cell-top-right">
                <span
                  className={`cell-day-num ${cell.isToday ? "today-day-num" : ""}`}
                >
                  {cell.dayNum}
                </span>
                <button
                  type="button"
                  className="cell-add-quick-btn"
                  title={`Add event on ${cell.dateStr}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenCreateEvent(cell.dateStr);
                  }}
                >
                  <Plus size={11} />
                </button>
              </div>
            </div>

            <div className="cell-events-list">
              {cell.events.map((evt) => {
                const isSelected = evt.id === selectedEventId;
                return (
                  <div
                    key={evt.id}
                    className={`calendar-event-chip ${evt.needsPreparation ? "requires-preparation" : ""} ${isSelected ? "selected" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEvent(isSelected ? null : evt.id);
                    }}
                    title={`${evt.title} (${evt.time || "All day"}) - Click to view & prepare`}
                    data-testid={`event-chip-${evt.id}`}
                  >
                    <span className="event-dot" />
                    {evt.time && <span className="chip-time">{evt.time}</span>}
                    {evt.needsPreparation && (
                      <Sparkles size={10} className="event-prep-sparkle" />
                    )}
                    <span className="chip-title">{evt.title}</span>
                  </div>
                );
              })}
              {cell.tasks.map((task) => (
                <button
                  type="button"
                  key={task.id}
                  className={`calendar-task-chip ${task.completed ? "completed" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleTask(task.id);
                  }}
                  title={`${task.title} — ${task.completed ? "Mark incomplete" : "Mark complete"}`}
                  data-testid={`calendar-task-${task.id}`}
                >
                  <CheckCircle2 size={11} />
                  <span className="chip-title">{task.title}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {!hasVisibleItems && (
        <div className="calendar-empty-month">
          <CalendarIcon size={22} />
          <p>{showEvents || showTasks ? "No calendar items this month" : "Nothing selected to display"}</p>
          <span>
            {showEvents || showTasks
              ? "Use the month arrows to find upcoming items, or add an event now."
              : "Turn on Events or Tasks above to see them here."}
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onOpenCreateEvent()}
          >
            <Plus size={14} />
            <span>Add Event</span>
          </button>
        </div>
      )}

      <div className="mobile-calendar-agenda" aria-label="Calendar items this month">
        {mobileAgendaDays.length === 0 ? (
          <div className="mobile-agenda-empty">
            <CalendarIcon size={22} />
            <p>{showEvents || showTasks ? "No calendar items this month" : "Nothing selected to display"}</p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onOpenCreateEvent()}
            >
              <Plus size={14} />
              <span>Add Event</span>
            </button>
          </div>
        ) : (
          mobileAgendaDays.map((day) => (
            <section className="mobile-agenda-day" key={day.dateStr}>
              <div className="mobile-agenda-day-header">
                <div>
                  <strong>
                    {new Date(`${day.dateStr}T12:00:00`).toLocaleDateString(
                      undefined,
                      { weekday: "short", month: "short", day: "numeric" },
                    )}
                  </strong>
                  {day.isToday && <span className="today-badge">Today</span>}
                </div>
                <button
                  type="button"
                  className="icon-btn cell-add-quick-btn"
                  title={`Add event on ${day.dateStr}`}
                  aria-label={`Add event on ${day.dateStr}`}
                  onClick={() => onOpenCreateEvent(day.dateStr)}
                >
                  <Plus size={14} />
                </button>
              </div>
              <div className="mobile-agenda-events">
                {[...day.events]
                  .sort((a, b) =>
                    (a.time || "99:99").localeCompare(b.time || "99:99"),
                  )
                  .map((event) => {
                    const isSelected = event.id === selectedEventId;
                    const sameTimeCount = day.events.filter(
                      (candidate) =>
                        candidate.time && candidate.time === event.time,
                    ).length;
                    return (
                      <button
                        type="button"
                        key={event.id}
                        className={`mobile-agenda-event ${isSelected ? "selected" : ""}`}
                        onClick={() =>
                          onSelectEvent(isSelected ? null : event.id)
                        }
                        data-testid={`mobile-event-${event.id}`}
                      >
                        <span className="event-dot" />
                        <span className="mobile-agenda-time">
                          {event.time || "All day"}
                        </span>
                        <span className="mobile-agenda-event-content">
                          <strong>{event.title}</strong>
                          <span>{event.location || "No location"}</span>
                          {sameTimeCount > 1 && (
                            <em>Same time · {sameTimeCount} events</em>
                          )}
                        </span>
                        {event.needsPreparation && (
                          <Sparkles size={14} className="event-prep-sparkle" />
                        )}
                      </button>
                    );
                  })}
                {day.tasks.map((task) => (
                  <button
                    type="button"
                    key={task.id}
                    className={`mobile-agenda-task ${task.completed ? "completed" : ""}`}
                    onClick={() => onToggleTask(task.id)}
                    data-testid={`mobile-calendar-task-${task.id}`}
                  >
                    <CheckCircle2 size={15} />
                    <span>{task.title}</span>
                  </button>
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {/* Selected Event Action Card */}
      {selectedEvent && (
        <div
          className="selected-event-card"
          data-testid="selected-event-banner"
        >
          <div className="selected-event-main">
            <div className="selected-event-header">
              <span className="selected-event-time">
                <CalendarIcon size={12} />
                <span>{selectedEvent.date}</span>
                {selectedEvent.time && (
                  <>
                    <Clock size={12} style={{ marginLeft: 6 }} />
                    <span>{selectedEvent.time}</span>
                  </>
                )}
              </span>
              {selectedEvent.location && (
                <span className="selected-event-location">
                  <MapPin size={12} />
                  <span>{selectedEvent.location}</span>
                </span>
              )}
            </div>

            <h3 className="selected-event-title">{selectedEvent.title}</h3>
            {selectedEvent.description && (
              <p className="selected-event-desc">{selectedEvent.description}</p>
            )}
          </div>

          <div className="selected-event-actions">
            <button
              className="btn btn-prepare btn-sm"
              onClick={() => onPrepareEvent(selectedEvent.id)}
              data-testid={`prepare-btn-${selectedEvent.id}`}
            >
              <Sparkles size={13} />
              <span>Prepare Action Plan</span>
            </button>

            {onDeleteEvent && (
              <button
                className="icon-btn delete-btn"
                onClick={() => {
                  if (
                    window.confirm(
                      `Delete "${selectedEvent.title}"? Linked tasks will be kept without this event.`,
                    )
                  ) {
                    onDeleteEvent(selectedEvent.id);
                    onSelectEvent(null);
                  }
                }}
                title="Delete Event"
              >
                <Trash2 size={15} />
              </button>
            )}

            {onEditEvent && (
              <button
                className="icon-btn"
                onClick={() => onEditEvent(selectedEvent)}
                title="Edit Event"
                data-testid={`edit-event-btn-${selectedEvent.id}`}
              >
                <Pencil size={15} />
              </button>
            )}

            <button
              className="icon-btn"
              onClick={() => onSelectEvent(null)}
              title="Close details"
              data-testid="close-selected-event-banner"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
