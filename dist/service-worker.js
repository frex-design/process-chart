// FRe:x 工程管理表 — Service Worker
// キャッシュ戦略:
//   /assets/ 以下（content hash付き静的ファイル） → Cache First（永続キャッシュ）
//   HTML                                          → Network First（常に最新のハッシュを取得）
//   Supabase API                                  → キャッシュしない

const CACHE_NAME = 'frex-process-v1';

// インストール: 即座にアクティベート
self.addEventListener('install', () => {
  self.skipWaiting();
});

// アクティベート: 古いキャッシュを削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // GET以外はスキップ
  if (event.request.method !== 'GET') return;

  // Supabase API はキャッシュしない（常にネットワーク）
  if (url.hostname.includes('supabase.co')) return;

  // ── /assets/ 以下（content hash付きJS/CSS）→ Cache First ──
  // ファイル名にハッシュが含まれるため、キャッシュしても安全
  if (url.pathname.includes('/assets/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached; // キャッシュHIT → 即返す
        // キャッシュMISS → ネットワーク取得 & キャッシュ保存
        const response = await fetch(event.request);
        if (response.status === 200) {
          cache.put(event.request, response.clone());
        }
        return response;
      })
    );
    return;
  }

  // ── HTML（index.html）→ Network First ──
  // 新しいビルドのアセットハッシュを確実に取得するため常にネットワーク優先
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
