import 'timers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Buffer } from 'buffer';
import * as processPolyfill from 'process';
import App from './App.tsx';
import './index.css';

// Make Buffer and process available globally for algosdk and other dependencies
(window as any).Buffer = Buffer;
(window as any).process = processPolyfill;
(window as any).global = globalThis;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);