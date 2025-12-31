import { z } from 'zod';

export const WhisperModelSchema = z.enum(['tiny', 'base', 'small', 'medium', 'large']);

export const TranslationServiceSchema = z.enum(['openai', 'google']);

export const WatermarkPositionSchema = z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right']);

export const WatermarkSizeSchema = z.enum(['small', 'medium', 'large']);

export const VideoMetadataSchema = z.object({
  title: z.string(),
  duration: z.number().positive(),
  duration_string: z.string(),
  view_count: z.number().nonnegative(),
  upload_date: z.string(),
  uploader: z.string(),
  thumbnail: z.string().url(),
  description: z.string(),
  width: z.number().positive(),
  height: z.number().positive(),
  fps: z.number().positive(),
  filesize: z.number().nonnegative(),
  url: z.string().url(),
});

export const UserChoicesSchema = z.object({
  source_lang: z.string().min(2).max(10),
  target_lang: z.string().min(2).max(10),
  auto_create_video: z.boolean(),
  whisper_model: WhisperModelSchema,
  url: z.string().url(),
  translation_service: TranslationServiceSchema,
  watermark_enabled: z.boolean().optional(),
  watermark_position: WatermarkPositionSchema.optional(),
  watermark_size: WatermarkSizeSchema.optional(),
});

export const ProcessedFilesSchema = z.object({
  original_srt: z.string().optional(),
  translated_srt: z.string().optional(),
  video_with_subtitles: z.string().optional(),
});

export const TimingSummarySchema = z.record(z.string(), z.string());

export const TaskStatusSchema = z.enum(['SUCCESS', 'FAILURE', 'PENDING', 'PROGRESS', 'DOWNLOAD_FAILED']);

export const TaskResultSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    title: z.string().optional(),
    detected_language: z.string().optional(),
    files: ProcessedFilesSchema.optional(),
    timing_summary: TimingSummarySchema.optional(),
    video_metadata: VideoMetadataSchema.optional(),
    user_choices: UserChoicesSchema.optional(),
    filename: z.string().optional(),
    file_size_mb: z.number().optional(),
    duration: z.number().optional(),
    download_url: z.string().url().optional(),
    message: z.string().optional(),
    task_id: z.string().optional(),
    result: TaskResultSchema.optional(),
    status: TaskStatusSchema.optional(),
    error: z.string().optional(),
  })
);

export const StepStatusSchema = z.enum(['waiting', 'in_progress', 'completed', 'error']);

export const StepSchema = z.object({
  label: z.string(),
  subtitle: z.string(),
  status: StepStatusSchema,
  progress: z.number().min(0).max(100),
  weight: z.number().positive(),
  indeterminate: z.boolean(),
  status_message: z.string().optional(),
});

export const ProgressSchema = z.object({
  steps: z.array(StepSchema),
  overall_percent: z.number().min(0).max(100),
  logs: z.array(z.string()),
});

export const InitialRequestSchema = z.object({
  url: z.string().url(),
  quality: z.string().optional(),
  type: z.string().optional(),
});

export const TaskErrorSchema = z.object({
  code: z.string().optional(),
  message: z.string().optional(),
  user_facing_message: z.string().optional(),
  recoverable: z.boolean().optional(),
});

export const TaskStatusResponseSchema = z.object({
  task_id: z.string(),
  state: TaskStatusSchema,
  progress: ProgressSchema,
  video_metadata: VideoMetadataSchema.nullable().optional(),
  result: TaskResultSchema.nullable().optional(),
  user_choices: UserChoicesSchema.optional(),
  initial_request: InitialRequestSchema.optional(),
  error: z.union([TaskErrorSchema, z.string()]).nullable().optional(),
});

export const UploadRequestSchema = z.object({
  file: z.instanceof(File),
  source_lang: z.string().min(2).max(10),
  target_lang: z.string().min(2).max(10),
  auto_create_video: z.boolean(),
  whisper_model: WhisperModelSchema,
  translation_service: TranslationServiceSchema,
  watermark_enabled: z.boolean().optional(),
  watermark_position: WatermarkPositionSchema.optional(),
  watermark_size: WatermarkSizeSchema.optional(),
  watermark_logo: z.instanceof(File).optional(),
});

export const YoutubeRequestSchema = z.object({
  url: z.string().url().refine(
    (url) => {
      const youtubePattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
      return youtubePattern.test(url);
    },
    { message: 'Must be a valid YouTube URL' }
  ),
  source_lang: z.string().min(2).max(10),
  target_lang: z.string().min(2).max(10),
  auto_create_video: z.boolean(),
  whisper_model: WhisperModelSchema,
  translation_service: TranslationServiceSchema,
  watermark_enabled: z.boolean().optional(),
  watermark_position: WatermarkPositionSchema.optional(),
  watermark_size: WatermarkSizeSchema.optional(),
  watermark_logo: z.instanceof(File).optional(),
});

export const QuickDownloadRequestSchema = z.object({
  url: z.string().url().refine(
    (url) => {
      const youtubePattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
      return youtubePattern.test(url);
    },
    { message: 'Must be a valid YouTube URL' }
  ),
});

export const TaskInitResponseSchema = z.object({
  task_id: z.string(),
  video_metadata: VideoMetadataSchema.optional(),
  user_choices: UserChoicesSchema.optional(),
  initial_request: InitialRequestSchema.optional(),
  progress: ProgressSchema.optional(),
});

export const ApiErrorResponseSchema = z.object({
  error: z.string(),
  status: z.literal('error'),
  message: z.string().optional(),
  error_code: z.string().optional(),
});

export const LanguageSchema = z.object({
  code: z.string(),
  name: z.string(),
  nativeName: z.string(),
  rtl: z.boolean().optional(),
});

export const LanguagesResponseSchema = z.object({
  languages: z.array(LanguageSchema),
});

export const HealthCheckResponseSchema = z.object({
  status: z.enum(['healthy', 'unhealthy']),
  timestamp: z.string(),
  services: z.object({
    redis: z.enum(['up', 'down']),
    celery: z.enum(['up', 'down']),
    backend: z.enum(['up', 'down']),
  }),
});

export const WatermarkConfigSchema = z.object({
  enabled: z.boolean(),
  position: WatermarkPositionSchema,
  size: WatermarkSizeSchema,
  logoFile: z.instanceof(File).optional(),
  logoUrl: z.string().optional(),
});

export function validateYoutubeUrl(url: string): boolean {
  try {
    QuickDownloadRequestSchema.parse({ url });
    return true;
  } catch {
    return false;
  }
}

export function validateWhisperModel(model: string): model is 'tiny' | 'base' | 'small' | 'medium' | 'large' {
  return WhisperModelSchema.safeParse(model).success;
}

export function validateTranslationService(service: string): service is 'openai' | 'google' {
  return TranslationServiceSchema.safeParse(service).success;
}