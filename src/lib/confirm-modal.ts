/**
 * Confirm Modal Store — global state untuk trigger confirm modal dari mana saja.
 * Pakai zustand (no persist needed — modal state is ephemeral).
 */
import { create } from "zustand";

export type ConfirmConfig = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: () => void;
};

type ConfirmState = {
  open: boolean;
  config: ConfirmConfig | null;
  show: (config: ConfirmConfig) => void;
  hide: () => void;
};

export const useConfirmModal = create<ConfirmState>((set) => ({
  open: false,
  config: null,
  show: (config) => set({ open: true, config }),
  hide: () => set({ open: false, config: null }),
}));

/**
 * Helper function untuk trigger confirm modal (mirip window.confirm tapi async via callback).
 * Usage:
 *   confirmAction({
 *     title: "Hapus pesanan?",
 *     message: "Pesanan akan dihapus permanen.",
 *     onConfirm: () => deleteOrder(id),
 *   });
 */
export function confirmAction(config: ConfirmConfig) {
  useConfirmModal.getState().show(config);
}
