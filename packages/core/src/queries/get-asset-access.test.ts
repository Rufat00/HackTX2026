import { expect, it, vi } from 'vitest';
import { getAssetAccess } from './get-asset-access';
import { updateProfile } from '../mutations/update-profile';
import { completeProfileUpload } from '../mutations/complete-profile-upload';
import type { CoreContext } from '../context';
const id = 'a3956988-0001-4000-9000-a5585e2f2b43';
it('scopes image access by trusted actor, purpose and ready status', async () => {
  const findFirst = vi.fn().mockResolvedValue(null),
    signDownload = vi.fn();
  const ctx = {
    db: { asset: { findFirst } },
    actor: { kind: 'user', userId: 'alice' },
    storage: { signDownload },
  } as unknown as CoreContext;
  await expect(getAssetAccess(ctx, id)).rejects.toMatchObject({
    code: 'not-found',
  });
  expect(findFirst).toHaveBeenCalledWith({
    where: { id, ownerUserId: 'alice', purpose: 'PROFILE', status: 'READY' },
  });
  expect(signDownload).not.toHaveBeenCalled();
});
it('does not mutate a profile when asset ownership fails', async () => {
  const update = vi.fn();
  const tx = {
    $queryRaw: vi.fn(),
    asset: { findFirst: vi.fn().mockResolvedValue(null) },
    user: { update },
  };
  const ctx = {
    db: { $transaction: async (fn: (v: typeof tx) => unknown) => fn(tx) },
    actor: { userId: 'bob' },
  } as unknown as CoreContext;
  await expect(
    updateProfile(ctx, {
      firstName: 'B',
      lastName: 'C',
      profileImageAssetId: id,
    }),
  ).rejects.toMatchObject({ code: 'not-found' });
  expect(update).not.toHaveBeenCalled();
});
it('cannot complete another user’s asset', async () => {
  const findFirst = vi.fn().mockResolvedValue(null),
    readSource = vi.fn();
  const ctx = {
    db: { asset: { findFirst } },
    actor: { userId: 'bob' },
    storage: { readSource },
  } as unknown as CoreContext;
  await expect(completeProfileUpload(ctx, id)).rejects.toMatchObject({
    code: 'not-found',
  });
  expect(readSource).not.toHaveBeenCalled();
});
it('does not reprocess or reattach a ready upload after a source overwrite', async () => {
  const readSource = vi.fn(),
    update = vi.fn();
  const ctx = {
    db: {
      asset: { findFirst: vi.fn().mockResolvedValue({ id, status: 'READY' }) },
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'alice',
          profileImageAssetId: 'newer-photo',
        }),
        update,
      },
    },
    actor: { userId: 'alice' },
    storage: { readSource },
  } as unknown as CoreContext;
  const profile = await completeProfileUpload(ctx, id);
  expect(profile.profileImageAssetId).toBe('newer-photo');
  expect(readSource).not.toHaveBeenCalled();
  expect(update).not.toHaveBeenCalled();
});
it('does not process a concurrently claimed upload twice', async () => {
  const readSource = vi.fn();
  const ctx = {
    db: {
      asset: {
        findFirst: vi.fn().mockResolvedValue({ id, status: 'PENDING' }),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    },
    actor: { userId: 'alice' },
    storage: { readSource },
  } as unknown as CoreContext;
  await expect(completeProfileUpload(ctx, id)).rejects.toMatchObject({
    code: 'conflict',
  });
  expect(readSource).not.toHaveBeenCalled();
});
