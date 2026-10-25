import { lazy, Suspense } from 'react';
import { Redirect } from 'expo-router';
import { LoadingIndicator, Screen } from '../components/ui';
const Gallery = lazy(() =>
  import('../features/design-gallery/gallery-screen').then(
    ({ GalleryScreen }) => ({ default: GalleryScreen }),
  ),
);
export default function GalleryRoute() {
  if (!__DEV__) return <Redirect href="/" />;
  return (
    <Suspense
      fallback={
        <Screen>
          <LoadingIndicator label="Loading gallery…" />
        </Screen>
      }
    >
      <Gallery />
    </Suspense>
  );
}
