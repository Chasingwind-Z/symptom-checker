import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { AppShellErrorBoundary } from './components/AppShellErrorBoundary.tsx';

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      void navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    });
  } else {
    void navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        void registration.unregister();
      });
    });

    if ('caches' in window) {
      void caches.keys().then((keys) => {
        keys
          .filter((key) => key.startsWith('symptom-checker-pwa'))
          .forEach((key) => {
            void caches.delete(key);
          });
      });
    }
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppShellErrorBoundary>
      <App />
    </AppShellErrorBoundary>
  </StrictMode>,
);
