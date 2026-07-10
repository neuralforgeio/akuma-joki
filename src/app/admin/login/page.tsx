"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";
import { PixelButton } from "@/components/akuma/pixel-button";
import { useToast } from "@/hooks/use-toast";
import { Lock, User, Gamepad2 } from "lucide-react";

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
      toast({ title: "Login berhasil!", description: "Selamat datang admin." });
      router.replace("/admin");
    } else {
      toast({
        title: "Login gagal",
        description: "Username atau password salah.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a0a] px-4">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute inset-0 scanlines" />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center border-2 border-[#a020f0] pixel-corner bg-[#121017] shadow-[0_0_22px_rgba(160,32,240,0.5)]">
            <Gamepad2 className="size-7 text-[#c44bff]" />
          </div>
          <h1 className="font-pixel text-lg text-[#e5e5e5] text-glow-neon">
            AKUMA JOKI
          </h1>
          <p className="mt-2 font-pixel text-[8px] uppercase tracking-widest text-[#9a93a8]">
            Admin Panel
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="border-2 border-[#a020f0]/50 bg-[#121017] pixel-corner p-6 space-y-4"
        >
          <div>
            <label className="font-pixel text-[8px] uppercase tracking-wide text-[#9a93a8] flex items-center gap-2">
              <User className="size-3 text-[#c44bff]" />
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="dearlyfebriano"
              autoFocus
              required
              className="mt-2 w-full bg-[#0a0a0a] border-2 border-[#2a2436] focus:border-[#a020f0] text-[#e5e5e5] placeholder:text-[#5a5266] px-4 py-3 text-sm pixel-corner outline-none transition-colors"
            />
          </div>

          <div>
            <label className="font-pixel text-[8px] uppercase tracking-wide text-[#9a93a8] flex items-center gap-2">
              <Lock className="size-3 text-[#c44bff]" />
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="mt-2 w-full bg-[#0a0a0a] border-2 border-[#2a2436] focus:border-[#a020f0] text-[#e5e5e5] placeholder:text-[#5a5266] px-4 py-3 text-sm pixel-corner outline-none transition-colors"
            />
          </div>

          <PixelButton type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? "MEMUAT..." : "LOGIN"}
          </PixelButton>
        </form>

        <p className="mt-4 text-center font-pixel text-[7px] uppercase tracking-wide text-[#5a5266]">
          Hanya untuk admin AKUMA JOKI
        </p>
      </div>
    </div>
  );
}
