# Implementation Plan: Queue Visualizer Simulation

## 1. Objectives and Scope
- Model a discrete-time queue/processor simulation using Pinia stores for tasks, queues, and processors plus a Manager orchestrator.
- Provide a `Simulation.vue` UI that configures entity counts, starts/stops the simulation loop, exposes current time/state, and renders per-queue and per-processor status cards.
- Supply node-based unit tests that validate core behaviors (task lifecycle, queue dispatching, processors finishing work, manager orchestration).

## 2. Data Models and Stores

### 2.1 Task Store (`src/stores/task-store.ts`)
- **State**
  - `nextId: number` – increments every time a fresh task is created.
  - `pool: Task[]` – stack/queue (array) of reusable tasks returned by processors.
- **Task interface**
  ```ts
  interface Task {
    id: number
    duration: number // seconds, integer >= 1
  }
  ```
  - Task constructor/creator takes an optional duration (default `1`). Validation ensures `duration >= 1`.
- **API**
  - `newTask(duration?: number): Task`
    - If `pool` is empty, creates a new task with auto ID and given duration.
    - If `pool` has entries, remove one (FIFO/LIFO – choose FIFO for predictability) and return it after updating duration to requested value (or keep stored duration if we do not override — specify in open questions if unclear).
  - `returnTask(task: Task): void` – push task back onto `pool` for reuse.
  - Potential helper `createTask(duration: number): Task` for internal creation.

### 2.2 Queue Store (`src/stores/queue-store.ts`)
- **Queue model**
  ```ts
  interface QueueConfig {
    id: number
    interval: number // steps between task production
    lengthLimit: number // > 0 triggers failure when exceeded
  }

  interface QueueState extends QueueConfig {
    tasks: Task[]
    processors: Processor[]
    lastProducedAt: number // last time step when a task was produced
    failed: boolean
  }
  ```
- **State**
  - `queues: QueueState[]`
  - `nextId` for queue IDs.
- **API**
  - `createQueue(interval: number, lengthLimit: number): QueueState` – validates positive inputs.
  - `reset(): void` – clear queues when manager restarts.
  - `connectToProcessor(queueId, processor)` – adds processor reference.
  - `stepTime(currentTime: number, taskStore)` – iterate all queues:
    - If `failed`, skip.
    - Produce task when `(currentTime - lastProducedAt) >= interval` (or exactly divisible). Acquire task from task store, append to `tasks`. If `tasks.length > lengthLimit`, flag `failed` and emit event for manager.
    - Attempt dispatch: loop processors, if queue has pending tasks and processor `checkReady()` returns true, shift first task and call `processor.acceptTask(task)`.

### 2.3 Processor Store (`src/stores/processors-store.ts`)
- **Processor model**
  ```ts
  interface ProcessorState {
    id: number
    currentTask: Task | null
    busyUntil: number // absolute time when task completes
  }
  ```
- **State**
  - `processors: ProcessorState[]`
  - `nextId`
  - Dependency on task store to return tasks.
- **API**
  - `createProcessor(): ProcessorState`
  - `reset(): void`
  - `checkReady(processorId): boolean`
  - `acceptTask(processorId, task: Task, currentTime: number)`
    - Sets `currentTask`, `busyUntil = currentTime + task.duration`.
  - `stepTime(currentTime, taskStore)` – when `currentTask` exists and `currentTime >= busyUntil`, call `taskStore.returnTask(task)` and mark processor free.

## 3. Manager (`src/simulation/manager.ts` or similar)
- **Constants**: `ONE_TO_ONE`, `ONE_TO_MANY`, `STOPPED`, `RUNNING`.
- **State**
  - References to queue & processor stores and task store.
  - `currentTime: number` starting at 0.
  - `status: 'STOPPED' | 'RUNNING'`.
  - `intervalHandle: number | null` if using `requestAnimationFrame`/`setInterval` for automated ticking; but spec implies manual step plus auto-run when Start pressed.
- **Methods**
  - `startSimulation(queueCount: number, processorCount: number, connection: ConnectionMode)`
    - Validate counts (>0, integers; enforce equal counts for `ONE_TO_ONE`).
    - Reset stores and manager state, instantiate queues/processors with sensible defaults (e.g., interval=1 step, lengthLimit configurable or use heuristics). Could expose additional config options later; for now pick default interval/duration.
    - Connect queues to processors according to connection mode.
    - Set `status = RUNNING`, `currentTime = 0`.
  - `stopSimulation()` – stop timers, set `status = STOPPED`.
  - `stepSimulation()` – called per tick regardless of RUNNING vs manual step.
    - For each processor: `processorStore.stepTime(currentTime)`.
    - For each queue: `queueStore.stepTime(currentTime, processorStore, taskStore)`.
    - After stepping, check if any queue failed -> stop simulation.
    - Increment `currentTime += 1`.
  - Manage enabling/disabling UI Step button depending on whether queues/processors exist.
  - Provide computed getters for `isRunning`, `isReady` (entities created), etc.

