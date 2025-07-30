import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './components/AuthProvider';
import AppRouter from './components/AppRouter';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  </StrictMode>
);
