# Afterglow product specification

This is the product behavior reference. For the native scaffold, the bootstrap prompt supersedes guest-only identity, web-specific rendering and technology examples. The persistent root AGENTS.md and the active task define implementation scope.

# 1 Afterglow product design and implementation specification

Version 1.0  |  24 October 2026  |  Product and engineering handoff
Afterglow is a collaborative spatial memory social post. People contribute fragments of one event, and AI helps organize those fragments into an explorable space that preserves different perspectives and reveals shared sub-moments. Build the complete path from three contributors to a shared, readable memory canvas first.
## Product vision
A conventional post presents one selection of an event. Afterglow lets a group share how it felt: arrival, a funny exchange, the peak of the night, and the quiet walk home. Photos and short stories remain the evidence. AI proposes organization and short labels; contributors retain authorship and control.
The primary user is a small group remembering an event together. The secondary user is a friend opening their shared memory link. The unit of content is one memory board, not an endless feed. A board should feel inviting within seconds and remain understandable on a phone.
## Binding design decisions
Use a structured two-dimensional masonry grid with deliberate, visible spaces between cards. Photo, story, and music cards align to a common grid. Content cards never overlap. Optional decorative stickers may overlap card edges but must not cover text, attribution, or controls.
People pan left, right, up, and down through a finite content space with a generous surrounding margin. This is not a vertical-only masonry feed. Semantic regions are navigational groupings, not hard color zones. Nearby photo palettes continuously influence a soft ambient background; crossing a region boundary must never trigger a discrete color switch.
## First release outcome
Three people add 2 to 5 photos each, short text, and explicit people tags. A generation action produces 2 to 5 named groups, contributor labels, a shared-moments view, and a stable spatial layout. Music is optional and never blocks the experience. A silent board is complete.
The hackathon target is a working end-to-end prototype within 24 elapsed hours, including 7 hours of sleep and 2 hours of meals and breaks. Story mode, generative stickers, video, recorded audio, games, and real-time co-editing are deferred.
## Reading order
Sections 2 to 5 define the experience and geometry. Sections 6 to 9 define AI, overlap, atmosphere, and architecture. Sections 10 to 13 define storage and API contracts. Sections 14 to 17 define scope, work, acceptance, and the demo.

# 2 User flows and permissions

## Create and invite
The owner creates a memory with a title and optional event date. The board starts as a draft with the owner as a contributor. The owner copies a contribution invite link and sends it outside the app. Opening the link shows the board title and a Join action, then creates a session-bound participant. A contributor invite grants contribution access; a viewer share link grants read access only.
The prototype uses server-issued guest sessions with an opaque cookie and invite tokens. Display names identify attribution in the UI but never serve as authorization. A browser session can belong to multiple boards. A participant cannot impersonate another participant by changing a request field.
## Contribute
A contributor uploads photos or adds a short story, writes a caption, and selects participants in a people picker. Person tags mean “this person is part of this memory”; they do not imply that the person uploaded it. Show the uploader separately on every card. Optional mood chips are user supplied hints, not diagnoses.
Validate files before committing a card. Show upload progress and preserve draft text if upload fails. Let people retry or remove a failed file. Each successful contribution enters the draft list immediately; it does not rearrange an already published canvas.
## Organize and publish
The owner selects Organize memories. The app snapshots the current content revision, runs analysis and packing, and shows a preview with proposed group titles and shared moments. The owner can rename a group and remove an item; manual group reassignment is deferred. Publish atomically activates that layout and creates a viewer share link. Repeated publish requests must not create multiple revisions.
New contributions after publication appear in a pending list. The owner can organize again and publish a new revision. Until then viewers see the previous complete revision. Never make cards jump while a visitor is exploring.
## Explore and inspect
A viewer opens the published board at the central entry cluster, pans to another group, taps a card to expand, and optionally filters by contributor or shared moments. Closing detail restores the exact previous camera and focus. A Home control recenters the entry cluster; group chips jump to other groups.
## Roles and removal
Owner: edit board metadata, invite or revoke contributors, remove any card, generate, publish, and delete the board. Contributor: add content, edit or remove their own content, and edit their own person tags. Viewer: read the published revision only. Owner removal overrides contributor ownership. Revocation blocks future access and invalidates share tokens as appropriate.
Before sharing, explain that anyone holding the viewer link can view the board. Tags never expand access. Deleting a published item must immediately suppress it from all revisions and later delete its stored media; a full rearrangement is not required for removal.

# 3 Phone layout and visual interaction

