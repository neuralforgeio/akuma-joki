"use client";

import { useState } from "react";
import { useAdminStore } from "@/lib/admin-store";
import { PixelButton } from "@/components/akuma/pixel-button";
import { useToast } from "@/hooks/use-toast";
import { HelpCircle, Plus, Trash2, Save, Edit3 } from "lucide-react";

export default function FAQPage() {
  const faq = useAdminStore((s) => s.faq);
  const addFAQ = useAdminStore((s) => s.addFAQ);
  const updateFAQ = useAdminStore((s) => s.updateFAQ);
  const deleteFAQ = useAdminStore((s) => s.deleteFAQ);
  const { toast } = useToast();
  const [form, setForm] = useState({ question: "", answer: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ question: "", answer: "" });

  const handleAdd = () => {
    if (!form.question || !form.answer) {
      toast({ title: "Lengkapi Q&A", variant: "destructive" });
      return;
    }
    addFAQ(form.question, form.answer);
    setForm({ question: "", answer: "" });
    toast({ title: "FAQ ditambahkan!" });
  };

  const handleSaveEdit = (id: string) => {
    updateFAQ(id, editForm.question, editForm.answer);
    setEditId(null);
    toast({ title: "FAQ diupdate!" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-pixel text-base sm:text-lg text-[#e5e5e5] text-glow-neon">
          FAQ MANAGER
        </h1>
        <p className="mt-1 text-sm text-[#9a93a8]">
          Kelola Frequently Asked Questions untuk auto-reply.
        </p>
      </div>

      {/* add form */}
      <div className="border-2 border-[#a020f0]/50 bg-[#121017] pixel-corner p-5 space-y-3 max-w-2xl">
        <h2 className="font-pixel text-[9px] uppercase text-[#c44bff]">Tambah FAQ</h2>
        <input
          type="text"
          value={form.question}
          onChange={(e) => setForm({ ...form, question: e.target.value })}
          placeholder="Pertanyaan..."
          className="w-full bg-[#0a0a0a] border-2 border-[#2a2436] focus:border-[#a020f0] text-[#e5e5e5] px-4 py-2 text-sm pixel-corner outline-none"
        />
        <textarea
          value={form.answer}
          onChange={(e) => setForm({ ...form, answer: e.target.value })}
          placeholder="Jawaban..."
          rows={2}
          className="w-full bg-[#0a0a0a] border-2 border-[#2a2436] focus:border-[#a020f0] text-[#e5e5e5] px-4 py-2 text-sm pixel-corner outline-none resize-none"
        />
        <PixelButton size="sm" onClick={handleAdd}>
          <Plus className="size-3" /> Tambah
        </PixelButton>
      </div>

      {/* FAQ list */}
      <div className="space-y-3">
        {faq.length === 0 ? (
          <div className="text-center py-8">
            <HelpCircle className="mx-auto size-8 text-[#2a2436]" />
            <p className="mt-3 font-pixel text-[7px] uppercase text-[#5a5266]">
              Belum ada FAQ
            </p>
          </div>
        ) : (
          faq.map((f) => (
            <div key={f.id} className="border-2 border-[#2a2436] bg-[#121017] pixel-corner p-4">
              {editId === f.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editForm.question}
                    onChange={(e) => setEditForm({ ...editForm, question: e.target.value })}
                    className="w-full bg-[#0a0a0a] border-2 border-[#2a2436] text-[#e5e5e5] px-3 py-2 text-sm pixel-corner outline-none focus:border-[#a020f0]"
                  />
                  <textarea
                    value={editForm.answer}
                    onChange={(e) => setEditForm({ ...editForm, answer: e.target.value })}
                    rows={2}
                    className="w-full bg-[#0a0a0a] border-2 border-[#2a2436] text-[#e5e5e5] px-3 py-2 text-xs pixel-corner outline-none focus:border-[#a020f0] resize-none"
                  />
                  <div className="flex gap-2">
                    <PixelButton size="sm" onClick={() => handleSaveEdit(f.id)}>
                      <Save className="size-3" /> Simpan
                    </PixelButton>
                    <PixelButton size="sm" variant="silver" onClick={() => setEditId(null)}>
                      Batal
                    </PixelButton>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <HelpCircle className="size-4 text-[#c44bff] shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#e5e5e5] font-semibold">{f.question}</p>
                    <p className="text-xs text-[#bcb4c9] mt-1">{f.answer}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setEditId(f.id);
                        setEditForm({ question: f.question, answer: f.answer });
                      }}
                      className="text-[#9a93a8] hover:text-[#c44bff] p-1"
                    >
                      <Edit3 className="size-3" />
                    </button>
                    <button
                      onClick={() => deleteFAQ(f.id)}
                      className="text-[#ff3b6b] hover:scale-110 transition-transform p-1"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
