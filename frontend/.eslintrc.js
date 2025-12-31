module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  plugins: ['i18next'],
  rules: {
    // Prevent hardcoded strings in JSX
    'i18next/no-literal-string': [
      'error',
      {
        markupOnly: true,
        ignoreAttribute: [
          'data-testid',
          'className', 
          'style',
          'href',
          'src',
          'alt',
          'aria-label',
          'aria-describedby',
          'role',
          'type',
          'name',
          'id',
          'placeholder',
          'title',
          'accept',
          'dir',
          'lang'
        ],
        // Allow technical terms and identifiers from our allowlist
        ignore: [
          'AI',
          'API', 
          'YouTube',
          'MP4',
          'H.264',
          'FFmpeg',
          'yt-dlp',
          'Redis',
          'Docker',
          'JWT',
          'OAuth',
          'tiny',
          'base', 
          'small',
          'medium',
          'large',
          'Google Translate',
          'OpenAI',
          'GPT-4o',
          'Whisper',
          'int8',
          // CSS classes and technical strings
          /^[\w-]+$/,
          // File extensions and formats
          /^\.\w+$/,
          // Numbers and percentages
          /^\d+(\.\d+)?%?$/,
          // Version numbers
          /^\d+\.\d+(\.\d+)?$/,
          // URLs
          /^https?:\/\//,
          // CSS values
          /^\d+(px|em|rem|%|vh|vw)$/,
          // Emoji and symbols (expanded range)
          /^[\u{1F300}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+$/u,
          // Special symbols and arrows
          /^[▼⚙️📊🎬💡⚠️👁️⏱️▲▼◄►✓✗✨⭐🔥🎯🚀💪🎉🎊]$/u,
          // Seconds notation and units
          /^\d+(\.\d+)?s$/,
          // Single letter units
          /^[smhdMS]$/,
          // Simple punctuation and special chars
          /^[.,!?;:\-_+=*\/\\|<>@#$%^&(){}[\]]$/
        ]
      }
    ]
  },
  overrides: [
    {
      // Don't enforce on config files
      files: ['*.config.js', '*.config.ts', 'tailwind.config.js'],
      rules: {
        'i18next/no-literal-string': 'off'
      }
    }
  ]
};