## Screen composition
Use a quiet header with board title, back navigation, and contributor avatars. Below it, place a horizontally scrollable control row with All, contributor names, and Shared moments. Anchor Add memory for contributors and Home for everyone above the safe area. Keep music controls separate and visible only when configured. Controls remain in screen space while cards move in world space.
The initial camera is at a readable scale of 1.0, centered horizontally on the entry group and aligned to its top. At a 390 CSS pixel viewport, a 308 pixel card plus 16 pixel gutters occupies most of the width. One primary card is readable while neighboring cards hint that the space continues. Do not shrink the entire board to fit a phone on entry.
## Card templates
Photo cards use a consistent width, an image region with reserved intrinsic aspect ratio, then a caption and attribution. For extreme ratios outside 0.67 to 1.8, use a fitted thumbnail with a neutral matte; detail shows the full image. Reserve the final measured height before packing. Story cards show up to 600 characters with a Read more action after a measured 10-line preview. Never put unreadable text directly on a photo.
Use a stable light card surface and dark type independent of the ambient color. Body copy is 16 CSS pixels at scale 1; attribution is 13 pixels or larger. Card padding is 16 pixels, corners 16 pixels, and shadows remain subtle. Contributor avatars and names are present on each card. Cluster labels use real text and occupy their own collision-checked rectangles.
## Detail and discovery
Tap opens a full-height sheet on phones and a dialog on larger screens. Show the complete photo or story, uploader, explicit people tags, cluster label, and an explanation for suggested related content. Escape and Back close the sheet. Trap focus only while the dialog is open; restore it to the original card afterward.
Contributor highlighting outlines matching cards and reduces nonmatching emphasis without moving or removing them. An additional “Tagged with this person” control switches from uploader to tagged-person membership. Shared moments highlights only confirmed shared content, with an option to inspect suggestions separately. Never communicate authorship or shared status using color alone.
## Accessibility and optional decoration
Provide a List view in cluster and item order, keyboard reachable cards, visible focus, group jump buttons, and directional pan buttons. Use 44 by 44 CSS pixel touch targets as the product standard. Test normal text contrast at 4.5 to 1 and large text at 3 to 1 on the actual card surface [2]. Reduced motion removes inertial and camera animations and uses a static neutral ambient background.
Stickers are deferred. If later enabled, cap each at 80 world units and two per group. They are decorative, pointer-events none, and excluded from packing; put them behind protected content and never across a control target.

# 4 Spatial packing algorithm

## Geometry and invariants
Store canonical world coordinates in CSS pixels at scale 1. Use horizontal pitch p = 324, composed of a 308-unit card slot and a 16-unit gutter, and vertical pitch r = 8. A card occupies one column in the MVP. Its row span is ceil((measuredHeight + 16) / 8), and its packed rectangle height is rowSpan * 8 - 16. This adds less than 8 units of internal whitespace; short quotes stay short. The content frame can contain internal whitespace; it must never stretch photos to fill the slot.
Measure each card offscreen at the canonical width after fonts and image metadata are ready. Include attribution, padding, and text preview in the measurement. Labels are one-column grid blocks measured the same way. Font or caption changes require a new layout generation. All collision tests include content and labels, not decorative stickers.
## Deterministic two dimensional masonry
1. Sort clusters by descending item count, then smallest member item ID; derive cluster UUIDs from layout ID and sorted member IDs. Choose the largest as the entry group at the origin. Order items inside each cluster by capture time when explicitly available, otherwise creation time, then ID. Save this order for List view.
2. Pack each cluster into three local columns. For each item, choose the column with the lowest occupied row; ties go left to right. Put the label above those columns. This is a quantized masonry shape with visible gaps, not a stack of overlapping cards.
3. Center the first cluster around world x = 0 and put its top at y = 0. Place remaining cluster boxes at offsets (324*u, 324*v) from that origin, enumerating integer (u,v) in expanding square rings. Allow negative x and y. Inflate cluster boxes by 162 units on all sides for intergroup breathing room.
4. Reject a candidate if its inflated box intersects any placed inflated box. For valid origins, score compactness plus semantic proximity: score = 0.35 * distanceToOriginCells + sum(affinityToPlacedGroup * distanceToPlacedGroupCells). Select the minimum score in the first ring with valid candidates; resolve ties by x then y. Distances are Euclidean center distances divided by 324. Affinity is the number of cross-group suggested links divided by the smaller group size, capped at 1; use zero if absent. These weights are product defaults.
5. Translate local cards into world coordinates, validate all pairwise gap constraints, compute world bounds, then persist the layout revision. If a check fails, use a deterministic separated row of cluster boxes as a safe fallback. Do not publish partial coordinates.
## Guarantees and limits
For any two content rectangles, at least one axis must have a separating gap of 16 units or more. Gap is measured between rectangle edges, including labels. Because scale never drops below 0.75, the visible minimum is 12 CSS pixels. Test independently of the packing code.
With at most 30 cards and 5 groups, exhaustive candidate and collision scans are acceptable. Cap origin search at 200 rings and fall back rather than hang. Identical inputs, measured sizes, model output, and algorithm version must yield identical coordinates. Store a layout seed and version. Published coordinates remain immutable.

# 5 Camera gestures and rendering

