import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Globe } from 'lucide-react';
import { useTranslation } from '../i18n/TranslationContext';

const HeroSection: React.FC = () => {
  const { t } = useTranslation();

  // Option 1: Keep English for branding (current approach)
  const features = [
    {
      icon: Zap,
      title: "Fast Processing",
      description: "Lightning-fast AI processing for quick results"
    },
    {
      icon: Globe,
      title: "Multi-Language",
      description: "Support for multiple languages and auto-detection"
    },
    {
      icon: Sparkles,
      title: "AI Powered",
      description: "Advanced AI technology for accurate translations"
    }
  ];

  // Option 2: Use translations (uncomment to enable)
  // const features = [
  //   {
  //     icon: Zap,
  //     title: t('heroFeatures.fastProcessing.title'),
  //     description: t('heroFeatures.fastProcessing.description')
  //   },
  //   {
  //     icon: Globe,
  //     title: t('heroFeatures.multiLanguage.title'),
  //     description: t('heroFeatures.multiLanguage.description')
  //   },
  //   {
  //     icon: Sparkles,
  //     title: t('heroFeatures.aiPowered.title'),
  //     description: t('heroFeatures.aiPowered.description')
  //   }
  // ];

  return (
    <section className="relative pt-32 pb-20 px-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <motion.h1 
            className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-gray-100 to-accent bg-clip-text text-transparent"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            {t('app.title')}
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            {t('app.subtitle')}
          </motion.p>

          {/* Features Grid */}
          <motion.div 
            className="grid md:grid-cols-3 gap-8 mb-16"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 + index * 0.1, duration: 0.6 }}
                className="glass-dark rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 group"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-accent/20 to-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="flex justify-center"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-6 h-10 border-2 border-accent/50 rounded-full flex justify-center"
            >
              <div className="w-1 h-3 bg-accent rounded-full mt-2"></div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;