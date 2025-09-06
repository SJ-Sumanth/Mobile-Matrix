// Core type definitions for MobileMatrix
export * from './phone';
export * from './chat';
export * from './comparison';
export * from './api';
export * from './services';
export * from './errors';

// Utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Common utility types for the application
export type ID = string;
export type Timestamp = Date;
export type Currency = 'INR';

// Environment types
export type Environment = 'development' | 'staging' | 'production';

// Feature flags type
export type FeatureFlags = {
  enableAIChat: boolean;
  enableMultipleComparison: boolean;
  enablePriceTracking: boolean;
  enableUserAccounts: boolean;
  enableSocialSharing: boolean;
};
