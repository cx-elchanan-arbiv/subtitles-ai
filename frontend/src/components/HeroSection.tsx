import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../i18n/TranslationContext';

const HeroSection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section className="relative pt-24 pb-4 px-4">
      <div className="relative max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center gap-1"
        >
          <motion.h1
            className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-gray-100 to-accent bg-clip-text text-transparent"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            {t('app.title')}
          </motion.h1>
          <motion.p
            className="text-base text-gray-400 max-w-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            {t('app.subtitle')}
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
