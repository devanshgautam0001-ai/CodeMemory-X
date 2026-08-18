# CodeMemory X

> **"Your code remembers everything."**

Created and maintained by **Devansh Gautam**.

---

## 🧠 What is CodeMemory X?

CodeMemory X creates a new category of developer tool: **The Memory Layer of Software Development**. Operating silently inside VS Code, it captures uncommitted micro-edits, structural AST mutations, terminal test outputs, linter errors, and AI chat rationale into an immutable local **Temporal Knowledge Graph**.

Developers forget **WHY** code exists.  
Git remembers **WHAT** changed.  
CodeMemory X remembers **WHY**.

---

## ⚡ Key Features

- 🧠 **Sub-conscious Event Capture**: Ingests uncommitted edits, terminal commands, and AI prompts without interrupting your flow.
- 🌳 **AST Symbol Lineage**: Tracks functions, classes, and types across renames, moves, and complete rewrites.
- 📜 **Symbol Storybook Engine**: Visual interactive timeline reconstructing how any function evolved over time.
- 🛡️ **Risk Prediction Sentinel**: Warns developers when modifying code tied to past bug regressions or architectural decisions.
- 💬 **Memory Command Palette**: Instant retrieval of historical rationale and Architectural Decision Records (ADRs).

---

## 🤖 Supported AI Providers

CodeMemory X supports both local zero-telemetry LLM endpoints and leading cloud providers:

- 🏠 **Ollama** (Local REST endpoint: `http://localhost:11434`)
- 🏠 **LM Studio** (Local OpenAI-compatible endpoint: `http://localhost:1234/v1`)
- ☁️ **OpenAI** (GPT-4o, GPT-4, GPT-3.5)
- ☁️ **Anthropic Claude** (Claude 3.5 Sonnet, Claude 3 Opus)
- ☁️ **Google Gemini** (Gemini 1.5 Pro, Gemini 1.5 Flash)

---

## 🔒 Security & Privacy First

- 🔐 **Zero Credential Leaks**: API keys are stored securely using VS Code's `SecretStorage` API and never written to disk or logs.
- 🛡️ **Local Storage**: Temporal events are persisted locally using embedded WASM SQLite (`sql.js`).
- 🧼 **Sanitized RPC & Exports**: Absolute system file paths and bearer tokens are automatically redacted (`[PATH_REDACTED]`).
- 📊 **Formula Injection Protection**: CSV exports sanitize spreadsheet control characters (`=`, `+`, `-`, `@`).

---

## ⌨️ Extension Commands

Access via Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

- **`CodeMemory X: Open Memory Dashboard`**: Launches the interactive Memory Explorer & Analytics view.
- **`CodeMemory X: Record Decision (ADR)`**: Records architectural rationale directly into local memory.
- **`CodeMemory X: Show Symbol Story`**: Visualizes symbol evolution and historical refactor lineage.

---

## ⚙️ Configuration Settings

Configure via VS Code Settings (`Ctrl+,` / `Cmd+,` -> search for `codememory`):

- `codememory.aiProvider`: Default provider selection (`ollama`, `lmstudio`, `openai`, `claude`, `gemini`).
- `codememory.apiKey`: API Key for cloud AI providers (stored securely in VS Code SecretStorage).
- `codememory.apiEndpoint`: Custom endpoint URL for local or proxy instances.
- `codememory.contextRadius`: Knowledge Graph hop radius for context retrieval.
- `codememory.enableTelemetry`: Toggles passive memory event ingestion.

---

## 🛡️ License & Author

Distributed under the MIT License.

Created and maintained by **Devansh Gautam**.
