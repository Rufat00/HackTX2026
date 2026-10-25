import type { CoreContext } from '../context';
import { AppError } from '@afterglow/contracts/errors';
export async function getProfile({ db, actor }: CoreContext) {
  const user = await db.user.findUnique({
    where: { id: actor.userId },
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      profileImageAssetId: true,
    },
  });
  if (!user) throw new AppError('unauthenticated', 'Please sign in again');
  return user;
}
