import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/inter';
import App from './App.tsx';
import './index.css';
import './lib/firebase';
import { registerSW } from 'virtual:pwa-register';

// Registro automático de la PWA
registerSW({ immediate: true });


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
