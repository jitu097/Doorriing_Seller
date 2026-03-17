import "./sentry";
import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from "@sentry/react";
import App from './App.jsx'
import './index.css'

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js")
      .then((registration) => {
        console.log("Service Worker registered:", registration);
      })
      .catch((error) => {
        console.error("Service Worker registration failed:", error);
      });
  });
}

const ErrorFallback = () => (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    <h2>Something went wrong.</h2>
    <p>Please refresh the page or contact support if the issue persists.</p>
  </div>
);

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
            <App />
        </Sentry.ErrorBoundary>
    </React.StrictMode>,
)
