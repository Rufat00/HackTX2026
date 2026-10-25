import { expect, it } from 'vitest';
import { ApiFailure, readApiResponse } from './api-response';

it('rejects an HTTP 200 HTML warning page instead of treating the upload as saved', async () => {
  await expect(
    readApiResponse(new Response('<!doctype html><html>ngrok warning</html>')),
  ).rejects.toThrow('API tunnel');
});
it('explains an unreachable API and an offline ngrok tunnel', async () => {
  await expect(
    readApiResponse(
      new Response('<html>ERR_NGROK_8012</html>', { status: 502 }),
    ),
  ).rejects.toThrow('pnpm dev:api');
  await expect(
    readApiResponse(
      new Response('<html>ERR_NGROK_3200</html>', { status: 404 }),
    ),
  ).rejects.toThrow('Restart ngrok');
});
it('explains an HTML size rejection without exposing the raw proxy response', async () => {
  await expect(
    readApiResponse(
      new Response('<html>internal proxy details</html>', { status: 413 }),
    ),
  ).rejects.toThrow('smaller photo');
});
it('retains structured validation feedback from the API', async () => {
  const error = {
    code: 'validation',
    message: 'Choose a smaller photo',
    retryable: false,
    requestId: 'test',
    fieldErrors: { image: ['Too large'] },
  };
  await expect(
    readApiResponse(Response.json({ error }, { status: 400 })),
  ).rejects.toMatchObject(
    new ApiFailure(error as ConstructorParameters<typeof ApiFailure>[0]),
  );
});
it('accepts successful upload JSON and safely rejects malformed JSON', async () => {
  expect(await readApiResponse(Response.json({ ok: true }))).toEqual({
    ok: true,
  });
  await expect(
    readApiResponse(
      new Response('broken private upstream detail', { status: 502 }),
    ),
  ).rejects.toThrow('unreadable response');
  await expect(
    readApiResponse(
      Response.json({ error: 'invalid envelope' }, { status: 500 }),
    ),
  ).rejects.toThrow('HTTP 500');
});
