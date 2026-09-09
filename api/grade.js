/* Chấm bài IELTS — proxy tới Anthropic API, giữ API key ở phía máy chủ.
   Cần đặt biến môi trường trên Vercel:
     ANTHROPIC_API_KEY  (bắt buộc)
     ANTHROPIC_MODEL    (tuỳ chọn, mặc định claude-sonnet-5)
     DAILY_LIMIT        (tuỳ chọn, mặc định 15 lượt / IP / ngày) */
const HITS = new Map();
const DAY = 86400000;
const LIMIT = Number(process.env.DAILY_LIMIT || 15);
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed", message: "Chỉ nhận POST." });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(503).json({ error: "no_key", message: "Máy chủ chưa được gắn ANTHROPIC_API_KEY." });

  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  const now = Date.now();
  const rec = HITS.get(ip) || { n: 0, t: now };
  if (now - rec.t > DAY) { rec.n = 0; rec.t = now; }
  if (rec.n >= LIMIT) return res.status(429).json({ error: "rate_limited", message: "Đã hết lượt chấm miễn phí trong ngày." });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const prompt = String((body && body.prompt) || "");
  if (prompt.length < 100 || prompt.length > 24000) return res.status(400).json({ error: "bad_input", message: "Độ dài bài không hợp lệ." });

  rec.n += 1; HITS.set(ip, rec);

  let r, data;
  try {
    r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2200,
        system: "Bạn là giám khảo IELTS. Luôn trả lời bằng DUY NHẤT một object JSON hợp lệ, không kèm chữ nào khác, không bọc trong dấu ```.",
        messages: [{ role: "user", content: prompt }]
      })
    });
    data = await r.json();
  } catch (e) {
    return res.status(502).json({ error: "upstream", message: "Không gọi được API chấm bài." });
  }
  if (!r.ok) {
    const msg = (data && data.error && data.error.message) || ("HTTP " + r.status);
    return res.status(502).json({ error: "upstream", message: msg });
  }

  const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("").trim();
  const clean = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  let out = null;
  try { out = JSON.parse(clean); }
  catch (e) {
    const a = clean.indexOf("{"), b = clean.lastIndexOf("}");
    if (a >= 0 && b > a) { try { out = JSON.parse(clean.slice(a, b + 1)); } catch (e2) { } }
  }
  if (!out) return res.status(502).json({ error: "bad_json", message: "Kết quả chấm không đọc được, thử lại giúp." });
  return res.status(200).json(out);
};
