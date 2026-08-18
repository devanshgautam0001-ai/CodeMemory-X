# CodeMemory X — Technical Debt Register

**Audit Date**: August 7, 2026  
**Status**: Freeze Period Assessment  
**Ranking Severity**: `Critical` | `High` | `Medium` | `Low`

---

## 1. Executive Summary

This register lists all technical debt items accumulated through Task-001 to Task-019. Prior to production release, these items should be addressed in designated hardening sprints.

---

## 2. Technical Debt Register

### 🔴 Critical Severity

| ID | Title | Description | Remediation Plan |
| :--- | :--- | :--- | :--- |
| **TD-CRIT-01** | UI Mock Data to EventBus RPC Wiring | `MemoryExplorer`, `StoryView`, `TimelineView`, and `KnowledgeGraphView` in `@codememory/ui` currently rely on rich mock datasets. They need real postMessage RPC bindings to extension host engines (`@codememory/memory-query`, `@codememory/context-engine`). | Implement VS Code Webview Message Protocol handlers connecting webview state to `@codememory/memory-query` queries. |
| **TD-CRIT-02** | WASM SQLite Single-Process Concurrency | `sql.js` (WASM SQLite) runs in memory or single-file mode. Access from multiple webview/extension processes requires explicit mutex locking in `DatabaseProvider`. | Implement cross-process IPC channel locking or single-writer Extension Host thread model. |

---

### 🟠 High Severity

| ID | Title | Description | Remediation Plan |
| :--- | :--- | :--- | :--- |
| **TD-HIGH-01** | AI Provider Vendor Network Implementations | `OpenAIProvider`, `ClaudeProvider`, `GeminiProvider`, and 7 other adapters throw `NotImplementedError` per architectural freeze instruction. | Implement network fetch adapters using vendor REST/gRPC endpoints behind `IAIProvider`. |
| **TD-HIGH-02** | Webview PostMessage Security Schema Validation | Webview postMessage communications between `apps/vscode` and `apps/webview` require strict Zod/JSON schema validation to prevent untrusted message injection. | Add Zod schema validator middleware for extension host message listeners. |

---

### 🟡 Medium Severity

| ID | Title | Description | Remediation Plan |
| :--- | :--- | :--- | :--- |
| **TD-MED-01** | Knowledge Graph Canvas Virtualization (>500 Nodes) | SVG rendering in `GraphCanvas` handles 50-100 nodes comfortably, but may drop frame rate when graph exceeds 500+ nodes. | Implement Canvas2D or WebGL rendering pipeline (e.g. PixiJS or Cytoscape.js canvas adapter) for large graphs. |
| **TD-MED-02** | Context Engine Compression Heuristics | Token trimming in `@codememory/context-engine` uses basic character-to-token ratio estimations (~4 chars/token). | Integrate `js-tiktoken` or `cl100k_base` tokenizer for exact token budget accounting. |

---

### 🟢 Low Severity

| ID | Title | Description | Remediation Plan |
| :--- | :--- | :--- | :--- |
| **TD-LOW-01** | Storybook Component Isolation | Storybook stories use static sample datasets. | Add interactive Storybook knobs/controls for dynamic state mutation testing. |
| **TD-LOW-02** | Anemic Domain Interfaces | Some memory model interfaces lack domain helper methods (e.g., `isExpired()`, `getRiskCategory()`). | Add domain helper methods to memory model wrapper classes. |