## Coordinate contract
Store camera center (cx, cy) in world units and scale s in the range 0.75 to 1.25. Let (vx, vy) be the center of the unobscured canvas viewport after header and bottom controls. Render a world point as screen = viewportCenter + s * (world - cameraCenter). Invert this equation for hit tests and zoom anchors. Record viewport dimensions in CSS pixels, not device pixels.
For a drag delta (dx, dy), update cameraCenter -= (dx, dy) / s. Panning is unconstrained by axis. Clamp camera center to world bounds expanded by half the viewport in world units so a viewer can reach every edge without becoming lost in empty space. Home restores the initial group and scale 1. A group jump centers that group’s top label and first card, rather than fitting a large group into unreadably small text.
## Pointer behavior
Capture the active pointer after pointerdown on the canvas. Treat movement under 8 CSS pixels as a possible tap; crossing that threshold suppresses the tap and begins a drag. Release capture on pointerup or pointercancel and clear gesture state. Links, buttons, text selection in detail, and form fields must never initiate a pan.
Use browser gesture settings only on the canvas interaction surface, not on the entire page [3]. Keep page zoom available through browser controls, and provide accessible scale buttons. One-finger dragging is required. Custom pinch zoom and inertia are optional polish; native browser zoom must not corrupt camera coordinates. Two-finger custom zoom, if added, anchors the inverse-mapped world point under the midpoint.
## Rendering budget
Update camera transforms on requestAnimationFrame without triggering a component tree rerender on each pointer event. Use one translated and scaled world container with absolutely positioned DOM cards. Keep controls in a separate fixed layer and the ambient background in a third layer behind cards. Do not use GPU image readbacks while panning.
For the 30-card MVP, render all cards with lazy image decoding and reserved dimensions. For later boards, query rectangles intersecting the viewport expanded by 324 world units and keep focus and detail targets mounted. DOM order follows cluster and item order, not coordinates. List view remains available even if the spatial renderer fails.
## Edge behavior
On rotation or viewport resize, retain the world point at the viewport center, recalculate safe areas, and clamp once. A filter never changes geometry or camera. An empty board shows a contribution prompt; one card opens at scale 1. A loading image uses its reserved frame. A missing image shows a retryable placeholder without moving neighbors.
Target a median frame duration under 20 ms during a 10-second pan on the nominated test phone with 30 cards; fewer than 5 percent of frames may exceed 50 ms. Record the device and browser in demo notes. This is a validation target, not a claim of measured performance.

# 6 AI semantic clustering pipeline

## Inputs and boundaries
Analyze a snapshot of active cards only. The model sees board title, short user captions or stories, user mood hints, and low-resolution photo derivatives when photo analysis is enabled. Strip EXIF and precise location by default. Never infer faces, participant identities, private relationships, or emotional certainty from a photo. People tags are explicit user input.
Text from cards and images is untrusted content. The model has no tools and receives instructions to return data only. Do not execute generated markup, URLs, code, or instructions. Store the model identifier, prompt version, content revision, and analysis result for reproducibility.
## One bounded analysis call
For the MVP, send at most 30 items to a configurable multimodal model adapter in one request. Require JSON with clusters[{id, title, description, itemIds}], suggestedLinks[{a, b, confidence, reason}], and optional item descriptors. Cluster IDs are local result IDs remapped to server UUIDs. Titles are at most 40 characters; descriptions at most 160. Prompt for 2 to 5 groups where evidence supports them; allow one group for a uniform or tiny board.
Every active item must occur in exactly one primary cluster. The model must preserve item IDs, authorship, tags, and content verbatim and may not create people or fabricate event facts. Labels use restrained phrases such as “Walk home” rather than claiming that someone felt a particular emotion. Photos without captions can still be grouped by visible setting and activity; label uncertainty when evidence is weak.
## Validation and fallback
Validate JSON schema, reject unknown IDs, deduplicate memberships, clamp confidence to 0 through 1, and require each suggested link to reference two distinct known items. Cap links at 3 per item. Any invalid membership partition rejects the whole result; retry once with validation feedback. Bound each attempt to 20 seconds and the complete analysis to 45 seconds.
If the service is unavailable or validation still fails, group deterministically by contributor, with a single group for tiny boards. Use neutral labels such as “Maya’s memories.” Preserve explicit shared tags and publish a usable layout. The preview must say “Basic grouping used” and offer Retry AI; never present fallback output as AI inference.
## Upgrade path after the hackathon
For larger boards, create a per-item semantic descriptor from visible content plus user text, embed descriptors with one model version, and normalize vectors. Start with agglomerative average-link clustering using cosine distance; tune a distance cutoff near 0.30 on labeled event fixtures, then cap groups and isolate outliers. Do not treat this proposed cutoff as measured accuracy.
Candidate relatedness may combine 0.70 semantic similarity, 0.20 explicit tag Jaccard overlap, and 0.10 time proximity when capture times are voluntarily available. Redistribute weights over available signals; do not manufacture missing metadata. Human tag evidence and model semantic similarity remain separate fields. Use content hashes to cache descriptors, and remove deleted content from prompts and caches.

# 7 Contributor perspectives and shared moments

## Three different relationships
Authorship answers who contributed a card. People tags answer who the contributor says is involved. Semantic links answer which cards may describe a similar sub-moment. Store these separately. A multi-author cluster alone is not evidence that everybody was present together, and a shared camera subject does not establish identity.
Let P(i) be the set containing the uploader and all explicit participant tags for item i. Every item in a primary cluster has one uploader and zero or more explicit tags. Show provenance in detail: “Added by Alex,” “Tagged Maya and Rufat,” and, separately, “Suggested related memory.”
## Confirmed overlap
A card is explicitly shared when |P(i)| is at least 2. Two cards by distinct uploaders form a confirmed shared pair if P(a) intersect P(b) is nonempty and they are in the same primary cluster. The cluster restriction prevents one generic person tag from connecting an entire board. The pair explanation must cite tags and cluster membership rather than claim a verified historical event.
A cluster’s confirmed participant set is the union of P(i) for its explicitly shared cards and confirmed pairs. If this set has at least two people, show a “Shared by” label plus those avatars. Preserve personal cards alongside shared ones. The default Shared moments toggle highlights explicit shared cards and cards in confirmed pairs only.
## Suggested overlap
A cross-author semantic link with confidence at least 0.75 and no explicit tag support is a suggested overlap. Confidence is model output, not calibrated probability. Mark it “Possibly the same moment” with an inspect action; exclude it from confirmed shared counts. The owner can confirm a suggestion for the prototype; store the confirmer and time. Rejection hides that suggestion for the current analysis revision.
A confirmed semantic suggestion adds a reviewed relation between its two item IDs. It does not create people tags or assert attendance beyond the two contributions. For Shared moments, these reviewed links count as shared pairs. A new analysis invalidates suggestions, but reviewed links can carry forward only while both items and their content revisions are unchanged.
## Visual interpretation of the Venn idea
Use adjacency, contributor avatar sets, and explicit relationship labels to express intersecting perspectives. Card rectangles remain separated. Shared cards sit in their semantic cluster and may receive a subtle outline. Do not draw overlapping content piles or move copies into person-specific zones. One card has one location and can belong to several participant filters.
Example: Alex uploads a concert photo tagged Maya; Maya adds “We finally heard our song.” Both land in “Near the stage.” Alex’s card is explicitly shared; the two cards form a confirmed pair through Maya. Rufat’s untagged photo in the same cluster is only a semantic candidate until reviewed. In a Rufat uploader filter, only Rufat’s contributions highlight; in a tagged-person filter, Alex’s card can highlight for Maya.

