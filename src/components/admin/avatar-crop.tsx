"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Upload, Check, X, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { confirmAction } from "@/lib/confirm-modal";

/**
 * AvatarCrop — component upload + crop foto profile (circle crop).
 * Admin upload foto → preview dengan zoom & drag → crop → simpan base64.
 *
 * - Upload via file input atau drag & drop
 * - Canvas-based crop (circle, 256x256 output)
 * - Zoom in/out, rotate
 * - Drag untuk reposition
 * - Preview hasil crop real-time
 * - Simpan sebagai base64 data URL
 */
export function AvatarCrop({
  currentAvatar,
  onSave,
  label = "Foto Profile CS",
}: {
  currentAvatar?: string;
  onSave: (dataUrl: string) => void;
  label?: string;
}) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Handle file upload
  const handleFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      confirmAction({
        title: "File Terlalu Besar",
        message: "Ukuran file maksimal 5MB.",
        variant: "warning",
        confirmLabel: "OK",
        cancelLabel: "Tutup",
        onConfirm: () => {},
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
  };

  // Draw canvas function (defined before effects that use it)
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const size = 256;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, size, size);

    // Save context state
    ctx.save();

    // Clip to circle
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();

    // Fill background
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, size, size);

    // Calculate dimensions to cover the circle
    const imgRatio = img.width / img.height;
    let drawW = size * zoom;
    let drawH = size * zoom;
    if (imgRatio > 1) {
      drawH = size * zoom;
      drawW = drawH * imgRatio;
    } else {
      drawW = size * zoom;
      drawH = drawW / imgRatio;
    }

    // Center + offset
    const dx = (size - drawW) / 2 + offset.x;
    const dy = (size - drawH) / 2 + offset.y;

    // Rotate around center
    ctx.translate(size / 2, size / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-size / 2, -size / 2);

    ctx.drawImage(img, dx, dy, drawW, drawH);
    ctx.restore();

    // Draw circle border
    ctx.strokeStyle = "rgba(139, 92, 246, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
    ctx.stroke();
  }, [zoom, rotation, offset]);

  // Load image to ref
  useEffect(() => {
    if (!imageSrc) { imgRef.current = null; return; }
    const img = new Image();
    img.onload = () => { imgRef.current = img; drawCanvas(); };
    img.src = imageSrc;
  }, [imageSrc, drawCanvas]);

  // Redraw on zoom/rotation/offset change
  useEffect(() => {
    if (imgRef.current) drawCanvas();
  }, [zoom, rotation, offset, drawCanvas]);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!imageSrc) return;
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const handleMouseUp = () => setDragging(false);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!imageSrc || !e.touches[0]) return;
    setDragging(true);
    setDragStart({ x: e.touches[0].clientX - offset.x, y: e.touches[0].clientY - offset.y });
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragging || !e.touches[0]) return;
    setOffset({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y });
  };

  // Save cropped image
  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    onSave(dataUrl);
    setImageSrc(null);
  };

  const handleCancel = () => {
    setImageSrc(null);
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div className="space-y-3">
      <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{label}</label>

      {/* Current avatar or upload button */}
      {!imageSrc && (
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 rounded-full overflow-hidden border-2 border-violet-500/30 bg-white/5 shrink-0">
            {currentAvatar ? (
              <img src={currentAvatar} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-violet-400">
                AJ
              </div>
            )}
          </div>
          <div className="flex-1">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/10 hover:border-violet-500/30 transition-all"
            >
              <Upload className="size-4" /> Upload Foto
            </button>
            {currentAvatar && (
              <button
                type="button"
                onClick={() => onSave("")}
                className="ml-2 text-xs text-red-400 hover:text-red-300"
              >
                Hapus
              </button>
            )}
            <p className="text-[10px] text-zinc-600 mt-1.5">Max 5MB · PNG/JPG · akan di-crop circular</p>
          </div>
        </div>
      )}

      {/* Crop editor */}
      {imageSrc && (
        <div className="space-y-3">
          {/* Canvas preview */}
          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              width={256}
              height={256}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUp}
              className="rounded-full cursor-move touch-none"
              style={{ width: 200, height: 200 }}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10"
            >
              <ZoomOut className="size-4" />
            </button>
            <span className="text-xs text-zinc-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10"
            >
              <ZoomIn className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10"
            >
              <RotateCw className="size-4" />
            </button>
          </div>

          {/* Save / Cancel */}
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-2 text-sm text-white hover:from-violet-500 hover:to-violet-400 transition-all"
            >
              <Check className="size-4" /> Simpan Crop
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/10 transition-all"
            >
              <X className="size-4" /> Batal
            </button>
          </div>

          <p className="text-center text-[10px] text-zinc-600">Drag untuk reposition · zoom & rotate untuk sesuaikan</p>
        </div>
      )}
    </div>
  );
}
