import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { signOutUser } from '../firebase/auth';
import { useTranslation } from '../i18n/TranslationContext';

const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [showDropdown, setShowDropdown] = useState(false);

  if (!user) return null;

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setShowDropdown(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <div className="user-profile">
      <div 
        className="user-avatar"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt={user.displayName || 'User'} />
        ) : (
          <div className="avatar-placeholder">
            {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
          </div>
        )}
      </div>
      
      {showDropdown && (
        <div className="user-dropdown">
          <div className="user-info">
            <p className="user-name">{user.displayName || t.user || 'User'}</p>
            <p className="user-email">{user.email}</p>
          </div>
          <button 
            className="sign-out-button"
            onClick={handleSignOut}
          >
            {t.signOut || 'Sign Out'}
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfile;