# Agent instruction 2 — Extract Bond's design language and implement Afterglow's UI system

Work in the Afterglow repository after the foundation task. Read root `AGENTS.md`, the product specification and existing theme/components first. Your input is a ZIP containing approximately 140 Mobbin screenshots of “Bond — Turn memories into discoveries.” Inspect the actual archive before making visual claims. Do not use a web search result or a remembered idea of Bond as a substitute for these screenshots.

The task is to derive an evidence-backed visual system, implement native React Native theme variables and reusable primitives/widgets, and write a design contract that keeps future features consistent. Build a development gallery and a few representative composition examples. Do not implement the entire social product or reconstruct 140 screens.

## Input handling and complete inspection

If the ZIP is missing, report that the archive is required for extraction. You may set up the inventory format and gallery plumbing, but do not invent reference colors, fonts, tokens or “Bond-like” screens. Do not treat an unrelated archive as the reference.

Preserve the source archive. Extract into ignored `design/reference/bond/`. Reject archive traversal paths, absolute paths and symlinks escaping the target. List every image with stable ID, original filename, dimensions and hash in `design/reference-manifest.json`. Exclude operating-system metadata from the screenshot count and report the actual count rather than forcing it to 140.

Generate numbered contact sheets and inspect every screenshot individually at readable resolution. Contact sheets organize the set; they do not replace individual inspection. Group screenshots into flows and screen families, identify near-duplicates and UI states, and distinguish system dialogs, keyboard, photo content and platform chrome from app-owned design. Preserve original IDs when deduplicating. Record which images were inspected.

## Evidence before theme values

Create `docs/design/reference-audit.md` and `design/evidence.json`. Each important conclusion needs source IDs, a crop or region description, approximate measurement, confidence and a note saying whether it is observed, inferred or an Afterglow adaptation. Inspect text and shapes directly; OCR and pixel sampling are supporting tools only.

Raw screenshot pixels are not automatically React Native density-independent units. Group images by device size; infer logical dimensions only when supported, documenting scale uncertainty. Measure padding, gap and radius ratios as well as approximate values. Treat text rendered into photos separately from actual UI typography.

Infer font family only where evidence supports it. Screenshots alone rarely establish an exact font license or weight mapping. Record unknowns; use a documented available font substitute and retune line heights if needed. Do not claim a lookalike font is the original. Infer motion, haptics and interaction from static screens only as explicit proposals; do not label them extracted facts.

Identify the recurring language across onboarding, authentication, navigation, lists, profile, cards, forms, sheets and dialogs. Capture supported loading, error, empty and selected states. If a state does not appear in the references, design a consistent adaptation and label it as such.

## Required design deliverables

Create these files with real findings, not placeholder prose:

- `docs/design/design-language.md`: surfaces, typography, density, alignment, imagery, icon language, card anatomy, controls, navigation, sheet/dialog behavior and examples of correct/incorrect composition. Include the evidence/assumption boundaries.
- `design/tokens.json`: machine-readable primitives, semantic roles and component tokens. Track evidence separately so runtime values remain compact.
- `apps/mobile/src/theme/`: typed token exports, semantic theme interface, ThemeProvider and hooks using the project's existing React Native styling approach.
- `docs/design/components.md`: catalog with purpose, public props, variants, size rules, states, accessibility, anatomy and screenshot references. Separate primitives from product widgets.
- `docs/design/screen-recipes.md`: reusable recipes for auth, profile, board list, contribution flow, card detail and spatial board shell. Identify direct reference patterns and adapted patterns.
- `docs/design/quality-checklist.md`: practical checks every future UI change must pass.
- A development-only gallery route with all implemented variants and states, plus representative auth, profile and memory/contribution examples composed from those components.
- A narrowly scoped `apps/mobile/AGENTS.md` containing the mandatory design workflow and links to these files. Preserve and follow the root development rules.

Keep reference screenshots and contact sheets out of the production app bundle. Use supplied demo assets, licensed icons and permitted fonts. Do not turn reference screenshots, branding or private user photos into production assets.

## Token architecture

Use three layers:

1. Primitive values: measured palette entries, spacing scale, type sizes/weights/line heights, radii, borders, opacity, shadows/elevation, icon sizes, control dimensions and safe-area-aware layout limits.
2. Semantic values: background, surface, elevated surface, text primary/secondary/disabled, accent, selected, border, focus, danger, success and overlay roles.
3. Component values: button, field, card, chip, avatar, navigation and sheet tokens where consistent exceptions are evidenced.

Do not infer surface colors from photos or screenshot averages. Use flat app-owned regions and repeated measurements. Do not invent dark mode if the reference set only supports light mode; make the theme interface extensible and ship the evidenced theme first. Native mobile theme variables are typed TypeScript values accessed through the theme layer, not CSS custom properties. A later web target can receive a generated CSS mapping.

