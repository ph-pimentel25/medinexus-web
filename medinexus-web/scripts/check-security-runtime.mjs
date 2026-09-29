// Run against a local production build with external providers disabled.
import assert from 'node:assert/strict';
const origin = process.env.TEST_BASE_URL || 'http://localhost:3104';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(origin).hostname), 'Local build only');
const get = (path, options) => fetch(new URL(path, origin), options);
const home = await get('/');
assert.equal(home.status, 200);
assert.equal(home.headers.get('x-content-type-options'), 'nosniff');
assert.equal(home.headers.get('x-frame-options'), 'DENY');
assert.equal(home.headers.get('x-powered-by'), null);
assert.match(home.headers.get('content-security-policy'), /frame-ancestors 'none'/);
assert.doesNotMatch(home.headers.get('content-security-policy'), /unsafe-eval/);
assert.match(home.headers.get('permissions-policy'), /geolocation=\(self\)/);
if (process.env.EXPECT_VERCEL_HEADERS === '1') assert.match(home.headers.get('strict-transport-security'), /max-age=31536000/);
const manifestResponse = await get('/manifest.webmanifest');
assert.equal(manifestResponse.status, 200);
const manifest = await manifestResponse.json();
assert.equal(manifest.display, 'standalone');
assert.equal(manifest.start_url, '/dashboard');
for (const icon of manifest.icons) assert.equal((await get(icon.src)).status, 200);
const image = await get('/_next/image?url=%2Fbrand%2Fmedinexus-logo.png&w=256&q=75');
assert.equal(image.status, 200);
assert.match(image.headers.get('content-type'), /^image\//);
assert.ok((await image.arrayBuffer()).byteLength > 100);
assert.equal((await get('/_next/image?url=http%3A%2F%2F127.0.0.1%2Fprivate&w=256&q=75')).status, 400);
for (const path of ['/api/discovery', '/api/webhooks/asaas']) {
  assert.equal((await get(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })).status, 401, path);
}
for (const path of ['/api/cron/patient-messages', '/api/cron/clinical-summaries']) assert.equal((await get(path)).status, 401, path);
const checkout = await get('/api/payments/checkout');
assert.equal(checkout.status, 200);
assert.equal(checkout.headers.get('cache-control'), 'no-store');
assert.equal((await checkout.json()).available, false);
console.log('PASS: production CSP/headers, PWA manifest/icons, next/image and unauthenticated server API guards');
