import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Wrench } from 'lucide-react';
import { useTranslation } from '../i18n/TranslationContext';
import { useAuth } from '../contexts/AuthContext';

const CLAUDE_RTL_URL = 'http://127.0.0.1:7778';
const PROJECT_CWD = '/Users/elchananarbiv/Projects/SubsTranslator';

async function openFixYoutubeSkill() {
  // 1. Create a new session in the SubsTranslator project directory
  const newRes = await fetch(`${CLAUDE_RTL_URL}/new`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cwd: PROJECT_CWD, perm: 'full' }),
  });
  if (!newRes.ok) throw new Error('Failed to create session');
  const { id } = await newRes.json();

  // 2. Send the skill command
  await fetch(`${CLAUDE_RTL_URL}/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, text: '/fix-youtube-quality' }),
  });

  // 3. Open the conversation in a new tab
  window.open(`${CLAUDE_RTL_URL}/?id=${id}`, '_blank');
}
import UserProfile from './UserProfile';

interface HeaderProps {
  onShowAuthModal: () => void;
  onHomeClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onShowAuthModal, onHomeClick }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [fixing, setFixing] = useState(false);

  const handleFixYoutube = async () => {
    setFixing(true);
    try {
      await openFixYoutubeSkill();
    } catch (e) {
      alert('לא הצלחתי להתחבר ל-Claude RTL Chat (http://127.0.0.1:7778). ודא שהשרת פועל.');
    } finally {
      setFixing(false);
    }
  };

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
            {/* Fix YouTube Quality — dev tool, opens Claude RTL Chat with the skill */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleFixYoutube}
              disabled={fixing}
              title="פתח Claude עם /fix-youtube-quality"
              className="text-gray-400 hover:text-yellow-400 transition-colors p-2 rounded-lg hover:bg-white/10 disabled:opacity-50"
            >
              <Wrench className={`w-5 h-5 ${fixing ? 'animate-spin' : ''}`} />
            </motion.button>

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