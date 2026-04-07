// Bug Fixed By Wen Han Tang With Help From ChatGPT A0340008W
const cacheStore = new Map();

const buildCacheKey = (req) => `${req.originalUrl}`;

export const responseCache = (ttlSeconds = 15) => (req, res, next) => {
  if (req.method !== "GET") {
    return next();
  }

  const key = buildCacheKey(req);
  const now = Date.now();
  const cached = cacheStore.get(key);

  if (cached && cached.expiresAt > now) {
    return res.status(cached.status).json(cached.payload);
  }

  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  res.json = (body) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      cacheStore.set(key, {
        payload: body,
        status: res.statusCode,
        expiresAt: now + ttlSeconds * 1000,
      });
    }
    return originalJson(body);
  };

  res.send = (body) => {
    if (
      res.statusCode >= 200 &&
      res.statusCode < 300 &&
      body &&
      typeof body === "object" &&
      !Buffer.isBuffer(body)
    ) {
      cacheStore.set(key, {
        payload: body,
        status: res.statusCode,
        expiresAt: now + ttlSeconds * 1000,
      });
    }
    return originalSend(body);
  };

  return next();
};

export const clearResponseCache = () => {
  cacheStore.clear();
};
