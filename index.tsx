import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// Service Worker Registration for automatic updates
if ('serviceWorker' in navigator) {
  // Flag to prevent multiple reloads if the event fires rapidly
  let refreshing = false;

  // Listen for when the new service worker has taken control.
  // This event is fired when a new service worker activates and becomes the
  // controller for the page. With self.skipWaiting() and self.clients.claim()
  // in the service worker, this happens automatically on update.
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) {
      return;
    }
    console.log('Service Worker: New version available. Reloading automatically.');
    refreshing = true;
    window.location.reload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
        
        // To ensure users with long-running tabs get updates,
        // we can periodically check for a new service worker.
        setInterval(() => {
          registration.update();
        }, 1000 * 60 * 60); // Check for updates every hour
      })
      .catch(error => {
        console.log('ServiceWorker registration failed: ', error);
      });
  });
}

const renderApp = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("Could not find root element to mount to");
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

if (document.readyState === 'loading') {
  // Loading hasn't finished yet
  document.addEventListener('DOMContentLoaded', renderApp);
} else {
  // `DOMContentLoaded` has already fired
  renderApp();
}