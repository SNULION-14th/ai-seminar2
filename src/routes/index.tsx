import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { RootLayout } from '../layouts/RootLayout';
import { WorkspacePage } from '../pages/WorkspacePage';
import { EventsPage } from '../pages/EventsPage';
import { TasksPage } from '../pages/TasksPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<RootLayout />}>
        <Route index element={<WorkspacePage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};
