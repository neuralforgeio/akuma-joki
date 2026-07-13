"use client";

import { useEffect, useState } from "react";
import { useSyncExternalStore } from "react";
import { useAdminStore } from "@/lib/admin-store";
import { Megaphone, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const DISMISS_KEY = "akuma-announcement-dismissed";

function subscribeDismiss(cb: () => void) {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}
function getDismissSnapshot() {
  try {
    return sessionStorage.getItem(DISMISS_KEY) || "";
  } catch {
    return "";
  }
}
function getServerDismissSnapshot() {
  return "";
}

/**
 * AnnouncementBanner — banner global yang muncul di semua halaman public.
 * Baca dari admin-store. User bisa dismiss (sessionStorage).
 */
export function AnnouncementBanner() {
  const announcement = useAdminStore((s) => s.announcement);
  const dismissedId = useSyncExternalStore(
    subscribeDismiss,
    getDismissSnapshot,
    getServerDismissSnapshot
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isDismissed = announcement && dismissedId === announcement.id;
  if (!mounted || !announcement || !announcement.active || isDismissed) return null;

  const handleDismiss = () => {
    try {
      if (announcement) {
        sessionStorage.setItem(DISMISS_KEY, announcement.id);
        window.dispatchEvent(new Event("storage"));
      }
    } catch {
      /* ignore */
    }
  };

  const color =
    announcement.type === "warning"
      ? "#ff3b6b"
      : announcement.type === "success"
      ? "#6ee7b7"
      : "#7fd4ff";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="relative z-50 overflow-hidden border-b-2"
        style={{ borderColor: `${color}66`, background: `${color}11` }}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5">
          <Megaphone className="size-4 shrink-0" style={{ color }} />
          <div className="min-w-0 flex-1">
            <span
              className="font-pixel text-[8px] uppercase tracking-wide mr-2"
              style={{ color }}
            >
              {announcement.title}
            </span>
            <span className="text-xs text-[#e5e5e5]">{announcement.body}</span>
          </div>
          <button
            onClick={handleDismiss}
            className="shrink-0 text-[#9a93a8] hover:text-[#e5e5e5] p-1"
            aria-label="Tutup announcement"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
