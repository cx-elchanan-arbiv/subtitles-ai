import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { I18nProvider } from './i18n/I18nProvider';
import { TranslationProvider } from './i18n/TranslationContext';
import { AuthProvider } from './contexts/AuthContext';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <I18nProvider>
      <TranslationProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </TranslationProvider>
    </I18nProvider>
  </React.StrictMode>
);
