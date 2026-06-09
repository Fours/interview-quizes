type Answer = {
  answer: string;
  isCorrect: boolean;
};

type Question = {
  question: string;
  explanation: string;
  answers: Answer[];
};

type Quiz = {
  name: string;
  questions: Question[];
};

export const quizes: Quiz[] = [
  {
    name: "Quiz 1",
    questions: [
      {
        question: `What does the following TypeScript conditional type evaluate to?

\`\`\`typescript
type Unpack<T> = T extends (...args: any[]) => infer R ? R : never;
type Result = Unpack<() => Promise<string>>;
\`\`\``,
        explanation: `The \`infer\` keyword inside a conditional type's \`extends\` clause lets TypeScript capture and name a type that it infers at evaluation time. Here, \`infer R\` captures whatever the function returns. Because \`() => Promise<string>\` returns \`Promise<string>\`, TypeScript binds \`R = Promise<string>\` and the whole type resolves to \`Promise<string>\`.

It does **not** unwrap the Promise — that would require composing with \`Awaited<T>\`. The \`never\` branch is only reached when \`T\` is not a function type at all. This pattern is exactly how TypeScript's built-in \`ReturnType<T>\` utility is implemented in \`lib.es5.d.ts\`.`,
        answers: [
          { answer: "`Promise<string>`", isCorrect: true },
          { answer: "`string`", isCorrect: false },
          { answer: "`never`", isCorrect: false },
          { answer: "`any`", isCorrect: false },
        ],
      },
      {
        question: `A child component is wrapped in \`React.memo\`. Which of the following prop-passing patterns will cause it to **unnecessarily re-render** on every parent render?

\`\`\`tsx
function Parent() {
  const [count, setCount] = React.useState(0);

  // Option A
  const handleA = () => console.log('clicked');

  // Option B
  const handleB = React.useCallback(() => console.log('clicked'), []);

  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
      <MemoChild onAction={/* handleA or handleB */} />
    </>
  );
}
\`\`\``,
        explanation: `\`React.memo\` performs a **shallow comparison** of props using \`Object.is\`. Functions are objects, and every time \`Parent\` renders, \`handleA\` is recreated as a brand-new function object — a different reference each render. \`Object.is(prevHandleA, nextHandleA)\` is always \`false\`, so \`MemoChild\` re-renders on every parent render despite the memoization wrapper.

\`useCallback\` solves this by returning a **stable reference** across renders as long as its dependency array doesn't change. \`handleB\`'s reference is the same object on every render (since the deps array is empty), so \`MemoChild\`'s prop comparison passes and the re-render is skipped.

The same problem applies to object literals and arrays passed as props — \`const options = { size: 'lg' }\` defined inside a render function creates a new reference every time.`,
        answers: [
          {
            answer: "Passing `handleA` — a callback defined inline without `useCallback`",
            isCorrect: true,
          },
          {
            answer: "Passing `handleB` — a `useCallback`-wrapped callback with an empty dependency array",
            isCorrect: false,
          },
          {
            answer: "Passing a string constant as a prop",
            isCorrect: false,
          },
          {
            answer: "Passing a number derived from `useState`",
            isCorrect: false,
          },
        ],
      },
      {
        question: `Consider the following Node.js script:

\`\`\`javascript
setTimeout(() => console.log('setTimeout'), 0);
setImmediate(() => console.log('setImmediate'));
Promise.resolve().then(() => console.log('Promise'));
process.nextTick(() => console.log('nextTick'));
\`\`\`

Ignoring the non-deterministic ordering between \`setTimeout\` and \`setImmediate\`, which two callbacks are **always** guaranteed to run before \`setImmediate\`?`,
        explanation: `Node.js processes two special queues before advancing to the next event loop phase:

1. **Next tick queue** (\`process.nextTick\`): drained completely before anything else — even before Promise microtasks.
2. **Microtask queue** (resolved Promises / \`queueMicrotask\`): drained after the next tick queue is empty.

Only after both queues are empty does Node.js move to the next event loop phase. \`setImmediate\` runs in the **check phase** — after I/O polling — making it the last of the group to execute.

The relative order of \`setTimeout(fn, 0)\` vs \`setImmediate\` is non-deterministic when both are queued from the main module, because which phase runs first depends on OS scheduling jitter. Inside an I/O callback, \`setImmediate\` is guaranteed to fire before \`setTimeout(fn, 0)\`.`,
        answers: [
          {
            answer: "`process.nextTick` and resolved Promise callbacks",
            isCorrect: true,
          },
          {
            answer: "`setTimeout` and `process.nextTick`",
            isCorrect: false,
          },
          {
            answer: "Resolved Promise callbacks and `setTimeout`",
            isCorrect: false,
          },
          {
            answer: "`setTimeout` and `setImmediate`",
            isCorrect: false,
          },
        ],
      },
      {
        question: `What is the output of the following JavaScript code?

\`\`\`javascript
function makeCounter(initial = 0) {
  let count = initial;
  return {
    increment() { return ++count; },
    decrement() { return --count; },
    value()     { return count; },
  };
}

const a = makeCounter(10);
const b = makeCounter(10);

a.increment();
a.increment();
b.decrement();

console.log(a.value(), b.value());
\`\`\``,
        explanation: `Each call to \`makeCounter\` creates a new **execution context** with its own \`count\` variable. The three returned methods form a **closure** over that specific \`count\` — they hold a live reference to the variable in the scope where they were created, not a copy of its value.

\`a\` and \`b\` are completely independent: each closes over a separate \`count\` initialized to \`10\`. Calling \`a.increment()\` twice raises \`a\`'s count to \`12\`. Calling \`b.decrement()\` once lowers \`b\`'s count to \`9\`. Neither operation affects the other.

This pattern — using closures to encapsulate mutable private state — is the **Module Pattern**, one of the foundational JavaScript design patterns predating ES6 classes and still commonly used in functional codebases.`,
        answers: [
          { answer: "`12 9`", isCorrect: true },
          { answer: "`12 11`", isCorrect: false },
          { answer: "`11 9`", isCorrect: false },
          { answer: "`12 12`", isCorrect: false },
        ],
      },
      {
        question: `Your team horizontally shards a PostgreSQL users table by \`user_id\` across 8 shards. A new feature requires looking up a user by \`email\` address (unique, but not the shard key). What happens when this query executes, and what is the standard mitigation?

\`\`\`sql
SELECT * FROM users WHERE email = 'alice@example.com';
\`\`\``,
        explanation: `When a table is sharded by a key, the routing layer uses that key to direct queries to exactly one shard. A query on a **non-shard-key column** provides no routing information — the system cannot know which shard holds the row without inspecting all of them. The result is a **scatter-gather (fan-out) query**: the query is broadcast to every shard, each returns its matches, and the coordinator merges the results. At 8 shards this is manageable; at hundreds of shards it becomes a serious bottleneck.

The standard mitigation is a **lookup table**: a small, unsharded table that maps \`email → user_id\`. The application first queries the lookup table to resolve the \`user_id\`, then issues a routed single-shard query. AWS DynamoDB's Global Secondary Indexes and Vitess's VSchema implement this pattern at the infrastructure level. Another option is to maintain a search index (e.g., Elasticsearch) for non-key lookups.`,
        answers: [
          {
            answer: "The query fan-outs to all 8 shards (scatter-gather). The standard fix is a separate `email → user_id` lookup table to enable routed single-shard lookups.",
            isCorrect: true,
          },
          {
            answer: "The query is automatically routed to the shard holding the matching email, since the database adapts when a unique index exists.",
            isCorrect: false,
          },
          {
            answer: "The query fails with an error — non-shard-key lookups are forbidden by the routing layer.",
            isCorrect: false,
          },
          {
            answer: "The query hits only shard 0 and returns an empty result if the user lives on a different shard.",
            isCorrect: false,
          },
        ],
      },
      {
        question: `Your Node.js API sets the following HTTP response header. An attacker injects \`<script>alert(document.cookie)</script>\` into server-rendered HTML. Which directive blocks execution, and why does adding \`'unsafe-inline'\` to \`script-src\` completely defeat the policy?

\`\`\`
Content-Security-Policy: default-src 'self'; script-src 'self'
\`\`\``,
        explanation: `**\`script-src 'self'\`** is the operative directive. It tells the browser to only execute scripts that originate from the same origin as the document — this blocks inline \`<script>\` tags and inline event handlers (\`onclick="..."\`) entirely, which are the primary XSS delivery mechanisms.

Adding **\`'unsafe-inline'\`** to \`script-src\` re-enables all inline script execution. Since XSS attacks inject inline code, allowing \`'unsafe-inline'\` makes the entire CSP useless against XSS.

The modern alternative is a **nonce-based CSP**: the server generates a cryptographically random nonce per request, includes \`'nonce-<value>'\` in \`script-src\`, and adds \`nonce="<value>"\` to every legitimate \`<script>\` tag. Injected scripts won't carry the correct nonce and are blocked. A **hash-based** approach (\`'sha256-<hash>'\`) works similarly for static inline scripts. Both strategies allow specific inline scripts without enabling arbitrary inline execution.`,
        answers: [
          {
            answer: "`script-src 'self'` blocks the injected inline script. Adding `'unsafe-inline'` re-enables all inline scripts and completely undermines the XSS protection.",
            isCorrect: true,
          },
          {
            answer: "`default-src 'self'` blocks the script; `script-src` only applies to external script files, not inline tags.",
            isCorrect: false,
          },
          {
            answer: "Neither directive blocks inline scripts by default — you must explicitly add `script-src 'none'`.",
            isCorrect: false,
          },
          {
            answer: "`script-src 'self'` blocks the script, and `'unsafe-inline'` is only dangerous for cross-origin scripts, not same-origin injections.",
            isCorrect: false,
          },
        ],
      },
      {
        question: `Given the query below, what rank values does \`RANK()\` assign when two employees in the same department share the highest salary? How does this differ from \`DENSE_RANK()\`?

\`\`\`sql
SELECT
  name,
  department,
  salary,
  RANK()       OVER (PARTITION BY department ORDER BY salary DESC) AS rnk,
  DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS dense_rnk
FROM employees;
\`\`\``,
        explanation: `**\`RANK()\`** assigns the same rank to tied rows, then **skips** subsequent ranks by the number of ties. Two employees tied for first both receive rank \`1\`, and the next distinct salary receives rank \`3\` — rank \`2\` is skipped. Think of it like an Olympic podium: two gold medalists, no silver, then bronze.

**\`DENSE_RANK()\`** also assigns the same rank to tied rows but **never skips** ranks. The same two tied employees get rank \`1\`, and the next employee gets rank \`2\` regardless of the tie count.

Practical guidance:
- Use \`RANK()\` when you need to know "how many rows rank above this one" (including peers) — useful for leaderboards where gaps convey meaning.
- Use \`DENSE_RANK()\` when you want a compact, gap-free ranking — e.g., "return the top 3 distinct salary levels per department."
- \`ROW_NUMBER()\` assigns a unique sequential integer to every row and breaks ties arbitrarily — use it when you need exactly one result per position.`,
        answers: [
          {
            answer: "`RANK()` gives both tied employees rank `1` and skips rank `2`, so the next employee gets rank `3`. `DENSE_RANK()` gives rank `1` then `2` with no gap.",
            isCorrect: true,
          },
          {
            answer: "`RANK()` assigns consecutive ranks with no gaps — it is identical to `DENSE_RANK()`.",
            isCorrect: false,
          },
          {
            answer: "`RANK()` arbitrarily assigns rank `1` to one tied employee and rank `2` to the other to ensure uniqueness.",
            isCorrect: false,
          },
          {
            answer: "`RANK()` returns `NULL` for tied rows and requires an explicit tie-breaker column in `ORDER BY`.",
            isCorrect: false,
          },
        ],
      },
      {
        question: `In MongoDB, you are modeling a blog platform. Each post has comments; comments are **always** fetched together with their parent post, and no post will ever exceed a few hundred comments. Which data modeling strategy is correct, and why would the reference pattern cause problems here?`,
        explanation: `**Embed comments as an array inside the post document.** MongoDB's document model is optimized around one principle: *data that is accessed together should be stored together*. When comments are always read with their post and the count is bounded, a single \`db.posts.findOne({ _id })\` retrieves the complete post-with-comments — no join, no second round-trip, and the result fits comfortably within MongoDB's 16 MB document limit.

The **reference pattern** (comments in a separate collection linked by \`post_id\`) adds unnecessary complexity in this scenario: you must use a \`$lookup\` aggregation stage (MongoDB's join) or issue two queries in the application, both of which hurt read performance without any benefit when comments are always co-read with the post.

The reference pattern is the right choice when:
- Comment counts are unbounded (risk of hitting the 16 MB document limit).
- Comments must be queried independently, paginated at scale, or shared across parents.
- Concurrent writes to a single post document create lock contention.

A common mistake is applying relational normalization instincts to MongoDB. The correct rule is to **model for your access patterns**, not for normalization.`,
        answers: [
          {
            answer: "Embed comments as an array within the post document — data accessed together should be stored together, and bounded size makes a single-document read safe and efficient.",
            isCorrect: true,
          },
          {
            answer: "Store comments in a separate collection with a `post_id` reference — normalization prevents data duplication and is always preferred.",
            isCorrect: false,
          },
          {
            answer: "Store arrays of comment `_id` references inside the post document, then batch-fetch comments in a second query.",
            isCorrect: false,
          },
          {
            answer: "Duplicate comments in both the post document and a standalone collection to optimize both read paths simultaneously.",
            isCorrect: false,
          },
        ],
      },
      {
        question: `The following Dockerfile builds a Node.js API. A developer notices that every source code change — even a one-line edit in \`src/index.ts\` — causes \`npm ci\` to re-run, adding 90 seconds to every build. What is the root cause, and what change fixes it?

\`\`\`dockerfile
FROM node:22-alpine
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build
CMD ["node", "dist/index.js"]
\`\`\``,
        explanation: `Docker builds images layer by layer and **caches each layer**. A layer is invalidated — and all subsequent layers rebuild from scratch — whenever its instruction or the files it depends on change. In this Dockerfile, \`COPY . .\` copies the entire source tree (including \`src/\`, \`package.json\`, \`package-lock.json\`, and everything else) into one layer. Any file change invalidates that layer, forcing \`npm ci\` to re-run every time.

The fix is to copy only the dependency manifests first, install dependencies, then copy the rest of the source:

\`\`\`dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["node", "dist/index.js"]
\`\`\`

Now the \`npm ci\` layer is only invalidated when \`package.json\` or \`package-lock.json\` actually change. Source-only edits hit the cache for the install step and only rebuild the \`COPY . .\` and \`npm run build\` layers — reducing incremental build time from 90 seconds to a few seconds. This is one of the highest-impact Dockerfile optimizations for development velocity.`,
        answers: [
          {
            answer: "`COPY . .` copies all source files before `npm ci`, so any file change invalidates the install layer. Fix: copy only `package.json`/`package-lock.json`, run `npm ci`, then copy the full source.",
            isCorrect: true,
          },
          {
            answer: "The `node:22-alpine` base image doesn't support layer caching. Switching to `node:22` enables it.",
            isCorrect: false,
          },
          {
            answer: "`npm ci` always deletes and reinstalls `node_modules` regardless of cache. Replace it with `npm install --prefer-offline` to use the cache.",
            isCorrect: false,
          },
          {
            answer: "Merging `RUN npm ci` and `RUN npm run build` into a single `RUN` instruction with `&&` would eliminate the cache invalidation.",
            isCorrect: false,
          },
        ],
      },
      {
        question: `A Kubernetes Deployment has both a **liveness probe** and a **readiness probe** configured. The application takes 20 seconds to start up, but the liveness probe begins checking at second 5 with a \`failureThreshold\` of 3 and \`periodSeconds\` of 5. What happens, and how should the probes be correctly configured?`,
        explanation: `**Liveness probe failure** signals to Kubernetes that the container is stuck or unrecoverable — Kubernetes kills and restarts it per the pod's \`restartPolicy\`. With a \`failureThreshold\` of 3 and \`periodSeconds\` of 5, the liveness probe declares the container dead at second 20 (5s start + 3×5s). Since the app needs exactly 20 seconds to start, the container gets killed just as it would be finishing startup, creating a **crash loop**.

**Readiness probe failure** is gentler: Kubernetes removes the pod from the Service's endpoint list (stopping new traffic), but does not restart the container. This is the appropriate behavior during startup.

The correct solution uses a **\`startupProbe\`**: while the startup probe is failing, liveness and readiness probes are completely suspended. Only after the startup probe succeeds do the other probes activate. Configure it with a generous budget:

\`\`\`yaml
startupProbe:
  httpGet:
    path: /healthz
    port: 8080
  failureThreshold: 30
  periodSeconds: 2   # 60-second startup budget
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  periodSeconds: 10
readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  periodSeconds: 5
\`\`\`

This gives the app a 60-second startup window without affecting the tighter runtime health checking cadence.`,
        answers: [
          {
            answer: "Kubernetes kills the container in a crash loop before it finishes starting. Fix: add a `startupProbe` with a generous `failureThreshold` to suspend liveness/readiness checking during startup.",
            isCorrect: true,
          },
          {
            answer: "Kubernetes removes the pod from Service endpoints but does not restart it, so the app eventually finishes starting and traffic resumes automatically.",
            isCorrect: false,
          },
          {
            answer: "Both probes are suspended until the container's main process signals readiness via a lifecycle hook, so a 20-second startup has no effect.",
            isCorrect: false,
          },
          {
            answer: "Kubernetes scales up a replacement pod and terminates the slow pod only after the replacement passes its readiness probe.",
            isCorrect: false,
          },
        ],
      },
    ],
  },
];
