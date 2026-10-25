import {
  OpenAICompositionProvider,
  analyzeComposition,
  verifyCompositionModelAccess,
} from '@afterglow/ai/composition';
if (!process.env.OPENAI_API_KEY)
  throw new Error(
    'Set server-only OPENAI_API_KEY for this explicitly paid manual check',
  );
if (process.env.AI_COMPOSITION_PROVIDER !== 'openai')
  throw new Error(
    'Set AI_COMPOSITION_PROVIDER=openai to opt in to a live check',
  );
const model = process.env.AI_COMPOSITION_MODEL ?? 'gpt-6.1-sol';
// Verify this account can access the exact requested model before live analysis.
await verifyCompositionModelAccess(process.env.OPENAI_API_KEY, model);
const analysis = await analyzeComposition(
  {
    title: 'Manual adapter check',
    contentRevision: 1,
    items: [
      {
        id: 'demo-a',
        contributorId: 'demo',
        contributorName: 'Demo',
        text: 'Walking home after the concert',
      },
    ],
  },
  new OpenAICompositionProvider(process.env.OPENAI_API_KEY, model),
);
console.info(
  JSON.stringify({
    model: analysis.model,
    label: analysis.label,
    fallbackReason: analysis.fallbackReason,
  }),
);
if (analysis.fallbackReason) process.exitCode = 1;