# 8 Ambient palette and continuous transitions

## Extract and normalize once
On successful photo processing, use an oriented, EXIF-stripped derivative sampled to 64 by 64 pixels. Ignore transparent samples. Convert sRGB samples to OKLab and run deterministic k-means with k = 3, seeded from the asset hash, for 8 iterations. Store cluster centroids and pixel fractions. A single valid photo color is an acceptable fallback. Neutral text and music cards do not add palette anchors.
For every palette centroid, create a muted ambient variant: clamp L to 0.88 through 0.95 and scale (a,b) so chroma is at most 0.045. Save the weighted mean of these variants as the photo’s ambient anchor. Keep the original palette for possible later use. Convert output to sRGB with gamut mapping by reducing chroma at fixed lightness until channels are valid; do not simply clip saturated channels. OKLab provides the interpolation coordinates used here [1].
## Continuous spatial field
Let qi be a photo card center, ci its ambient OKLab anchor, and z a world-space sample location. Use sigma = 700 world units. Compute wi(z) = exp(-distance(z, qi)^2 / (2*sigma^2)). Let c0 be neutral OKLab (0.93, 0, 0), and epsilon = 0.12. Then C(z) = (epsilon*c0 + sum(wi*ci)) / (epsilon + sum(wi)). All sums use the complete published photo set for the 30-card MVP.
Evaluate C at five viewport sample positions: center and four corners mapped to world coordinates. Render a bilinearly interpolated 3 by 3 color mesh, with edge midpoint colors averaged from adjacent samples. This creates a soft background behind the card gutters. Weighting is independent of cluster ID, people filters, and which card happens to be nearest. There are no zone thresholds, nearest-card winners, or hard neighbor cutoffs.
## Temporal smoothing
Recompute targets at most 30 times per second during movement and interpolate displayed OKLab channels each animation frame. With dt in seconds, alpha = 1 - exp(-min(dt, 0.05)/0.60); displayed += alpha*(target - displayed). Initialize to the entry target before showing the canvas to avoid a first-frame flash. After a tab resumes, reset the time baseline; do not let a long suspended frame jump the color.
When a new revision is opened, load palettes before revealing the board. Missing palettes contribute no anchor until ready, then fade their weight from 0 to 1 over 600 ms. In empty space, Gaussian influence approaches zero and the neutral anchor takes over smoothly. Filters never alter the background. Reduced motion uses the static neutral background.
## Audio is independent
The MVP may add one board-level soundtrack card with title, artist, and an external track URL. A licensed or user-owned local demo track may play only after an explicit Play action, with persistent Pause and mute controls. No playback is required for the demo. Spatial audio mixing, region transitions, automatic playback, streaming-service integrations, and generated music are deferred.

# 9 Application architecture and operational behavior

## Components and ownership
Implement a TypeScript web client, an application API, SQL persistence, and private object storage. These are architecture choices; select familiar libraries and pin dependency versions at project creation. A small server-side worker runs media processing, a model adapter, deterministic layout packing, and publication validation. Keep provider credentials on the server. Do not depend on a particular model vendor for the geometry or color system.
Client modules: BoardShell, ContributionForm, CanvasViewport, MemoryCard, ItemDetail, PerspectiveFilters, AmbientField, and ListView. Server modules: SessionAccess, UploadService, BoardRepository, AnalysisJob, LayoutService, and PublishService. Keep packing, overlap derivation, and palette blending as pure functions with versioned inputs.
## Revision state machine
Board state is draft or published. contentRevision increments on any active contribution or tag edit. An analysis job snapshots contentRevision and moves queued -> running -> succeeded or failed; succeeded output is previewable but not yet public. LayoutRevision stores the exact input snapshot, analysis output, and coordinates. Publishing sets publishedLayoutId atomically only if the snapshot still matches current contentRevision. Otherwise return a conflict and ask the owner to regenerate.
Published snapshots are immutable. A deletion tombstone is evaluated at read time to suppress removed content immediately from old revisions. Owner title edits may be shown immediately, but captions, tags, and placements use the published snapshot until the next publish. This prevents mixed old coordinates and new text heights.
## Collaboration without live editing
Use ordinary HTTP writes and manual refresh or 5-second polling while the contribution page is open. The viewer reads one versioned published snapshot. No presence cursors, sockets, concurrent drag editing, or operational transforms are required. Database transactions and optimistic versions protect against conflicting owner actions.
## Security and media
Every request checks session role and board membership or a valid viewer capability. Store invite token hashes, expirations, roles, and revocation state. Use signed upload and download URLs with short expiry. Enforce storage ownership, MIME inspection, decoded pixel limits, and board quotas server side; never trust filename extensions. Sanitize plain text and escape output. Do not fetch arbitrary music URLs server side.
Limit a board to 8 contributors, 30 cards, 20 photos, and 10 MB per source photo. Accept JPEG, PNG, and WebP only for the MVP. Limit decoded images to 25 megapixels; produce 400 and 1200 pixel derivatives. Do not send original files to the model. Clear processing and access errors must preserve user drafts and allow retry.
## Observability and recovery
Log job ID, board ID, revision, stage duration, fallback reason, model identifier, and validation failures. Exclude photo URLs, tokens, and private story text from logs. Retry transient uploads and model failures within bounded budgets; packing always has a deterministic fallback. Preload a demo board before judging. A seed fixture is visibly labeled Demo data and never represented as live analysis.

