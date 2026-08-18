# Contributing to CodeMemory X

Thank you for contributing to **CodeMemory X** — The Memory Layer of Software Development.

---

## 1. Coding Standards

- **Strict TypeScript:** Enable `strict: true` across all packages. Avoid `any` type usage. Use `unknown` or explicit generics.
- **Clean Architecture & Hexagonal Isolation:** Domain logic in `packages/core` must have **zero** dependencies on VS Code API (`vscode`) or browser DOM APIs.
- **Pure Functional Core, Imperative Shell:** Keep domain entities side-effect-free. Use the `Result<T, E>` type for operations that can fail gracefully.

---

## 2. Branch Naming Convention

Follow the standard branch naming format:
- `feat/task-xxx-description` (e.g., `feat/task-002-hexagonal-ports`)
- `fix/task-xxx-description` (e.g., `fix/task-015-ipc-leak`)
- `docs/description` (e.g., `docs/architecture-update`)

---

## 3. Commit Message Guidelines

We enforce [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body]
```

**Allowed Types:**
- `feat`: A new feature or task implementation.
- `fix`: A bug fix.
- `docs`: Documentation updates.
- `style`: Formatting changes with zero code meaning change.
- `refactor`: Code restructuring without bug fix or feature addition.
- `test`: Adding or correcting tests.
- `chore`: Build or monorepo configuration changes.

---

## 4. Pull Request Checklist

Before submitting a Pull Request, ensure:

1. [ ] `npm run typecheck` passes with zero errors.
2. [ ] `npm run lint` passes cleanly.
3. [ ] `npm run test` passes all Vitest unit tests.
4. [ ] `npm run build` produces clean distribution artifacts.
5. [ ] Single task boundary respected (do not combine multiple tasks in one PR).

---

## 5. Testing Rules

- Every domain entity, value object, and service must have accompanying `.test.ts` files in a `__tests__/` directory.
- Use `vitest` as the primary unit testing framework.
- Mock external side effects (I/O, IPC, Storage, Webview messages).
