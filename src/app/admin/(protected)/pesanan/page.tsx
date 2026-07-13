"use client";

import { useAdminStore } from "@/lib/admin-store";
import { PixelButton } from "@/components/akuma/pixel-button";
import { useToast } from "@/hooks/use-toast";
import { Package, Trash2, MessageCircle } from "lucide-react";
import { WHATSAPP_NUMBER } from "@/lib/games-data";
import type { Order } from "@/lib/admin-store";

const STATUS_COLORS: Record<Order["status"], { bg: string; text: string; border: string }> = {
  new: { bg: "bg-[#7fd4ff]/10", text: "text-[#7fd4ff]", border: "border-[#7fd4ff]/40" },
  processing: { bg: "bg-[#ffd166]/10", text: "text-[#ffd166]", border: "border-[#ffd166]/40" },
  done: { bg: "bg-[#6ee7b7]/10", text: "text-[#6ee7b7]", border: "border-[#6ee7b7]/40" },
  cancelled: { bg: "bg-[#ff3b6b]/10", text: "text-[#ff3b6b]", border: "border-[#ff3b6b]/40" },
};

export default function PesananPage() {
  const orders = useAdminStore((s) => s.orders);
  const updateOrderStatus = useAdminStore((s) => s.updateOrderStatus);
  const deleteOrder = useAdminStore((s) => s.deleteOrder);
  const { toast } = useToast();

  const handleStatus = (id: string, status: Order["status"]) => {
    updateOrderStatus(id, status);
    toast({ title: `Status → ${status}` });
  };

  const handleWA = (o: Order) => {
    const msg = `Halo! Order ${o.productName} (${o.gameName})\nUsername: ${o.username}\nStatus: ${o.status}`;
    const a = document.createElement("a");
    a.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-pixel text-base sm:text-lg text-[#e5e5e5] text-glow-neon">
          PESANAN
        </h1>
        <p className="mt-1 text-sm text-[#9a93a8]">
          Inbox order dari checkout ({orders.length} total).
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <Package className="mx-auto size-12 text-[#2a2436]" />
          <p className="mt-4 font-pixel text-[9px] uppercase text-[#9a93a8]">
            Belum ada pesanan
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const sc = STATUS_COLORS[o.status];
            return (
              <div key={o.id} className="border-2 border-[#2a2436] bg-[#121017] pixel-corner p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`font-pixel text-[7px] uppercase px-2 py-1 pixel-corner border-2 ${sc.bg} ${sc.text} ${sc.border}`}>
                        {o.status}
                      </span>
                      <span className="font-pixel text-[6px] text-[#5a5266]">
                        {new Date(o.createdAt).toLocaleString("id-ID")}
                      </span>
                    </div>
                    <p className="text-sm text-[#e5e5e5]">
                      <span className="text-[#c44bff]">{o.productName}</span> — {o.gameName}
                    </p>
                    <p className="text-xs text-[#9a93a8] mt-1">
                      Username: <span className="text-[#e5e5e5]">{o.username}</span>
                    </p>
                    <p className="text-xs text-[#9a93a8]">
                      Password: <span className="text-[#e5e5e5]">{o.password}</span>
                    </p>
                    {o.customerWA && (
                      <p className="text-xs text-[#9a93a8]">WA: {o.customerWA}</p>
                    )}
                    <p className="font-pixel text-[8px] text-[#6ee7b7] mt-1">{o.priceLabel}</p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <select
                      value={o.status}
                      onChange={(e) => handleStatus(o.id, e.target.value as Order["status"])}
                      className="bg-[#0a0a0a] border-2 border-[#2a2436] text-[#e5e5e5] px-2 py-1 text-xs pixel-corner outline-none focus:border-[#a020f0]"
                    >
                      <option value="new">New</option>
                      <option value="processing">Processing</option>
                      <option value="done">Done</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <button
                      onClick={() => handleWA(o)}
                      className="flex items-center gap-1 font-pixel text-[7px] uppercase text-[#25D366] border-2 border-[#25D366]/40 px-2 py-1 pixel-corner hover:bg-[#25D366]/10"
                    >
                      <MessageCircle className="size-3" /> WA
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Hapus pesanan ini?")) deleteOrder(o.id);
                      }}
                      className="flex items-center gap-1 font-pixel text-[7px] uppercase text-[#ff3b6b] border-2 border-[#ff3b6b]/40 px-2 py-1 pixel-corner hover:bg-[#ff3b6b]/10"
                    >
                      <Trash2 className="size-3" /> Hapus
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