# 10 Data model and storage contract

Use UUIDs for entities, UTC timestamps, and integer content revisions. Enforce foreign keys and unique constraints in the database. JSON structures below require runtime validation; they are not unrestricted metadata bags. Item content is mutable in the draft, while every published snapshot stores a copy of the rendered content and permissions provenance.
## Integrity rules
Photo items require assetId and a ready asset; story items require text; music items require track fields. All participant references must belong to the same board. Source keys never appear in viewer payloads. Index Item(boardId, deletedAt, createdAt), Participant(boardId, sessionId), and AccessToken(tokenHash). Palette JSON stores weighted OKLab centroids plus ambient anchor and algorithm version.


Record | Required fields and constraints
--- | ---
Board | id, ownerSessionId, title(1..80), eventDate?, state, contentRevision, publishedLayoutId?, createdAt, deletedAt?
Session | id, opaqueCookieHash, createdAt, expiresAt. Cookie is HttpOnly and Secure in hosted environments.
Participant | id, boardId, sessionId, displayName(1..40), avatarColor, role(owner / contributor), revokedAt?. Unique(boardId, sessionId).
AccessToken | id, boardId, tokenHash, role(contributor / viewer), expiresAt, revokedAt?. Raw tokens appear only in copied links. Store sourceTokenId on redeemed viewer capabilities and participant memberships for revocation checks.
Item | id, boardId, uploaderId, kind(photo / story / music), text(0..600), assetId?, trackTitle?, trackArtist?, trackUrl?, mood?, capturedAt?, revision, createdAt, deletedAt?. Validate fields by kind.
ItemPersonTag | itemId, participantId, addedBy, createdAt. Unique(itemId, participantId); participant and item belong to the same board.
Asset | id, boardId, uploaderId, sourceKey, thumbKey, detailKey, mime, byteSize, width, height, contentHash, status(processing / ready / failed), errorCode?, paletteVersion, paletteJson?.

# 11 Analysis and layout persistence

## Snapshot and cleanup rules
The input snapshot records every item revision, tags, measured dimensions, contributor display data, media derivative references, and palette anchors. Related pairs are canonical unordered pairs with evidence stored separately from membership. Compute sharing flags on the server from snapshot evidence, never from user-supplied booleans.
## Transactions and retention
Increments to contentRevision and item writes occur in the same transaction. Publication compares that revision and the preview version under a board lock. Deletion invalidates board caches and queues deletion of original and derivative objects; retain only a non-content tombstone after cleanup. For the prototype, delete unclaimed uploads after 24 hours and guest demo boards after 7 days. Surface these prototype limits before contribution.
## Minimal example
A layout points to one content snapshot and owns many placements and clusters. A placement references exactly one primary cluster. A participant may upload many items and be tagged in many more. Shared status is derived from explicit tags or a reviewed relation, so a future change to model providers cannot rewrite authorship.


Record | Required fields and constraints
--- | ---
AnalysisJob | id, boardId, requestedBy, inputContentRevision, idempotencyKey, inputHash, state, stage, modelId?, promptVersion, resultJson?, fallbackReason?, errorCode?, createdAt, finishedAt?. Unique(boardId, idempotencyKey).
Cluster | id, layoutId, title(1..40), description(0..160), sortOrder, x, y, width, height. Every cluster belongs to one immutable layout.
LayoutRevision | id, boardId, inputContentRevision, inputSnapshotJson, algorithmVersion, paletteVersion, seed, boundsJson, entryClusterId, createdAt, status(preview / published). Include previewVersion for optimistic edits.
Placement | layoutId, itemId, clusterId, x, y, width, height, rowSpan, sortOrder. Unique(layoutId, itemId). Snapshot includes text, tags, uploader and asset references.
RelatedPair | id, boardId, analysisJobId, aItemId, bItemId, aRevision, bRevision, type(tag_supported / semantic_suggestion / reviewed), confidence?, reason, reviewState?, reviewedBy?, reviewedAt?. Canonical order aItemId < bItemId.

# 12 Read and contribution API contracts

