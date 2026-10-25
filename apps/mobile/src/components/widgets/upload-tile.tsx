import { Button, Card, Feedback, LoadingIndicator, Text } from '../ui';
export function UploadTile({
  phase,
  label,
  progress,
  error,
  onRetry,
  onChoose,
}: {
  phase: 'empty' | 'uploading' | 'verifying' | 'ready' | 'failed';
  label: string;
  progress?: number;
  error?: string;
  onRetry?: () => void;
  onChoose?: () => void;
}) {
  const percentage =
    progress !== undefined && Number.isFinite(progress)
      ? Math.round(Math.max(0, Math.min(1, progress)) * 100)
      : null;
  return (
    <Card>
      <Text variant="label">{label}</Text>
      {phase === 'uploading' || phase === 'verifying' ? (
        <LoadingIndicator
          label={
            phase === 'verifying'
              ? 'Checking and saving…'
              : percentage === null
                ? 'Uploading…'
                : `Uploading ${percentage}%`
          }
        />
      ) : (
        <Text>
          {phase === 'ready'
            ? 'Saved'
            : phase === 'failed'
              ? 'Upload failed'
              : 'Choose a photo when you are ready.'}
        </Text>
      )}
      {error ? <Feedback error message={error} /> : null}
      {phase === 'failed' && onRetry ? (
        <Button label="Retry upload" variant="secondary" onPress={onRetry} />
      ) : null}
      {(phase === 'empty' || phase === 'ready') && onChoose ? (
        <Button
          label={phase === 'ready' ? 'Replace photo' : 'Choose photo'}
          variant="secondary"
          onPress={onChoose}
        />
      ) : null}
    </Card>
  );
}
