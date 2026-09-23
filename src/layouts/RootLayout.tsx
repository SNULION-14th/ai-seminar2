import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/Header';
import { ActionPlanModal } from '../components/ActionPlanModal';
import { CreateEventModal } from '../components/CreateEventModal';
import { CreateTaskModal } from '../components/CreateTaskModal';

export const RootLayout: React.FC = () => {
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);

  return (
    <div className="app-container">
      <Header
        onOpenCreateEvent={() => setShowCreateEvent(true)}
        onOpenCreateTask={() => setShowCreateTask(true)}
      />

      <main className="main-content">
        <Outlet />
      </main>

      {/* Global Modals */}
      <ActionPlanModal />

      {showCreateEvent && (
        <CreateEventModal onClose={() => setShowCreateEvent(false)} />
      )}

      {showCreateTask && (
        <CreateTaskModal onClose={() => setShowCreateTask(false)} />
      )}
    </div>
  );
};
