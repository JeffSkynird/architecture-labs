import Fastify from 'fastify';
import cors from '@fastify/cors';
import { z } from 'zod';

const app = Fastify({ logger: true });

app.register(cors, { origin: "http://localhost:3000" });

const SearchParamsSchema = z.object({
  origin: z.string(),
  destination: z.string(),
  departureDate: z.string(),
  returnDate: z.string(),
  passengers: z.number(),
  nonStopOnly: z.boolean(),
});
const SearchResultsSchema = z.object({
  count: z.number(),
  cheapestPrice: z.number().nullable(),
}).nullable();
const FlightSnapshotSchema = z.object({
  meta: z.object({ contextId: z.string().uuid(), version: z.number(), hash: z.string(), ts: z.string().datetime(), userId: z.string(), }),
  ui: z.object({
    route: z.string(),
    searchParams: SearchParamsSchema,
    results: SearchResultsSchema,
  }),
});
type Snapshot = z.infer<typeof FlightSnapshotSchema>;
type MirrorEntry = { current: Snapshot; history: Snapshot[] };

const mirror = new Map<string, MirrorEntry>();

app.post('/api/context/mirror', async (req, reply) => {
  try {
    const parsed = FlightSnapshotSchema.parse(req.body);
    const { contextId } = parsed.meta;
     if (mirror.size > 0) {
      const existingContextId = mirror.keys().next().value;
      if (contextId !== existingContextId) {
        mirror.clear();
      }
    }
    const entry = mirror.get(contextId);
    const nextVersion = (entry?.current.meta.version ?? 0) + 1;
    const current = { ...parsed, meta: { ...parsed.meta, version: nextVersion } };
    const history = entry ? [entry.current, ...entry.history].slice(0, 20) : [];
    mirror.set(contextId, { current, history });
    app.log.info(`Updated context ${contextId} to v${nextVersion} (Origin: ${current.ui.searchParams.origin})`);
    return reply.send({ contextId, version: nextVersion, hash: current.meta.hash });
  } catch (error) {
    app.log.error(error);
    return reply.code(400).send({ error: 'invalid_snapshot' });
  }
});
app.post('/api/ia/prompt', async (req, reply) => {
  const { intent, contextId } = req.body as { intent: string, contextId: string };
  if (!intent || !contextId) return reply.code(400).send({ error: 'missing_params' });
  const entry = mirror.get(contextId);
  if (!entry){
    const result = fakeTravelLLM("Without Context USER INTENT: "+intent); 
    return reply.send({ result, usedContext: null });
  }
  const snapshot = entry.current;
  const prompt = buildFlightPrompt(snapshot, intent);
  app.log.info(`Built prompt for user ${snapshot.meta.userId} with context v${snapshot.meta.version}`);
  app.log.info(`Prompt: ${prompt}`);
  const result = fakeTravelLLM(prompt);
  return reply.send({ result, usedContext: snapshot.meta });
});

app.get('/api/context/:contextId', async (req, reply) => {
  const { contextId } = req.params as { contextId: string };
  const entry = mirror.get(contextId);
  if (!entry) {
    return reply.code(404).send({ error: 'context_not_found' });
  }
  return reply.send(entry.current);
});

app.get('/api/context/all/:contextId', async (req, reply) => {
  const { contextId } = req.params as { contextId: string };
  if (mirror.size === 0) {
    return reply.send({ message: 'context_empty' });
  }
  if (mirror.size > 0) {
    const existingContextId = mirror.keys().next().value;
    if (contextId !== existingContextId) {
      mirror.clear();
      return reply.send({ message: 'context_empty' });
    }
  }
  const allContexts = Object.fromEntries(mirror);
  return reply.send(allContexts);
});

function buildFlightPrompt(s: Snapshot, intent: string): string {
  const { searchParams, results } = s.ui;
  let contextText = `SYSTEM: You are an expert travel assistant. The user is looking for a flight from ${searchParams.origin} to ${searchParams.destination} for ${searchParams.passengers} passenger(s).`;
  if (searchParams.nonStopOnly) {
    contextText += ' They enabled the "Non-stop flights only" filter.';
  }
  if (results) {
    contextText += ` They are currently viewing ${results.count} results, with the lowest price being $${results.cheapestPrice}.`;
  } else {
    contextText += ' They have not performed a search yet.';
  }
  return `${contextText}\n\nUSER INTENT: ${intent}`;
}

function fakeTravelLLM(prompt: string): string {
  return `Understood. Looking up information about your question: "${prompt.split('USER INTENT: ')[1]}"`;
}

app.listen({ host: '0.0.0.0', port: 3001 }).then(() => {
  console.log('Travel Assistant server listening on http://localhost:3001');
});
