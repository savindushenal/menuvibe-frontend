// Classic Template Types
// Re-export shared types from premium template for consistency

export * from '../premium/types';

// Classic template specific types can be added here
export interface ClassicTheme {
  headerStyle: 'simple' | 'centered' | 'logo-left';
  menuLayout: 'list' | 'grid' | 'compact';
  showPrices: boolean;
  showImages: boolean;
  showDescriptions: boolean;
}
