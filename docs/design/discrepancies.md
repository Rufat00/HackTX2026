# Design discrepancies and verification

The source archive was inspected individually at readable resolution for **149/149** screenshots, with original dimensions and hashes retained. This is reference inspection, not evidence of native implementation fidelity. The implementation currently ships the evidenced light theme.

| Source / concern                    | Decision or discrepancy                                                                   | Resolution / status                                                                                                                                                |
| ----------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| BOND-007/113/127 font               | Exact family, licensing and weight mapping cannot be established from raster screenshots. | Platform System substitute, documented type ladder. Baselines need native comparison.                                                                              |
| BOND-034/056 geometry               | Nominal 3× screenshot scale is inferred; 1179/1180 widths differ by one pixel.            | Use ratios, approximate measurements and native units; no claim of exact reconstruction.                                                                           |
| BOND-010/088/124 gray/status colors | Source small gray/coral/green text can be faint.                                          | Deliberately darker semantic colors; automated contrast checks cover stable surfaces.                                                                              |
| BOND-002/041 circles                | Approximate observed circle size can fall below a 44-unit target.                         | Minimum 44 targets, 52 regular controls; text grows rather than clipping.                                                                                          |
| BOND-028/092 overlapping thumbnails | Decorative reference geometry conflicts with Afterglow memory invariants.                 | Primary cards use width 308, gap 16, vertical grid 8. Static preview illustrates separation only. No packing/camera/ambient-field workflow was added.              |
| BOND-024/053/062 dark media editors | Insufficient evidence for a full dark interface.                                          | Extensible semantic theme interface; light only.                                                                                                                   |
| BOND-018/109 failures               | Account/native upload states differ from phone/story workflows.                           | Shared recoverable fields/feedback, real existing auth/upload behavior retained.                                                                                   |
| BOND-041/058/073 overlays           | Screenshots cannot establish focus, transitions or haptics.                               | Native Modal, Back/close, heading focus and trigger restoration implemented as adaptations. Device verification pending. No haptics claim.                         |
| BOND-042/056 identity               | Reference portraits are private and not licensed demo assets.                             | No source images in app; named initials and missing-media gallery fixtures. Feather icons use the existing Expo dependency.                                        |
| Gallery production boundary         | Expo Router discovers the gallery file in release builds.                                 | Runtime `__DEV__` guard redirects to `/`; lazy fixture import. This is a development route guard, not proof of fixture-code elimination or business authorization. |

## Checks completed in this environment

Archive/evidence integrity is checked by `pnpm design:references:check`, rehashing the preserved ZIP and all imported originals when present. Secure-import tests reject traversal, absolute paths, symlinks and path collisions before extraction. Token generation has a drift check. Component contracts are exercised through inert native hosts using the already installed React server renderer: duplicate-write guards, secure password defaults, field-value/error preservation, checked state and suggestion provenance. These tests do not exercise native layout, autofill, touch, keyboard or focus behavior.

Verified on 2026-10-24:

- `pnpm typecheck`, including generated-token drift validation: passed across the workspace.
- `pnpm lint` and `pnpm format:check`: passed.
- `pnpm test`: 41 passed, including 9 native component contract checks and 4 semantic contrast checks.
- `pnpm design:test:import`: 3 secure-import regression tests passed.
- `pnpm design:references:check`: all 149 individual inspection records validated; source ZIP and every original rehashed successfully.
- `pnpm install --frozen-lockfile`: passed; the existing Expo-compatible icon package is now a pinned direct dependency.
- Expo release exports for Android and iOS: passed. Release asset metadata excludes Bond reference images/archive. Exports are compilation evidence only.
- Comparison CLI help/argument setup checked; no visual comparison was generated without a native capture.

The existing foundation integration suite is unchanged and was not rerun in this UI task; no database/provider behavior changed.

## Native visual matrix — pending device access

No Android SDK/emulator, connected native device, or iOS simulator is available in this Linux/WSL environment. **No native screenshots, device rendering or side-by-side fidelity results are claimed.** Browser screenshots were not substituted. Both Android and iOS bundle exports validate compilation only.

| Viewport / setting                   | Gallery scenarios                                                                  | Native result |
| ------------------------------------ | ---------------------------------------------------------------------------------- | ------------- |
| 360 × 800                            | Auth, errors, field focus/open keyboard, sheet, failed upload                      | Pending       |
| 390 × 844                            | Auth/profile, long story, missing/loading photo, empty contributors                | Pending       |
| Wider phone, e.g. 430 × 932          | Wrapping controls, identity row/group, static spatial-card gaps                    | Pending       |
| Native large text                    | Long Unicode names, button wrapping, sheet keyboard scroll, password autofill      | Pending       |
| VoiceOver / TalkBack; reduced motion | Heading focus, background exclusion, close/Back, focus return; transition disabled | Pending       |

The gallery width controls bound a preview inside the actual device viewport; they are not device emulation. The ×1.3 toggle simulates component typography only; use actual OS font settings for acceptance, especially native inputs and overlays.

## Comparison protocol

