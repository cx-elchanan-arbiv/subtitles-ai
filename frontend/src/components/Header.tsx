import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, Wrench } from 'lucide-react';
import { useTranslation } from '../i18n/TranslationContext';
import { useAuth } from '../contexts/AuthContext';
import UserProfile from './UserProfile';

const CLAUDE_RTL_URL = 'http://127.0.0.1:7778';
const PROJECT_CWD = '/Users/elchananarbiv/Projects/SubsTranslator';

async function openFixYoutubeSkill() {
  const newRes = await fetch(`${CLAUDE_RTL_URL}/new`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cwd: PROJECT_CWD, perm: 'full' }),
  });
  if (!newRes.ok) throw new Error('Failed to create session');
  const { id } = await newRes.json();

  await fetch(`${CLAUDE_RTL_URL}/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, text: '/fix-youtube-quality' }),
  });

  window.open(`${CLAUDE_RTL_URL}/?id=${id}`, '_blank');
}

interface HeaderProps {
  onShowAuthModal: () => void;
  onHomeClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onShowAuthModal, onHomeClick }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [fixing, setFixing] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleFixYoutube = async () => {
    setFixing(true);
    setShowTooltip(false);
    try {
      await openFixYoutubeSkill();
    } catch {
      alert('לא הצלחתי להתחבר ל-Claude RTL Chat (http://127.0.0.1:7778). ודא שהשרת פועל.');
    } finally {
      setFixing(false);
    }
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 p-4"
    >
      <div className="glass rounded-2xl px-6 py-4 mx-auto max-w-7xl">
        <div className="flex items-center justify-between">

          {/* Logo */}
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            onClick={onHomeClick}
            className="flex items-center hover:opacity-80 transition-opacity cursor-pointer bg-transparent border-none"
            aria-label="חזרה למסך הראשי"
            style={{ background: 'transparent', border: 'none', padding: 0 }}
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-blue-500 flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-white">🎬</span>
            </div>
          </motion.button>

          {/* Navigation */}
          <div className="flex items-center gap-3">

            {/* Fix YouTube Quality button */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleFixYoutube}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                disabled={fixing}
                className="flex items-center gap-2 px-3 py-2 rounded-xl font-medium text-sm
                           bg-gradient-to-r from-orange-500/80 to-yellow-500/80
                           hover:from-orange-500 hover:to-yellow-500
                           text-white shadow-md hover:shadow-orange-500/30 hover:shadow-lg
                           transition-all duration-200 disabled:opacity-50"
              >
                <Wrench className={`w-4 h-4 ${fixing ? 'animate-spin' : ''}`} />
                <span>{fixing ? 'פותח...' : 'תקן יוטיוב'}</span>
              </motion.button>

              {/* Custom tooltip */}
              <AnimatePresence>
                {showTooltip && !fixing && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full mt-2 right-0 z-50 w-64 rounded-xl
                               bg-gray-900/95 border border-white/10 shadow-xl p-3 text-right"
                    style={{ backdropFilter: 'blur(12px)' }}
                  >
                    <p className="text-white text-sm font-semibold mb-1">🔧 תקן איכות יוטיוב</p>
                    <p className="text-gray-300 text-xs leading-relaxed">
                      פותח שיחת Claude חדשה ומריץ אוטומטית את הסקריפט <code className="text-yellow-400">/fix-youtube-quality</code> — בודק איזה לקוח יוטיוב עובד ומתקן הורדות שיורדות ב-360p.
                    </p>
                    <p className="text-gray-500 text-xs mt-1">⚡ דורש Claude RTL Chat פעיל ב-7778</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Profile or Sign In */}
            {user ? (
              <UserProfile />
            ) : (
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)' }}
                whileTap={{ scale: 0.95 }}
                onClick={onShowAuthModal}
                className="bg-gradient-to-r from-accent to-blue-500 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 hover:shadow-lg transition-all duration-300"
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
