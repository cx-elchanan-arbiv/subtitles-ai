/**
 * User Preferences Manager
 * Handles saving and loading user preferences to localStorage
 */

export interface WatermarkPreferences {
  enabled: boolean;
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  size: 'small' | 'medium' | 'large';
  opacity: number; // 0-100 (percentage)
  logoUrl?: string;
  logoFile?: File | null;
  isCollapsed?: boolean;
}

export interface UserPreferences {
  watermark: WatermarkPreferences;
  // Future: add more preference categories
  // video: VideoPreferences;
  // language: LanguagePreferences;
}

const STORAGE_KEY = 'substranslator_preferences';

const DEFAULT_PREFERENCES: UserPreferences = {
  watermark: {
    enabled: false,
    position: 'bottom-right',
    size: 'medium',
    opacity: 40, // 40% default opacity (0.4 as percentage)
    logoUrl: '',
    logoFile: null,
    isCollapsed: false
  }
};

/**
 * Load user preferences from localStorage
 */
export function loadUserPreferences(): UserPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return DEFAULT_PREFERENCES;
    }

    const parsed = JSON.parse(stored);
    
    // Merge with defaults to handle new preference fields
    return {
      ...DEFAULT_PREFERENCES,
      ...parsed,
      watermark: {
        ...DEFAULT_PREFERENCES.watermark,
        ...parsed.watermark,
        // Note: logoFile cannot be stored in localStorage, will be handled separately
        logoFile: null
      }
    };
  } catch (error) {
    console.warn('Failed to load user preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Save user preferences to localStorage
 */
export function saveUserPreferences(preferences: UserPreferences): void {
  try {
    // Create a copy without the File object (can't be serialized)
    const toSave = {
      ...preferences,
      watermark: {
        ...preferences.watermark,
        logoFile: null // Don't save File objects
      }
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (error) {
    console.error('Failed to save user preferences:', error);
  }
}

/**
 * Update watermark preferences
 */
export function updateWatermarkPreferences(
  updates: Partial<WatermarkPreferences>
): UserPreferences {
  const current = loadUserPreferences();
  const updated = {
    ...current,
    watermark: {
      ...current.watermark,
      ...updates
    }
  };
  
  saveUserPreferences(updated);
  return updated;
}

/**
 * Reset preferences to defaults
 */
export function resetUserPreferences(): UserPreferences {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to reset preferences:', error);
  }
  return DEFAULT_PREFERENCES;
}

/**
 * Save logo file to IndexedDB (for larger files)
 * This is more complex but allows storing actual File objects
 */
export async function saveLogoFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const dataUrl = reader.result as string;
        localStorage.setItem('substranslator_logo', dataUrl);
        resolve(dataUrl);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Load logo file from storage
 */
export function loadLogoFile(): string | null {
  try {
    return localStorage.getItem('substranslator_logo');
  } catch (error) {
    console.error('Failed to load logo file:', error);
    return null;
  }
}

/**
 * Remove saved logo file
 */
export function removeLogoFile(): void {
  try {
    localStorage.removeItem('substranslator_logo');
  } catch (error) {
    console.error('Failed to remove logo file:', error);
  }
}
