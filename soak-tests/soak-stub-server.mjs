/**
 * Minimal HTTP stub for soak testing when full stack + Mongo are unavailable.
 * Author: Aum Yogeshbhai Chotaliya (A0285229M)
 * Usage: node soak-tests/soak-stub-server.mjs [port]
 */
import http from 'http';

const port = Number(process.argv[2] || process.env.SOAK_STUB_PORT || 6061);

const json = (res, code, body) => {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
};

const server = http.createServer((req, res) => {
  const u = req.url.split('?')[0];
  if (u.startsWith('/api/v1/product/search/')) json(res, 200, { success: true, products: [] });
  else if (u.startsWith('/api/v1/product/product-list/')) json(res, 200, { success: true, products: [] });
  else if (u === '/api/v1/product/get-product') json(res, 200, { success: true, products: [] });
  else if (u === '/api/v1/category/get-category') json(res, 200, { success: true, category: [] });
  else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(port, () => {
  console.log(`soak-stub-server listening on http://localhost:${port}`);
});
