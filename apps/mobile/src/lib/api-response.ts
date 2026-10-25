import { z } from 'zod';
import { errorCodes, type ApiError } from '@afterglow/contracts/errors';

export class ApiFailure extends Error {
  constructor(public detail: ApiError['error']) {
    super(detail.message);
  }
}
const errorSchema = z.object({
  error: z.object({
    code: z.enum(errorCodes),
    message: z.string(),
    retryable: z.boolean(),
    requestId: z.string(),
    fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
  }),
});

export async function readApiResponse(
  response: Pick<Response, 'text' | 'status' | 'ok'>,
): Promise<unknown> {
  const text = await response.text();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    if (response.status === 413)
      throw new Error('This photo is too large. Choose a smaller photo.');
    if (text.includes('ERR_NGROK_8012'))
      throw new Error(
        'The API is not running. Start pnpm dev:api, then retry.',
      );
    if (text.includes('ERR_NGROK_3200'))
      throw new Error('The API tunnel is offline. Restart ngrok, then retry.');
    if (/ngrok|<!doctype|<html/i.test(text))
      throw new Error(
        'The API tunnel returned a web page. Check that ngrok and the API are running, then retry.',
      );
    throw new Error(
      `The API returned an unreadable response (HTTP ${response.status}). Try again.`,
    );
  }
  if (!response.ok) {
    const failure = errorSchema.safeParse(body);
    if (failure.success) throw new ApiFailure(failure.data.error);
    throw new Error(
      `The API request failed (HTTP ${response.status}). Try again.`,
    );
  }
  return body;
}
