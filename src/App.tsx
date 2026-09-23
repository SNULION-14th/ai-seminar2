import { BrowserRouter } from 'react-router-dom';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { AppRoutes } from './routes';
import './App.css';

export function App() {
  return (
    <BrowserRouter>
      <WorkspaceProvider>
        <AppRoutes />
      </WorkspaceProvider>
    </BrowserRouter>
  );
}

export default App;