## Common conventions
All routes use /api/v1 and JSON except direct object-storage uploads. The guest session cookie is set by POST /sessions; the server generates the session ID. IDs and timestamps are strings; camera and rectangle values are finite numbers in world units. Require CSRF protection for cookie-authenticated mutations. Client-supplied uploader IDs are rejected.
Errors have {error:{code,message,retryable,requestId}}. Use 400 for malformed input, 401 for no session, 403 for insufficient role, 404 for absent or inaccessible objects, 409 for revision or idempotency conflicts, 413 for size limits, 422 for invalid content, and 429 for rate limits. Return 503 for temporary processing unavailability.
## Board and membership
POST /boards {title,eventDate?} -> 201 {board,participant}. POST /boards/:id/invites {role,expiresInHours} -> 201 {inviteUrl,expiresAt}; owner only. Default expiry is 24 hours for contributor links and 7 days for viewer links. DELETE /boards/:id/invites/:tokenId -> 204 revokes that link. POST /invites/redeem {token,displayName?} -> 200 {boardId,role,participant?}; viewer redemption creates a read capability bound to the session, not a contributor.
PATCH /boards/:id {title,expectedContentRevision}, DELETE /boards/:id, and DELETE /boards/:id/participants/:participantId are owner-only; return 200, 204, and 204 respectively. Revocation blocks that participant session immediately. Token revocation also invalidates read capabilities derived from it. GET /boards/:id returns role-appropriate metadata, contributors, contentRevision, publishedLayoutId, and pendingItemCount for the owner. GET /boards/:id/draft returns active draft items and versions for contributors only. GET /boards/:id/published returns {board,layout,clusters,placements,participants,relatedPairs,assets} for the published revision. Use ETag with layout ID and tombstone revision; a viewer never receives draft text or private source keys.
## Upload and add
POST /boards/:id/uploads {filename,mime,byteSize} -> 201 {assetId,uploadUrl,expiresAt,requiredHeaders}. The URL targets one private key and expires in 10 minutes. After direct PUT, POST /assets/:id/complete -> 202 {status:"processing"}. GET /assets/:id returns processing state and derivative metadata when ready. Completion is idempotent and validates the object before decoding.
POST /boards/:id/items {kind,text,assetId?,tagParticipantIds:[],mood?,track?} plus Idempotency-Key -> 201 {item,contentRevision}. Photo assets must be ready and belong to this board and contributor. A story requires nonempty text. A music item requires track title and HTTPS URL; it needs no uploaded asset. Limit one music item per board in the optional implementation.
PATCH /items/:id {expectedRevision,text?,tagParticipantIds?,mood?} -> 200 {item,contentRevision}. A mismatch returns 409. The author may edit their own item; the owner may remove it but not silently rewrite someone else’s story. DELETE /items/:id -> 204 creates a tombstone, increments board contentRevision, and suppresses the item from published reads. Repeating delete succeeds without incrementing twice.

# 13 Generation publication and response shapes

## Generation routes
POST /boards/:id/generations {expectedContentRevision} with Idempotency-Key -> 202 {jobId,state:"queued"}. Owner only. Enforce one active job per board. Same key and payload return the same job; same key with a different payload returns 409. A new key while a job is active returns 409 with activeJobId.
GET /generations/:id -> 200 {id,state,stage,inputContentRevision,layoutId?,fallbackReason?,error?}. Poll every second for 10 seconds, then every 3 seconds. Show Upload processing, Finding moments, Arranging cards, or Ready rather than fictional percentage progress. Stop polling when terminal. A client timeout does not cancel server work; show Check again.
GET /layouts/:id/preview returns the complete generated snapshot to the owner only. PATCH /layouts/:id/clusters/:clusterId {title,description,expectedVersion} renames a preview label, then remeasures and repacks before returning a new preview version. Keep published revisions immutable.
POST /related-pairs/:id/review {decision:"confirm"|"reject",expectedVersion} -> 200 {pair}; owner only and preview only. POST /boards/:id/publish {layoutId,expectedContentRevision,expectedPreviewVersion} -> 200 {publishedLayoutId,viewerUrl}. In one transaction verify ownership, ready assets, current input revision, gap validation, and preview version. A repeat of the same publish returns the same snapshot and share token. An obsolete preview returns 409 STALE_PREVIEW.
## Canonical shape examples
The examples below omit unrelated fields but show coordinate units and provenance explicitly. Values are illustrative.
```json
{"camera":{"cx":0,"cy":324,"scale":1},
 "bounds":{"minX":-648,"minY":-324,"maxX":1620,"maxY":1620},
 "placement":{"itemId":"item-a","clusterId":"cluster-stage",
   "x":-324,"y":324,"width":308,"height":632,"rowSpan":81},
 "palette":{"space":"oklab","ambient":[0.92,0.018,0.025]},
 "pair":{"aItemId":"item-a","bItemId":"item-b",
   "type":"tag_supported","reason":"Maya tagged in the same group"}}
```
## Failure semantics
Generation failure leaves the last published layout untouched. If media processing fails, the failed photo remains in the contribution list and cannot enter a publish snapshot. The owner may remove or retry it. A model fallback can still produce a successful job with a clear fallbackReason. Schema validation and packing failures never leak a partially valid layout.
Cache published payloads by layout ID plus deletion revision, with private responses for participant sessions. Resolve media URLs at read time so expired links do not force regeneration. Refresh signed URLs on 403 once. Never place raw invitation tokens in analytics or referrer-bearing outbound links.

# 14 MVP cutline and 24 hour schedule

