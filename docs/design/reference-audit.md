# Bond reference audit

Inspected on 2026-10-24: **149 of 149 images individually**, at 600-pixel readable width, with original rasters retained for measurements. No archive entry was discarded as a duplicate. There are zero exact SHA-256 duplicate groups and 34 dHash near-duplicate candidate pairs; their individual states remain separately identified. [Manifest](../../design/reference-manifest.json) records original names, dimensions, hashes, inspection notes and families. Eight numbered contact sheets organize the set and do not stand in for individual viewing.

The source archive was found at `/mnt/c/Users/Rufat Niftaliyev/Downloads/Bond ios Aug 2026.zip`. Its filename/hash and an unchanged copy are preserved; source images, readable copies, crops and contact sheets live under ignored `design/reference/bond/`. Import uses traversal/absolute-path/symlink checks before extraction. No reference image is bundled in mobile.

## Size and scale

107 images measure 1179×2676; 42 measure 1180×2676. Both groups contain an approximately 120-pixel Mobbin footer. The remaining 2556-pixel app height and 1179-pixel width are consistent with a **393×852 logical viewport at 3×**, but export rounding on the 1180 group and screenshot provenance prevent treating that scale as guaranteed. Measurements in evidence are original pixels first; runtime units are documented adaptations. Status bars, native keyboards/photo pickers, photo content and the footer are excluded from app token inference.

## Flow coverage

| IDs     | Family                     | Notable states                                                                                                                                         |
| ------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 001–022 | Welcome/account/onboarding | Empty/typed phone, OTP partial/success, names, invalid birthday, photo empty/filled, story failure, loading                                            |
| 023–059 | Home/discovery/detail      | Empty/populated home, recommendations, skeleton, expanded copy, selected contributors, approved/finalized, empty/populated sheets, remove confirmation |
| 060–090 | Capture/story/editor       | Native photo library/cropper, empty/typed backstory, audience selection, tag empty/selected, contextual dark editors, delete menu                      |
| 091–109 | Story/conversation         | Tutorial artwork, mention, question editor, pending/generated/updated answer, expanded provenance, liked state, repost failure                         |
| 110–124 | Connections/profile        | Empty search, request/accept/disabled states, profile, classifying, disconnect and notification                                                        |
| 125–133 | Memories/exploration       | Empty/recent/list, category chips, focused composer, pending/empty-result/multilingual/copied                                                          |
| 134–146 | Profile/settings           | Menu, photo empty/filled/crop, name changes, share/copied, delete confirmation                                                                         |
| 147–149 | Inbox                      | Unread region, requests, accepted and mixed-event list                                                                                                 |

Each shorthand ID above has the `BOND-` prefix. Individual notes are in the manifest; recurring findings include source IDs, region, approximate measurement and observed/inferred/adapted classification in [evidence.json](../../design/evidence.json).

## Conclusions and unknowns

The recurring system is neutral, rounded and sparse, with black primary pills, white inset surfaces and circular controls. Blue connection actions, green finalization and pink hearts are contextual accents. We preserve neutral hierarchy and adapt text/status contrast. We cannot establish original font licensing, exact type weights, elevation parameters, motion, haptics, keyboard avoidance, reduced motion or text scaling from static images. Platform System and Feather icons are explicit substitutes. The dark media/editor screens are contextual; no complete dark theme is shipped.

Original screenshots contain overlapping/tilted thumbnails, photo-overlaid stickers and phone/voice/social workflows. These are not imported as Afterglow memory behavior. The product's gap-separated two-dimensional masonry, stable text surfaces, identity provenance and optional music constraints take precedence.
