import { useEffect, useState } from 'react';
import { Image, View, type ImageSourcePropType } from 'react-native';
import { useTheme } from '../../theme/theme-provider';
import { Text } from './text';
export type AvatarPerson = {
  id: string;
  name: string;
  source?: ImageSourcePropType;
};
export function Avatar({
  name,
  source,
  size = 'md',
  onError,
}: {
  name: string;
  source?: ImageSourcePropType;
  size?: 'sm' | 'md' | 'lg';
  onError?: () => void;
}) {
  const t = useTheme(),
    [failed, setFailed] = useState(false),
    dimension = t.component.avatar[size];
  useEffect(() => setFailed(false), [source]);
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={name}
      style={{
        width: dimension,
        height: dimension,
        borderRadius: t.primitives.radius.pill,
        backgroundColor: t.semantic.surfaceMuted,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {source && !failed ? (
        <Image
          source={source}
          accessible={false}
          style={{ width: '100%', height: '100%' }}
          onError={() => {
            setFailed(true);
            onError?.();
          }}
        />
      ) : (
        <Text variant={size === 'lg' ? 'title' : 'caption'}>
          {name
            .trim()
            .split(/\s+/u)
            .slice(0, 2)
            .map((part) => Array.from(part)[0] ?? '')
            .join('')
            .toLocaleUpperCase() || '?'}
        </Text>
      )}
    </View>
  );
}
export function AvatarGroup({
  people,
  max = 4,
}: {
  people: AvatarPerson[];
  max?: number;
}) {
  const t = useTheme(),
    limit = Math.max(1, Math.floor(max));
  return (
    <View
      accessible
      accessibilityLabel={people.map((person) => person.name).join(', ')}
      style={{ flexDirection: 'row', alignItems: 'center' }}
    >
      {people.slice(0, limit).map((person, index) => (
        <View
          key={person.id}
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
          style={{
            marginLeft: index ? -t.component.avatar.overlap : 0,
            borderWidth: t.primitives.border.focus,
            borderColor: t.semantic.surface,
            borderRadius: t.primitives.radius.pill,
          }}
        >
          <Avatar {...person} size="sm" />
        </View>
      ))}
      {people.length > limit ? (
        <Text variant="caption"> +{people.length - limit}</Text>
      ) : null}
    </View>
  );
}
