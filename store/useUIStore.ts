// ============================================
// UI状態管理（タブスワイプ制御用）
// ============================================

import { create } from 'zustand';

interface UIState {
    // サブ画面（詳細画面、結果入力画面など）が開いているか
    isSubScreenOpen: boolean;
    setSubScreenOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()((set) => ({
    isSubScreenOpen: false,
    setSubScreenOpen: (open) => set({ isSubScreenOpen: open }),
}));

// セレクター
export const useIsSubScreenOpen = () => useUIStore((state) => state.isSubScreenOpen);
export const useSetSubScreenOpen = () => useUIStore((state) => state.setSubScreenOpen);
