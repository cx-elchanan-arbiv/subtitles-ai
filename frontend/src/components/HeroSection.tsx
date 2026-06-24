import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Globe } from 'lucide-react';
import { useTranslation } from '../i18n/TranslationContext';

const HeroSection: React.FC = () => {
  const { t } = useTranslation();

  const features = [
    { icon: Zap,       title: "Fast Processing", description: "Lightning-fast AI processing" },
    { icon: Globe,     title: "Multi-Language",  description: "Auto-detection & many languages" },
    { icon: Sparkles,  title: "AI Powered",      description: "Accurate AI translations" },
  ];

  return (
    <section className="relative pt-24 pb-3 px-4">
      <div className="relative max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Title + subtitle — compact */}
          <motion.h1
            className="text-3xl md:text-4xl font-bold mb-1 bg-gradient-to-r from-white via-gray-100 to-accent bg-clip-text text-transparent"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            {t('app.title')}
          </motion.h1>
          <motion.p
            className="text-sm text-gray-400 mb-4 max-w-xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            {t('app.subtitle')}
          </motion.p>

          {/* Feature cards — compact horizontal strip */}
          <motion.div
            className="grid grid-cols-3 gap-3 mb-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35 + index * 0.07, duration: 0.35 }}
                className="glass-dark rounded-xl p-3 hover:bg-white/10 transition-all duration-300 group flex items-center gap-3"
              >
                <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-accent/20 to-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-4 h-4 text-accent" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-white leading-tight">{feature.title}</p>
                  <p className="text-xs text-gray-400 leading-tight">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
