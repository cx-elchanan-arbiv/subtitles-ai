import React from 'react';
import { signInWithGoogle, signInWithApple } from '../firebase/auth';
import { useTranslation } from '../i18n/TranslationContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      setLoading('google');
      await signInWithGoogle();
      onClose();
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      setError(error.message || 'Failed to sign in with Google');
    } finally {
      setLoading(null);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setError(null);
      setLoading('apple');
      await signInWithApple();
      onClose();
    } catch (error: any) {
      console.error('Apple sign-in error:', error);
      setError(error.message || 'Failed to sign in with Apple');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t.signIn || 'Sign In'}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        {error && (
          <div className="error-message" style={{
            color: '#dc3545',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '4px',
            padding: '10px',
            margin: '10px 0',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}
        
        <div className="auth-buttons">
          <button 
            className="auth-button google-button"
            onClick={handleGoogleSignIn}
            disabled={loading !== null}
          >
            {loading === 'google' ? (
              <span>Loading...</span>
            ) : (
              <>
                <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" />
                {t.signInWithGoogle || 'Sign in with Google'}
              </>
            )}
          </button>
          
          <button 
            className="auth-button apple-button"
            onClick={handleAppleSignIn}
            disabled={loading !== null}
          >
            {loading === 'apple' ? (
              <span>Loading...</span>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                {t.signInWithApple || 'Sign in with Apple'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;