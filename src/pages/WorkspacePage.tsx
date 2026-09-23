import React from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { EventCard } from '../components/EventCard';
import { TaskCard } from '../components/TaskCard';
import { EventActionContextView } from '../components/EventActionContextView';
import { Calendar, CheckSquare } from 'lucide-react';

export const WorkspacePage: React.FC = () => {
  const { events, tasks, startPreparation, deleteEvent, toggleTask, deleteTask } =
    useWorkspace();

  return (
    <div className="workspace-page" data-testid="workspace-page">
      <div className="workspace-hero">
        <h1 className="hero-title">Personal Event-to-Action Workspace</h1>
        <p className="hero-desc">
          Bridge what’s coming up on your calendar directly to the tasks and Notion documentation
          you need to complete them.
        </p>
      </div>

      <div className="workspace-grid">
        {/* Left Column: Upcoming Events */}
        <section className="workspace-section events-column">
          <div className="section-header">
            <div className="header-title-wrap">
              <Calendar size={18} className="text-accent" />
              <h2 className="section-title">Upcoming Events</h2>
              <span className="count-pill">{events.length}</span>
            </div>
          </div>

          <div className="cards-stack">
            {events.length === 0 ? (
              <div className="empty-state">No upcoming events found.</div>
            ) : (
              events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onPrepare={startPreparation}
                  onDelete={deleteEvent}
                />
              ))
            )}
          </div>
        </section>

        {/* Right Column: Google Tasks */}
        <section className="workspace-section tasks-column">
          <div className="section-header">
            <div className="header-title-wrap">
              <CheckSquare size={18} className="text-accent" />
              <h2 className="section-title">Google Tasks</h2>
              <span className="count-pill">
                {tasks.filter((t) => !t.completed).length} open
              </span>
            </div>
          </div>

          <div className="cards-stack">
            {tasks.length === 0 ? (
              <div className="empty-state">No tasks created yet.</div>
            ) : (
              tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={toggleTask}
                  onDelete={deleteTask}
                />
              ))
            )}
          </div>
        </section>
      </div>

      {/* Visual Relationship Hierarchy */}
      <section className="eac-wrapper-section">
        <EventActionContextView events={events} tasks={tasks} />
      </section>
    </div>
  );
};
