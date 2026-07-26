import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/inter';
import App from './App.tsx';
import './index.css';
import './lib/firebase';
// Service Worker desactivado temporalmente por problemas de caché
// Se reactivará cuando se estabilice el build
// import { registerSW } from 'virtual:pwa-register';
// const updateSW = registerSW({ onNeedRefresh() { updateSW(true); }, onOfflineReady() {}, immediate: true });


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
