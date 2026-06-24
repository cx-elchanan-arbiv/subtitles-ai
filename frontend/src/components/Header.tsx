import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, Wrench, AlertCircle, Info } from 'lucide-react';
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
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'error' | 'info' } | null>(null);

  const handleFixYoutube = async () => {
    setFixing(true);
    setShowTooltip(false);
    setStatusMsg(null);
    try {
      await openFixYoutubeSkill();
      // success — window opened, no message needed
    } catch {
      // Fetch failed (CORS / server not ready) — open 7778 directly anyway
      const opened = window.open(CLAUDE_RTL_URL, '_blank');
      if (opened) {
        setStatusMsg({ text: 'נפתח — הרץ /fix-youtube-quality', type: 'info' });
      } else {
        setStatusMsg({ text: 'Claude RTL Chat לא פועל על פורט 7778', type: 'error' });
      }
      setTimeout(() => setStatusMsg(null), 4000);
    } finally {
      setFixing(false);
    }
  };

  return (
    <motion.header
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 p-3 pointer-events-none"
    >
      <div className="flex items-start justify-between">

        {/* Fix YouTube + Sign In — floating top-left */}
        <div className="pointer-events-auto flex items-start gap-2">

          {/* Fix YouTube Quality */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleFixYoutube}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              disabled={fixing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium
                         bg-gradient-to-r from-orange-500/80 to-yellow-500/80
                         hover:from-orange-500 hover:to-yellow-500
                         text-white shadow-md hover:shadow-orange-500/30 hover:shadow-lg
                         transition-all duration-200 disabled:opacity-50"
            >
              <Wrench className={`w-4 h-4 ${fixing ? 'animate-spin' : ''}`} />
              <span>{fixing ? 'פותח...' : 'תקן יוטיוב'}</span>
            </motion.button>

            {/* Tooltip */}
            <AnimatePresence>
              {showTooltip && !fixing && !errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full mt-2 left-0 z-50 w-64 rounded-xl
                             bg-gray-900/95 border border-white/10 shadow-xl p-3 text-right"
                  style={{ backdropFilter: 'blur(12px)' }}
                >
                  <p className="text-white text-sm font-semibold mb-1">🔧 תקן איכות יוטיוב</p>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    פותח שיחת Claude ומריץ{' '}
                    <code className="text-yellow-400">/fix-youtube-quality</code> — בודק לקוח יוטיוב עובד ומתקן הורדות ב-360p.
                  </p>
                  <p className="text-gray-500 text-xs mt-1">⚡ דורש Claude RTL Chat ב-7778</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Inline status toast */}
            <AnimatePresence>
              {statusMsg && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute top-full mt-2 left-0 z-50 w-64 rounded-xl shadow-xl p-3 text-right border
                    ${statusMsg.type === 'error'
                      ? 'bg-red-900/90 border-red-500/30'
                      : 'bg-emerald-900/90 border-emerald-500/30'}`}
                  style={{ backdropFilter: 'blur(12px)' }}
                >
                  <div className="flex items-center gap-2 justify-end">
                    <p className={`text-sm font-semibold ${statusMsg.type === 'error' ? 'text-red-200' : 'text-emerald-200'}`}>
                      {statusMsg.text}
                    </p>
                    {statusMsg.type === 'error'
                      ? <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      : <Info className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sign In / User Profile */}
          {user ? (
            <UserProfile />
          ) : (
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)' }}
              whileTap={{ scale: 0.95 }}
              onClick={onShowAuthModal}
              className="bg-gradient-to-r from-accent to-blue-500 text-white px-4 py-2 rounded-xl
                         text-sm font-medium flex items-center gap-2 shadow-md
                         hover:shadow-lg transition-all duration-300"
            >
              <LogIn className="w-4 h-4" />
              <span>{t.signIn}</span>
            </motion.button>
          )}
        </div>

        {/* Logo — floating top-right */}
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          onClick={onHomeClick}
          className="pointer-events-auto w-11 h-11 rounded-xl bg-gradient-to-br from-accent to-blue-500
                     flex items-center justify-center shadow-lg hover:opacity-80 transition-opacity
                     border-none cursor-pointer"
          aria-label="חזרה למסך הראשי"
        >
          <span className="text-xl font-bold text-white">🎬</span>
        </motion.button>

      </div>
    </motion.header>
  );
};

export default Header;
