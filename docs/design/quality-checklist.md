# UI change checklist

- Read the design language, component catalog and nearest recipe; review relevant BOND IDs before extending tokens.
- Use the shared theme/provider and native primitives. Run `pnpm design:tokens:check`; never hand-edit generated values.
- Keep routes thin. Keep business data, auth and transport out of primitives. Label future-domain gallery fixtures as local examples.
- Show relevant loading/error/empty/success/pending/disabled states, preserve typed input and map server field errors nearby.
- Verify 360×800, 390×844 and a wider phone, including large text, long Unicode names/stories, missing media and open keyboard. Record actual OS/device/build; compilation is not native rendering evidence.
- Check safe areas, keyboard avoidance, native Back, wrapping/clipping, text contrast, 44-unit touch targets, screen-reader names/roles/states, modal initial/return focus and reduced motion.
- Keep photos/stories/music at separate world rectangles with a minimum 16-unit gutter and readable entry scale. Colors never assert attendance or distinguish confirmed/suggested evidence alone.
- Keep screenshot/archive/contact-sheet imports out of mobile. Use only owned/licensed assets and authorized image URLs.
- For fair comparison, use matching aspect ratios and mask different photo content, status bars and keyboards. Never replace native proof with a browser pixel score.
- Update the catalog/gallery and discrepancy log for extensions. Run typecheck, lint, token/contrast and component behavior checks; report what was and was not visually exercised.
