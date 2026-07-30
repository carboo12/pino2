import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/inter';
import App from './App.tsx';
import './index.css';
import './lib/firebase';
import { queryClient } from './lib/query-client';
import { APP_VERSION } from './lib/version';

// ─────────────────────────────────────────────────────────────────────────────
// KILL SWITCH DE VERSIÓN
// Detecta si el usuario tiene una versión anterior cacheada.
// Si es así, purga todo y recarga — el usuario siempre verá la versión nueva.
//
// IMPORTANTE: Para activar la purga en un nuevo deploy, incrementa la versión
// en el archivo web/VERSION (ej: 1.1.0-mvp → 1.2.0-mvp) Y en sw.js (CACHE_VERSION).
// ─────────────────────────────────────────────────────────────────────────────
const VERSION_STORAGE_KEY = 'pino_app_version';

async function runKillSwitch(): Promise<boolean> {
  const stored = localStorage.getItem(VERSION_STORAGE_KEY);

  if (stored === APP_VERSION) {
    return false; // Versión correcta — no hace nada
  }

  console.log(`[KillSwitch] Versión desactualizada (${stored} → ${APP_VERSION}). Purgando cachés...`);

  // a) Desregistrar todos los Service Workers anteriores
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((r) => r.unregister()));
    } catch (e) {
      console.warn('[KillSwitch] Error al desregistrar SWs:', e);
    }
  }

  // b) Purgar todos los cachés de CacheStorage
  if ('caches' in window) {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch (e) {
      console.warn('[KillSwitch] Error al purgar cachés:', e);
    }
  }

  // c) Limpiar mem-cache de React Query
  try {
    queryClient.clear();
  } catch (e) {
    console.warn('[KillSwitch] Error al limpiar queryClient:', e);
  }

  // d) Marcar la nueva versión y forzar recarga limpia
  localStorage.setItem(VERSION_STORAGE_KEY, APP_VERSION);
  window.location.reload();
  return true; // Señal para abortar el render — la recarga está en curso
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRO Y CICLO DE VIDA COMPLETO DEL SERVICE WORKER
//
// Gestiona 3 escenarios:
//   1. SW nuevo detectado en "waiting"  → fuerza SKIP_WAITING inmediatamente
//   2. SW nuevo instalándose            → escucha updatefound + statechange
//   3. SW activado con versión distinta → recarga la página para aplicar cambios
// ─────────────────────────────────────────────────────────────────────────────
function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  // Flag para evitar bucles de recarga si controllerchange se dispara varias veces
  let refreshing = false;

  // Cuando el SW nuevo tome control, recargar para que el cliente use los nuevos assets
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    console.log('[SW] Nuevo Service Worker activado. Recargando para aplicar actualización...');
    window.location.reload();
  });

  // Escuchar mensajes del SW (notificación de activación con versión)
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'SW_ACTIVATED') {
      const swVersion: string = event.data.version ?? '';
      // Si la versión del SW activo no coincide con la app → recargar
      if (swVersion && swVersion !== APP_VERSION) {
        console.log(`[SW] Versión SW activa (${swVersion}) ≠ app (${APP_VERSION}). Recargando...`);
        window.location.reload();
      }
    }
  });

  navigator.serviceWorker.register('/sw.js').then((reg) => {
    console.log('[SW] Service Worker registrado. Scope:', reg.scope);

    // Escenario 1: Ya hay un SW nuevo esperando (p.ej. usuario tenía la tab abierta)
    if (reg.waiting) {
      console.log('[SW] SW en espera detectado — forzando activación inmediata...');
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    }

    // Escenario 2: Un nuevo SW se está instalando ahora mismo
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // Hay un nuevo SW instalado. Forzar activación sin esperar al cierre de tabs.
          console.log('[SW] Nueva versión instalada — forzando activación...');
          newWorker.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    });

    // Chequeo periódico cada 60 minutos para detectar nuevas versiones en background
    setInterval(() => {
      reg.update().catch((err) => console.warn('[SW] Error al verificar actualización:', err));
    }, 60 * 60 * 1000);

  }).catch((err) => {
    console.error('[SW] Error al registrar Service Worker:', err);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// BOOT SEQUENCE (async)
// Orden: Kill Switch → registro SW → render React
// El render se aborta si el Kill Switch detecta versión vieja (hay reload en curso).
// ─────────────────────────────────────────────────────────────────────────────
(async () => {
  const reloading = await runKillSwitch();
  if (reloading) return; // Abortamos: la página se está recargando

  // Registrar SW solo en producción para no interferir con el dev server de Vite
  if (import.meta.env.PROD) {
    if (document.readyState === 'complete') {
      registerServiceWorker();
    } else {
      window.addEventListener('load', registerServiceWorker, { once: true });
    }
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
})();
