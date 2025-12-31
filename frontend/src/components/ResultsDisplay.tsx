import React, { useState } from 'react';
import DOMPurify from 'dompurify';
import { TaskResult } from '../hooks/useApi';
import { useTranslation } from '../i18n/TranslationContext';
import { Translation } from '../i18n/TranslationContext';

interface ResultsDisplayProps {
  result: TaskResult | null;
  autoCreateVideo: boolean;
  onStartNew?: () => void;
}

// Default prompts for custom summarization (only the instruction part, not the full template)
const DEFAULT_PROMPTS: Record<string, string> = {
  he: "אנא צור סיכום מובנה שמחלק את התוכן לפי נושאים עיקריים, עם נקודות מפתח תחת כל נושא.\nהשתמש בפורמט markdown עם כותרות וסעיפים.",
  en: "Please create a structured summary that divides the content by main topics, with key points under each topic.\nUse markdown format with headers and bullet points.",
  es: "Por favor crea un resumen estructurado que divida el contenido por temas principales, con puntos clave bajo cada tema.\nUsa formato markdown con encabezados y viñetas.",
  ar: "يرجى إنشاء ملخص منظم يقسم المحتوى حسب المواضيع الرئيسية، مع النقاط الرئيسية تحت كل موضوع.\nاستخدم تنسيق markdown مع العناوين والنقاط.",
  fr: "Veuillez créer un résumé structuré qui divise le contenu par thèmes principaux, avec des points clés sous chaque thème.\nUtilisez le format markdown avec des en-têtes et des puces.",
  de: "Bitte erstellen Sie eine strukturierte Zusammenfassung, die den Inhalt nach Hauptthemen unterteilt, mit wichtigen Punkten unter jedem Thema.\nVerwenden Sie das Markdown-Format mit Überschriften und Aufzählungszeichen.",
  it: "Per favore crea un riassunto strutturato che divide il contenuto per argomenti principali, con punti chiave sotto ogni argomento.\nUsa il formato markdown con intestazioni e elenchi puntati.",
  pt: "Por favor, crie um resumo estruturado que divida o conteúdo por tópicos principais, com pontos-chave sob cada tópico.\nUse o formato markdown com cabeçalhos e marcadores.",
  ru: "Пожалуйста, создайте структурированное резюме, которое разделяет контент по основным темам, с ключевыми моментами под каждой темой.\nИспользуйте формат markdown с заголовками и маркерами.",
  ja: "主要なトピックごとにコンテンツを分割し、各トピックの下に重要なポイントを含む構造化された要約を作成してください。\n見出しと箇条書きを含むマークダウン形式を使用してください。",
  ko: "주요 주제별로 콘텐츠를 나누고 각 주제 아래에 핵심 포인트를 포함한 구조화된 요약을 작성해주세요.\n제목과 글머리 기호가 포함된 마크다운 형식을 사용하세요.",
  zh: "请创建一个结构化的摘要，按主要主题划分内容，每个主题下包含关键要点。\n使用带有标题和项目符号的markdown格式。",
  tr: "Lütfen içeriği ana konulara göre bölen, her konunun altında önemli noktaların olduğu yapılandırılmış bir özet oluşturun.\nBaşlıklar ve madde işaretleri içeren markdown formatını kullanın."
};

