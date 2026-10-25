import { useRef, useState, type RefObject } from 'react';
import { View, type ViewInstance } from 'react-native';
import { ThemeProvider, useTheme } from '../../theme/theme-provider';
import { createPhotoHalos } from '../memories/ambient-field';
import {
  Avatar,
  AvatarGroup,
  Badge,
  Button,
  Card,
  Chip,
  ConfirmDialog,
  Divider,
  EmptyState,
  Feedback,
  FormError,
  IconButton,
  Inline,
  LoadingIndicator,
  PasswordField,
  Screen,
  SegmentedControl,
  Sheet,
  Skeleton,
  Stack,
  Surface,
  Text,
  TextField,
} from '../../components/ui';
import {
  ContributorFilterBar,
  ContributorPicker,
  MemoryBoardPreview,
  PhotoMemoryCard,
  ProfileHeader,
  SharedMomentBadge,
  StoryMemoryCard,
  UploadTile,
  UserSummary,
} from '../../components/widgets';
const people = [
  { id: 'a', name: 'Amara Okafor' },
  { id: 'b', name: '李 明' },
  { id: 'c', name: 'Sofía Hernández' },
  { id: 'd', name: 'Alexandria Montgomery-Williams' },
  { id: 'e', name: 'Noor Ali' },
];
export function GalleryScreen() {
  const [width, setWidth] = useState('390'),
    [scale, setScale] = useState('1');
  return (
    <ThemeProvider previewTextScale={Number(scale)}>
      <Gallery
        width={Number(width)}
        setWidth={setWidth}
        scale={scale}
        setScale={setScale}
      />
    </ThemeProvider>
  );
}
function Gallery({
  width,
  setWidth,
  scale,
  setScale,
}: {
  width: number;
  setWidth: (value: string) => void;
  scale: string;
  setScale: (value: string) => void;
}) {
  const t = useTheme(),
    [section, setSection] = useState('controls'),
    [text, setText] = useState(''),
    [selected, setSelected] = useState<string[]>([]),
    [filter, setFilter] = useState<string | null>(null),
    [sheet, setSheet] = useState(false),
    [confirm, setConfirm] = useState(false),
    [notice, setNotice] = useState(''),
    [phase, setPhase] = useState<
      'empty' | 'uploading' | 'verifying' | 'ready' | 'failed'
    >('failed'),
    sheetTrigger = useRef<ViewInstance>(null),
    profileSheetTrigger = useRef<ViewInstance>(null),
    storySheetTrigger = useRef<ViewInstance>(null),
    activeSheetTrigger = useRef<ViewInstance>(null),
    confirmTrigger = useRef<ViewInstance>(null);
  function openSheet(trigger: RefObject<ViewInstance | null>) {
    activeSheetTrigger.current = trigger.current;
    setSheet(true);
  }
  return (
    <Screen>
      <Text variant="display">Afterglow gallery</Text>
      <Badge label="Development · local fixtures only" />
      <Text tone="secondary">
        Controls below change local examples. No accounts, uploads, memories or
        publication are written.
      </Text>
      <Text variant="label">Preview width (bounded by device)</Text>
      <SegmentedControl
        value={String(width)}
        onChange={setWidth}
        options={['360', '390', '430'].map((value) => ({
          value,
          label: value,
        }))}
      />
      <Text variant="label">
        Text scale simulation · also test native font settings
      </Text>
      <SegmentedControl
        value={scale}
        onChange={setScale}
        options={[
          { value: '1', label: 'Standard' },
          { value: '1.3', label: 'Large ×1.3' },
        ]}
      />
      <SegmentedControl
        value={section}
        onChange={setSection}
        options={[
          { value: 'controls', label: 'Primitives' },
          { value: 'identity', label: 'Auth / profile' },
          { value: 'memory', label: 'Memories' },
        ]}
      />
      <Divider />
      <View
        style={{
          width: '100%',
          maxWidth: width,
          alignSelf: 'center',
          gap: t.primitives.space.xl,
        }}
      >
        {section === 'controls' ? (
          <>
            <Text variant="title">Typography & surfaces</Text>
            <Surface>
              <Stack>
                <Text variant="display">Remember together</Text>
                <Text variant="title">A shared evening</Text>
                <Text variant="heading">A little detail</Text>
                <Text>Scalable body text on a stable surface.</Text>
                <Text variant="caption" tone="secondary">
                  Caption · System substitute
                </Text>
              </Stack>
            </Surface>
            <Surface tone="muted">
              <Text>Muted surface</Text>
            </Surface>
            <Surface tone="elevated">
              <Text>Elevated surface</Text>
            </Surface>
            <Text variant="title">Actions</Text>
            <Button
              label="Primary action"
              icon="arrow-right"
              onPress={() => setNotice('Local action completed.')}
            />
            <Button
              variant="secondary"
              label="Secondary action"
              onPress={() => setNotice('Secondary local action completed.')}
            />
            <Button
              variant="ghost"
              label="Quiet action"
              onPress={() => setNotice('Quiet local action completed.')}
            />
            <Button
              variant="danger"
              label="Review fixture removal"
              ref={confirmTrigger}
              onPress={() => setConfirm(true)}
            />
            <Button
              label="Disabled action"
              disabled
              onPress={() => setNotice('Unexpected disabled action')}
            />
            <Button
              label="Saving fixture"
              pending
              onPress={() => setNotice('Unexpected pending action')}
            />
            <Inline>
              <IconButton
                label="Open fixture sheet"
                icon="plus"
                ref={sheetTrigger}
                onPress={() => openSheet(sheetTrigger)}
              />
              <IconButton
                label="Unavailable camera"
                icon="camera"
                disabled
                onPress={() => {}}
              />
            </Inline>
            <Text variant="title">Fields & selection</Text>
            <TextField
              label="Story draft"
              hint="Local draft remains when errors appear."
              value={text}
              onChangeText={setText}
              multiline
            />
            <TextField
              label="Invalid username"
              defaultValue="already-taken"
              error="This username is unavailable. Choose another."
            />
            <TextField
              label="Disabled field"
              value="Read only"
              editable={false}
            />
            <PasswordField
              label="Password example"
              textContentType="newPassword"
              autoComplete="new-password"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <FormError message="Could not save this fixture. Your draft is preserved." />
            <Inline>
              <Chip
                label="Selected"
                selected
                onPress={() => setNotice('Selected chip pressed')}
              />
              <Chip
                label="Available"
                onPress={() => setNotice('Available chip pressed')}
              />
              <Chip label="Disabled" disabled onPress={() => {}} />
            </Inline>
            <Text variant="title">Feedback states</Text>
            <LoadingIndicator label="Loading example…" />
            <Skeleton />
            <Skeleton kind="media" />
            <Feedback message="Pending review" />
            <Feedback tone="success" message="Fixture saved locally" />
            <Feedback
              error
              message="Connection interrupted. Retry when ready."
            />
            <Inline>
              <Badge label="Pending" />
              <Badge label="Saved" tone="success" />
              <Badge label="Failed" tone="danger" />
              <Badge label="AI suggestion" tone="suggestion" />
            </Inline>
            <EmptyState
              title="Nothing here yet"
              description="An empty state explains what can happen next."
              action={{
                label: 'Try local action',
                onPress: () => setNotice('Empty-state action completed.'),
              }}
            />
          </>
        ) : section === 'identity' ? (
          <>
            <Text variant="title">Auth composition · fixture</Text>
            <Stack gap="xl">
              <Text variant="caption" tone="secondary">
                01 / ABOUT YOU
              </Text>
              <Text variant="hero">Let’s start{'\n'}with you.</Text>
              <TextField
                variant="quiet"
                label="First name"
                placeholder="First name"
                defaultValue="Sofía"
                textContentType="givenName"
              />
              <TextField
                variant="quiet"
                label="Last name"
                placeholder="Last name"
                defaultValue="Hernández"
                textContentType="familyName"
              />
              <PasswordField
                variant="quiet"
                label="Password"
                placeholder="Your password"
                textContentType="newPassword"
              />
              <Button
                label="Continue · local preview"
                icon="arrow-right"
                onPress={() =>
                  setNotice(
                    'Local preview only. Open the account route for the real signup flow.',
                  )
                }
              />
            </Stack>
            <Text variant="heading">Standard field states</Text>
            <Card>
              <Text variant="display">Afterglow</Text>
              <Text tone="secondary">Create your account</Text>
              <TextField
                label="Username"
                value={text}
                onChangeText={setText}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="username"
              />
              <PasswordField
                label="Password"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="newPassword"
              />
              <TextField
                label="First name"
                defaultValue="Sofía"
                textContentType="givenName"
              />
              <TextField
                label="Last name"
                defaultValue="Hernández"
                textContentType="familyName"
              />
              <Button
                label="Validate local example"
                onPress={() =>
                  setNotice(
                    'Local example only. Use the account screen to register.',
                  )
                }
              />
              <Text variant="caption">Photo is optional after signup.</Text>
            </Card>
            <Text variant="title">Profile composition · fixture</Text>
            <ProfileHeader name={people[3]!.name} username="alexandria" />
            <UserSummary
              name="Sofía Hernández"
              detail="Uploader · identity from session"
            />
            <Inline>
              <Avatar name="李 明" size="sm" />
              <Avatar name="Amara Okafor" />
              <Avatar name="Noor Ali" size="lg" />
            </Inline>
            <AvatarGroup people={people} max={3} />
            <TextField label="First name" defaultValue="Alexandria" />
            <TextField label="Last name" defaultValue="Montgomery-Williams" />
            <Button
              variant="secondary"
              label="Preview optional photo sheet"
              ref={profileSheetTrigger}
              onPress={() => openSheet(profileSheetTrigger)}
            />
          </>
        ) : (
          <>
            <Text variant="title">Backstory editor · local fixture</Text>
            <ThemeProvider appearance="editor">
              <Surface padding="xl">
                <Stack gap="xl">
                  <Inline>
                    <Text variant="heading">Backstory</Text>
                    <IconButton
                      label="Save local backstory example"
                      icon="check"
                      variant="primary"
                      onPress={() =>
                        setNotice(
                          'Local editor fixture only; no memory was written.',
                        )
                      }
                    />
                  </Inline>
                  <Text variant="quote" tone="secondary">
                    “
                  </Text>
                  <TextField
                    label="Your story"
                    variant="quiet"
                    multiline
                    value={text}
                    onChangeText={setText}
                    placeholder="Made this with my friends…"
                    style={t.primitives.type.body}
                  />
                  <Text variant="caption" tone="secondary">
                    BOND-063/064 · scoped editor adaptation
                  </Text>
                </Stack>
              </Surface>
            </ThemeProvider>
            <Text variant="title">Memory appearance · local fixture</Text>
            <ThemeProvider appearance="memory">
              <MemoryPaletteFixture />
            </ThemeProvider>
            <Text variant="title">Contribution composition · fixture</Text>
            <UploadTile
              phase={phase}
              label="Local photo fixture"
              error={
                phase === 'failed'
                  ? 'Upload example failed. No file was sent.'
                  : undefined
              }
              onRetry={() => setPhase('uploading')}
              onChoose={() => setPhase('uploading')}
            />
            <SegmentedControl
              value={phase}
              onChange={(value) => setPhase(value as typeof phase)}
              options={[
                'empty',
                'uploading',
                'verifying',
                'ready',
                'failed',
              ].map((value) => ({ value, label: value }))}
            />
            <TextField
              label="Preserved caption draft"
              value={text}
              onChangeText={setText}
              multiline
            />
            <ContributorPicker
              people={people}
              selectedIds={selected}
              onChange={setSelected}
            />
            <ContributorPicker
              people={[]}
              selectedIds={[]}
              onChange={() => {}}
            />
            <Text variant="title">Board list composition · fixture</Text>
            <Card>
              <Text variant="heading">An evening by the lake</Text>
              <AvatarGroup people={people} />
              <Badge label="Preview · unpublished" />
              <Button
                variant="secondary"
                label="Inspect local memory"
                ref={sheetTrigger}
                onPress={() => openSheet(sheetTrigger)}
              />
            </Card>
            <ContributorFilterBar
              people={people}
              value={filter}
              onChange={setFilter}
            />
            <Feedback
              message={
                filter
                  ? `Local contributor filter: ${people.find((person) => person.id === filter)?.name}. Spatial layout stays unchanged.`
                  : 'Showing every fixture contributor.'
              }
            />
            <MemoryBoardPreview title="Spatial shell · fixed 308-unit cards">
              <PhotoMemoryCard
                uploader="Amara Okafor"
                caption="The light just before sunset. Missing-media fixture."
                tags={selected.map(
                  (id) => people.find((person) => person.id === id)!.name,
                )}
              />
              <StoryMemoryCard
                uploader="Sofía Hernández"
                text="We stayed until the sky changed. Someone remembered the blanket, and everyone had a story to add. This long paragraph remains readable without a fixed text height."
                tags={['李 明']}
                onOpenRef={storySheetTrigger}
                onOpen={() => openSheet(storySheetTrigger)}
              />
              <PhotoMemoryCard
                uploader="Noor Ali"
                caption="Loading state fixture"
                imageState="loading"
              />
              <PhotoMemoryCard
                uploader="Noor Ali"
                caption="Failed media fixture"
                imageState="error"
                onRetry={() =>
                  setNotice('Local retry requested; no source photo exists.')
                }
              />
            </MemoryBoardPreview>
            <SharedMomentBadge
              evidence="tagged"
              explanation="A contributor explicitly tagged this person."
            />
            <SharedMomentBadge
              evidence="reviewed"
              explanation="A person reviewed this connection."
            />
            <SharedMomentBadge
              evidence="suggested"
              explanation="Unreviewed semantic relation. This does not establish identity or attendance."
            />
          </>
        )}
        <Feedback message={notice} />
      </View>
      <Sheet
        visible={sheet}
        title="Memory detail · fixture"
        onClose={() => setSheet(false)}
        returnFocusRef={activeSheetTrigger}
      >
        <UserSummary name="Amara Okafor" detail="Uploaded by" />
        <Text>Local detail example. Text stays on a stable white surface.</Text>
        <SharedMomentBadge
          evidence="tagged"
          explanation="Explicitly tagged: 李 明"
        />
        <SharedMomentBadge
          evidence="suggested"
          explanation="AI proposed a relation between two stories; nobody has confirmed it."
        />
        <TextField
          label="Local note"
          value={text}
          onChangeText={setText}
          multiline
        />
      </Sheet>
      <ConfirmDialog
        visible={confirm}
        title="Remove local fixture?"
        message="This only updates the gallery status. It does not delete account or memory data."
        confirmLabel="Remove fixture"
        onConfirm={() => {
          setConfirm(false);
          setNotice('Local fixture removal confirmed.');
        }}
        onClose={() => setConfirm(false)}
        returnFocusRef={confirmTrigger}
      />
    </Screen>
  );
}

function MemoryPaletteFixture() {
  const t = useTheme();
  const halos = createPhotoHalos(
    [
      { id: 'warm', kind: 'PHOTO', color: t.semantic.danger },
      { id: 'cool', kind: 'PHOTO', color: t.semantic.suggestion },
    ],
    [
      { id: 'warm', x: 0, y: 0, width: 120, height: 160 },
      { id: 'cool', x: 160, y: 140, width: 120, height: 160 },
    ],
  );
  return (
    <View
      style={{
        width: '100%',
        aspectRatio: 1,
        overflow: 'hidden',
        backgroundColor: t.semantic.background,
      }}
    >
      {halos.map((halo) => (
        <View
          key={halo.id}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: halo.left,
            top: halo.top,
            width: halo.size,
            height: halo.size,
            backgroundImage: halo.backgroundImage,
          }}
        />
      ))}
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          padding: t.primitives.space.lg,
        }}
      >
        <Surface>
          <Stack>
            <Text variant="heading">Amara’s section</Text>
            <Text>Dark surface over photo-local colors.</Text>
            <Text variant="caption" tone="secondary">
              Static color fixture · no track or audio loaded
            </Text>
          </Stack>
        </Surface>
      </View>
    </View>
  );
}
