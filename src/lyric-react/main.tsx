import React from 'react';
import { createRoot } from 'react-dom/client';
import { LyricApp } from './App';
import './styles/index.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LyricApp />
  </React.StrictMode>,
);
