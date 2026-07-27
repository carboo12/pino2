import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/inter';
import App from './App.tsx';
import './index.css';
import './lib/firebase';
import { queryClient } from './lib/query-client';
import { APP_VERSION } from './lib/version';

// --- CAPA 3: KILL SWITCH DE VERSIÓN Y PURGA DE CACHÉ ---
(function handleVersionUpgrade() {
  const STORED_VERSION_KEY = 'app_version';
  const storedVersion = localStorage.getItem(STORED_VERSION_KEY);

  if (storedVersion !== APP_VERSION) {
    console.log('[App Upgrade] Nueva versión detectada: ' + storedVersion + ' -> ' + APP_VERSION + '. Purgando cachés...');

    // a) Desregistrar Service Workers anteriores
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
    }

    // b) Purgar cachés del navegador (CacheStorage)
    if ('caches' in window) {
      caches.keys().then((keys) => {
        return Promise.all(keys.map((key) => caches.delete(key)));
      });
    }

    // c) Limpiar mem-cache de React Query v5
    try {
      queryClient.clear();
    } catch (e) {
      console.warn('Error al limpiar queryClient:', e);
    }

    // d) Guardar nueva versión y forzar reload
    localStorage.setItem(STORED_VERSION_KEY, APP_VERSION);
    window.location.reload();
  }
})();

// --- CAPA 4: REGISTRO Y CONTROL DE SERVICE WORKER ---
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[SW] Service Worker registrado exitosamente:', reg.scope);

        // Chequeo periódico reg.update() cada 60 minutos
        setInterval(() => {
          reg.update().catch((err) => console.warn('[SW] Error al actualizar SW:', err));
        }, 60 * 60 * 1000);
      })
      .catch((err) => {
        console.error('[SW] Error al registrar Service Worker:', err);
      });

    // Listener para controllerchange
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
