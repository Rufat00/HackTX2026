import type { CoreContext } from '../context';
import { searchCatalog } from '../music/catalog';

export async function searchSongs(_ctx: CoreContext, input: unknown) {
  return searchCatalog(input);
}
