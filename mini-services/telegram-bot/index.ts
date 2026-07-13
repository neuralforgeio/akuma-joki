/**
 * AKUMA JOKI — Telegram Bot Mini-Service
 * ----------------------------------------
 * Port: 3004 (hardcoded, required by gateway convention)
 *
 * Fungsi:
 *  - Long-polling Telegram getUpdates
 *  - Untuk setiap pesan masuk, balas menggunakan model GLM (z-ai-web-dev-sdk)
 *  - Per-chat conversation history (in-memory, trim 20 pesan)
 *  - HTTP control API untuk admin dashboard:
 *      GET  /            -> status (token masked)
 *      POST /config      -> simpan token + persona + settings, hot-reload
 *      POST /start       -> mulai polling
 *      POST /stop        -> hentikan polling
 *      GET  /logs        -> log terbaru
 *      POST /test        -> kirim pesan uji ke chatId
 *      POST /clear       -> hapus history sebuah chat
 *      GET  /chats       -> daftar chat aktif + ringkasan
 *
 * Security:
 *  - Token TIDAK pernah dikembalikan plain via HTTP (hanya masked).
 *  - config.json disimpan lokal (gitignored).
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = join(__dirname, "config.json");
const PORT = 3004;

const TELEGRAM_API = "https://api.telegram.org";

/* ============================ Types ============================ */
type BotConfig = {
  token: string;
  systemPrompt: string;
  welcomeEnabled: boolean;
  modelLabel: string; // tampilan saja, GLM dipakai via SDK
  adminChatIds: string[]; // whitelist opsional (kosong = semua chat diizinkan)
};

type LogEntry = {
  id: number;
  ts: number;
  kind: "info" | "msg-in" | "msg-out" | "error" | "system";
  chatId?: string;
  from?: string;
  text: string;
};

type ChatSummary = {
  chatId: string;
  from: string;
  msgCount: number;
  lastActive: number;
  preview: string;
};

/* ============================ State ============================ */
const DEFAULT_CONFIG: BotConfig = {
  token: "",
  systemPrompt:
    "Kamu adalah AKUMA, asisten AI ramah untuk AKUMA JOKI (layanan joki game). " +
    "Jawab dengan santai, singkat, dan helpful dalam Bahasa Indonesia. " +
    "Kamu bisa membantu pertanyaan seputar game, joki, dan topik umum. " +
    "Jika ditanya harga/order, arahkan ke WhatsApp admin atau website AKUMA JOKI.",
  welcomeEnabled: true,
  modelLabel: "GLM-5.2 (z-ai)",
  adminChatIds: [],
};

let config: BotConfig = loadConfig();
let running = false;
let offset = 0;
let pollingTimer: ReturnType<typeof setTimeout> | null = null;
let zaiInstance: any = null;
let botInfo: { id: number; username: string; first_name: string } | null = null;
let logIdCounter = 1;
const logs: LogEntry[] = [];
const MAX_LOGS = 200;
const conversations = new Map<string, { from: string; messages: { role: string; content: string }[]; lastActive: number }>();
const MAX_HISTORY = 20; // pesan per chat (ekslusif system)