## Required for the hackathon
Build guest sessions, one event board, contributor invite, photo and story contribution, explicit people tags, bounded AI grouping and titles, server-packed masonry, two-axis panning, card detail, uploader highlighting, confirmed shared highlights, smooth photo-derived ambient color, and a viewer share link. Include an inspectable preview and a deterministic fallback. Use a seeded board for rehearsal, plus one real upload and one real generation in the live path.
## Optional only after the complete path works
One board-level track link or user-triggered local demo soundtrack, scale controls beyond the default, and inertia are polish. If any threatens the schedule, cut it. Music is optional in both product design and acceptance. Never make a silent board appear incomplete.
## Deferred beyond the hackathon
No video, recorded voice, streaming music integration, spatial soundtrack crossfades, AI-generated stickers, custom interactive widgets, mini-games, feed, notifications, full account system, face recognition, manual freeform card dragging, real-time co-editing, or guided story mode. Retain the ability to add these later without changing the core card geometry or attribution model.
## Schedule assumptions
This plan assumes one developer already familiar with a web stack, with an optional second teammate helping with fixtures and testing. Hour offsets start at the hackathon kickoff; translate them into local clock times once kickoff is known. The plan reserves 15 focused build hours, 7 hours of sleep, and 2 hours of meals and breaks, totaling 24.

Elapsed time | Work and exit condition
--- | ---
H0 to H1 | Freeze scope, create project and seed fixture. Render one photo card with attribution.
H1 to H4 | Implement packed canvas, two-axis camera, detail and palette field against the fixture.
H4 to H5 | Meal and break. End with the core visual concept demonstrable.
H5 to H8 | Add session roles, board storage, signed upload, tags and draft items.
H8 to H10 | Integrate AI adapter, fallback, overlap derivation, preview and publication. Save a complete board.
H10 to H17 | Sleep for 7 hours. No background work is required for the plan.
H17 to H18 | Breakfast and break. Triage only blockers.
H18 to H21 | Finish integration, security checks, phone usability and acceptance tests.
H21 to H23 | Feature freeze, deploy, load fixture, rehearse live and fallback paths.
H23 to H24 | Final smoke check, demo recording backup and presentation buffer.

# 15 Implementation tasks and decision gates

## Work packages in dependency order
T1 Data and access, 2 focused hours. Create records, session cookie, capability checks, board creation and invite redemption. Done when two independent browser sessions contribute with distinct attribution and a viewer write is denied.
T2 Canvas and geometry, 2.5 hours. Implement measurement, quantized three-column cluster packing, global ring placement, gap validation, camera, Home and detail. Depends on seeded data only, so it can precede backend integration. Done when negative coordinates and all four pan directions work at phone scale.
T3 Ambient field, 1 hour. Extract deterministic photo palettes, implement continuous weights and frame-time smoothing, and respect reduced motion. Done when a warm-to-cool pan passes the continuity test without a region switch.
T4 Contribution storage, 2 hours. Add uploads, processing, captions, stories, tags and retry. Depends on T1. Done when an actual phone photo appears in a persistent draft after refresh with its uploader and tags intact.
T5 Intelligence and overlap, 1.5 hours. Build one model adapter, schema validator, generation job state and fallback. Derive confirmed versus suggested relations. Done when every item occurs once and unsupported shared claims are excluded.
T6 Integration and sharing, 2 hours. Snapshot inputs, preview, publish transaction, signed read URLs, contributor filters and shared toggle. Depends on T1 through T5. Done when a viewer session opens the complete published board and a late contribution does not rearrange it.
T7 Validation and delivery, 3 hours. Run the critical tests, verify on the nominated phone, deploy, rehearse and save a backup demo. The work packages total 14 hours; reserve one additional hour as buffer within the 15 focused hours; work package estimates are planning limits rather than guaranteed durations.
## Stop rules
At H4, if packing is unstable, use a fixed three-column layout per cluster and separated cluster boxes; preserve real gaps and two-axis exploration. At H8, if upload processing is blocking, limit supported image formats further and keep a verified seed dataset. Do not replace collaborative authorship with invented attribution.
At H10, a working snapshot must exist before sleep. If model integration is failing, activate the documented basic-grouping fallback and preserve a visibly labeled saved AI result for comparison. At H21, freeze features. Remove optional music and animation before cutting readability, gaps, attribution, or continuous color.
## Release hygiene
Keep the model key and storage credentials server-only. Record required environment variable names and deployment steps in the repository. Commit a deterministic fixture, palette data, and expected geometry. Verify that revoking an invite blocks future use and that removing an item hides it from viewer reads. Open the deployed link on a separate device rather than relying on the author’s session.
For a post-hackathon release, replace guest-only identity with durable accounts, add tag consent and abuse reporting, deletion and retention policies, larger-board clustering, and an explicit review workflow. These are later product tasks rather than hidden requirements for the demo.

# 16 Acceptance criteria and verification plan

