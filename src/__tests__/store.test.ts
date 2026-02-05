// ============================================
// Zustand ストアのテストケース
// ============================================

// AsyncStorageのモック
const mockStorage: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn((key: string) => Promise.resolve(mockStorage[key] || null)),
    setItem: jest.fn((key: string, value: string) => {
      mockStorage[key] = value;
      return Promise.resolve();
    }),
    removeItem: jest.fn((key: string) => {
      delete mockStorage[key];
      return Promise.resolve();
    }),
  },
}));

import { useProfileStore } from '../stores/useAppStore';
import type { PBs } from '../types';

// zustand storeをテストでリセットするヘルパー
const resetStore = () => {
  useProfileStore.setState({
    profile: {
      ageCategory: 'senior',
      gender: 'other',
      experience: 'intermediate',
      pbs: {},
      estimated: null,
      current: null,
    },
  });
};

describe('useProfileStore', () => {
  beforeEach(() => {
    resetStore();
  });

  // ============================================
  // updatePBs
  // ============================================

  describe('updatePBs', () => {
    it('PBを更新するとeTPが自動計算される', () => {
      const { updatePBs } = useProfileStore.getState();
      updatePBs({ m1500: 240 });

      const { profile } = useProfileStore.getState();
      expect(profile.pbs.m1500).toBe(240);
      expect(profile.estimated).not.toBeNull();
      expect(profile.estimated!.etp).toBeGreaterThan(0);
    });

    it('複数PBを段階的に追加できる', () => {
      const { updatePBs } = useProfileStore.getState();
      updatePBs({ m1500: 240 });
      updatePBs({ m800: 120 });

      const { profile } = useProfileStore.getState();
      expect(profile.pbs.m800).toBe(120);
      expect(profile.pbs.m1500).toBe(240);
    });

    it('currentがない場合、リミッターが自動推定される', () => {
      const { updatePBs } = useProfileStore.getState();
      // 筋持久力型: 800mが相対的に遅い
      updatePBs({ m800: 130, m1500: 240 });

      const { profile } = useProfileStore.getState();
      expect(profile.estimated).not.toBeNull();
      expect(profile.estimated!.limiterType).toBe('muscular');
    });

    it('currentがある場合、リミッターは自動推定されない', () => {
      // まずcurrentを設定
      useProfileStore.setState({
        profile: {
          ...useProfileStore.getState().profile,
          current: { etp: 70, limiterType: 'cardio', lastTestDate: '2024-01-01' },
          estimated: { etp: 75, confidence: 'medium', adjustments: [], limiterType: 'cardio' },
        },
      });

      const { updatePBs } = useProfileStore.getState();
      updatePBs({ m800: 130, m1500: 240 });

      const { profile } = useProfileStore.getState();
      // currentがあるのでestimated.limiterTypeはcardioのまま
      expect(profile.estimated!.limiterType).toBe('cardio');
    });

    it('単一PBのみではbalancedになる', () => {
      const { updatePBs } = useProfileStore.getState();
      updatePBs({ m1500: 240 });

      const { profile } = useProfileStore.getState();
      expect(profile.estimated!.limiterType).toBe('balanced');
    });

    it('3000mと5000mのペアからリミッターが推定される', () => {
      const { updatePBs } = useProfileStore.getState();
      // 1500mが速い選手 → cardio推定
      updatePBs({ m1500: 230, m5000: 950 });

      const { profile } = useProfileStore.getState();
      expect(profile.estimated).not.toBeNull();
      expect(profile.estimated!.limiterType).toBe('cardio');
    });

    it('4距離全てのPBを設定できる', () => {
      const { updatePBs } = useProfileStore.getState();
      updatePBs({ m800: 120, m1500: 240, m3000: 520, m5000: 910 });

      const { profile } = useProfileStore.getState();
      expect(profile.pbs.m800).toBe(120);
      expect(profile.pbs.m1500).toBe(240);
      expect(profile.pbs.m3000).toBe(520);
      expect(profile.pbs.m5000).toBe(910);
      expect(profile.estimated).not.toBeNull();
    });
  });

  // ============================================
  // updateAttributes
  // ============================================

  describe('updateAttributes', () => {
    it('年齢カテゴリを更新するとeTPが再計算される', () => {
      const { updatePBs, updateAttributes } = useProfileStore.getState();
      updatePBs({ m1500: 240 });
      const etpBefore = useProfileStore.getState().profile.estimated!.etp;

      updateAttributes({ ageCategory: 'masters_50' });
      const etpAfter = useProfileStore.getState().profile.estimated!.etp;

      // masters_50: etpAdj=4 → eTPが増える
      expect(etpAfter).toBe(etpBefore + 4);
    });

    it('経験レベルを更新するとeTPが再計算される', () => {
      const { updatePBs, updateAttributes } = useProfileStore.getState();
      updatePBs({ m1500: 240 });
      const etpBefore = useProfileStore.getState().profile.estimated!.etp;

      updateAttributes({ experience: 'elite' });
      const etpAfter = useProfileStore.getState().profile.estimated!.etp;

      // elite: etpAdj=-1, intermediate: etpAdj=1 → 差は-2
      expect(etpAfter).toBe(etpBefore - 2);
    });
  });

  // ============================================
  // setLimiterType
  // ============================================

  describe('setLimiterType', () => {
    it('リミッタータイプを手動設定できる', () => {
      const { updatePBs, setLimiterType } = useProfileStore.getState();
      updatePBs({ m1500: 240 });
      setLimiterType('cardio');

      const { profile } = useProfileStore.getState();
      expect(profile.estimated!.limiterType).toBe('cardio');
    });
  });

  // ============================================
  // setCurrent
  // ============================================

  describe('setCurrent', () => {
    it('テスト結果からcurrentを設定', () => {
      const { setCurrent } = useProfileStore.getState();
      setCurrent(70, 'cardio');

      const { profile } = useProfileStore.getState();
      expect(profile.current).not.toBeNull();
      expect(profile.current!.etp).toBe(70);
      expect(profile.current!.limiterType).toBe('cardio');
      expect(profile.current!.lastTestDate).toBeTruthy();
    });
  });

  // ============================================
  // resetProfile
  // ============================================

  describe('resetProfile', () => {
    it('プロフィールをリセットできる', () => {
      const { updatePBs, setCurrent, resetProfile } = useProfileStore.getState();
      updatePBs({ m1500: 240 });
      setCurrent(70, 'cardio');

      resetProfile();

      const { profile } = useProfileStore.getState();
      expect(profile.pbs).toEqual({});
      expect(profile.estimated).toBeNull();
      expect(profile.current).toBeNull();
    });
  });
});