Choose one source of truth and generate derived exports if useful; do not maintain independently drifting JSON and TypeScript token values. Provide a check that catches out-of-sync generated output. Use color tokens for stable card surfaces independently of the ambient photo-driven field.

Component styles must use tokens. Permit raw values for percentages, flex, zero, measured geometry, image aspect ratios and camera transforms where they are not design tokens. Do not manufacture meaningless spacing tokens for algorithmic coordinates. For a new visual value, first reuse a role or document a justified token extension.

## Primitive and widget scope

Implement roughly 18–24 meaningful primitives, consolidating equivalents rather than chasing a quota. Cover layout (`Screen`, `Stack`, `Inline`, `Surface`, `Divider`), typography (`Text` with semantic variants), actions (`Button`, `IconButton`), forms (`TextField`, `PasswordField`, `Field`, `FormError`), identity (`Avatar`, `AvatarGroup`), selection (`Chip`, `SegmentedControl`), presentation (`Card`, `Badge`), feedback (`LoadingIndicator`, `Skeleton`, `EmptyState`) and overlays (`Sheet`, `ConfirmDialog`, contextual feedback). Prefer extending a well-fitting existing primitive to introducing duplicates.

Widgets should compose these primitives: UserSummary, ProfileHeader, PhotoMemoryCard, StoryMemoryCard, ContributorPicker, ContributorFilterBar, SharedMomentBadge, MemoryBoardPreview, UploadTile with progress/failure/retry, and optional MusicCard. Build only the interactions supported by the scaffold and use labeled deterministic fixtures for future-domain examples. A complex widget has one meaningful contract, not a pile of uncontrolled style props.

Every interactive component needs appropriate default, pressed, focused, disabled, loading, selected and error behavior as relevant. Avoid nonsensical states such as an interactive disabled divider. Keep accessibility labels, roles, scalable text, touch targets and focus behavior in the component contract. Follow native keyboard and screen-reader conventions. Use platform adapters for shadows and elevation where necessary.

Forms integrate TanStack Form through reusable field adapters. Keep transport validation schemas shared and business validation authoritative on the server. Preserve typed input and field errors. Test keyboard avoidance, password autofill and secure text input. Do not copy web-only HTML or shadcn components into native code.

## Afterglow constraints override screenshot layouts

Use Bond as evidence for visual language and reusable patterns. Adapt those patterns to Afterglow's content rather than importing unrelated Bond product behavior.

- The spatial board is structured masonry extending in both axes, not a vertical-only feed.
- Primary photo, story and optional music cards never overlap. Gutters stay visible. Decorative stickers are optional later and cannot obscure content.
- Use the product specification's 308-unit canonical card width, 16-unit minimum world gutter, fine vertical packing grid and scale contract until a measured usability issue justifies an explicit spec change.
- Readability at phone entry scale takes priority over fitting the whole board onscreen.
- Ambient background blends continuously from nearby photo palettes. Do not map each semantic group to a flat discrete background or animate a hard zone switch.
- Card text, labels and controls retain stable contrast as ambient color changes.
- Contributor attribution, tagged people and AI-suggested relationships remain distinct.
- Music is optional. No fake playback, placeholder social counts or nonfunctional controls disguised as finished features.

## Visual verification

Build a test matrix around 360×800 and 390×844 logical sizes, plus a wider phone and large-text setting. Include long names, long stories, missing avatars, loading images, upload failures, empty lists, focused fields and open keyboards. Verify native rendering; browser screenshots alone are insufficient. State exactly which platforms/devices were exercised.

For representative patterns that can be compared fairly, render the implementation at a matching aspect ratio and make labeled side-by-side comparisons or overlays with the source. Mask different photo content, status bars and keyboard regions when evaluating spacing/type fidelity. Do not optimize an arbitrary global pixel score at the expense of actual component geometry.

Check token consistency, spacing hierarchy, typography baselines, line wrapping, safe areas, clipping, readable contrast, native touch targets, selected states, keyboard behavior and reduced motion. Maintain a discrepancy log with source IDs, explanation and resolution. Review the gallery after each significant component batch.

Deliver the real theme and component code, reference evidence, gallery, screen recipes and final design rules. Run relevant type/lint/component checks. Report observed patterns, uncertain details, intentional adaptations and remaining limitations honestly. Do not claim all 140 references were inspected unless the manifest supports that claim.

## Required workflow for every later feature

Make this persistent in `apps/mobile/AGENTS.md`:

1. Read the design language and closest screen recipe before coding.
2. Inspect the existing gallery and choose reusable primitives/widgets.
3. If a pattern is absent, review the relevant source IDs before proposing a new token or component.
4. Compose the feature from the system; keep route files thin and domain-specific data out of primitives.
5. Implement loading, error, empty, success, pending and disabled states as relevant.
6. Verify the phone layout, keyboard/safe areas, text scaling, accessibility and long-content cases.
7. Update the catalog/gallery and discrepancy log when extending the system.
8. Report the visual checks performed. Never quietly replace the system with generic defaults or hardcoded styles.