The prototype is ready when every required check below passes on the nominated phone and in a desktop viewer session. Capture failures with the board revision and device. Optional music may be absent. These criteria are requirements to verify during development, not claims that the application has already passed them.
## Geometry and phone usability
A1 Given 30 mixed cards including long stories and portrait photos, all content and label rectangles satisfy a 16-world-unit separating gap on at least one axis. At minimum scale 0.75 the visible gap is at least 12 CSS pixels. Repeat with fixed input sizes and verify byte-identical placements.
A2 At 390 by 844 and 360 by 800 CSS pixels, the initial 308-unit card is readable at scale 1. Captions do not clip, controls avoid safe areas, and detail shows the full story or photo. Pan in each direction, reach negative coordinates, jump by group, and return Home without losing controls.
A3 Tap opens detail; an 8-pixel-or-longer drag does not. Closing detail restores camera and focus. Keyboard and directional buttons reach every group without dragging. List view exposes every item and uploader. Reduced motion has no inertial or ambient animation.
## AI and perspectives
A4 A 12-card fixture from three contributors produces a complete partition with no duplicate or invented IDs. Invalid JSON and an unreachable model produce a usable basic grouping within the 45-second analysis budget, visibly labeled as fallback. Prompt-injection text in a card does not alter the response schema or trigger tools.
A5 Authorship and people tags remain distinct. The concert example on section 7 produces the specified confirmed pair; Rufat’s untagged card is excluded from confirmed sharing until review. Uploader filtering highlights only that uploader; tagged-person filtering includes explicitly tagged cards. All filters preserve positions and atmosphere.
## Atmosphere and performance
A6 In a fixed warm-to-cool fixture, advance the camera by 1 world unit across a cluster boundary and assert target OKLab Euclidean change below 0.005 between samples. No code path assigns colors by cluster ID. At 60 Hz, a single displayed-frame change remains below 0.01 in the same fixture; inspect a slow and fast pan for flashes.
A7 Empty space tends smoothly toward neutral. Delayed palette availability fades in, tab resume does not jump, and filters leave colors unchanged. Measure the 30-card pan budget from section 5. Published board payload should be under 300 KB excluding images, and initial visible derivatives under 1.5 MB. Target usable entry within 3 seconds on a defined 10 Mbps test connection.
## Persistence and access
A8 Two sessions contribute, refresh, and retain attribution. Viewer writes and cross-board asset references fail. Duplicate idempotency keys create no duplicate cards or jobs. Revoked invites fail; a late edit makes an old preview return STALE_PREVIEW. Deleting a published card hides it immediately, including from cached reads.
A9 Simulate upload failure, unavailable AI, missing image, and expired media URL. Draft text survives, fallback remains explorable, placeholders preserve geometry, and one URL refresh recovers expired access. Publication always exposes a complete immutable snapshot. If music is included, it is silent until Play and can always be paused.

# 17 Demo script fixtures and technical references

## Prepare a repeatable event
Use a fictional concert evening with Alex, Maya, and Rufat. Seed 9 photos and 3 stories across Arrival, Near the stage, and Walk home. Include warm arrival photos, cool stage lighting, and muted night photos so the ambient change is visible. Include the explicit tags from section 7, one unsupported semantic suggestion, and one story that expands beyond the preview. Obtain permission for any real demo photos; fictional names in fixtures do not imply real contributors.
Keep three browser sessions ready: owner, second contributor, and viewer. Verify the published fixture link on the phone. Keep the last successful generated snapshot plus a short backup screen recording. If the network fails, disclose that the board being shown is saved demo data.
## Three minute live demonstration
0:00 to 0:20 Say: “Different people remember the same night differently. Afterglow turns their photos and stories into one memory space you can explore.” Open the event and show the contributor avatars.
0:20 to 0:50 In the contribution view, upload one photo, add a short caption, and tag Maya. In the second session, show a story from Maya. Point out the separate Added by and Tagged labels. Use the preloaded remaining cards so the demo stays short.
0:50 to 1:15 Select Organize memories and explain that AI proposes sub-moments and titles from contributed material. Show the preview, inspect one group, then publish. If generation exceeds the allotted demo time, open the saved completed snapshot and say so.
1:15 to 1:50 Open the viewer link on a phone. Pan horizontally and vertically, pause on a readable story, and open its detail. Let the warm-to-cool background settle while pointing out the visible card gutters. Say: “The layout stays structured; the atmosphere follows nearby photos continuously.”
1:50 to 2:20 Select Alex to highlight his contributions, then Shared moments to reveal tag-supported overlap with Maya. Inspect the unconfirmed suggestion and explain that semantic similarity is separate from confirmed participation. Do not demonstrate overlap by stacking cards.
2:20 to 2:45 Return to All and Home. If music is implemented, press Play briefly, then Pause. Otherwise proceed silently. State that the experience is complete without a soundtrack.
2:45 to 3:00 Close: “The group supplies the memory. AI helps find the connections, and the spatial post lets someone explore several perspectives together.” Show the share link and leave the canvas at a readable view.
## Technical references
[1] W3C CSS Color Module Level 4, OKLab and color interpolation. https://www.w3.org/TR/css-color/ . Supports the color-space choice; the field weights and smoothing constants in this specification are product defaults.
[2] W3C Web Content Accessibility Guidelines 2.2. https://www.w3.org/TR/WCAG22/ . Relevant checks include text contrast, keyboard access, focus visibility, and alternatives to dragging. The 44-pixel control target is a chosen product standard.
[3] MDN touch-action reference. https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action . Explains browser gesture handling and pointer cancellation. Use this to validate the implementation on target browsers.

# 18 Layout reference for implementation

This schematic shows the layout relationship, not a production screenshot. Cards share column alignments and have independent heights with visible gutters. Semantic groups occupy different positions in a two-dimensional world. The phone shows a readable part of that world rather than shrinking the whole board into the screen.
Labels occupy reserved space above cards. Contributor names sit inside cards. The ambient field is visible through the gaps and continues behind every group. The dashed rectangle indicates the camera viewport and does not create a color zone. The phone controls remain fixed while content pans behind them.
Use the exact dimensions and collision rules from section 4 for implementation. The schematic is simplified to make spacing and navigation clear. Optional stickers are omitted; they may never obscure the card content or controls.
