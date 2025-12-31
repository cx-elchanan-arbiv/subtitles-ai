// Enterprise Error System Types and Mappings for Professional Error Handling

export type ServerErrorKind =
  | "none"
  | "client_invalid"
  | "400_invalid_url"
  | "401_unauthorized"
  | "403_forbidden"
  | "404_not_found"
  | "410_gone"
  | "422_unprocessable"
  | "429_rate_limit"
  | "500_server"
  | "503_maintenance"
  | "network_error"
  | "timeout_error"
  | "upload_error"
  | "processing_error"
  | "validation_error";

export interface ErrorInfo {
  title: string;
  message: string;
  code?: number;
  type?: ServerErrorKind;
  recoverable?: boolean;
  retryAfter?: number;
  context?: Record<string, any>;
  timestamp?: number;
  requestId?: string;
}

export interface ErrorAction {
  label: string;
  action: () => void;
  primary?: boolean;
  destructive?: boolean;
}

export interface EnhancedErrorInfo extends ErrorInfo {
  actions?: ErrorAction[];
  tips?: string[];
  supportUrl?: string;
  documentationUrl?: string;
}

// Badge color mapping based on HTTP status codes and error types
export function getBadgeColor(code?: number, type?: ServerErrorKind): string {
  if (type === 'network_error') return "bg-purple-100 text-purple-700 border-purple-200";
  if (type === 'timeout_error') return "bg-yellow-100 text-yellow-700 border-yellow-200";
  if (type === 'upload_error') return "bg-orange-100 text-orange-700 border-orange-200";
  if (type === 'processing_error') return "bg-red-100 text-red-700 border-red-200";
  if (type === 'validation_error') return "bg-blue-100 text-blue-700 border-blue-200";
  
  if (!code) return "bg-gray-100 text-gray-700 border-gray-200";
  if (code >= 500) return "bg-red-100 text-red-700 border-red-200";
  if (code === 429) return "bg-amber-100 text-amber-700 border-amber-200";
  if (code >= 400) return "bg-orange-100 text-orange-700 border-orange-200";
  return "bg-gray-100 text-gray-700 border-gray-200";
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export function getErrorSeverity(code?: number, type?: ServerErrorKind): ErrorSeverity {
  if (type === 'network_error' || code === 503) return ErrorSeverity.MEDIUM;
  if (code === 500 || type === 'processing_error') return ErrorSeverity.HIGH;
  if (code === 429) return ErrorSeverity.MEDIUM;
  if (code === 404 || code === 403) return ErrorSeverity.LOW;
  if (type === 'validation_error') return ErrorSeverity.LOW;
  return ErrorSeverity.MEDIUM;
}

// Error categories for analytics and monitoring
export enum ErrorCategory {
  USER_INPUT = 'user_input',
  NETWORK = 'network',
  SERVER = 'server',
  CLIENT = 'client',
  EXTERNAL_SERVICE = 'external_service',
  PROCESSING = 'processing',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization'
}

export function getErrorCategory(code?: number, type?: ServerErrorKind): ErrorCategory {
  if (type === 'network_error') return ErrorCategory.NETWORK;
  if (type === 'validation_error' || code === 400) return ErrorCategory.USER_INPUT;
  if (code === 401) return ErrorCategory.AUTHENTICATION;
  if (code === 403) return ErrorCategory.AUTHORIZATION;
  if (code === 404) return ErrorCategory.EXTERNAL_SERVICE;
  if (code === 429) return ErrorCategory.EXTERNAL_SERVICE;
  if (code && code >= 500) return ErrorCategory.SERVER;
  if (type === 'processing_error') return ErrorCategory.PROCESSING;
  return ErrorCategory.CLIENT;
}

// Helper function to create standardized error objects
export function createErrorInfo(
  titleKey: string,
  messageKey: string,
  options: {
    code?: number;
    type?: ServerErrorKind;
    recoverable?: boolean;
    retryAfter?: number;
    context?: Record<string, any>;
    t?: (key: string, options?: any) => string;
  } = {}
): ErrorInfo {
  const { code, type, recoverable = true, retryAfter, context, t } = options;
  
  return {
    title: t ? t(titleKey) : titleKey,
    message: t ? t(messageKey) : messageKey,
    code,
    type,
    recoverable,
    retryAfter,
    context,
    timestamp: Date.now(),
    requestId: generateRequestId(),
  };
}

// Generate unique request ID for error tracking
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Enhanced error info factory with i18n support
export function createEnhancedErrorInfo(
  error: any,
  t: (key: string, options?: any) => string,
  retryCallback?: () => void,
  supportCallback?: () => void
): EnhancedErrorInfo {
  const baseError = getErrorInfo(error, t);
  const actions: ErrorAction[] = [];
  
  // Add retry action if error is recoverable
  if (baseError.recoverable && retryCallback) {
    actions.push({
      label: t('errors:generic.retry'),
      action: retryCallback,
      primary: true,
    });
  }
  
  // Add support action for high severity errors
  const severity = getErrorSeverity(baseError.code, baseError.type);
  if (severity === ErrorSeverity.HIGH || severity === ErrorSeverity.CRITICAL) {
    if (supportCallback) {
      actions.push({
        label: t('common:navigation.help'),
        action: supportCallback,
      });
    }
  }
  
  // Get contextual tips based on error type
  const tips = getErrorTips(baseError.type, t);
  
  return {
    ...baseError,
    actions,
    tips,
    supportUrl: getSupportUrl(baseError.type),
    documentationUrl: getDocumentationUrl(baseError.type),
  };
}

// Get contextual tips for error types
function getErrorTips(type?: ServerErrorKind, t?: (key: string) => string): string[] {
  if (!t) return [];
  
  switch (type) {
    case '404_not_found':
    case '403_forbidden':
      return ['Check the URL format', 'Ensure the resource exists'];
    case '429_rate_limit':
      return ['Wait before trying again', 'Check rate limits'];
    case 'upload_error':
      return ['Check file format', 'Ensure file is not corrupted'];
    default:
      return [];
  }
}

// Get support URL based on error type
function getSupportUrl(type?: ServerErrorKind): string | undefined {
  const baseUrl = process.env.REACT_APP_SUPPORT_URL || '/help';
  
  switch (type) {
    case 'network_error':
      return `${baseUrl}#network-issues`;
    case 'upload_error':
      return `${baseUrl}#upload-problems`;
    case 'processing_error':
      return `${baseUrl}#processing-issues`;
    default:
      return baseUrl;
  }
}

// Get documentation URL based on error type
function getDocumentationUrl(type?: ServerErrorKind): string | undefined {
  const baseUrl = process.env.REACT_APP_DOCS_URL || '/docs';
  
  switch (type) {
    case '400_invalid_url':
      return `${baseUrl}/supported-formats`;
    case 'upload_error':
      return `${baseUrl}/file-requirements`;
    case 'processing_error':
      return `${baseUrl}/troubleshooting`;
    default:
      return baseUrl;
  }
}

// Main error info resolver with i18n support
export function getErrorInfo(error: any, t?: (key: string, options?: any) => string): ErrorInfo {
  // If it's already an ErrorInfo object
  if (error && typeof error === 'object' && error.title && error.message) {
    return error;
  }

  // If it's a string, try to parse or use as generic error
  if (typeof error === 'string') {
    const lowerError = error.toLowerCase();
    
    // Network errors
    if (lowerError.includes('network') || lowerError.includes('fetch') || lowerError.includes('connection')) {
      return createErrorInfo(
        'errors:network.title',
        'errors:network.message',
        { type: 'network_error', t }
      );
    }
    
    // Timeout errors
    if (lowerError.includes('timeout')) {
      return createErrorInfo(
        'errors:processing.timeout',
        'errors:processing.timeout',
        { type: 'timeout_error', t }
      );
    }
    
    // HTTP status errors
    if (lowerError.includes('unauthorized') || lowerError.includes('401')) {
      return createErrorInfo(
        'errors:http.401.title',
        'errors:http.401.message',
        { code: 401, type: '401_unauthorized', t }
      );
    }
    
    if (lowerError.includes('forbidden') || lowerError.includes('403')) {
      return createErrorInfo(
        'errors:http.403.title',
        'errors:http.403.message',
        { code: 403, type: '403_forbidden', t }
      );
    }
    
    if (lowerError.includes('not found') || lowerError.includes('404')) {
      return createErrorInfo(
        'errors:http.404.title',
        'errors:http.404.message',
        { code: 404, type: '404_not_found', t }
      );
    }
    
    if (lowerError.includes('rate limit') || lowerError.includes('429')) {
      return createErrorInfo(
        'errors:http.429.title',
        'errors:http.429.message',
        { code: 429, type: '429_rate_limit', retryAfter: 300, t }
      );
    }
    
    if (lowerError.includes('server error') || lowerError.includes('500')) {
      return createErrorInfo(
        'errors:http.500.title',
        'errors:http.500.message',
        { code: 500, type: '500_server', t }
      );
    }
    
    if (lowerError.includes('maintenance') || lowerError.includes('503')) {
      return createErrorInfo(
        'errors:http.503.title',
        'errors:http.503.message',
        { code: 503, type: '503_maintenance', retryAfter: 1800, t }
      );
    }
    
    if (lowerError.includes('invalid') && lowerError.includes('url')) {
      return createErrorInfo(
        'errors:http.400.title',
        'errors:http.400.message',
        { code: 400, type: '400_invalid_url', t }
      );
    }

    // Generic error for unrecognized strings
    return createErrorInfo(
      'errors:generic.title',
      error,
      { type: 'client_invalid', t }
    );
  }

  // If it has a status code, try to map it
  if (error && error.status) {
    const status = error.status;
    const errorMap: Record<number, { titleKey: string; messageKey: string; type: ServerErrorKind }> = {
      400: { titleKey: 'errors:http.400.title', messageKey: 'errors:http.400.message', type: '400_invalid_url' },
      401: { titleKey: 'errors:http.401.title', messageKey: 'errors:http.401.message', type: '401_unauthorized' },
      403: { titleKey: 'errors:http.403.title', messageKey: 'errors:http.403.message', type: '403_forbidden' },
      404: { titleKey: 'errors:http.404.title', messageKey: 'errors:http.404.message', type: '404_not_found' },
      410: { titleKey: 'errors:http.410.title', messageKey: 'errors:http.410.message', type: '410_gone' },
      422: { titleKey: 'errors:http.422.title', messageKey: 'errors:http.422.message', type: '422_unprocessable' },
      429: { titleKey: 'errors:http.429.title', messageKey: 'errors:http.429.message', type: '429_rate_limit' },
      500: { titleKey: 'errors:http.500.title', messageKey: 'errors:http.500.message', type: '500_server' },
      503: { titleKey: 'errors:http.503.title', messageKey: 'errors:http.503.message', type: '503_maintenance' },
    };
    
    const errorConfig = errorMap[status];
    if (errorConfig) {
      return createErrorInfo(
        errorConfig.titleKey,
        errorConfig.messageKey,
        { 
          code: status, 
          type: errorConfig.type,
          retryAfter: status === 429 ? 300 : status === 503 ? 1800 : undefined,
          t 
        }
      );
    }
  }

  // Default fallback
  return createErrorInfo(
    'errors:generic.title',
    'errors:generic.message',
    { type: 'client_invalid', t }
  );
}

// Error boundary helper
export class ErrorBoundaryError extends Error {
  public readonly errorInfo: ErrorInfo;
  
  constructor(error: any, t?: (key: string, options?: any) => string) {
    super(typeof error === 'string' ? error : error?.message || 'Unknown error');
    this.name = 'ErrorBoundaryError';
    this.errorInfo = getErrorInfo(error, t);
  }
}

// Error reporting helper for analytics
export function reportError(error: ErrorInfo, context?: Record<string, any>) {
  // In production, send to error tracking service (e.g., Sentry)
  if (process.env.NODE_ENV === 'production') {
    console.error('Error reported:', {
      ...error,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    });
    
    // TODO: Integrate with Sentry or other error tracking service
    // Sentry.captureException(new Error(error.message), {
    //   tags: {
    //     errorType: error.type,
    //     errorCode: error.code?.toString(),
    //   },
    //   extra: {
    //     ...error,
    //     ...context,
    //   },
    // });
  } else {
    console.error('Development Error:', error, context);
  }
}