import React from 'react';
import type { EventItem, TaskItem } from '../types';
import { Calendar, CheckSquare, FileText, ArrowRight, CornerDownRight, ExternalLink } from 'lucide-react';

interface EventActionContextViewProps {
  events: EventItem[];
  tasks: TaskItem[];
}

export const EventActionContextView: React.FC<EventActionContextViewProps> = ({ events, tasks }) => {
  const eventsWithTasks = events.map(event => {
    const relatedTasks = tasks.filter(t => t.eventId === event.id);
    return {
      event,
      tasks: relatedTasks
    };
  });

  return (
    <div className="eac-container">
      <div className="section-header">
        <div>
          <h2 className="section-title">Event → Action → Context Map</h2>
          <p className="section-subtitle">
            Visual hierarchy linking your commitments to required tasks and documentation.
          </p>
        </div>
      </div>

      <div className="eac-tree">
        {eventsWithTasks.length === 0 ? (
          <div className="empty-state">No events available.</div>
        ) : (
          eventsWithTasks.map(({ event, tasks: eventTasks }) => (
            <div key={event.id} className="eac-event-node">
              <div className="eac-event-header">
                <div className="eac-icon-wrapper event">
                  <Calendar size={16} />
                </div>
                <div className="eac-node-content">
                  <div className="eac-node-title">
                    <span className="badge-tag event-badge-tag">EVENT</span>
                    <strong>{event.title}</strong>
                    <span className="eac-date-tag">{event.date}</span>
                  </div>
                  {event.description && <div className="eac-node-desc">{event.description}</div>}
                </div>
              </div>

              {eventTasks.length > 0 ? (
                <div className="eac-actions-list">
                  {eventTasks.map((task) => (
                    <div key={task.id} className="eac-action-node">
                      <div className="eac-branch-line">
                        <CornerDownRight size={16} />
                      </div>
                      <div className="eac-action-content">
                        <div className="eac-action-header">
                          <div className="eac-icon-wrapper action">
                            <CheckSquare size={14} />
                          </div>
                          <span className="badge-tag action-badge-tag">ACTION</span>
                          <span className={`eac-action-title ${task.completed ? 'completed' : ''}`}>
                            {task.title}
                          </span>
                        </div>

                        {task.notionContext ? (
                          <div className="eac-context-node">
                            <div className="eac-sub-branch">
                              <ArrowRight size={13} />
                            </div>
                            <div className={`eac-context-card type-${task.notionContext.type.toLowerCase()}`}>
                              <FileText size={13} />
                              <span className="eac-context-strategy">{task.notionContext.type}</span>
                              <span className="eac-context-title">{task.notionContext.pageTitle}</span>
                              {task.notionContext.snippet && (
                                <span className="eac-context-snippet">— {task.notionContext.snippet}</span>
                              )}
                              {task.notionContext.url && (
                                <a
                                  href={task.notionContext.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="eac-link-btn"
                                >
                                  <ExternalLink size={11} />
                                </a>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="eac-no-context">
                            <span className="text-muted">No external Notion context attached</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="eac-no-actions">
                  <span className="text-muted">No actions generated yet for this event.</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
