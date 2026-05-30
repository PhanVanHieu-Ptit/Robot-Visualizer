# DECISIONS.md

> All decisions below are **[INFERRED]** — no ADR files or commit history comments exist. Rationale is reconstructed from code evidence and common practice for this stack.

---

## ADR-001: Zustand for State Management [INFERRED]

**Decision:** Zustand over Redux Toolkit or React Context.

**Rationale:**
- Store is small (3 fields, 3 actions) — Redux overhead is unjustified
- No need for middleware (saga, thunk, observable) at this scope
- Zustand's `setState` partial merge is ergonomic for single-robot updates (`updateRobot`)
- No DevTools integration configured (trade-off accepted at MVP stage)

**Trade-offs:**
- No time-travel debugging without explicit middleware
- `useRobotStore.setState()` called directly in `useSimulation` bypasses defined action layer — see KNOWN_ISSUES.md

---

## ADR-002: React Three Fiber over Vanilla Three.js [INFERRED]

**Decision:** Use `@react-three/fiber` and `@react-three/drei` wrappers.

**Rationale:**
- Declarative JSX scene graph aligns with React component model
- `useFrame` hook integrates cleanly with R3F render loop
- `OrbitControls` from drei requires no manual imperative setup
- Reduces boilerplate for camera, lighting, and scene teardown

**Trade-offs:**
- R3F adds an abstraction layer over Three.js; debugging requires understanding both
- `useFrame` runs in R3F's render loop, not React's — developers must not update React state inside `useFrame` (triggers re-render cascade)

---

## ADR-003: Socket.IO over Native WebSocket [INFERRED]

**Decision:** `socket.io-client` for real-time communication.

**Rationale:**
- Auto-reconnect on disconnect (no manual retry logic needed)
- Event-based API (`socket.on('robot:update', ...)`) cleaner than raw `onmessage` parsing
- Fallback transports (long-polling) if WebSocket handshake fails
- Assumed the backend also uses Socket.IO server (matching protocol)

**Trade-offs:**
- Larger bundle than a raw WebSocket client
- Ties frontend to Socket.IO protocol — raw WS servers not compatible without adapter

---

## ADR-004: Simulation Fallback Mode [INFERRED]

**Decision:** Run a mock robot movement loop when the backend is unreachable.

**Rationale:**
- Decouples frontend development from backend availability
- Enables meaningful demo/prototype without infrastructure
- 500ms tick rate approximates realistic AMR update frequency

**Trade-offs:**
- Simulation physics (random walk) does not reflect real robot behavior
- Battery only drains — no recharge cycle (see KNOWN_ISSUES.md)
- Bounds clamping is symmetric `[-24, 24]`, not warehouse-topology-aware

---

## ADR-005: Vite over CRA / Webpack [INFERRED]

**Decision:** Vite as build tool and dev server.

**Rationale:**
- Native ESM dev server: instant cold start regardless of module count
- First-class React + TypeScript support via `@vitejs/plugin-react`
- Tailwind CSS v4 Vite plugin integrates without PostCSS config file
- Standard choice for new React projects in 2024–2025

**Trade-offs:**
- Fewer battle-tested plugins than webpack for edge cases (e.g., Webpack Module Federation not available)
- `vite preview` is not a production server — requires separate deployment target

---

## ADR-006: Centralized Types in `src/types/index.ts` [INFERRED]

**Decision:** Single file for all TypeScript interfaces and type aliases.

**Rationale:**
- Acceptable for small domains (current: 5 interfaces, ~39 lines)
- Avoids circular import issues in a flat module graph
- Simple co-location convention easy for solo/small team

**Trade-offs:**
- Will become unwieldy as domain grows beyond ~10 types
- No domain separation (robot types, warehouse types, UI types all co-located)
- Recommended future split: `src/types/robot.ts`, `src/types/warehouse.ts`

---

## ADR-007: Hardcoded Warehouse Layout [INFERRED]

**Decision:** `generateWarehouse()` produces a fixed 5×4 shelf grid and 3 named zones.

**Rationale:**
- Sufficient for MVP visualization — real warehouse layout not yet integrated
- Avoids need for a layout API, file parser, or admin UI at this stage

**Trade-offs:**
- Layout cannot be changed without modifying source code
- Shelf positions are derived from index arithmetic — no named shelf identifiers
- No relationship between robot `taskId` and specific shelf destinations

---

## ADR-008: No Runtime Schema Validation [INFERRED]

**Decision:** No Zod, Yup, or similar validation on Socket.IO payloads.

**Rationale:**
- Backend is local/trusted — validation overhead deemed unnecessary at prototype stage

**Trade-offs:**
- Malformed `robot:update` payloads silently corrupt the store (see KNOWN_ISSUES.md)
- Adding Zod validation to `useWebSocket.ts` is the recommended remediation path
