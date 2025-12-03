import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useSimulationManager, ConnectionMode, SimulationStatus } from '../stores/simulation-manager'
import { useQueueStore } from '../stores/queue-store'
import { useProcessorStore } from '../stores/processor-store'

describe('simulation manager', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts simulations and connects queues to processors', () => {
    const manager = useSimulationManager()
    const queueStore = useQueueStore()
    const processorStore = useProcessorStore()

    manager.startSimulation(2, 2, ConnectionMode.ONE_TO_ONE)

    expect(manager.status).toBe(SimulationStatus.RUNNING)
    expect(manager.currentTime).toBe(0)
    expect(queueStore.queues.length).toBe(2)
    expect(processorStore.processors.length).toBe(2)

    const firstQueue = queueStore.queues[0]
    const firstProcessor = processorStore.processors[0]

    expect(firstQueue).toBeDefined()
    expect(firstProcessor).toBeDefined()

    if (!firstQueue || !firstProcessor) {
      throw new Error('Simulation entities were not initialized')
    }

    expect(firstQueue.processors[0]).toBe(firstProcessor)
  })

  it('validates one-to-one connection counts', () => {
    const manager = useSimulationManager()

    expect(() => manager.startSimulation(1, 2, ConnectionMode.ONE_TO_ONE)).toThrow()
  })

  it('advances time only while running', () => {
    const manager = useSimulationManager()

    manager.startSimulation(1, 1, ConnectionMode.ONE_TO_ONE)
    expect(manager.currentTime).toBe(0)

    manager.stepSimulation()
    expect(manager.currentTime).toBe(1)

    manager.stopSimulation()
    manager.stepSimulation()
    expect(manager.currentTime).toBe(1)
  })

  it('stops the simulation when a queue fails', () => {
    const manager = useSimulationManager()
    const queueStore = useQueueStore()

    manager.startSimulation(1, 1, ConnectionMode.ONE_TO_ONE)

    const queue = queueStore.queues[0]

    if (!queue) {
      throw new Error('Expected a queue to exist')
    }

    queue.lengthLimit = 1
    queue.processors.length = 0

    manager.stepSimulation()
    expect(manager.currentTime).toBe(1)
    expect(manager.status).toBe(SimulationStatus.RUNNING)

    manager.stepSimulation()
    expect(manager.status).toBe(SimulationStatus.STOPPED)
  })
})