/* ============================ Config I/O ============================ */
function loadConfig(): BotConfig {
  try {
    if (existsSync(CONFIG_PATH)) {
      const raw = readFileSync(CONFIG_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch (e) {
    console.error("Failed to load config:", e);
  }
  return { ...DEFAULT_CONFIG };
}

function saveConfig() {
  try {
    writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  } catch (e) {
    console.error("Failed to save config:", e);
  }
}

/* ============================ Logging ============================ */
function log(kind: LogEntry["kind"], text: string, extra?: { chatId?: string; from?: string }) {
  const entry: LogEntry = {
    id: logIdCounter++,
    ts: Date.now(),
    kind,
    text,
    chatId: extra?.chatId,
    from: extra?.from,
  };
  logs.push(entry);
  if (logs.length > MAX_LOGS) logs.splice(0, logs.length - MAX_LOGS);
  const prefix = `[${new Date(entry.ts).toISOString()}] [${kind.toUpperCase()}]`;
  console.log(`${prefix} ${extra?.from ? `(${extra.from}) ` : ""}${text}`);
}

/* ============================ Telegram API ============================ */
async function tgCall(method: string, body: any): Promise<any> {
  if (!config.token) throw new Error("Bot token belum diset");
  const res = await fetch(`${TELEGRAM_API}/bot${config.token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(`Telegram ${method} failed: ${data.description || res.statusText}`);
  }
  return data.result;
}

async function getBotInfo() {
  try {
    const me = await tgCall("getMe", {});
    botInfo = { id: me.id, username: me.username, first_name: me.first_name };
    log("system", `Bot terhubung: @${me.username} (${me.first_name}, id ${me.id})`);
    return me;
  } catch (e: any) {
    log("error", `Gagal getMe: ${e.message}`);
    botInfo = null;
    return null;
  }
}

async function sendMessage(chatId: string | number, text: string, replyTo?: number) {
  return tgCall("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: undefined,
    reply_to_message_id: replyTo,
    disable_web_page_preview: true,
  });
}

/* ============================ GLM (z-ai-web-dev-sdk) ============================ */
async function getZai() {
  if (zaiInstance) return zaiInstance;
  const ZAI = (await import("z-ai-web-dev-sdk")).default;
  zaiInstance = await ZAI.create();
  return zaiInstance;
}

async function askGlm(chatId: string, userText: string, fromName: string): Promise<string> {
  const zai = await getZai();
  const conv = conversations.get(chatId) || { from: fromName, messages: [], lastActive: Date.now() };

  // tambah pesan user
  conv.messages.push({ role: "user", content: userText });
  // trim
  if (conv.messages.length > MAX_HISTORY) {
    conv.messages = conv.messages.slice(-MAX_HISTORY);
  }
  conv.lastActive = Date.now();

  const messages = [
    { role: "assistant", content: config.systemPrompt },
    ...conv.messages,
  ];

  try {
    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: "disabled" },
    });
    const reply = completion.choices?.[0]?.message?.content?.trim() || "(kosong)";
    conv.messages.push({ role: "assistant", content: reply });
    if (conv.messages.length > MAX_HISTORY) {
      conv.messages = conv.messages.slice(-MAX_HISTORY);
    }
    conversations.set(chatId, conv);
    return reply;
  } catch (e: any) {
    log("error", `GLM error: ${e.message}`, { chatId, from: fromName });
    return "Maaf, saya lagi gangguan koneksi ke model AI. Coba lagi sebentar ya 🙏";
  }
}

/* ============================ Polling loop ============================ */
async function pollOnce() {
  if (!running || !config.token) return;
  try {
    const updates = await tgCall("getUpdates", {
      offset,
      timeout: 25,
      allowed_updates: ["message", "edited_message", "callback_query"],
    });
    for (const upd of updates) {
      offset = upd.update_id + 1;
      await handleUpdate(upd);
    }
  } catch (e: any) {
    log("error", `Polling error: ${e.message}`);
  } finally {
    if (running) {
      pollingTimer = setTimeout(pollOnce, 800);
    }
  }
}

async function handleUpdate(upd: any) {
  const msg = upd.message || upd.edited_message;
  if (!msg) return;
  const chatId = String(msg.chat?.id ?? "");
  const fromName = msg.from?.first_name || msg.from?.username || "User";
  const text = msg.text?.trim() || "";

  // whitelist check
  if (config.adminChatIds.length > 0 && !config.adminChatIds.includes(chatId)) {
    return; // abaikan chat yg tidak di-whitelist
  }

  // commands
  if (text.startsWith("/")) {
    await handleCommand(text, chatId, fromName, msg.message_id);
    return;
  }

  if (!text) {
    // non-text (sticker/photo/dll)
    await sendMessage(chatId, "Saya cuma bisa baca pesan teks ya 😅 — ketik /help buat liat menu.", msg.message_id);
    return;
  }

  log("msg-in", text, { chatId, from: fromName });

  // typing indicator
  tgCall("sendChatAction", { chat_id: chatId, action: "typing" }).catch(() => {});

  const reply = await askGlm(chatId, text, fromName);
  await sendMessage(chatId, reply, msg.message_id);
  log("msg-out", reply.slice(0, 200), { chatId, from: "bot" });
}

async function handleCommand(text: string, chatId: string, fromName: string, msgId: number) {
  const cmd = text.split(/\s+/)[0].toLowerCase().split("@")[0];
  switch (cmd) {
    case "/start":
      if (config.welcomeEnabled) {
        await sendMessage(
          chatId,
          `Halo ${fromName}! 👋 Saya AKUMA, asisten AI AKUMA JOKI.\n\n` +
            `Kirim pesan apa aja, saya balas pakai AI (GLM).\n\n` +
            `Perintah:\n/help — bantuan\n/clear — reset ingatan chat\n/about — tentang saya`,
          msgId
        );
      }
      log("system", `/start dari ${fromName}`, { chatId, from: fromName });
      break;
    case "/help":
      await sendMessage(
        chatId,
        "🤖 *AKUMA Bot — Bantuan*\n\n" +
          "• Kirim teks apa saja → saya jawab pakai AI (GLM-5.2)\n" +
          "• /clear — hapus riwayat chat (mulai dari awal)\n" +
          "• /about — info bot\n" +
          "• /start — sambutan awal\n\n" +
          "Tip: obrolan saya ini mengingat 20 pesan terakhir.",
        msgId
      );
      break;
    case "/clear":
      conversations.delete(chatId);
      await sendMessage(chatId, "✅ Ingatan chat sudah direset. Mulai dari awal ya!", msgId);
      log("system", `/clear dari ${fromName}`, { chatId, from: fromName });
      break;
    case "/about":
      await sendMessage(
        chatId,
        "⚡ AKUMA Bot v1.0\nPower by GLM-5.2 via z-ai-web-dev-sdk\nDibuat untuk AKUMA JOKI.",
        msgId
      );
      break;
    default:
      await sendMessage(chatId, "Perintah tidak dikenal. Ketik /help ya.", msgId);
  }
}

/* ============================ Start / Stop ============================ */
async function startBot() {
  if (running) return { ok: true, message: "already running" };
  if (!config.token) return { ok: false, message: "token kosong" };
  running = true;
  log("system", "Bot starting...");
  const me = await getBotInfo();
  if (!me) {
    running = false;
    return { ok: false, message: "getMe failed, cek token" };
  }
  offset = 0;
  pollOnce();
  return { ok: true, bot: botInfo };
}

function stopBot() {
  if (!running) return { ok: true, message: "already stopped" };
  running = false;
  if (pollingTimer) {
    clearTimeout(pollingTimer);
    pollingTimer = null;
  }
  log("system", "Bot stopped");
  return { ok: true };
}

/* ============================ HTTP Control API ============================ */
function json(res: any, status = 200, body: any) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.end(JSON.stringify(body));
}

function maskToken(t: string): string {
  if (!t) return "";
  if (t.length <= 12) return "***";
  return t.slice(0, 6) + "••••••" + t.slice(-4);
}

function readBody(req: any): Promise<any> {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c: Buffer) => (data += c.toString()));
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
  });
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    if (method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // GET / — status
    if (path === "/" && method === "GET") {
      return Response.json({
        ok: true,
        service: "akuma-telegram-bot",
        version: "1.0.0",
        port: PORT,
        running,
        bot: botInfo,
        tokenMasked: maskToken(config.token),
        tokenSet: !!config.token,
        systemPrompt: config.systemPrompt,
        welcomeEnabled: config.welcomeEnabled,
        modelLabel: config.modelLabel,
        adminChatIds: config.adminChatIds,
        activeChats: conversations.size,
        totalLogs: logs.length,
        uptime: process.uptime(),
      });
    }

    // GET /logs
    if (path === "/logs" && method === "GET") {
      const limit = parseInt(url.searchParams.get("limit") || "50");
      return Response.json({ ok: true, logs: logs.slice(-limit).reverse() });
    }

    // GET /chats
    if (path === "/chats" && method === "GET") {
      const chats: ChatSummary[] = [];
      for (const [chatId, conv] of conversations.entries()) {
        const lastMsg = conv.messages[conv.messages.length - 1];
        chats.push({
          chatId,
          from: conv.from,
          msgCount: conv.messages.length,
          lastActive: conv.lastActive,
          preview: lastMsg?.content?.slice(0, 100) || "",
        });
      }
      chats.sort((a, b) => b.lastActive - a.lastActive);
      return Response.json({ ok: true, chats });
    }

    // POST /config
    if (path === "/config" && method === "POST") {
      const body = await req.json();
      let needRestart = false;
      if (typeof body.token === "string" && body.token.trim()) {
        if (body.token !== config.token) {
          config.token = body.token.trim();
          needRestart = true;
        }
      }
      if (typeof body.systemPrompt === "string") config.systemPrompt = body.systemPrompt;
      if (typeof body.welcomeEnabled === "boolean") config.welcomeEnabled = body.welcomeEnabled;
      if (typeof body.modelLabel === "string") config.modelLabel = body.modelLabel;
      if (Array.isArray(body.adminChatIds)) config.adminChatIds = body.adminChatIds.filter((x: any) => typeof x === "string");
      saveConfig();
      log("system", "Config updated via admin panel");
      // jika token berubah & bot sedang jalan, restart
      if (needRestart && running) {
        stopBot();
        await new Promise((r) => setTimeout(r, 300));
        await startBot();
      }
      return Response.json({ ok: true, needRestart, tokenMasked: maskToken(config.token) });
    }

    // POST /start
    if (path === "/start" && method === "POST") {
      const r = await startBot();
      return Response.json(r, { status: r.ok ? 200 : 400 });
    }

    // POST /stop
    if (path === "/stop" && method === "POST") {
      const r = stopBot();
      return Response.json(r);
    }

    // POST /test — kirim pesan uji
    if (path === "/test" && method === "POST") {
      const body = await req.json();
      const { chatId, text } = body;
      if (!chatId || !text) return Response.json({ ok: false, message: "chatId & text wajib" }, { status: 400 });
      if (!config.token) return Response.json({ ok: false, message: "token kosong" }, { status: 400 });
      try {
        await sendMessage(chatId, String(text));
        log("msg-out", `[TEST] ${text}`.slice(0, 200), { chatId, from: "admin" });
        return Response.json({ ok: true });
      } catch (e: any) {
        return Response.json({ ok: false, message: e.message }, { status: 500 });
      }
    }

    // POST /clear — hapus history chat
    if (path === "/clear" && method === "POST") {
      const body = await req.json();
      const { chatId } = body;
      if (!chatId) return Response.json({ ok: false, message: "chatId wajib" }, { status: 400 });
      conversations.delete(String(chatId));
      log("system", `History cleared for ${chatId}`);
      return Response.json({ ok: true });
    }

    // POST /clear-all
    if (path === "/clear-all" && method === "POST") {
      const n = conversations.size;
      conversations.clear();
      log("system", `All conversations cleared (${n} chats)`);
      return Response.json({ ok: true, cleared: n });
    }

    return Response.json({ ok: false, message: "not found" }, { status: 404 });
  },
});

log("system", `Telegram bot mini-service listening on http://localhost:${PORT}`);
log("system", `Token set: ${config.token ? "yes" : "no"} | Running: ${running}`);

// Auto-start jika token sudah ada dari config sebelumnya
if (config.token) {
  startBot().catch((e) => log("error", `Autostart failed: ${e.message}`));
}