1. Open `/gallery` in a development build; select the representative pattern. Record platform/OS, real logical viewport, native font scale and reduced-motion setting.
2. Capture the actual native screen. Keep private captures under ignored `design/reference/verification/`. Choose a source ID with comparable anatomy (007 form hierarchy, 113 profile, 073 sheet, 127 card/list framing).
3. Crop matching app-owned regions at a matching aspect ratio. Exclude Mobbin footer, platform chrome, keyboard, and unrelated photo content. Do not compare a full Bond product screen to a different Afterglow flow.
4. Use `pnpm design:compare --reference '<source.png>' --capture '<native.png>' --reference-crop x0,y0,x1,y1 --capture-crop x0,y0,x1,y1 --device 'device, OS, font scale' --mask x0,y0,x1,y1 --out design/reference/verification/comparison.png`. Repeat `--mask` as needed; mask coordinates use the normalized 390-pixel comparison width. The output has reference/native/difference columns and a JSON record of crops/masks/device. Resizing requires matching crop aspect ratios; difference pixels are not a fidelity score.
5. Review spacing, rounded corners, typography baselines, wrapping, clipping, target size and stable contrast. Record source IDs, native capture paths and actual observed discrepancies here. Fix regressions, then re-capture.

No comparison artifact has been generated without a genuine native capture.

## Expo Go runtime compatibility follow-up — 2026-10-24

A phone reached the public Expo tunnel with an Expo Go 58 client but fetched a project manifest for SDK 55; no JavaScript bundle was requested before the user reported returning to the iPhone Home Screen. This establishes an unsupported runtime mismatch, although no native crash report was available to prove the crash cause.

The app was upgraded to Expo 58.0.19, React 19.3.0 and React Native 0.88.0, with Expo-selected native package versions and pinned runtime peers. Native refs use `ViewInstance`, and modal focus uses `AccessibilityInfo.sendAccessibilityEvent` rather than a deprecated numeric node handle. Shared visual tokens and product workflows are unchanged.

All 41 tests, lint, SDK dependency compatibility and native TypeScript checks passed after alignment. The public manifest now reports SDK 58.0.0. Actual successful gallery rendering on the user's phone remains unconfirmed until the corrected QR is scanned; tunnel HTTP checks are not native rendering evidence. The public preview exposes Expo development source/bundles/endpoints only; authenticated API and private storage were not tunneled.

## Auth and app shell refinement — 2026-10-24

User-requested scope: replace the crowded account forms with reference-informed login/two-step signup; add Home, central Add, Friends, top search/avatar and profile Back navigation. BOND-002/007/023/110 originals were re-inspected. Large left-aligned hero typography and subtle field baselines adapt their spacing/input hierarchy rather than claiming an exact clone. All name/credential fields still use TanStack Form and the real API. Existing profile edits/uploads/sign-out remain available. Home/Friends have empty states; search is local and creation is explicitly unavailable until the next form task. No reference photos or screenshot crops were added to the bundle.

Native screenshot, keyboard/autofill, VoiceOver and large-text checks on the user's iPhone remain pending; no native visual fidelity result is claimed from compilation.

Validation for this refinement: mobile TypeScript, mobile ESLint, generated-token drift and targeted formatting checks passed. All 41 existing tests passed. An iOS release export compiled 1,471 modules successfully; its asset metadata contains no Bond reference imagery. This export is compilation evidence, not a device screenshot or native interaction test.

## Working creation and public sharing — 2026-10-24

BOND-063/064 originals were re-inspected alongside the supplied screenshots. High confidence: dark context, rounded writing surface, large quote mark, subdued date, photo above editor and circular check. Adaptations: solid surfaces, System type, scalable ordinary prose, separate non-overlapping photo/editor regions, no fake voice control, explicit saved/pending/published status. This scoped dark editor does not establish a global dark theme. The center Add placeholder was replaced by the authenticated collection/composition/sharing workflow. Home and Friends now read real board lists; username selection grants actual contribution membership.

No new screenshot/reference asset entered application imports. Actual iPhone rendering, keyboard/large-text/VoiceOver behavior, two-axis gesture feel and native animated ambient colors remain pending device observation. No fidelity or performance result is claimed from typechecking or release exports.

Creation verification: 45 ordinary tests and 19 integration tests passed, including the concurrent draft retry fix, board/media authorization, public snapshot stability, immediate suppression and public HTTP rendering. Workspace TypeScript, ESLint, generated-token checks and the iOS release export passed. These results do not replace the pending iPhone visual/interaction matrix.

Upload/form follow-up: removed auth eyebrow/subtitle copy, creation slogans/privacy footer, repeated editor save explanation and long sharing instructions. Kept the existing reference-informed typography, field/control anatomy, quote editor, meaningful status and public visibility confirmation. No new visual tokens or source-image assets were added. Form-copy changes are not claimed as screenshot-verified.

## User-requested memory view — 2026-10-25

The later explicit request supersedes the original 308-unit/16-gap canvas recipe: active geometry is `constellation-v2`, varied and irregular but nonoverlapping, with zero photo/story padding. Dark square viewport, centered contributor song, photo-local radial gradients and directional gradient fog are user-directed adaptations. Fog is not a backdrop blur. Existing published snapshots retain their saved geometry until recomposed and republished. iTunes previews provide streamed audio, not Instagram’s licensed full-track catalog. Native appearance, gesture behavior and audible playback still need iPhone validation.
