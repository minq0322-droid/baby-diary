import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/tokens.css';
import './styles/app.css';

try {
  if (__ARTIFACT__) document.documentElement.classList.add('is-artifact');
  const theme = localStorage.getItem('theme');
  if (theme === 'light' || theme === 'dark')
    document.documentElement.setAttribute('data-theme', theme);
} catch {
  // Storage may be unavailable.
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <div className="artifact-welcome">
    <p>기록장을 준비하고 있어요</p>
  </div>,
);

async function start() {
  if (__ARTIFACT__) {
    const { ArtifactStore } = await import('./data/artifactStore');
    const store = await ArtifactStore.create();
    root.render(
      <React.StrictMode>
        <App store={store} />
      </React.StrictMode>,
    );
  } else {
    const { default: NormalApp } = await import('./normalApp');
    root.render(
      <React.StrictMode>
        <NormalApp />
      </React.StrictMode>,
    );
  }
}

void start();
