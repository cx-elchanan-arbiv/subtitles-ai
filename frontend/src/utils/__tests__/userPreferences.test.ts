/**
 * Tests for User Preferences functionality
 */

import {
  loadUserPreferences,
  saveUserPreferences,
  updateWatermarkPreferences,
  resetUserPreferences,
  saveLogoFile,
  loadLogoFile,
  removeLogoFile,
  UserPreferences,
  WatermarkPreferences
} from '../userPreferences';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// FileReader is now mocked globally in setupTests.ts

describe('User Preferences', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadUserPreferences', () => {
    it('should return default preferences when localStorage is empty', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const preferences = loadUserPreferences();

      expect(preferences).toEqual({
        watermark: {
          enabled: false,
          position: 'bottom-right',
          size: 'medium',
          opacity: 40,
          logoUrl: '',
          logoFile: null,
          isCollapsed: false
        }
      });
    });

    it('should load saved preferences from localStorage', () => {
      const savedPrefs = {
        watermark: {
          enabled: true,
          position: 'top-right',
          size: 'large',
          logoUrl: 'test-url',
          isCollapsed: true
        }
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedPrefs));
      
      const preferences = loadUserPreferences();
      
      expect(preferences.watermark.enabled).toBe(true);
      expect(preferences.watermark.position).toBe('top-right');
      expect(preferences.watermark.size).toBe('large');
      expect(preferences.watermark.isCollapsed).toBe(true);
      expect(preferences.watermark.logoFile).toBe(null); // Should always be null
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');

      const preferences = loadUserPreferences();

      expect(preferences).toEqual({
        watermark: {
          enabled: false,
          position: 'bottom-right',
          size: 'medium',
          opacity: 40,
          logoUrl: '',
          logoFile: null,
          isCollapsed: false
        }
      });
    });
  });

  describe('saveUserPreferences', () => {
    it('should save preferences to localStorage', () => {
      const preferences: UserPreferences = {
        watermark: {
          enabled: true,
          position: 'top-left',
          size: 'small',
          logoUrl: 'test-url',
          logoFile: null,
          isCollapsed: false
        }
      };
      
      saveUserPreferences(preferences);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'substranslator_preferences',
        JSON.stringify({
          watermark: {
            enabled: true,
            position: 'top-left',
            size: 'small',
            logoUrl: 'test-url',
            logoFile: null,
            isCollapsed: false
          }
        })
      );
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      const preferences: UserPreferences = {
        watermark: {
          enabled: true,
          position: 'bottom-right',
          size: 'medium',
          logoUrl: '',
          logoFile: null,
          isCollapsed: false
        }
      };
      
      // Should not throw
      expect(() => saveUserPreferences(preferences)).not.toThrow();
    });
  });

  describe('updateWatermarkPreferences', () => {
    it('should update only specified watermark preferences', () => {
      const existingPrefs = {
        watermark: {
          enabled: false,
          position: 'bottom-right' as const,
          size: 'medium' as const,
          logoUrl: '',
          logoFile: null,
          isCollapsed: false
        }
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingPrefs));
      
      const updates: Partial<WatermarkPreferences> = {
        enabled: true,
        position: 'top-right'
      };
      
      const result = updateWatermarkPreferences(updates);
      
      expect(result.watermark.enabled).toBe(true);
      expect(result.watermark.position).toBe('top-right');
      expect(result.watermark.size).toBe('medium'); // Should remain unchanged
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('resetUserPreferences', () => {
    it('should remove preferences from localStorage', () => {
      const result = resetUserPreferences();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('substranslator_preferences');
      expect(result).toEqual({
        watermark: {
          enabled: false,
          position: 'bottom-right',
          size: 'medium',
          opacity: 40,
          logoUrl: '',
          logoFile: null,
          isCollapsed: false
        }
      });
    });
  });

  describe('Logo file management', () => {
    it('should save logo file as data URL', async () => {
      const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
      
      const result = await saveLogoFile(mockFile);
      
      expect(result).toBe('data:image/png;base64,AA==');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'substranslator_logo',
        'data:image/png;base64,AA=='
      );
    });

    it('should load logo file from localStorage', () => {
      const mockDataUrl = 'data:image/png;base64,mockdata';
      localStorageMock.getItem.mockReturnValue(mockDataUrl);
      
      const result = loadLogoFile();
      
      expect(result).toBe(mockDataUrl);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('substranslator_logo');
    });

    it('should remove logo file from localStorage', () => {
      removeLogoFile();
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('substranslator_logo');
    });

    it('should handle FileReader errors gracefully', async () => {
      const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
      
      // Enable error mode in global mock
      (window.FileReader as any).shouldError = true;
      
      await expect(saveLogoFile(mockFile)).rejects.toThrow();
      
      // Reset error mode
      (window.FileReader as any).shouldError = false;
    });
  });
});
