"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Wifi, WifiOff, CloudOff, RefreshCw } from "lucide-react";

/**
 * NetworkStatus — banner yang muncul saat koneksi internet terputus.
 * - Offline: banner merah "Anda sedang offline" di top
 * - Online (setelah offline): banner hijau "Kembali online" 3 detik, lalu fade
 * - Listen ke window online/offline events
 * - Pixel-art themed
 */
export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOnline(navigator.onLine);

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setShowRestored(true);
        const t = setTimeout(() => setShowRestored(false), 3000);
        return () => clearTimeout(t);
      }
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [wasOffline]);

  return (
    <AnimatePresence>
      {/* OFFLINE banner — persistent saat offline */}
      {!isOnline && (
        <motion.div
          key="offline"
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed left-0 right-0 top-0 z-[99999] border-b-2 border-[#ff3b6b] bg-[#ff3b6b] pixel-corner-0"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-center justify-center gap-2.5 px-4 py-2.5">
            <CloudOff className="size-4 text-white shrink-0" />
            <p className="font-pixel text-[8px] uppercase tracking-wide text-white">
              Anda sedang offline — beberapa fitur mungkin tidak berfungsi
            </p>
          </div>
        </motion.div>
      )}

      {/* RESTORED banner — 3 detik setelah kembali online */}
      {isOnline && showRestored && (
        <motion.div
          key="restored"
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed left-0 right-0 top-0 z-[99999] border-b-2 border-[#6ee7b7] bg-[#6ee7b7]"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center justify-center gap-2.5 px-4 py-2.5">
            <Wifi className="size-4 text-[#0a0a0a] shrink-0" />
            <p className="font-pixel text-[8px] uppercase tracking-wide text-[#0a0a0a]">
              Kembali online — koneksi internet pulih
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
