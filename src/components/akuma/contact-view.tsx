"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Bug, Lightbulb, HelpCircle, AlertTriangle, Send,
  MessageCircle, Clock, Mail, ShieldCheck, CheckCircle2,
} from "lucide-react";
import { WHATSAPP_NUMBER } from "@/lib/games-data";
import { useAdminStore } from "@/lib/admin-store";
import { Reveal } from "./reveal";
import { Starfield, MovingGrid } from "./backgrounds";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type ReportType = "bug" | "suggestion" | "question" | "complaint";

const REPORT_TYPES: { id: ReportType; label: string; icon: typeof Bug; color: string; desc: string }[] = [
  { id: "bug", label: "Bug Report", icon: Bug, color: "#ef4444", desc: "Lapork error / fitur tidak jalan" },
  { id: "suggestion", label: "Saran", icon: Lightbulb, color: "#fbbf24", desc: "Usul fitur / perbaikan" },
  { id: "question", label: "Pertanyaan", icon: HelpCircle, color: "#22d3ee", desc: "Tanya seputar layanan" },
  { id: "complaint", label: "Keluhan", icon: AlertTriangle, color: "#f97316", desc: "Komplain order / service" },
];

const REPORTS_KEY = "akuma-contact-reports";

type StoredReport = {
  id: string;
  name: string;
  contact: string;
  type: ReportType;
  subject: string;
  description: string;
  page: string;
  status: "new" | "read" | "resolved";
  createdAt: number;
};

