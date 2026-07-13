"use client";

import { useState, useRef } from "react";
import { useAdminStore } from "@/lib/admin-store";
import { useToast } from "@/hooks/use-toast";
import { FileImage, Upload, Trash2, Download } from "lucide-react";

export default function ArtifactPage() {
  const artifacts = useAdminStore((s) => s.artifacts);
  const addArtifact = useAdminStore((s) => s.addArtifact);
  const deleteArtifact = useAdminStore((s) => s.deleteArtifact);
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File terlalu besar",
          description: `${file.name} > 2MB (localStorage limit)`,
          variant: "destructive",
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        addArtifact({
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    });
    toast({ title: "Artifact diupload!" });
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDownload = (name: string, dataUrl: string) => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-pixel text-base sm:text-lg text-[#e5e5e5] text-glow-neon">
          ARTIFACT
        </h1>
        <p className="mt-1 text-sm text-[#9a93a8]">
          Upload & kelola file (gambar, dokumen). Disimpan di localStorage (max 2MB/file).
        </p>
      </div>

      {/* upload */}
      <div className="border-2 border-dashed border-[#a020f0]/40 bg-[#121017] pixel-corner p-8 text-center">
        <input
          ref={fileRef}
          type="file"
          multiple
          onChange={handleUpload}
          className="hidden"
          accept="image/*,.pdf,.txt,.json,.md"
        />
        <FileImage className="mx-auto size-8 text-[#a020f0]" />
        <p className="mt-3 font-pixel text-[8px] uppercase text-[#9a93a8]">
          Drag file atau klik untuk upload
        </p>
        <button
          onClick={() => fileRef.current?.click()}
          className="mt-4 inline-flex items-center gap-2 font-pixel text-[8px] uppercase text-[#c44bff] border-2 border-[#a020f0] px-4 py-2 pixel-corner hover:bg-[#a020f0]/10"
        >
          <Upload className="size-3" /> Pilih File
        </button>
      </div>

      {/* list */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {artifacts.map((a) => (
          <div key={a.id} className="border-2 border-[#2a2436] bg-[#121017] pixel-corner p-3">
            <div className="flex items-start gap-3">
              {a.type.startsWith("image/") ? (
                <img
                  src={a.dataUrl}
                  alt={a.name}
                  className="h-12 w-12 object-cover border border-[#2a2436] pixel-corner"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center border border-[#2a2436] pixel-corner bg-[#0a0a0a]">
                  <FileImage className="size-5 text-[#9a93a8]" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs text-[#e5e5e5] truncate">{a.name}</p>
                <p className="font-pixel text-[6px] text-[#5a5266] mt-0.5">
                  {formatSize(a.size)} · {a.type || "file"}
                </p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => handleDownload(a.name, a.dataUrl)}
                className="flex-1 flex items-center justify-center gap-1 font-pixel text-[7px] uppercase text-[#7fd4ff] border-2 border-[#7fd4ff]/40 py-1.5 pixel-corner hover:bg-[#7fd4ff]/10"
              >
                <Download className="size-3" /> Unduh
              </button>
              <button
                onClick={() => {
                  if (confirm("Hapus artifact?")) deleteArtifact(a.id);
                }}
                className="flex items-center justify-center border-2 border-[#ff3b6b]/40 text-[#ff3b6b] px-2 py-1.5 pixel-corner hover:bg-[#ff3b6b]/10"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {artifacts.length === 0 && (
        <p className="font-pixel text-[7px] uppercase text-[#5a5266] text-center py-8">
          Belum ada artifact
        </p>
      )}
    </div>
  );
}
