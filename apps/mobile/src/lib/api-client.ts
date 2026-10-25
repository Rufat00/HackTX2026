import { authClient, apiURL } from './auth-client';
import { readApiResponse } from './api-response';
import { clientHeaders } from './client-headers';
export { ApiFailure } from './api-response';
let privateGeneration = 0;
export function resetPrivateRequests() {
  privateGeneration++;
}
export async function apiRequest(path: string, options: RequestInit = {}) {
  const generation = privateGeneration;
  const cookie = await authClient.getCookie();
  const response = await fetch(`${apiURL}${path}`, {
    ...options,
    credentials: 'omit',
    headers: {
      'Content-Type': 'application/json',
      ...clientHeaders,
      ...(cookie ? { Cookie: cookie } : {}),
      ...options.headers,
    },
  });
  const body = await readApiResponse(response);
  if (generation !== privateGeneration)
    throw new Error('Session changed; please retry');
  return body;
}
