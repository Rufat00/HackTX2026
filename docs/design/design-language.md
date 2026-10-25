# Afterglow design language

The source is the preserved **Bond ios Aug 2026.zip**, not a web recreation. All 149 individual screenshots were inspected; see [the audit](reference-audit.md), [manifest](../../design/reference-manifest.json) and [measured evidence](../../design/evidence.json). These rules adapt the recurring visual language to Afterglow. They do not import Bond's phone/OTP, recommendations, voice recording, guided stories, social counts or account deletion features.

## Surfaces and hierarchy

Use the light neutral field observed in BOND-023/034/127 (flat RGB 246/246/246), brighter white cards, near-black actions and subdued supporting text. Keep photo-derived ambient color behind stable card/control surfaces. Ordinary screens are light. Dark media/editor contexts in BOND-024/053/062 do not establish a complete dark mode.

BOND-034/051/127 show large rounded white surfaces with generous inset content; BOND-041/073 show even rounder sheets. Use 24-unit ordinary cards and 32-unit sheets. The static gallery retains the original 308-unit spatial card fixture. The active memory canvas follows the user’s later request: varied widths, full-bleed photos, zero photo/story padding, and irregular placement without a uniform gutter. Never overlap primary memory cards, even though Bond's decorative story thumbnails tilt and overlap (BOND-028/092).

## Typography and density

The original font family, license and weight mapping are unknown. Use the platform **System** sans as an available substitute, with regular body, medium labels and semibold headings. The condensed sticker face and handwritten text in BOND-017/065 are specialty presentation, not a body-font system. Body is 16/24, caption 13/18, title 24/30 and display 32/38. Typography remains scalable; heights are minimums and text wraps. Exact source line-height cannot be reconstructed from raster glyph bounds.

Page gutters are 16. Use a restrained 4/8/12/16/24/32/48 spacing ladder, inferred from repeated ratios in BOND-034/056/127. Major sections breathe; related field labels/errors stay close. Use left alignment for editable forms and lists, centered identity/empty-state compositions where supported by BOND-007/054/113. Avoid centered paragraphs in long stories.

## Imagery, identity and cards

Reference photos, portraits, branding, QR codes, textures and third-party logos remain in the ignored reference archive. They are never production assets. Gallery examples use labeled deterministic text and missing-media fixtures, not personal photos. Production photo widgets accept authorized native image sources from their feature.

Photo memory anatomy: reserved media area, caption on white, uploader identity, explicit tagged people, and separate suggestion evidence. Story memory anatomy: readable prose on white, attribution and optional detail action. Never place memory body text directly on a changing photo or ambient field. Avatars are circular with initials fallback (BOND-042/056). Only avatar groups may overlap, with a visible ring; names remain available to assistive technology.

## Actions, fields and navigation

BOND-001/017/034/073 establish black rounded primary actions and white/pale secondary actions. Circular outline-icon controls recur throughout. Feather's MIT-licensed glyphs through Expo are a substitute for the unknown original icon set. Text labels accompany consequential actions. Minimum touch target is 44; regular buttons/fields are at least 52 high and grow with text.

BOND-043/070/075 support explicit checks for selection. Chips and segmented controls expose selected state, not hue alone. Navigation stays in screen space, distinct from future world-coordinate cards. The requested app shell has Home and Friends tabs with a primary Add action between them, plus search and profile access above. These destinations currently show honest empty states; the Add sheet reserves the creation flow for the next task. No board or friendship data workflow is implied by this navigation.

Afterglow uses persistent username/password identity. Visible labels, secure-entry/autofill behavior and server field errors supersede Bond's phone/OTP forms. Shared field adapters connect TanStack Form to the same primitives. Errors preserve input, name the problem and offer a real retry. No fake reset-password link.

## Feedback and overlays

Loading copy (BOND-019/031/032), skeletons (051), preserved-draft failures (018/109), empty states (054), pending state (116) and successful selection (047/085) are observed. Upload progress, keyboard focus rings, pressed appearance and reduced-motion handling are **Afterglow adaptations**. No motion or haptic timing is claimed from screenshots.

Use native Modal-backed sheets/dialogs with an explicit close/Cancel, Android Back, VoiceOver/TalkBack modal semantics, initial heading focus and restoration to the triggering control. BOND-058/121/146 support destructive confirmation; our dialog uses a solid surface instead of copying translucent platform blur. Sheet content scrolls above the keyboard. Disable duplicate confirmation while pending and preserve nearby error feedback.

## Accessibility adjustments

The observed secondary gray and coral/green statuses can be too faint for small text. Semantic secondary, danger and success colors are deliberately darker adaptations; token checks verify text contrast on stable surfaces. Focus uses a visible outline and controls expose roles/states. Skeletons are decorative with a separate loading announcement. Reduced motion disables modal transitions; no skeleton shimmer is introduced.

Correct: one primary action, quiet supporting copy, explicit named attribution, stable white story surface, visible card gaps, recoverable inline error. Incorrect: all-blue primary actions copied from Bond's connection requests, handwritten body text, unexplained photo identity inference, overlapping story cards, fixed-height text rows that clip at large font sizes, or attaching screenshot crops as UI.

## Auth and navigation refinement — 2026-10-24

Re-inspected BOND-002, 007, 023 and 110 individually from the preserved originals. High-confidence observations: generous neutral margins, large name inputs, circular controls, sparse three-icon navigation, and a pale search capsule. The centered lowercase Afterglow wordmark, left-aligned 48/54 hero type, subtle input baselines, two-step username signup, Home–Add–Friends ordering, and creation placeholder are explicit Afterglow adaptations requested in this task. The original font and exact native type metrics remain unverified. Search currently edits local query text against an empty collection; it does not claim a server search or friendship workflow.

## Memory canvas adaptation — 2026-10-25

The user explicitly requested a dark square viewport, irregular photo/story placement, centered contributor songs, photo-local color blending and fog where exploration can continue. These are user-directed adaptations, not inferred Bond evidence. Primary content remains nonoverlapping. Photo-centered native radial gradients blend across contributor sections; directional linear-gradient fog fades out at actual world boundaries. Fog is a gradient treatment, not a measured Gaussian blur. Other screens retain the light theme. Native visual acceptance is pending.
