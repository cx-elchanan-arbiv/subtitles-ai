import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../i18n/TranslationContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, fallback }) => {
  const { isAuthenticated, loading } = useAuth();
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="loading">
        {t.processing || 'Loading...'}
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        {fallback || (
          <div className="auth-required-message">
            <h3>{t.signInRequired || 'Sign in required'}</h3>
            <p>{t.signInToUseFeatures || 'Please sign in to use this feature'}</p>
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;