# CodeMemory X — Known Limitations (Phase 2.5)

**Document Date**: August 7, 2026  
**Phase**: Phase-2.5 Dogfooding & Stability Sprint

---

## 1. Scope & Architecture Constraints

1. **Language Parser Scope (TypeScript Only)**:
   - Current vertical slice supports TypeScript (`.ts`) and TSX (`.tsx`) files only.
   - Additional parsers (Python, Java, Go, Rust, C#, C++, PHP) remain in the Parser SDK specification backlog for future phases.

2. **Single Workspace / Single Process SQLite**:
   - EventStore uses in-memory / single-file WASM SQLite (`sql.js`). Multi-window VS Code instances operating on the exact same SQLite database file require IPC file lock coordination.

3. **Zero AI Enforcement**:
   - Per architecture freeze directives, LLM vendor network adapters (`OpenAIProvider`, `ClaudeProvider`, `GeminiProvider`) throw `NotImplementedError`. No cloud network requests or vector embeddings are performed.

4. **AST Regex Mapper Fallback**:
   - Native Tree-sitter WASM binding fallback uses regex-based AST token extraction when WebAssembly Tree-sitter binaries are unmounted.

---

## 2. Mitigation Strategies for Production

- **Language Expansion**: Additional language parsers will plug into `TreeSitterRegistry` without altering `@codememory/parser-sdk` or `@codememory/memory-engine`.
- **Multi-Process Lock Protocol**: Extension host process manages exclusive write access to `.codememory/events.db` SQLite handle.
