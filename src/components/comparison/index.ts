// Comparison component exports
export { default as PhoneComparisonDisplay } from './PhoneComparisonDisplay'
export { default as PhoneCard } from './PhoneCard'
export { default as SpecificationChart } from './SpecificationChart'
export { default as CategoryComparison } from './CategoryComparison'
export { default as ComparisonInsights } from './ComparisonInsights'
export { default as ComparisonManager } from './ComparisonManager'
export { default as MultiPhoneComparisonDisplay } from './MultiPhoneComparison'

// Re-export types for convenience
export type {
  ComparisonResult,
  ComparisonCategory,
  ComparisonInsights as IComparisonInsights,
  SpecComparison,
  MultiPhoneComparison,
  SavedComparison,
  ComparisonHistoryEntry,
  ShareComparison,
} from '@/types/comparison'
