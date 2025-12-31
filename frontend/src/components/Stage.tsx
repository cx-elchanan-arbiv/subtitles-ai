
import React from 'react';
import { Step as StepType } from '../hooks/useApi';
import { useTranslation } from '../i18n/TranslationContext';

interface StageProps {
  step: StepType;
  onRetry: () => void;
}

const Stage: React.FC<StageProps> = ({ step, onRetry }) => {
  const { t } = useTranslation();

  const getStatusIcon = () => {
    switch (step.status) {
      case 'waiting': return '⏳';
      case 'in_progress': return '🔄';
      case 'completed': return '✅';
      case 'error': return '❌';
      default: return ''
    }
  };

  return (
    <div className={`stage-row ${step.status}`}>
      <div className="stage-icon">{getStatusIcon()}</div>
      <div className="stage-details">
        <div className="stage-title">{t.steps[step.label] || step.label}</div>
        <div className="stage-subtitle">{step.status_message || step.subtitle}</div>
        <div className="stage-progress-bar-wrapper">
          <div 
            className="stage-progress-bar"
            style={{ width: `${step.progress}%` }}
          ></div>
        </div>
      </div>
      {step.status === 'error' && (
        <button onClick={onRetry} className="retry-button">{t('actions.retry')}</button>
      )}
    </div>
  );
};

export default Stage;
