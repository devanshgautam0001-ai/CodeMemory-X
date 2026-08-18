# CodeMemory X

Created and maintained by **Devansh Gautam**.

> **"Your code remembers everything."**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Monorepo: Turborepo](https://img.shields.io/badge/monorepo-turborepo-ef4444.svg)](https://turbo.build/)
[![Marketplace](https://img.shields.io/badge/VS%20Code%20Marketplace-v0.1.0-blue.svg)](https://marketplace.visualstudio.com/items?itemName=devansh-gautam-codememory.codememory-x-vscode)

---

## 📌 Overview

**CodeMemory X** creates a new category of developer tool: **The Memory Layer of Software Development**. Operating silently inside VS Code, it captures uncommitted micro-edits, structural AST mutations, terminal test outputs, linter errors, and AI chat rationale into an immutable local **Temporal Knowledge Graph**.

---

## 💡 Why CodeMemory X?

Developers forget **WHY** code exists.  
Git remembers **WHAT** changed.  
**CodeMemory X remembers WHY.**

CodeMemory X bridges the gap between raw file modifications and human intent, preserving deep architectural rationale directly within your local development workspace.

---

## ⚡ Features

- 🧠 **Sub-conscious Event Capture**: Passively ingests uncommitted edits, terminal commands, and AI prompts without interrupting workflow.
- 🌳 **AST Symbol Lineage**: Tracks functions, classes, and types across renames, moves, and complete rewrites using Tree-Sitter AST parsing.
- 📜 **Symbol Storybook Engine**: Visual interactive timeline reconstructing how any function or symbol evolved over time.
- 🛡️ **Risk Prediction Sentinel & Drift Sentinel**: Warns developers when modifying code tied to past bug regressions or architectural decisions.
- 💬 **Memory Command Palette**: Instant retrieval of historical rationale and Architectural Decision Records (ADRs).

---

## 🏗️ Architecture

CodeMemory X is engineered using **Hexagonal Architecture (Ports & Adapters)**, **Clean Architecture**, and **Domain-Driven Design (DDD)** principles to maintain absolute decoupling between core engines and editor runtimes.

```
 +-----------------------------------------------------------------------+
 |                         VS Code Extension Host                        |
 |   +--------------------+  +--------------------+  +----------------+  |
 |   | Memory Commands    |  | Webview Dashboard  |  | Sidebar View   |  |
 |   +---------+----------+  +---------+----------+  +-------+--------+  |
 +-------------|-----------------------|---------------------|-----------+
               |                       |                     |
               v                       v                     v
 +-----------------------------------------------------------------------+
 |                           Application Layer                           |
 |                Command Handlers & Query Handlers (CQRS)               |
 +-------------------------------------+---------------------------------+
                                       |
                                       v
 +-----------------------------------------------------------------------+
 |                     Domain Core (@codememory/core)                    |
 |  +-------------------+  +-------------------+  +-------------------+  |
 |  | Memory Engine     |  | Knowledge Graph   |  | Risk Predictor    |  |
 |  +-------------------+  +-------------------+  +-------------------+  |
 +-------------------------------------+---------------------------------+
                                       |
                 Ports (Interfaces)    v    Adapters (Implementations)
 +-----------------------------------------------------------------------+
 |                          Infrastructure Layer                         |
 |  +-------------------+  +-------------------+  +-------------------+  |
 |  | SQLite (WASM)     |  | Tree-Sitter AST   |  | Event Store       |  |
 |  +-------------------+  +-------------------+  +-------------------+  |
 +-----------------------------------------------------------------------+
```

---

## 🔄 How It Works

1. **Passive Event Capture**: Monitors file changes, test executions, and command invocations silently in the extension host background.
2. **AST Parsing & Relationship Tracking**: Extracts symbol boundaries and maps relations using `@codememory/tree-sitter-engine` and `@codememory/symbol-graph`.
3. **Immutable Persistence**: Appends raw temporal events to a local WASM SQLite event store (`@codememory/event-store`).
4. **Context Engine & Query API**: Aggregates memory streams into fast context snapshots exposed to the VS Code sidebar and webview dashboard.

---

## 🔌 VS Code Extension

The extension (`codememory-x-vscode`) integrates seamlessly into VS Code:

- **Command Palette Commands**:
  - `CodeMemory X: Open Memory Dashboard` — Launches the full interactive Memory Explorer & Analytics view.
  - `CodeMemory X: Record Decision (ADR)` — Prompts to record architectural rationale directly into local memory.
  - `CodeMemory X: Show Symbol Story` — Visualizes symbol evolution and historical refactor lineage.
- **Activity Bar & Sidebar**: Adds a dedicated CodeMemory X activity bar icon housing the interactive webview sidebar.

---

## 📊 Memory Dashboard

The embedded React webview dashboard (`codememory-x-webview`) provides:

- **Memory Explorer**: Searchable stream of historical edits, decisions, and session memories.
- **Timeline View**: Visual chronological breakdown of development activity.
- **Knowledge Graph**: Interactive SVG node-link view of symbol relationships.
- **Story View**: Step-by-step reconstruction of function and class evolution.

---

## 🤖 AI Providers

CodeMemory X supports zero-telemetry local LLMs and major cloud providers:

- 🏠 **Ollama** (Local REST endpoint: `http://localhost:11434`)
- 🏠 **LM Studio** (Local OpenAI-compatible endpoint: `http://localhost:1234/v1`)
- ☁️ **OpenAI** (GPT-4o, GPT-4, GPT-3.5)
- ☁️ **Anthropic Claude** (Claude 3.5 Sonnet, Claude 3 Opus)
- ☁️ **Google Gemini** (Gemini 1.5 Pro, Gemini 1.5 Flash)

---

## 💻 Installation

Install directly from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=devansh-gautam-codememory.codememory-x-vscode):

1. Open VS Code.
2. Press `Ctrl+P` (or `Cmd+P`).
3. Paste `ext install devansh-gautam-codememory.codememory-x-vscode`.

Alternatively, search for **CodeMemory X** in the Extension View (`Ctrl+Shift+X`).

---

## 🛠️ Development Setup

### Prerequisites

- **Node.js**: `>=18.0.0`
- **Package Manager**: `npm >=10.0.0`

### Workspace Initialization

```bash
# Clone the repository
git clone https://github.com/devanshgautam0001-ai/CodeMemory-X.git
cd CodeMemory-X

# Install workspace dependencies
npm install
```

---

## ⚙️ Build, Test, Lint, Typecheck & Package

Execute pipeline commands from the monorepo root:

### Build
```bash
npm run build
```

### Test
```bash
npm run test
```

### Lint
```bash
npm run lint
```

### Typecheck
```bash
npm run typecheck
```

### Packaging VSIX
```bash
cd apps/vscode
npx @vscode/vsce package --no-dependencies --pre-release
```

---

## ⚙️ Configuration

Configure via VS Code Settings (`Ctrl+,` / `Cmd+,` -> search `codememory`):

| Setting Key | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `codememory.aiProvider` | `string` | `"ollama"` | Active LLM provider (`ollama`, `lmstudio`, `openai`, `claude`, `gemini`). |
| `codememory.apiKey` | `string` | `""` | API key for cloud providers (stored in VS Code SecretStorage). |
| `codememory.contextRadius` | `number` | `3` | Knowledge Graph hop radius for context retrieval. |
| `codememory.enableTelemetry` | `boolean` | `true` | Toggles passive local event ingestion. |

---

## 🔒 Security

- **Zero Credential Leaks**: API keys are saved exclusively via VS Code `SecretStorage` API and never written to disk or logged.
- **Local Persistence**: All temporal event streams and SQLite databases remain local to your machine.
- **Sanitized RPC & Errors**: Absolute system file paths and bearer tokens are automatically redacted (`[PATH_REDACTED]`).

---

## 🛡️ Privacy

CodeMemory X operates on a **privacy-first architecture**. Local event streams, AST graphs, and architectural decision logs never leave your device unless you explicitly route requests through cloud AI providers.

---

## 🤝 Contributing

Contributions are welcome! Please refer to [CONTRIBUTING.md](CONTRIBUTING.md) for branch strategies, code style standards, and pull request procedures.

---

## 📜 License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.

---

## 🛒 Marketplace

- **Extension Name**: `CodeMemory X`
- **Marketplace URL**: [https://marketplace.visualstudio.com/items?itemName=devansh-gautam-codememory.codememory-x-vscode](https://marketplace.visualstudio.com/items?itemName=devansh-gautam-codememory.codememory-x-vscode)
- **Extension Identifier**: `devansh-gautam-codememory.codememory-x-vscode`

---

## 👤 Author

Created and maintained by **Devansh Gautam**.  
- **Publisher Display Name**: Devansh Gautam  
- **Marketplace Publisher ID**: `devansh-gautam-codememory`  
