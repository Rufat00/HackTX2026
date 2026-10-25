# Screen recipes

These compose the [catalog](components.md) and follow [design language](design-language.md). Future-domain compositions in the gallery are local deterministic examples, not working board endpoints.

## Auth

Sources BOND-001/002/007/008/018: generous neutral space, centered wordmark, large editable text and a black primary action. `AuthFrame` keeps the heading, fields and bottom actions apart while allowing keyboard scrolling. Login uses quiet username/password fields. Signup first collects separate first/last names, then username/password; Continue validates names locally and final submission validates the full shared contract. Back and mode switching preserve input and clear obsolete errors. All credentials use real existing auth workflows, pending controls and nearby recoverable feedback. No phone/OTP/recovery controls.

## Profile

Sources BOND-012/013/113/134/138/140: centered Avatar/ProfileHeader, names and secondary identity metadata, explicit edit/photo action. Adaptation: use editable first/last fields on stable Surface, actual private upload workflow and initials fallback. Keep previous photo until verified replacement. Local image/read errors provide retry. Sign out revokes the session and clears private state; no unsupported account-delete/share controls.

## Board list

Sources BOND-125/126/127: section heading, white rounded list cards, small thumbnail/attribution and subordinate metadata. Adaptation: board title/event date, named contributors and pending/published labels with real counts only. Cursor lists remain virtualized when implemented. EmptyState offers an actual create action only when that flow exists. The gallery uses fixture cards and local detail sheets.

## Contribution

Sources BOND-014/017/018/051/073/075/109: image frame or text surface, explicit named tags, nearby pending/error feedback. Adaptation: UploadTile with authoritative phase or genuine progress, preserved story/caption, ContributorPicker with explicit checkbox selection, and primary save. Upload failure keeps content and retry. Do not simulate saved/published writes; gallery Retry only changes a labeled local fixture. Voice/stickers remain deferred.

## Card detail

Sources BOND-054/055/083/088/089: Sheet, stable white content, identity rows and explicit provenance. Adaptation: full photo/story, uploader, separately tagged people, then semantic suggestion badge with explanation. A suggestion never confirms attendance. Close/Back restores focus and future camera state. ConfirmDialog is reserved for actual destructive actions or a clearly labeled gallery-only confirmation.

## Spatial board shell

Source patterns BOND-028/034/127 provide typography, framing and filtering language only. Adaptation: fixed screen-space header and ContributorFilterBar, irregular, varied-width nonoverlapping cards in the active canvas, both horizontal and vertical exploration, stable high-contrast text/control surfaces over continuous photo palette field. Never fit the whole memory to unreadable scale or color by semantic cluster. MemoryBoardPreview is a bounded static fixture illustrating gaps; it is not a functional canvas and does not claim panning or AI publication.

## Main shell

BOND-023's sparse navigation and BOND-110's pale search capsule inform the requested shell. Home is left, the black circular Add button is central, Friends is right. Search and the signed-in avatar sit above the content; avatar opens the real profile editor with Back navigation. Home/Friends contain empty states without invented activity. Search now queries bounded memory lists. Add opens the working creation flow described below. Native safe areas and tab selection semantics remain active. Search preserves separate drafts per tab and the tab bar hides while the keyboard is open.

## Working memory creation — 2026-10-24

The center Add action now opens saved memory creation. Title/date are optional; a collector then presents photos, story items and searchable songs with explicit draft/upload status. The editor re-inspects BOND-062/063/064 and the user-supplied screenshots: dark field, circular Back/Done, photo above a generously rounded quote surface, plain white body and subdued date. This is a scoped editor appearance, not global dark mode. Solid surfaces replace unverified blur; System replaces the unverified handwritten face; voice remains absent. The writing surface and preview photo do not overlap.

The owner composes a revision into a native, two-direction scrolling square preview. Contributor sections use irregular nonoverlapping full-bleed cards and a centered optional song. The preview distinguishes Basic grouping from AI-proposed grouping. Sharing offers named contributor selection, explicitly confirmed public posting, private publication and unpublishing. A public share link opens the escaped read-only page without an account. Home loads saved drafts and public posts; Friends loads actual board memberships. Existing empty/search/error/retry states remain.

Form copy refinement: auth uses its wordmark, concise title, fields and actions; creation uses optional title/date and Continue; the editor retains its quote surface and character count without an instructional footer. Sharing keeps one-line access explanations and the explicit public-post confirmation. Error messages and actual upload/saved/pending states remain visible.

The memory view uses the scoped dark appearance and a square viewport. Photo-local radial fields remain anchored to world coordinates. Fixed fog overlays appear only toward unexplored content. The song picker searches titles/artists with debounce, shows artwork and real preview playback, preserves selection on failures and replaces the contributor’s existing song. Previews have provider attribution and an Apple Music link; unavailable previews cannot be selected. Playback is user-initiated and pauses when leaving.
