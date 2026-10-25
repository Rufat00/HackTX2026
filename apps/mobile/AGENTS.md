# Afterglow native design workflow

Follow the root [AGENTS.md](../../AGENTS.md). This file only adds native visual requirements; it does not expand product scope.

1. Before coding, read [design language](../../docs/design/design-language.md), [component catalog](../../docs/design/components.md), and the closest [screen recipe](../../docs/design/screen-recipes.md).
2. Inspect the development gallery at `/gallery` and choose existing primitives/widgets. The gallery is guarded in production and redirects to the account route.
3. If a pattern is absent, inspect the relevant BOND source IDs using [the manifest](../../design/reference-manifest.json) and [evidence](../../design/evidence.json) before proposing a token/component. Images are under ignored `design/reference/bond/` after import. Never invent evidence when source files are unavailable.
4. Compose features from the system; keep route files thin and domain/transport data out of primitives. Extend `design/tokens.json` and regenerate; never independently change JSON and generated TypeScript or scatter raw visual constants.
5. Implement loading, error, empty, success, pending and disabled states where relevant. Preserve input and field errors through TanStack Form adapters. Keep confirmed tags, authorship and AI suggestions distinct.
6. Verify phone layouts, keyboard/safe areas, scalable text, accessibility, long content and reduced motion using [the checklist](../../docs/design/quality-checklist.md). Native Back and modal focus must work. Report actual device evidence separately from bundles or browser checks.
7. Update the catalog, gallery and [discrepancy log](../../docs/design/discrepancies.md) when extending the system.
8. Report visual checks performed. Never quietly substitute generic defaults or hardcoded styles. Reference screenshots, branding and private portraits are not production assets.

Afterglow's world geometry and continuous ambient field override reference layouts: primary memory cards do not overlap; the active canvas follows the later user-requested varied-width constellation layout without a uniform gutter; the static gallery retains the original 308/16 fixture. Identity avatars may overlap only within their own AvatarGroup. The source font is unverified; platform System and licensed Feather icons are documented substitutes. No global dark mode is inferred from media editors.
