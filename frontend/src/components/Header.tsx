import React from 'react';
import { motion } from 'framer-motion';
import { LogIn } from 'lucide-react';
import { useTranslation } from '../i18n/TranslationContext';
import { useAuth } from '../contexts/AuthContext';
import UserProfile from './UserProfile';

interface HeaderProps {
  onShowAuthModal: () => void;
  onHomeClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onShowAuthModal, onHomeClick }) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <motion.header 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 p-4"
    >
      <div className="glass rounded-2xl px-6 py-4 mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          {/* Logo - Clickable to return home */}
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            onClick={onHomeClick}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer bg-transparent border-none"
            aria-label="חזרה למסך הראשי"
            style={{ background: 'transparent', border: 'none', padding: 0 }}
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-blue-500 flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-white">🎬</span>
            </div>
            <div className="hidden md:block">
              <h1 className="text-xl font-bold text-white">{t.appTitle}</h1>
              <p className="text-sm text-gray-300">{t.appSubtitle}</p>
            </div>
          </motion.button>

          {/* Navigation */}
          <div className="flex items-center space-x-4">
            {/* User Profile or Sign In */}
            {user ? (
              <UserProfile />
            ) : (
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(0, 212, 255, 0.3)" }}
                whileTap={{ scale: 0.95 }}
                onClick={onShowAuthModal}
                className="bg-gradient-to-r from-accent to-blue-500 text-white px-6 py-3 rounded-xl font-medium flex items-center space-x-2 hover:shadow-lg transition-all duration-300"
              >
                <LogIn className="w-5 h-5" />
                <span>{t.signIn}</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;