import { useMemo, useEffect } from 'react';
import { motion } from "framer-motion";
import { useTranslation } from "../i18n/TranslationContext";
import { useTranslation as useI18next } from 'react-i18next';
import { AlertCircle, RefreshCw, ExternalLink, HelpCircle } from "lucide-react";
import {
  EnhancedErrorInfo,
  getBadgeColor,
  getErrorSeverity,
  getErrorCategory,
  createEnhancedErrorInfo,
  reportError,
  ErrorSeverity
} from "../types/errors";

interface ErrorCardProps {
  error: EnhancedErrorInfo | any;
  onRetry?: () => void;
  onSupport?: () => void;
  className?: string;
  showDetails?: boolean;
  compact?: boolean;
}

const ErrorCard: React.FC<ErrorCardProps> = ({ 
  error, 
  onRetry, 
  onSupport,
  className = "",
  showDetails = true,
  compact = false 
}) => {
  const { isRTL } = useTranslation();
  const { t: i18nT } = useI18next(['errors', 'common']);
  
  // Enhance error with i18n support if needed
  const enhancedError = useMemo(() => {
    if (error.actions && error.tips) {
      return error as EnhancedErrorInfo;
    }
    return createEnhancedErrorInfo(error, (key: string) => i18nT(key, { defaultValue: key }), onRetry, onSupport);
  }, [error, i18nT, onRetry, onSupport]);

  const { title, message, code, type, actions, tips, supportUrl, documentationUrl } = enhancedError;
  const severity = getErrorSeverity(code, type);
  const category = getErrorCategory(code, type);

  // Report error for analytics
  useEffect(() => {
    reportError(enhancedError, { 
      category, 
      severity, 
      userAgent: navigator.userAgent,
      language: isRTL ? 'rtl' : 'ltr' 
    });
  }, [enhancedError, category, severity, isRTL]);

  // Get severity-based styling
  const getSeverityStyles = () => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return {
          container: "border-red-500 bg-red-50/90",
          icon: "bg-red-500 text-white",
          title: "text-red-900",
          message: "bg-red-100 border-red-300 text-red-800"
        };
      case ErrorSeverity.HIGH:
        return {
          container: "border-red-400 bg-red-50/80",
          icon: "bg-red-400 text-white",
          title: "text-red-800",
          message: "bg-red-50 border-red-200 text-red-700"
        };
      case ErrorSeverity.MEDIUM:
        return {
          container: "border-orange-400 bg-orange-50/80",
          icon: "bg-orange-400 text-white",
          title: "text-orange-800",
          message: "bg-orange-50 border-orange-200 text-orange-700"
        };
      default:
        return {
          container: "border-blue-400 bg-blue-50/80",
          icon: "bg-blue-400 text-white",
          title: "text-blue-800",
          message: "bg-blue-50 border-blue-200 text-blue-700"
        };
    }
  };

  const styles = getSeverityStyles();

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className={`rounded-xl border ${styles.container} backdrop-blur p-4 shadow-lg ${className}`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <AlertCircle className={`w-5 h-5 ${styles.icon.includes('red') ? 'text-red-500' : 'text-orange-500'} flex-shrink-0`} />
          <div className="flex-1 min-w-0">
            <div className={`font-medium ${styles.title} truncate`}>{title}</div>
            <div className="text-sm text-gray-600 truncate">{message}</div>
          </div>
          {actions && actions.length > 0 && (
            <button
              onClick={actions[0].action}
              className="p-2 rounded-lg hover:bg-white/50 transition-colors"
              aria-label={actions[0].label}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`rounded-2xl border ${styles.container} backdrop-blur p-6 shadow-lg ${className}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className={`flex items-start gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
        {/* Error Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className={`h-12 w-12 grid place-items-center rounded-xl ${styles.icon} flex-shrink-0`}
        >
          <AlertCircle className="w-6 h-6" />
        </motion.div>

        {/* Error Content */}
        <div className="flex-1 min-w-0">
          {/* Header with title and status code */}
          <div className={`flex items-center gap-3 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className={`font-bold text-xl ${styles.title} flex-1`}
            >
              {title}
            </motion.h3>
            {code && (
              <motion.span
                initial={{ opacity: 0, x: isRTL ? 10 : -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className={`rounded-lg border px-3 py-1 text-sm font-semibold ${getBadgeColor(code, type)}`}
              >
                {code}
              </motion.span>
            )}
          </div>

          {/* Error Message */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`${styles.message} backdrop-blur border rounded-xl p-4 mb-4 shadow-inner`}
          >
            <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <HelpCircle className="w-5 h-5 mt-0.5 flex-shrink-0 opacity-70" />
              <span className="text-base leading-relaxed">{message}</span>
            </div>
          </motion.div>

          {/* Action Buttons */}
          {actions && actions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className={`flex gap-3 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              {actions.map((action, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={action.action}
                  className={`
                    ${action.primary 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white' 
                      : 'bg-white/80 hover:bg-white text-gray-700 border border-gray-300'
                    }
                    ${action.destructive ? 'from-red-600 to-red-700 hover:from-red-700 hover:to-red-800' : ''}
                    font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2
                  `}
                >
                  {action.primary && <RefreshCw className="w-4 h-4" />}
                  {!action.primary && <ExternalLink className="w-4 h-4" />}
                  <span>{action.label}</span>
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* Tips Section */}
          {showDetails && tips && tips.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ delay: 0.6 }}
              className="border-t border-gray-200 pt-4"
            >
              <div className="bg-blue-50 rounded-lg p-4">
                <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="text-blue-500 text-lg mt-0.5 flex-shrink-0">💡</div>
                  <div className="flex-1">
                    <div className="font-medium text-blue-800 mb-2">
                      {i18nT('common:processingTips', { defaultValue: 'Tips' })}
                    </div>
                    <ul className={`space-y-1 text-sm text-blue-700 ${isRTL ? 'pr-4' : 'pl-4'}`}>
                      {tips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-400 mt-1 flex-shrink-0">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Links Section */}
          {showDetails && (supportUrl || documentationUrl) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ delay: 0.7 }}
              className="border-t border-gray-200 pt-4 mt-4"
            >
              <div className={`flex gap-4 text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                {supportUrl && (
                  <a
                    href={supportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>{i18nT('common:navigation.help', { defaultValue: 'Help' })}</span>
                  </a>
                )}
                {documentationUrl && (
                  <a
                    href={documentationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>{i18nT('common:navigation.about', { defaultValue: 'About' })}</span>
                  </a>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ErrorCard;
