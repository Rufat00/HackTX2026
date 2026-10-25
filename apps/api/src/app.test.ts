import { describe, it, expect, vi } from 'vitest';
import { createApp } from './app';
import type { Auth } from '@afterglow/auth/server';
import type { PrismaClient } from '@afterglow/db/client';
import type { Storage } from '@afterglow/storage/s3';
const session = vi.fn();
const app = createApp({
  auth: { api: { getSession: session }, handler: vi.fn() } as unknown as Auth,
  db: {} as PrismaClient,
  storage: {} as Storage,
  origins: ['afterglow://', 'http://localhost:3001'],
});
describe('safe API boundary', () => {
  it('requires sessions for business reads', async () => {
    session.mockResolvedValue(null);
    const res = await app.request('/api/v1/me');
    expect(res.status).toBe(401);
    expect((await res.json()).error.code).toBe('unauthenticated');
  });
  it('requires sessions for memory lists, mutations, binary uploads, and private media', async () => {
    session.mockResolvedValue(null);
    const id = '00000000-0000-4000-8000-000000000001';
    for (const [path, method] of [
      ['/api/v1/music/search?q=song', 'GET'],
      ['/api/v1/boards', 'GET'],
      ['/api/v1/boards', 'POST'],
      [`/api/v1/boards/${id}/media/${id}`, 'GET'],
      [`/api/v1/boards/${id}/assets/${id}/source`, 'POST'],
      [`/api/v1/boards/${id}/publish`, 'POST'],
      [`/api/v1/boards/${id}/contributors`, 'POST'],
      [`/api/v1/boards/${id}/unpublish`, 'POST'],
    ]) {
      const response = await app.request(path!, {
        method,
        headers: { 'X-Afterglow-Client': 'native' },
      });
      expect(response.status).toBe(401);
      expect((await response.json()).error.code).toBe('unauthenticated');
    }
  });
  it('blocks alternative auth routes', async () => {
    for (const route of [
      'sign-up/email',
      'sign-in/email',
      'request-password-reset',
      'change-email',
    ]) {
      const res = await app.request(`/api/auth/${route}`, {
        method: 'POST',
        headers: {
          'X-Afterglow-Client': 'native',
          'Content-Type': 'application/json',
        },
        body: '{}',
      });
      expect(res.status).toBe(404);
    }
  });
  it('blocks cross-origin mutations', async () => {
    const response = await app.request('/api/v1/me', {
      method: 'PATCH',
      headers: {
        origin: 'https://evil.example',
        'Content-Type': 'application/json',
      },
      body: '{}',
    });
    expect(response.status).toBe(403);
    expect(response.headers.get('access-control-allow-origin')).toBeNull();
  });
  it('rejects browser mutations without an origin or native header', async () =>
    expect(
      (await app.request('/api/v1/uploads', { method: 'POST', body: '{}' }))
        .status,
    ).toBe(403));
  it('does not return unexpected exception details', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    session.mockRejectedValue(new Error('secret SQL connection password'));
    const response = await app.request('/api/v1/me');
    const body = await response.json();
    expect(response.status).toBe(503);
    expect(JSON.stringify(body)).not.toContain('SQL');
    expect(body.error.requestId).toBeTruthy();
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });
});
