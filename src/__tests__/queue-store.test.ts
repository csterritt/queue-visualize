import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useTaskStore } from '../stores/task-store'
import { useProcessorStore } from '../stores/processor-store'
import { useQueueStore } from '../stores/queue-store'

describe('queue store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('creates queues with default state', () => {
    const queueStore = useQueueStore()
    const queue = queueStore.createQueue(2, 3)

    expect(queue.interval).toBe(2)
    expect(queue.lengthLimit).toBe(3)
    expect(queue.tasks.length).toBe(0)
    expect(queue.failed).toBe(false)
  })

  it('produces tasks according to the configured interval', () => {
    const taskStore = useTaskStore()
    const processorStore = useProcessorStore()
    const queueStore = useQueueStore()
    const queue = queueStore.createQueue(2, 5)

    queueStore.stepTime(0, processorStore, taskStore)
    expect(queue.tasks.length).toBe(1)

    queueStore.stepTime(1, processorStore, taskStore)
    expect(queue.tasks.length).toBe(1)

    queueStore.stepTime(2, processorStore, taskStore)
    expect(queue.tasks.length).toBe(2)
  })

  it('dispatches tasks to ready processors', () => {
    const taskStore = useTaskStore()
    const processorStore = useProcessorStore()
    const queueStore = useQueueStore()
    const queue = queueStore.createQueue(1, 5)
    const processor = processorStore.createProcessor()

    queueStore.connectToProcessor(queue.id, processor)

    queueStore.stepTime(0, processorStore, taskStore)

    expect(queue.tasks.length).toBe(0)
    expect(processor.currentTask).not.toBeNull()
  })

  it('marks queues as failed when the length limit is exceeded', () => {
    const taskStore = useTaskStore()
    const processorStore = useProcessorStore()
    const queueStore = useQueueStore()
    const queue = queueStore.createQueue(1, 1)

    const failures = queueStore.stepTime(0, processorStore, taskStore)
    expect(failures.length).toBe(0)

    const nextFailures = queueStore.stepTime(1, processorStore, taskStore)
    expect(queue.failed).toBe(true)
    expect(nextFailures).toContain(queue)
  })
})
