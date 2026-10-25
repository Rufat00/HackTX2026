import { peopleSearchSchema } from '@afterglow/contracts/memories';
import type { CoreContext } from '../context';

export async function listPeople(ctx: CoreContext, input: unknown) {
  const query = peopleSearchSchema.parse(input);
  const people = await ctx.db.user.findMany({
    where: { id: { not: ctx.actor.userId }, username: { startsWith: query } },
    take: 10,
    orderBy: [{ username: 'asc' }, { id: 'asc' }],
    select: { id: true, username: true, firstName: true, lastName: true },
  });
  return people.map((person) => ({
    id: person.id,
    username: person.username!,
    name: `${person.firstName} ${person.lastName}`,
  }));
}
