import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { format } from 'prettier';
const root = new URL('../../', import.meta.url);
const source = JSON.parse(
  await readFile(new URL('design/tokens.json', root), 'utf8'),
) as Record<string, unknown>;
function resolve(value: unknown, trail: string[] = []): unknown {
  if (typeof value === 'string' && value.startsWith('$')) {
    const path = value.slice(1);
    if (trail.includes(path))
      throw new Error(`Circular token reference: ${path}`);
    let referenced: unknown = source;
    for (const key of path.split('.')) {
      if (!referenced || typeof referenced !== 'object' || !(key in referenced))
        throw new Error(`Unknown token reference: ${path}`);
      referenced = (referenced as Record<string, unknown>)[key];
    }
    return resolve(referenced, [...trail, path]);
  }
  if (Array.isArray(value)) return value.map((v) => resolve(v, trail));
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, resolve(v, trail)]),
    );
  return value;
}
const resolved = resolve({
  scheme: 'light',
  primitives: source.primitives,
  semantic: source.semantic,
  component: source.component,
});
const output = await format(
  `// Generated from design/tokens.json. Run pnpm design:tokens; do not edit.\nexport const lightTheme = ${JSON.stringify(resolved, null, 2)} as const;\n`,
  { parser: 'typescript', singleQuote: true, trailingComma: 'all' },
);
const destination = new URL('apps/mobile/src/theme/tokens.generated.ts', root);
if (process.argv.includes('--check')) {
  if ((await readFile(destination, 'utf8')) !== output)
    throw new Error('Theme is out of sync. Run pnpm design:tokens.');
  console.info('Generated theme matches design/tokens.json');
} else {
  await writeFile(destination, output);
  console.info(`Generated ${fileURLToPath(destination)}`);
}
