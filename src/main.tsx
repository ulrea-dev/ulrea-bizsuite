import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { RepositoryProvider } from './repositories'
import { SupabaseStorageProvider } from './contexts/SupabaseStorageContext'

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RepositoryProvider>
      <SupabaseStorageProvider>
        <App />
      </SupabaseStorageProvider>
    </RepositoryProvider>
  </React.StrictMode>
);
