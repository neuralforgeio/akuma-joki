"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { useAdminStore } from "@/lib/admin-store";
import { useToast } from "@/hooks/use-toast";
import { HelpBanner } from "@/components/admin/help-tooltip";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  Send,
  CheckCheck,
  Check,
  Circle,
  Users,
  MessageCircle,
} from "lucide-react";

function formatTime(ts: number): string {
  try {
    return new Date(ts).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "--:--";
  }
}

function formatDate(ts: number): string {
  try {
    return new Date(ts).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function sameDay(a: number, b: number): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

export default function LiveChatPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [authorized, setAuthorized] = useState(false);

  const chatMessages = useAdminStore((s) => s.chatMessages);
  const sendChatMessage = useAdminStore((s) => s.sendChatMessage);
  const markChatRead = useAdminStore((s) => s.markChatRead);
  const settings = useAdminStore((s) => s.settings);

  const [input, setInput] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/admin/login");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAuthorized(true);
  }, [router]);

  // Group messages by userId
  const conversations = useMemo(() => {
    const map = new Map<
      string,
      {
        userId: string;
        messages: typeof chatMessages;
        lastTs: number;
        unread: number;
      }
    >();

    for (const m of chatMessages) {
      const uid = m.userId || "anon";
      const cur = map.get(uid) ?? {
        userId: uid,
        messages: [],
        lastTs: 0,
        unread: 0,
      };
      cur.messages.push(m);
      cur.lastTs = Math.max(cur.lastTs, m.ts);
      if (m.role === "user" && !m.read) cur.unread += 1;
      map.set(uid, cur);
    }

    return Array.from(map.values()).sort((a, b) => b.lastTs - a.lastTs);
  }, [chatMessages]);

  // Auto-select first conversation on mount if none selected
  useEffect(() => {
    if (!authorized) return;
    if (selectedUserId === null && conversations.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedUserId(conversations[0].userId);
    }
  }, [authorized, conversations, selectedUserId]);

  // Filter messages for the selected conversation
  const activeMessages = useMemo(() => {
    if (selectedUserId === null) return [];
    return chatMessages
      .filter((m) => (m.userId || "anon") === selectedUserId)
      .sort((a, b) => a.ts - b.ts);
  }, [chatMessages, selectedUserId]);

  // Mark unread user messages as read when conversation opened/updated
  useEffect(() => {
    if (!authorized || selectedUserId === null) return;
    // Mark all unread user messages in active convo as read
    const unread = activeMessages.filter(
      (m) => m.role === "user" && !m.read
    );
    if (unread.length === 0) return;
    // Slight delay to let user see the "unread" state briefly
    const t = setTimeout(() => {
      unread.forEach((m) => markChatRead(m.id));
    }, 600);
    return () => clearTimeout(t);
  }, [activeMessages, authorized, selectedUserId, markChatRead]);

  // Auto-scroll to bottom on new messages (if user is near bottom)
  useEffect(() => {
    if (!autoScroll) return;
    const el = messagesEndRef.current;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [activeMessages, autoScroll]);

  // Detect when user scrolls up — disable auto-scroll
  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setAutoScroll(distFromBottom < 80);
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    if (selectedUserId === null) {
      toast({
        title: "Pilih percakapan dulu",
        description: "Tidak ada user aktif untuk menerima balasan.",
        variant: "destructive",
      });
      return;
    }
    sendChatMessage({
      role: "cs",
      text,
      userId: selectedUserId,
    });
    setInput("");
    setAutoScroll(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const totalUnread = conversations.reduce((a, c) => a + c.unread, 0);
  const activeConvo = conversations.find((c) => c.userId === selectedUserId);

  if (!authorized) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="font-pixel text-[10px] uppercase text-[#a020f0] animate-pulse">
          Memuat...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <HelpBanner
        title="Live Chat"
        description="Percakapan real-time antara CS/admin dan pengunjung website. Pesan user muncul di sebelah kanan (hijau), balasan CS di sebelah kiri (gelap)."
        tips={[
          "Pilih percakapan dari sidebar kiri untuk melihat riwayat chat",
          "Pesan baru dari user akan otomatis ditandai sudah dibaca saat dibuka",
          "Tekan Enter untuk kirim, Shift+Enter untuk baris baru",
          "Maksimal 200 pesan tersimpan — pesan lama otomatis terhapus",
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-pixel text-base sm:text-lg text-[#e5e5e5] text-glow-neon flex items-center gap-2">
            <MessageSquare className="size-4 text-[#c44bff]" />
            LIVE CHAT
          </h1>
          <p className="mt-1 text-sm text-[#9a93a8]">
            WhatsApp-style chat dengan pengunjung website.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {totalUnread > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 border border-red-500/40 px-2.5 py-1 text-[10px] font-semibold text-red-400">
              <Circle className="size-2 fill-red-400 text-red-400" />
              {totalUnread} unread
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/15 border border-violet-500/40 px-2.5 py-1 text-[10px] font-semibold text-violet-300">
            <Users className="size-3" />
            {conversations.length} chat
          </span>
        </div>
      </div>

      {/* Chat container: sidebar + chat area */}
      <div className="grid md:grid-cols-[260px_1fr] gap-3 h-[70vh] min-h-[480px]">
        {/* Conversations sidebar */}
        <div className="border-2 border-[#2a2436] bg-[#121017] pixel-corner overflow-hidden flex flex-col">
          <div className="border-b-2 border-[#2a2436] px-3 py-2.5 flex items-center justify-between">
            <p className="font-pixel text-[8px] uppercase text-[#9a93a8]">
              Percakapan
            </p>
            <span className="font-pixel text-[7px] text-[#5a5266]">
              {conversations.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto akuma-scroll">
            {conversations.length === 0 ? (
              <div className="p-4 text-center">
                <MessageCircle className="mx-auto size-6 text-[#5a5266]" />
                <p className="mt-2 font-pixel text-[7px] uppercase text-[#5a5266]">
                  Belum ada chat
                </p>
                <p className="mt-1 text-[10px] text-[#9a93a8] leading-relaxed">
                  Chat dari pengunjung akan muncul di sini.
                </p>
              </div>
            ) : (
              conversations.map((c) => {
                const last = c.messages[c.messages.length - 1];
                const isActive = c.userId === selectedUserId;
                return (
                  <button
                    key={c.userId}
                    onClick={() => {
                      setSelectedUserId(c.userId);
                      setAutoScroll(true);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-3 border-b border-[#2a2436]/60 transition-all flex items-start gap-2.5",
                      isActive
                        ? "bg-[#a020f0]/15 border-l-2 border-l-[#a020f0]"
                        : "hover:bg-[#a020f0]/5"
                    )}
                  >
                    <div
                      className={cn(
                        "h-8 w-8 shrink-0 rounded-full flex items-center justify-center font-pixel text-[9px] uppercase",
                        isActive
                          ? "bg-[#a020f0]/30 text-[#c44bff] border border-[#a020f0]"
                          : "bg-[#1a1620] text-[#9a93a8] border border-[#2a2436]"
                      )}
                    >
                      {c.userId.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={cn(
                            "text-xs font-semibold truncate",
                            isActive ? "text-[#e5e5e5]" : "text-zinc-300"
                          )}
                        >
                          {c.userId === "anon" ? "Guest" : c.userId}
                        </p>
                        <span className="font-pixel text-[6px] text-[#5a5266] shrink-0">
                          {formatTime(c.lastTs)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className="text-[11px] text-[#9a93a8] truncate">
                          {last ? (last.role === "cs" ? "CS: " : "") + last.text : "—"}
                        </p>
                        {c.unread > 0 && (
                          <span className="shrink-0 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-[#22c55e] text-[9px] font-bold text-black">
                            {c.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat window */}
        <div className="border-2 border-[#2a2436] bg-[#0a0a0a] pixel-corner overflow-hidden flex flex-col">
          {/* Chat header */}
          <div className="border-b-2 border-[#2a2436] px-4 py-3 flex items-center justify-between bg-[#121017]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-violet-500/30 to-violet-700/30 border border-[#a020f0]/60 flex items-center justify-center font-pixel text-[10px] uppercase text-[#c44bff]">
                {activeConvo ? activeConvo.userId.slice(0, 2).toUpperCase() : "—"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#e5e5e5] truncate">
                  {activeConvo
                    ? activeConvo.userId === "anon"
                      ? "Guest User"
                      : activeConvo.userId
                    : "Pilih percakapan"}
                </p>
                <p className="text-[10px] text-[#9a93a8]">
                  {activeConvo
                    ? `${activeConvo.messages.length} pesan • ${formatTime(activeConvo.lastTs)}`
                    : "—"}
                </p>
              </div>
            </div>
            {activeConvo && (
              <div className="flex items-center gap-1.5 shrink-0">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold",
                    activeConvo.unread > 0
                      ? "bg-red-500/15 text-red-400 border border-red-500/30"
                      : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  )}
                >
                  {activeConvo.unread > 0
                    ? `${activeConvo.unread} baru`
                    : "Sudah dibaca"}
                </span>
              </div>
            )}
          </div>

          {/* Messages */}
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto akuma-scroll px-3 py-4 space-y-1"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 30%, rgba(160,32,240,0.04) 0, transparent 60%), radial-gradient(circle at 80% 70%, rgba(34,197,94,0.04) 0, transparent 60%)",
            }}
          >
            {!activeConvo ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-6">
                <MessageSquare className="size-10 text-[#5a5266]" />
                <p className="mt-3 font-pixel text-[8px] uppercase text-[#9a93a8]">
                  Pilih percakapan
                </p>
                <p className="mt-1 text-xs text-[#5a5266] max-w-[220px]">
                  Pilih salah satu percakapan dari sidebar kiri untuk mulai
                  membalas pengunjung.
                </p>
              </div>
            ) : activeMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-6">
                <MessageCircle className="size-8 text-[#5a5266]" />
                <p className="mt-2 text-xs text-[#9a93a8]">
                  Belum ada pesan dalam percakapan ini.
                </p>
              </div>
            ) : (
              activeMessages.map((m, idx) => {
                const prev = idx > 0 ? activeMessages[idx - 1] : null;
                const showDateSeparator =
                  !prev || !sameDay(prev.ts, m.ts);
                const isUser = m.role === "user";
                return (
                  <div key={m.id}>
                    {showDateSeparator && (
                      <div className="flex justify-center my-3">
                        <span className="font-pixel text-[7px] uppercase tracking-wide text-[#5a5266] bg-[#121017] border border-[#2a2436] px-2 py-1 rounded-full">
                          {formatDate(m.ts)}
                        </span>
                      </div>
                    )}
                    <div
                      className={cn(
                        "flex items-end gap-1.5",
                        isUser ? "justify-end" : "justify-start"
                      )}
                    >
                      {!isUser && (
                        <div className="h-6 w-6 shrink-0 rounded-full bg-[#1a1620] border border-[#a020f0]/60 flex items-center justify-center font-pixel text-[7px] text-[#c44bff]">
                          CS
                        </div>
                      )}
                      <div
                        className={cn(
                          "max-w-[78%] sm:max-w-[70%] px-3 py-2 text-sm leading-relaxed break-words shadow-sm",
                          isUser
                            ? "bg-gradient-to-br from-[#22c55e] to-[#16a34a] text-black rounded-2xl rounded-br-sm"
                            : "bg-[#1a1620] border border-[#2a2436] text-zinc-100 rounded-2xl rounded-bl-sm"
                        )}
                      >
                        <p className="whitespace-pre-wrap">{m.text}</p>
                        <div
                          className={cn(
                            "flex items-center justify-end gap-1 mt-0.5",
                            isUser ? "text-black/60" : "text-[#5a5266]"
                          )}
                        >
                          <span className="font-pixel text-[6px]">
                            {formatTime(m.ts)}
                          </span>
                          {!isUser &&
                            (m.read ? (
                              <CheckCheck className="size-3 text-[#22d3ee]" />
                            ) : (
                              <Check className="size-3" />
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t-2 border-[#2a2436] bg-[#121017] p-3">
            {activeConvo ? (
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder={`Balas ke ${
                    activeConvo.userId === "anon" ? "Guest" : activeConvo.userId
                  } sebagai ${settings.csName || "CS"}...`}
                  className="flex-1 min-w-0 resize-none bg-[#0a0a0a] border-2 border-[#2a2436] focus:border-[#a020f0]/60 rounded-xl px-3 py-2.5 text-sm text-zinc-100 placeholder:text-[#5a5266] outline-none transition-colors max-h-24"
                  style={{ minHeight: "42px" }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  aria-label="Kirim pesan"
                  className={cn(
                    "shrink-0 h-10 w-10 flex items-center justify-center rounded-xl border-2 transition-all",
                    input.trim()
                      ? "bg-[#a020f0] border-[#a020f0] text-white hover:bg-[#c44bff] shadow-[0_0_12px_rgba(160,32,240,0.4)]"
                      : "bg-transparent border-[#2a2436] text-[#5a5266] cursor-not-allowed"
                  )}
                >
                  <Send className="size-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center py-2">
                <p className="text-xs text-[#5a5266]">
                  Pilih percakapan untuk mulai membalas
                </p>
              </div>
            )}
            <p className="mt-1.5 text-[10px] text-[#5a5266] text-center">
              Enter untuk kirim • Shift+Enter untuk baris baru
            </p>
          </div>
        </div>
      </div>

      {/* Info footer */}
      <div className="glass rounded-2xl p-4 border-violet-500/20">
        <div className="flex items-start gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 border border-violet-500/30">
            <MessageSquare className="size-3.5 text-violet-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-zinc-400 leading-relaxed">
              Pesan yang dikirim dari halaman ini akan tercatat sebagai balasan CS
              ({settings.csName || "CS"}) dan otomatis sync ke pengunjung yang
              sedang online via auto-sync.
            </p>
            <p className="mt-1 text-[10px] text-zinc-500">
              Total pesan tersimpan: {chatMessages.length} / 200
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
