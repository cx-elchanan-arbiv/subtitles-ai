/**
 * E2E Test Environment Configuration
 *
 * Manages different test environments and configurations
 */

export type TestTier = 'smoke' | 'mock' | 'integration' | 'production';

export interface EnvironmentConfig {
  baseUrl: string;
  apiBaseUrl: string;
  tier: TestTier;
  useMocks: boolean;
  whisperModel: 'tiny' | 'base' | 'small' | 'medium' | 'large';
  translationService: 'google' | 'openai';
  timeout: {
    short: number;
    medium: number;
    long: number;
  };
}

export class TestEnvironment {
  /**
   * Get current test tier from environment
   */
  static getTier(): TestTier {
    return (process.env.TEST_TIER as TestTier) || 'mock';
  }

  /**
   * Get base URL for frontend
   */
  static getBaseUrl(): string {
    return process.env.BASE_URL || 'http://localhost:3000';
  }

  /**
   * Get API base URL for backend
   */
  static getApiBaseUrl(): string {
    return process.env.API_BASE_URL || 'http://localhost:8081';
  }

  /**
   * Determine if we should use real APIs or mocks
   */
  static shouldUseMocks(): boolean {
    const tier = this.getTier();
    return tier === 'smoke' || tier === 'mock';
  }

  /**
   * Get appropriate Whisper model based on test tier
   * Balances speed vs accuracy
   */
  static getWhisperModel(): 'tiny' | 'base' | 'small' | 'medium' | 'large' {
    const tier = this.getTier();
    switch (tier) {
      case 'smoke':
      case 'mock':
        return 'tiny'; // Fastest, cheapest (5-10x faster)
      case 'integration':
        return 'base'; // Balance (production default)
      case 'production':
        return 'medium'; // More accurate
      default:
        return 'tiny';
    }
  }

  /**
   * Get appropriate translation service
   * Google is free, OpenAI costs money
   */
  static getTranslationService(): 'google' | 'openai' {
    const tier = this.getTier();

    // Only use OpenAI when explicitly requested or in production tests
    if (process.env.TEST_OPENAI === 'true' && tier === 'production') {
      return 'openai';
    }

    // Default to free Google Translate
    return 'google';
  }

  /**
   * Get timeout configuration based on tier
   */
  static getTimeouts() {
    const tier = this.getTier();

    switch (tier) {
      case 'smoke':
      case 'mock':
        return {
          short: 5 * 1000,      // 5 seconds
          medium: 30 * 1000,    // 30 seconds
          long: 2 * 60 * 1000,  // 2 minutes
        };
      case 'integration':
        return {
          short: 10 * 1000,     // 10 seconds
          medium: 60 * 1000,    // 1 minute
          long: 5 * 60 * 1000,  // 5 minutes
        };
      case 'production':
        return {
          short: 15 * 1000,     // 15 seconds
          medium: 2 * 60 * 1000, // 2 minutes
          long: 10 * 60 * 1000, // 10 minutes
        };
      default:
        return {
          short: 5 * 1000,
          medium: 30 * 1000,
          long: 2 * 60 * 1000,
        };
    }
  }

  /**
   * Get full environment configuration
   */
  static getConfig(): EnvironmentConfig {
    return {
      baseUrl: this.getBaseUrl(),
      apiBaseUrl: this.getApiBaseUrl(),
      tier: this.getTier(),
      useMocks: this.shouldUseMocks(),
      whisperModel: this.getWhisperModel(),
      translationService: this.getTranslationService(),
      timeout: this.getTimeouts(),
    };
  }

  /**
   * Check if running in CI environment
   */
  static isCI(): boolean {
    return !!process.env.CI;
  }

  /**
   * Check if running against production
   */
  static isProduction(): boolean {
    const url = this.getBaseUrl();
    return url.includes('subs.sayai.io');
  }

  /**
   * Check if running against staging
   */
  static isStaging(): boolean {
    const url = this.getBaseUrl();
    return url.includes('staging');
  }

  /**
   * Check if running against local development
   */
  static isLocal(): boolean {
    const url = this.getBaseUrl();
    return url.includes('localhost') || url.includes('127.0.0.1');
  }

  /**
   * Get environment name for logging
   */
  static getEnvironmentName(): string {
    if (this.isProduction()) return 'Production';
    if (this.isStaging()) return 'Staging';
    if (this.isLocal()) return 'Local';
    return 'Unknown';
  }

  /**
   * Print current configuration (useful for debugging)
   */
  static printConfig(): void {
    const config = this.getConfig();
    console.log('🔧 E2E Test Configuration:');
    console.log(`   Environment: ${this.getEnvironmentName()}`);
    console.log(`   Base URL: ${config.baseUrl}`);
    console.log(`   API URL: ${config.apiBaseUrl}`);
    console.log(`   Test Tier: ${config.tier}`);
    console.log(`   Use Mocks: ${config.useMocks}`);
    console.log(`   Whisper Model: ${config.whisperModel}`);
    console.log(`   Translation Service: ${config.translationService}`);
    console.log(`   CI: ${this.isCI()}`);
  }
}

// Export singleton instance
export const testEnv = TestEnvironment.getConfig();
