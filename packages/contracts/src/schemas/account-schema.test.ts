import { expect, it } from 'vitest';
import { registerSchema, updateProfileSchema } from './account-schema';
it('normalizes usernames but preserves Unicode names and password bytes', () => {
  const value = registerSchema.parse({
    username: 'MAYA_1',
    password: '  Passphrase123  ',
    firstName: 'माया',
    lastName: '李',
  });
  expect(value.username).toBe('maya_1');
  expect(value.password).toBe('  Passphrase123  ');
  expect(value.firstName).toBe('माया');
});
it('rejects posted user identity and compatibility emails', () => {
  expect(() =>
    updateProfileSchema.parse({
      firstName: 'A',
      lastName: 'B',
      userId: 'another',
    }),
  ).toThrow();
  expect(() =>
    registerSchema.parse({
      username: 'abc',
      password: 'abcdefghijkl',
      firstName: 'A',
      lastName: 'B',
      email: 'user@example.com',
    }),
  ).toThrow();
});
