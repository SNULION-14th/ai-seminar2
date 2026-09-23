import React, { useState } from "react";
import type { EventItem } from "../types";
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
} from "lucide-react";

interface CalendarGridProps {
  events: EventItem[];
  selectedEventId: string | null;
  onSelectEvent: (eventId: string | null) => void;
  onPrepareEvent: (eventId: string) => void;
  onOpenCreateEvent: (dateStr?: string) => void;
  onDeleteEvent?: (eventId: string) => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  events,
  selectedEventId,
  onSelectEvent,
  onPrepareEvent,
  onOpenCreateEvent,
  onDeleteEvent,
}) => {
  // Default to Fall 2026 (October 2026)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(9); // 0-indexed: 9 = October

  const referenceToday = "2026-10-14";

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
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
      events: events.filter((e) => e.date === dateStr),
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
      events: events.filter((e) => e.date === dateStr),
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
      events: events.filter((e) => e.date === dateStr),
    });
  }

  const selectedEvent = events.find((e) => e.id === selectedEventId);

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
              className="btn btn-secondary btn-sm cal-semester-btn"
              onClick={() => {
                setCurrentYear(2026);
                setCurrentMonth(9);
              }}
              title="Jump to current semester"
            >
              Current Semester
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
              if ((e.target as HTMLElement).closest(".calendar-event-chip"))
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
                    className={`calendar-event-chip ${isSelected ? "selected" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEvent(isSelected ? null : evt.id);
                    }}
                    title={`${evt.title} (${evt.time || "All day"}) - Click to view & prepare`}
                    data-testid={`event-chip-${evt.id}`}
                  >
                    <span className="event-dot" />
                    {evt.needsPreparation && (
                      <Sparkles size={10} className="event-prep-sparkle" />
                    )}
                    <span className="chip-title">{evt.title}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
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
                  onDeleteEvent(selectedEvent.id);
                  onSelectEvent(null);
                }}
                title="Delete Event"
              >
                <Trash2 size={15} />
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
