"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";
import { PixelButton } from "@/components/akuma/pixel-button";
import { useToast } from "@/hooks/use-toast";
import { Lock, User, Gamepad2, ShieldCheck, Zap, Star, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const ok = await login(username.trim(), password);
    setLoading(false);
    if (ok) {
      toast({ title: "Login berhasil!", description: "Selamat datang!" });
      router.replace("/admin");
    } else {
      toast({ title: "Login gagal", description: "Username atau password salah.", variant: "destructive" });
    }
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#07090f]">
      {/* Background gradient */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse 60% 40% at 30% 50%, rgba(139,92,246,0.12), transparent 70%), radial-gradient(ellipse 40% 30% at 80% 80%, rgba(34,211,238,0.06), transparent 70%)",
      }} />
      <div className="absolute inset-0 bg-grid opacity-20" />

      {/* LEFT: Illustration / Brand (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-center items-center px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-md text-center"
        >
          {/* Logo */}
          <div className="mx-auto mb-6 flex h-20 w-32 items-center justify-center float-slow">
            <img src="/akuma-logo.png" alt="AKUMA JOKI" className="h-full w-full object-contain" />
          </div>

          {/* Brand text */}
          <h1 className="text-4xl font-bold text-gradient mb-3">AKUMA JOKI</h1>
          <p className="text-lg text-zinc-400 mb-8">Joki & Store Roblox Terpercaya</p>

          {/* Features */}
          <div className="space-y-4 text-left">
            {[
              { icon: ShieldCheck, title: "Aman & Terpercaya", desc: "Akun ditangani joki profesional" },
              { icon: Zap, title: "Proses Cepat", desc: "Mulai dalam 5 menit" },
              { icon: Star, title: "Rating 5 Bintang", desc: "Ribuan order selesai" },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.15 }}
                className="flex items-center gap-3 glass rounded-2xl p-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 border border-violet-500/30">
                  <f.icon className="size-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-100">{f.title}</p>
                  <p className="text-xs text-zinc-500">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 flex justify-center gap-8"
          >
            <div><p className="text-2xl font-bold text-gradient">1.2K+</p><p className="text-xs text-zinc-600">Order</p></div>
            <div><p className="text-2xl font-bold text-gradient">24/7</p><p className="text-xs text-zinc-600">Support</p></div>
            <div><p className="text-2xl font-bold text-gradient">100%</p><p className="text-xs text-zinc-600">Aman</p></div>
          </motion.div>
        </motion.div>
      </div>

      {/* RIGHT: Login Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-4 sm:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-3 flex h-16 w-24 items-center justify-center">
              <img src="/akuma-logo.png" alt="AKUMA JOKI" className="h-full w-full object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-gradient">AKUMA JOKI</h1>
            <p className="mt-1 text-xs text-zinc-500 uppercase tracking-widest">Admin Panel</p>
          </div>

          {/* Desktop heading */}
          <div className="hidden lg:block mb-8">
            <p className="text-xs text-violet-400 uppercase tracking-widest mb-2">Admin Panel</p>
            <h2 className="text-3xl font-bold text-zinc-100">Welcome Back</h2>
            <p className="mt-2 text-sm text-zinc-500">Sign in to manage your dashboard</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="glass-strong rounded-3xl p-6 sm:p-8 space-y-5">
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <User className="size-3 text-violet-400" /> Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                autoFocus
                required
                className="mt-2 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-violet-500/40 transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="size-3 text-violet-400" /> Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="mt-2 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-violet-500/40 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-5 py-3 text-sm font-medium text-white hover:from-violet-500 hover:to-violet-400 transition-all disabled:opacity-50 btn-shine"
            >
              {loading ? "Loading..." : <>Sign In <ArrowRight className="size-4" /></>}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-zinc-600">
            Authorized personnel only · AKUMA JOKI © 2026
          </p>
        </motion.div>
      </div>
    </div>
  );
}