export function ContactView() {
  const settings = useAdminStore((s) => s.settings);
  const hydrated = useAdminStore((s) => s._hasHydrated);
  const waNumber = hydrated ? settings.whatsappNumber : WHATSAPP_NUMBER;
  const csName = hydrated ? settings.csName : "Akuma Joki";
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [type, setType] = useState<ReportType>("bug");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !subject.trim() || !description.trim()) {
      toast({ title: "Lengkapi nama, subjek, dan deskripsi", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const report: StoredReport = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
        name: name.trim(),
        contact: contact.trim(),
        type,
        subject: subject.trim(),
        description: description.trim(),
        page: typeof window !== "undefined" ? window.location.href : "",
        status: "new",
        createdAt: Date.now(),
      };
      const existing: StoredReport[] = JSON.parse(localStorage.getItem(REPORTS_KEY) || "[]");
      existing.unshift(report);
      localStorage.setItem(REPORTS_KEY, JSON.stringify(existing.slice(0, 100)));

      setSubmitted(true);
      toast({ title: "Laporan terkirim! Terima kasih 🙏" });
      setName(""); setContact(""); setSubject(""); setDescription("");
      setType("bug");
    } catch {
      toast({ title: "Gagal menyimpan laporan", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendWA = () => {
    if (!name.trim() || !subject.trim() || !description.trim()) {
      toast({ title: "Lengkapi form dulu sebelum kirim WA", variant: "destructive" });
      return;
    }
    const typeLabel = REPORT_TYPES.find((t) => t.id === type)?.label || type;
    const text =
      `*${typeLabel.toUpperCase()} — AKUMA JOKI*\n\n` +
      `Nama: ${name}\n` +
      `Kontak: ${contact || "-"}\n` +
      `Subjek: ${subject}\n\n` +
      `Deskripsi:\n${description}\n\n` +
      `Halaman: ${typeof window !== "undefined" ? window.location.href : "-"}`;
    const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="relative min-h-screen overflow-hidden pb-16">
      <Starfield />
      <MovingGrid />

      {/* Hero */}
      <section className="relative mx-auto max-w-4xl px-4 sm:px-6 pt-12 sm:pt-20 pb-8 text-center">
        <Reveal>
          <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 mb-5">
            <Bug className="size-3.5 text-violet-400" />
            <span className="text-[10px] sm:text-xs font-pixel uppercase tracking-widest text-violet-400">
              Contact & Report
            </span>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <h1 className="font-pixel text-3xl sm:text-5xl md:text-6xl leading-tight text-gradient">
            Hubungi <span className="text-violet-400 ml-3">Kami</span>
          </h1>
        </Reveal>
        <Reveal delay={250}>
          <p className="mt-5 text-sm sm:text-base text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            Ada bug, saran, atau pertanyaan? Laporan kamu sangat berarti buat kami.
            Tim AKUMA JOKI akan respon secepat mungkin.
          </p>
        </Reveal>
      </section>

      <section className="relative mx-auto max-w-5xl px-4 sm:px-6 grid lg:grid-cols-5 gap-6">
        {/* Form */}
        <Reveal className="lg:col-span-3">
          <div className="glass-strong rounded-3xl p-6 sm:p-8">
            {submitted ? (
              <div className="py-10 text-center">
                <motion.div
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", duration: 0.6 }}
                  className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15 border border-green-500/30"
                >
                  <CheckCircle2 className="size-8 text-green-400" />
                </motion.div>
                <h3 className="text-lg font-semibold text-zinc-100 mb-1">Laporan Terkirim!</h3>
                <p className="text-sm text-zinc-500 mb-5">Terima kasih sudah membantu AKUMA JOKI jadi lebih baik.</p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-5 py-2.5 text-sm text-zinc-300 hover:bg-white/10 transition-all"
                >
                  Kirim Laporan Lagi
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-sm font-pixel uppercase tracking-widest text-violet-400 mb-2">Form Laporan</h2>

                {/* Type selector */}
                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">Jenis Laporan</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {REPORT_TYPES.map((t) => {
                      const Icon = t.icon;
                      const active = type === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setType(t.id)}
                          className={cn(
                            "flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all",
                            active ? "border-violet-500/40 bg-violet-500/10" : "border-white/8 bg-white/3 hover:border-white/15"
                          )}
                          style={active ? { boxShadow: `0 0 0 1px ${t.color}30` } : {}}
                        >
                          <Icon className="size-5" style={{ color: t.color }} />
                          <span className={cn("text-[10px] font-medium", active ? "text-zinc-100" : "text-zinc-400")}>
                            {t.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-[10px] text-zinc-600">{REPORT_TYPES.find((t) => t.id === type)?.desc}</p>
                </div>

                {/* Name + Contact */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5 block">Nama *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nama kamu"
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-violet-500/40 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5 block">Kontak (opsional)</label>
                    <input
                      type="text"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="WA / IG / email"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-violet-500/40 transition-colors"
                    />
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5 block">Subjek *</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Ringkasan singkat"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-violet-500/40 transition-colors"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5 block">Deskripsi *</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Jelaskan detail laporan kamu... (langkah reproduksi bug, kondisi, dll)"
                    required
                    rows={5}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-violet-500/40 transition-colors resize-none"
                  />
                </div>

                {/* Submit buttons */}
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-5 py-2.5 text-sm font-medium text-white hover:from-violet-500 hover:to-violet-400 transition-all shadow-[0_4px_20px_-4px_rgba(139,92,246,0.5)] disabled:opacity-60"
                  >
                    <Send className="size-4" /> Kirim Laporan
                  </button>
                  <button
                    type="button"
                    onClick={handleSendWA}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-500/10 border border-green-500/30 px-5 py-2.5 text-sm text-green-400 hover:bg-green-500/20 transition-all"
                  >
                    <MessageCircle className="size-4" /> Kirim via WhatsApp
                  </button>
                </div>
                <p className="text-[10px] text-zinc-600 pt-1">
                  Laporan disimpan lokal & dikirim ke admin. Untuk respon cepat, gunakan WhatsApp.
                </p>
              </form>
            )}
          </div>
        </Reveal>

        {/* Contact info */}
        <Reveal delay={150} className="lg:col-span-2">
          <div className="space-y-4">
            <div className="glass rounded-2xl p-5">
              <h3 className="text-xs font-pixel uppercase tracking-widest text-violet-400 mb-3">Info Kontak</h3>
              <a
                href={`https://wa.me/${waNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3 hover:bg-green-500/20 transition-all"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                  <MessageCircle className="size-5 text-green-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase text-zinc-500 tracking-wider">WhatsApp Admin</p>
                  <p className="text-sm text-zinc-100 truncate">{csName}</p>
                </div>
              </a>
            </div>

            <div className="glass rounded-2xl p-5">
              <h3 className="text-xs font-pixel uppercase tracking-widest text-violet-400 mb-3">Jam Operasional</h3>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/15 border border-violet-500/20">
                  <Clock className="size-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm text-zinc-100">16 Jam / Hari</p>
                  <p className="text-[10px] text-zinc-500">08.00 - 24.00 WIB</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/15 border border-violet-500/20">
                  <Mail className="size-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm text-zinc-100">Email</p>
                  <p className="text-[10px] text-zinc-500">akumajoki@gmail.com</p>
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl p-5 border-violet-500/20">
              <div className="flex items-center gap-3 mb-2">
                <ShieldCheck className="size-5 text-violet-400" />
                <h3 className="text-sm font-semibold text-zinc-100">Privasi Laporan</h3>
              </div>
              <ul className="space-y-1.5 text-[11px] text-zinc-500">
                <li>• Data laporan disimpan lokal di browser kamu</li>
                <li>• Hanya admin AKUMA JOKI yang bisa lihat</li>
                <li>• Tidak perlu login untuk kirim laporan</li>
                <li>• Untuk respon cepat, kirim via WhatsApp</li>
              </ul>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