const MAX_PROMPT_LENGTH = 1500;

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result, autoCreateVideo, onStartNew }) => {
  const { t } = useTranslation();
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  // Get default prompt based on target language
  const summaryLang = result?.user_choices?.target_lang || 'he';
  const defaultPrompt = DEFAULT_PROMPTS[summaryLang] || DEFAULT_PROMPTS['he'];

  const [customPrompt, setCustomPrompt] = useState<string>(defaultPrompt);

  if (!result) return null;

  const isPromptTooLong = customPrompt.length > MAX_PROMPT_LENGTH;

  const handleResetPrompt = () => {
    setCustomPrompt(defaultPrompt);
  };

  const handleSummarize = async () => {
    if (!result.files?.translated_srt) {
      setSummaryError('No translated subtitles available');
      return;
    }

    if (!result.task_id) {
      setSummaryError('Task ID not found');
      return;
    }

    if (isPromptTooLong) {
      setSummaryError(`Prompt is too long (${customPrompt.length} characters). Please shorten to ${MAX_PROMPT_LENGTH} characters or less.`);
      return;
    }

    // Get target language from user choices (supports all 13 translation languages)
    // he, en, es, ar, fr, de, it, pt, ru, ja, ko, zh, tr
    const summaryLang = result.user_choices?.target_lang || 'he';

    setIsSummarizing(true);
    setSummaryError(null);

    try {
      const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8081';
      const response = await fetch(`${apiBaseUrl}/api/summaries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task_id: result.task_id,
          summary_lang: summaryLang,
          custom_prompt: customPrompt.trim(), // Send custom prompt
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate summary');
      }

      const data = await response.json();
      setSummary(data.summary);
      setShowSummary(true);
    } catch (error) {
      setSummaryError(error instanceof Error ? error.message : 'Failed to generate summary');
    } finally {
      setIsSummarizing(false);
    }
  };


  return (
    <div className="results-container">
      <div className="success-header">
        <div className="success-icon">✅</div>
        <h3 className="success-title">{t.successTitle}</h3>
      </div>
      
      <div className="result-content">
        <div className="result-title">{result.title}</div>
        <div className="result-metadata">
          {result.detected_language && (
            <span className="result-metadata-item">
              {t.detectedLanguage} {result.detected_language}
            </span>
          )}
          {result.user_choices?.whisper_model && (
            <span className="result-metadata-item">
              {t('results.transcriptionQuality') || 'איכות תמלול'}: {t(`whisperModels.${result.user_choices.whisper_model}`) || result.user_choices.whisper_model}
              {result.user_choices.whisper_model === 'large' && ` [${t('whisperModels.pro')}]`}
            </span>
          )}
          {(result.video_metadata?.duration_string || result.duration) && (
            <span className="result-metadata-item">
              {t('results.videoDuration') || 'משך'}: {result.video_metadata?.duration_string || `${Math.floor((result.duration || 0) / 60)}:${String(Math.floor((result.duration || 0) % 60)).padStart(2, '0')}`}
            </span>
          )}
        </div>
        {result.file_size_mb && (
          <div className="result-info">📊 {t('fileInfo.fileSizeLabel')} {result.file_size_mb} {t('fileInfo.megabytes')}</div>
        )}
      </div>

      <div className="download-section">
        {/* Download-only result (video file) */}
        {result.filename && result.download_url && (
          <div className="video-section">
            <p className="video-ready-text">
              <span className="video-icon">🎬</span>
              {t('results.videoReady')}
            </p>
            <a href={result.download_url.startsWith('/download/') ? `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8081'}${result.download_url}` : `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8081'}/download/${result.filename}`} download className="download-btn download-btn-video" target="_blank" rel="noopener noreferrer">
              <span className="btn-icon">📥</span>
              <span className="btn-text">{t('results.downloadVideoButton')} ({result.file_size_mb} {t('fileInfo.megabytes')})</span>
            </a>
            <p style={{fontSize: '0.85em', color: '#888', marginTop: '8px'}}>
              💡 {t('fileInfo.downloadHint')}
            </p>
          </div>
        )}

        {/* Regular processing results (SRT files) */}
        <div className="download-buttons-grid">
          {result.files?.original_srt && (
            <a href={`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8081'}/download/${result.files.original_srt}`} download className="download-btn download-btn-original">
              <span className="btn-icon">📄</span>
              <span className="btn-text">{t.downloadOriginal}</span>
            </a>
          )}
          {result.files?.translated_srt && (
            <a href={`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8081'}/download/${result.files.translated_srt}`} download className="download-btn download-btn-translated">
              <span className="btn-icon">🌍</span>
              <span className="btn-text">{t.downloadTranslated}</span>
            </a>
          )}
        </div>

        {/* Custom summarization - only show if translated subtitles exist */}
        {result.files?.translated_srt && (
          <div className="summarize-section" style={{
            marginTop: '20px',
            padding: '20px',
            backgroundColor: '#f8f9ff',
            borderRadius: '12px',
            border: '2px solid #667eea'
          }}>
            <h3 style={{
              margin: '0 0 8px 0',
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#667eea',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              🤖 {t('results.aiSummaryTitle') || 'יצירת סיכום בינה מלאכותית'}
            </h3>
            <p style={{
              margin: '0 0 16px 0',
              fontSize: '13px',
              color: '#666',
              lineHeight: '1.5'
            }}>
              {t('results.aiSummaryDescription') || 'ערכו את ההוראות למטה כדי להתאים אישית את הסיכום, או השתמשו בברירת המחדל:'}
            </p>
            <div style={{marginBottom: '12px'}}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#333',
                fontSize: '14px'
              }}>
                {t('results.customPromptLabel') || 'הוראות:'}
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                disabled={isSummarizing}
                placeholder={defaultPrompt}
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '12px',
                  borderRadius: '8px',
                  border: isPromptTooLong ? '2px solid #f44336' : '2px solid #ddd',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  backgroundColor: isSummarizing ? '#f5f5f5' : '#fff',
                  cursor: isSummarizing ? 'not-allowed' : 'text',
                  direction: summaryLang === 'he' || summaryLang === 'ar' ? 'rtl' : 'ltr',
                  textAlign: summaryLang === 'he' || summaryLang === 'ar' ? 'right' : 'left'
                }}
              />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '6px',
                fontSize: '13px'
              }}>
                <span style={{
                  color: isPromptTooLong ? '#f44336' : '#666'
                }}>
                  {t('results.characters') || 'תווים'}: {customPrompt.length}/{MAX_PROMPT_LENGTH}
                </span>
                <button
                  onClick={handleResetPrompt}
                  disabled={isSummarizing || customPrompt === defaultPrompt}
                  style={{
                    padding: '4px 12px',
                    fontSize: '12px',
                    background: 'transparent',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: (isSummarizing || customPrompt === defaultPrompt) ? 'not-allowed' : 'pointer',
                    opacity: (isSummarizing || customPrompt === defaultPrompt) ? 0.5 : 1,
                    color: '#667eea'
                  }}
                >
                  🔄 {t('results.resetPrompt') || 'אפס'}
                </button>
              </div>
            </div>

            <button
              onClick={handleSummarize}
              disabled={isSummarizing || isPromptTooLong}
              className="download-btn download-btn-summarize"
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                cursor: (isSummarizing || isPromptTooLong) ? 'not-allowed' : 'pointer',
                opacity: (isSummarizing || isPromptTooLong) ? 0.7 : 1
              }}
            >
              <span className="btn-icon">🤖</span>
              <span className="btn-text">
                {isSummarizing ? t('results.summarizing') || 'מסכם...' : t('results.generateSummary') || 'צור סיכום'}
              </span>
            </button>

            {isPromptTooLong && (
              <div style={{
                marginTop: '10px',
                padding: '10px',
                backgroundColor: '#ffebee',
                borderRadius: '8px',
                color: '#c62828',
                fontSize: '13px'
              }}>
                ⚠️ {t('results.promptTooLong') || `הפרומפט ארוך מדי (${customPrompt.length} תווים). נא לקצר ל-${MAX_PROMPT_LENGTH} תווים או פחות.`}
              </div>
            )}

            {summaryError && !isPromptTooLong && (
              <div style={{
                marginTop: '10px',
                padding: '10px',
                backgroundColor: '#fee',
                borderRadius: '8px',
                color: '#c00'
              }}>
                {summaryError}
              </div>
            )}

            {summary && showSummary && (
              <div style={{
                marginTop: '20px',
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '12px',
                border: '1px solid #e0e0e0',
                position: 'relative'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '15px'
                }}>
                  <h4 style={{margin: 0, color: '#333'}}>
                    📋 {t('results.summaryReady') || 'סיכום מוכן!'}
                  </h4>
                  <button
                    onClick={() => setShowSummary(false)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      fontSize: '20px',
                      cursor: 'pointer',
                      color: '#666'
                    }}
                  >
                    ✕
                  </button>
                </div>
                <div
                  style={{
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.6',
                    color: '#444',
                    direction: 'rtl',
                    textAlign: 'right'
                  }}
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(
                      summary.replace(/\n/g, '<br/>')
                        .replace(/##\s(.+)/g, '<strong style="font-size: 1.1em; color: #667eea;">$1</strong>')
                        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.+?)\*/g, '<em>$1</em>'),
                      { ALLOWED_TAGS: ['br', 'strong', 'em', 'p', 'span'], ALLOWED_ATTR: ['style'] }
                    )
                  }}
                />
              </div>
            )}
          </div>
        )}

        {autoCreateVideo && result.files?.video_with_subtitles && (
          <div className="video-section">
            <p className="video-ready-text">
              <span className="video-icon">🎬</span>
              {t.videoReady}
            </p>
            <a href={`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8081'}/download/${result.files.video_with_subtitles}`} download className="download-btn download-btn-video">
              <span className="btn-icon">📺</span>
              <span className="btn-text">{t.downloadVideo}</span>
            </a>
          </div>
        )}
      </div>

      {result.timing_summary && (
        <div className="timing-summary">
          <div className="total-time">
            <strong>{t.totalTime}:</strong>
            <span>
              {Object.values(result.timing_summary)
                .reduce((acc, time) => acc + parseFloat(time), 0)
                .toFixed(1) + 's'}
            </span>
          </div>
          <div className="time-breakdown">
            {Object.entries(result.timing_summary).map(([key, value]) => (
              <span key={key} className="time-item">
                {`${t[key as keyof Translation] || key}: ${value}s`}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Start New Task Button */}
      {onStartNew && (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button
            onClick={onStartNew}
            className="download-btn"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              cursor: 'pointer',
              width: 'auto',
              padding: '12px 32px'
            }}
            aria-label="התחל משימה חדשה"
          >
            <span className="btn-icon">🔄</span>
            <span className="btn-text">{t('results.startNewTask') || 'התחל משימה חדשה'}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ResultsDisplay;
