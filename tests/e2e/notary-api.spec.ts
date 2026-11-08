import { test, expect } from '@playwright/test';
import { skipIfPreviewUnconfigured } from './helpers/environment';

// The notary order routes, probed only with requests they refuse before doing
// anything real: no email is sent, the partner's order API is never called, no
// file is stored. They are open to anyone without an account, so what they turn
// away is the contract worth keeping.
test.describe('Notary upload route (/api/notary-upload)', () => {
  test('refuses a submission with no name or email', async ({ request }) => {
    const res = await request.post('/api/notary-upload', { multipart: { phone: '+995500000000' } });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toMatch(/name, email/i);
  });

  test('refuses an email address that is not one', async ({ request }) => {
    const res = await request.post('/api/notary-upload', {
      multipart: { name: 'E2E Tester', email: 'not-an-email', order_summary: 'x' },
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toMatch(/email/i);
  });

  test('refuses an email address built to break out of the message', async ({ request }) => {
    const res = await request.post('/api/notary-upload', {
      multipart: { name: 'E2E Tester', email: 'a@b.co><img src=x>', order_summary: 'x' },
    });
    expect(res.status()).toBe(400);
  });

  test('refuses a submission with no file and no order summary', async ({ request }) => {
    const res = await request.post('/api/notary-upload', {
      multipart: { name: 'E2E Tester', email: 'e2e@suliko-test.dev' },
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toMatch(/file/i);
  });

  test('does not take GET', async ({ request }) => {
    const res = await request.get('/api/notary-upload');
    expect(res.status()).toBe(405);
  });
});

test.describe('Partner order proxy (/api/notary-order)', () => {
  test('an unknown endpoint is a 404', async ({ request }) => {
    const res = await request.get('/api/notary-order/nope');
    expect(res.status()).toBe(404);
  });

  test('the wrong method is a 405, whatever the endpoint', async ({ request }) => {
    expect((await request.get('/api/notary-order/orders')).status()).toBe(405);
    expect((await request.get('/api/notary-order/files')).status()).toBe(405);
    expect((await request.post('/api/notary-order/reference')).status()).toBe(405);
  });

  test('a file upload that is neither multipart nor JSON is a 415', async ({ request, baseURL }) => {
    const res = await request.post('/api/notary-order/files', {
      headers: { 'content-type': 'text/plain' },
      data: 'not a form',
    });
    skipIfPreviewUnconfigured(res.status(), baseURL, 'the partner order service');
    expect(res.status()).toBe(415);
  });

  test('a stored-file hand-off without its ids is a 400', async ({ request, baseURL }) => {
    const res = await request.post('/api/notary-order/files', { data: { order_id: 1 } });
    skipIfPreviewUnconfigured(res.status(), baseURL, 'the partner order service');
    expect(res.status()).toBe(400);
  });
});
