import { authClient, apiURL } from './auth-client';
import { clientHeaders } from './client-headers';

export async function getProfileImage(assetId: string) {
  return {
    url: `${apiURL}/api/v1/assets/${assetId}/content`,
    headers: {
      Cookie: (await authClient.getCookie()) ?? '',
      ...clientHeaders,
    },
  };
}
