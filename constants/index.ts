// Re-export from src/constants for backward compatibility
export * from '../src/constants';

// Alias for backward compatibility
export { ZONE_COEFFICIENTS_V3 as ZONE_COEFFICIENTS } from '../src/constants';

// LIMITER_CONFIG for onboarding (with emoji icons)
import { LimiterType } from '../src/types';

export const LIMITER_CONFIG: Record<LimiterType, { icon: string; name: string; label: string; color: string }> = {
  cardio: { icon: '❤️', name: '心肺リミッター型', label: '心肺', color: '#EF4444' },
  muscular: { icon: '💪', name: '筋持久力リミッター型', label: '筋持久力', color: '#F97316' },
  balanced: { icon: '⚖️', name: 'バランス型', label: 'バランス', color: '#3B82F6' },
};
