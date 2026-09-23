/* Sổ Luyện IELTS — chạy được khi mất mạng.
   App là một file HTML duy nhất, nên chỉ cần giữ file đó cùng vài tài nguyên nhỏ.
   Chiến lược: mạng trước, hỏng thì lấy bản đã lưu. Nhờ vậy mở app luôn thấy bản mới nhất
   khi có mạng, mà mất mạng vẫn dùng được bản lần trước. */
const CACHE = "soluyenielts-v4";
const CORE = ["/", "/index.html", "/manifest.json", "/icon.svg"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  /* Không đụng tới Supabase và API chấm bài — những thứ đó phải luôn đi thẳng ra mạng. */
  if (url.pathname.startsWith("/api/") || /supabase\.co|anthropic\.com/.test(url.hostname)) return;

  /* Phông chữ Google: lấy bản đã lưu trước cho nhanh, rồi âm thầm cập nhật. */
  if (/fonts\.(googleapis|gstatic)\.com/.test(url.hostname)) {
    e.respondWith(
      caches.match(req).then(hit => {
        const net = fetch(req).then(r => {
          if (r && r.ok) caches.open(CACHE).then(c => c.put(req, r.clone()));
          return r;
        }).catch(() => hit);
        return hit || net;
      })
    );
    return;
  }

  /* Trang và tài nguyên của app: mạng trước, hỏng thì dùng bản đã lưu. */
  e.respondWith(
    fetch(req)
      .then(r => {
        if (r && r.ok && url.origin === self.location.origin) {
          const copy = r.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return r;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match("/index.html")))
  );
});
