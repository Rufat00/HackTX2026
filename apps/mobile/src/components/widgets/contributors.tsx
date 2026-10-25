import {
  Chip,
  EmptyState,
  Inline,
  Stack,
  Text,
  type AvatarPerson,
} from '../ui';
export function ContributorPicker({
  people,
  selectedIds,
  onChange,
}: {
  people: AvatarPerson[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  if (!people.length)
    return (
      <EmptyState
        title="No contributors yet"
        description="Explicit participant tags will appear here when people join."
      />
    );
  return (
    <Stack>
      <Text variant="label">Explicit participant tags</Text>
      <Inline>
        {people.map((person) => (
          <Chip
            key={person.id}
            label={person.name}
            selected={selectedIds.includes(person.id)}
            onPress={() =>
              onChange(
                selectedIds.includes(person.id)
                  ? selectedIds.filter((id) => id !== person.id)
                  : [...selectedIds, person.id],
              )
            }
          />
        ))}
      </Inline>
    </Stack>
  );
}
export function ContributorFilterBar({
  people,
  value,
  onChange,
}: {
  people: AvatarPerson[];
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  return (
    <Stack gap="sm">
      <Text variant="label">Filter by contributor</Text>
      <Inline>
        <Chip
          label="All contributors"
          selected={value === null}
          onPress={() => onChange(null)}
        />
        {people.map((person) => (
          <Chip
            key={person.id}
            label={person.name}
            selected={value === person.id}
            onPress={() => onChange(person.id)}
          />
        ))}
      </Inline>
    </Stack>
  );
}
