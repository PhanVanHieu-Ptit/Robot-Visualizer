# PROMPT_RULES.md

Rules for AI agents (Claude, GitHub Copilot, Cursor, etc.) contributing to this codebase. Follow these to stay consistent with existing patterns and avoid introducing regressions.

---

## State Management

**Rule:** Always access Zustand store via a selector. Never subscribe to the entire store.

```ts
// Correct
const robots = useRobotStore((s) => s.robots)
const selectedId = useRobotStore((s) => s.selectedRobotId)

// Incorrect — causes re-render on any store field change
const { robots, selectedRobotId } = useRobotStore()
```

**Rule:** State mutations must go through defined store actions (`setRobots`, `updateRobot`, `setSelectedRobot`). Do not call `useRobotStore.setState()` directly from components or hooks — define a new action in `robotStore.ts` instead.

---

## TypeScript

**Rule:** All new data shapes go in `src/types/index.ts`. No inline type declarations in component files unless they are component-local prop interfaces.

**Rule:** No `any`. If a type is unknown at a boundary (e.g., Socket.IO payload), use `unknown` and narrow explicitly.

```ts
// Correct
socket.on('robot:update', (data: unknown) => {
  if (isRobot(data)) updateRobot(data)
})

// Incorrect
socket.on('robot:update', (data: any) => updateRobot(data))
```

---

## Components

**Rule:** Functional components only. No class components.

**Rule:** Prop interfaces must be explicitly declared immediately above the component definition.

```ts
// Correct
interface RobotMeshProps {
  robot: Robot
  selected: boolean
  onClick: () => void
}

export function RobotMesh({ robot, selected, onClick }: RobotMeshProps) { ... }
```

**Rule:** No default exports unless required by a framework convention. Use named exports.

---

## 3D / React Three Fiber

**Rule:** Drive 3D object position via `useFrame`, not React re-renders. Never write `position={[robot.x, robot.y, robot.z]}` as a JSX prop that changes dynamically — use a `ref` and `mesh.position.set()` inside `useFrame`.

**Rule:** Do not call React state setters (`useState`, `useRobotStore` actions) inside `useFrame`. This triggers React re-renders on every animation frame and will cause cascading performance issues.

**Rule:** Do not perform raw DOM manipulation inside R3F components. Use Three.js object APIs via refs.

---

## Status Mapping

**Rule:** Map `RobotStatus` to colors, labels, or icons using `Record<RobotStatus, T>`, never a `switch` statement or `if/else` chain.

```ts
// Correct
const statusColor: Record<RobotStatus, string> = {
  idle: '#3b82f6',
  moving: '#22c55e',
  charging: '#eab308',
  error: '#ef4444',
}

// Incorrect
if (status === 'idle') return '#3b82f6'
else if (status === 'moving') return '#22c55e'
// ...
```

This ensures TypeScript exhaustiveness checking catches missing cases when `RobotStatus` is extended.

---

## Simulation & Mock Data

**Rule:** Functions in `src/simulation/mockDataGenerator.ts` must remain pure — no store imports, no side effects, no async. They take state in and return new state out.

**Rule:** Do not add realistic physics or path planning to mock data. The simulation exists solely for UI development without a backend, not for physics fidelity.

---

## Environment & Configuration

**Rule:** Access environment variables via `import.meta.env.VITE_*`. Never hardcode URLs or ports.

**Rule:** Any new environment variable must be added to both `.env.example` and documented in `PROJECT_CONTEXT.md`.

---

## Testing

**There is currently no test infrastructure in this project.** Do not assume `jest`, `vitest`, or any testing utilities are available.

When adding logic that should be tested (pure functions, store actions, data transforms):
1. Flag it explicitly: `// TODO: add tests — no test infra yet`
2. Keep the logic in a pure function in an isolated module so it is trivially testable when infrastructure is added

---

## Anti-Patterns to Avoid

| Anti-pattern | Why |
|---|---|
| `useRobotStore.setState()` outside `robotStore.ts` | Bypasses action layer, breaks encapsulation |
| Raw DOM access inside R3F Canvas | Use Three.js object APIs via refs |
| `position={[x, y, z]}` JSX prop on animated R3F meshes | Triggers React reconciliation per frame |
| `switch` on `RobotStatus` for mappings | Use `Record<RobotStatus, T>` for exhaustiveness |
| Inline `any` types | Use `unknown` + type guards at boundaries |
| Class components | Project is functional-only |
| Importing store inside `mockDataGenerator.ts` | Mock functions must stay pure |
| Hardcoding `localhost:3001` | Use `import.meta.env.VITE_SOCKET_URL` |

---

## Adding New Features Checklist

- [ ] New types added to `src/types/index.ts`
- [ ] New store fields have corresponding typed actions in `robotStore.ts`
- [ ] Components use selector-based store access
- [ ] 3D position/rotation driven by `useFrame`, not JSX props
- [ ] Status or enum mappings use `Record<..., T>`
- [ ] No `any` — use `unknown` + type guard at external boundaries
- [ ] Environment variables in `.env.example` if new ones added