## 4. UI Components

### 4.1 `Simulation.vue`
- **Sections**
  1. **Configuration Controls (Top Row)**
     - Two `<select>` inputs bound to local refs `queueCount`, `processorCount` (1–10). Maybe use `<select class="select select-bordered">` with DaisyUI styles.
     - Start button triggers `manager.startSimulation(queueCount, processorCount, connectionMode)`; `connectionMode` can be toggled by radio buttons or defaults to `ONE_TO_ONE` until UI expanded.
  2. **Simulation Control Panel**
     - Display current time from manager.
     - Status indicator showing `Running` in green when `manager.status === RUNNING`, else `Stopped`.
     - `Step` button disabled until manager has initialized queues & processors; also disabled while manager auto-runs unless we support manual stepping even when running (need clarity – see open questions). Button calls `manager.stepSimulation()`.
  3. **Queues Column** – iterate through queue store array, render `QueueDisplay` components showing queue ID, length, lengthLimit, failure indicator.
  4. **Processors Column** – iterate processors, render `ProcessorDisplay` showing ID and status (`Ready` vs `Busy (task #, time remaining)`).
- **State Management**
  - Component imports Pinia stores and manager composable for reactivity.
  - Watches manager status to enable Step button and update statuses.

### 4.2 Supporting Components
- `QueueDisplay.vue`
  - Props: queue state object.
  - Shows queue name, `tasks.length`, `lengthLimit`, maybe badge when failed.
- `ProcessorDisplay.vue`
  - Props: processor state object.
  - Shows `Ready` when `currentTask === null`, else `Busy (task.id)`.
- Styling with Tailwind/DaisyUI cards/lists for clarity.

## 5. Testing Strategy
- Use Node/Vitest (if configured) or simple Jest-like environment per existing tooling (check package.json; likely `vitest`). Write tests under `src/__tests__/` or `tests/` mirroring store files.
- **Task Store Tests**
  - Creating tasks increments IDs and enforces minimum duration.
  - `newTask` reuses returned tasks when pool non-empty.
  - `returnTask` stores tasks for reuse.
- **Queue Store Tests**
  - Queue creation sets defaults.
  - `stepTime` produces tasks at correct intervals.
  - Dispatching removes tasks when processor ready.
  - Length limit triggers failure and stops further processing.
- **Processor Store Tests**
  - `acceptTask` marks busy and `checkReady` reflects busy state.
  - `stepTime` frees processor and returns tasks to task store when duration elapses.
- **Manager Tests**
  - `startSimulation` enforces connection rules and status transitions.
  - `ONE_TO_ONE` connection pairs correctly; `ONE_TO_MANY` fully connects graph.
  - Simulation loop increments time, stops when queue failure occurs, resets on stop.
- Where direct time progression is needed, manually invoke `stepSimulation` to avoid timers in tests.

## 6. Implementation Steps
1. **Set up stores directory structure** with new Pinia stores for tasks, queues, processors (plus exports/index if needed).
2. **Implement Task model** with reusable pool logic.
3. **Implement Processor store** including time-stepping logic and readiness checks.
4. **Implement Queue store** with task production, dispatching, failure detection, and processor connections.
5. **Create Manager service** to orchestrate stores, manage configuration, and drive simulation ticks.
6. **Build Vue components**: `Simulation.vue`, `QueueDisplay.vue`, `ProcessorDisplay.vue`, and wire them in `App.vue` (replacing placeholder content).
7. **Add reactivity/controls** for configuration, status display, start/step actions.
8. **Write unit tests** covering stores and manager logic.
9. **Manual QA** by running dev server to verify UI interactions (optional but recommended locally).

## 7. Open Questions / Ambiguities
1. **Task duration override when reusing from pool**: Should reused tasks keep their previous duration or be overwritten by the `newTask` request? (Assumption: allow specifying new duration to simulate different workloads.)
2. **Queue production interval defaults**: Are intervals and length limits user-configurable per queue, or do we apply fixed defaults? Requirements specify constructor arguments but UI doesnt expose them; plan assumes fixed defaults set during manager initialization.
3. **Simulation pacing**: Should `Start simulation` trigger continuous automatic stepping, or just instantiate entities and rely on manual `Step` presses? Requirements imply manager loops automatically until stopped, yet there is also a manual Step button. Need clarity on coexistence (e.g., Step disabled while running automatically?).
4. **Processor task durations**: Are tasks immutable once created? If reused, should their IDs remain constant? (Currently assuming yes to maintain identity.)
5. **Queue failure behavior**: Once any queue fails, do others immediately halt even if tasks remain? Plan assumes manager stops entire simulation and leaves states visible.
6. **Testing framework**: Confirm whether Vitest is available; if not, need guidance on the expected simple node tests (plain Node asserts?).
7. **Connection constants exposure**: Should UI allow toggling between `ONE_TO_ONE` and `ONE_TO_MANY` yet, or only programmatic for now?
