import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useTaskStore } from '../stores/task-store'
import { useProcessorStore } from '../stores/processor-store'

describe('processor store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('accepts tasks and reports readiness', () => {
    const taskStore = useTaskStore()
    const processorStore = useProcessorStore()
    const processor = processorStore.createProcessor()
    const task = taskStore.newTask(2)

    expect(processorStore.checkReady(processor.id)).toBe(true)

    processorStore.acceptTask(processor.id, task, 0)

    expect(processorStore.checkReady(processor.id)).toBe(false)
    expect(processor.currentTask).toBe(task)
    expect(processor.busyUntil).toBe(task.duration)
  })

  it('steps time and returns finished tasks to the pool', () => {
    const taskStore = useTaskStore()
    const processorStore = useProcessorStore()
    const processor = processorStore.createProcessor()
    const task = taskStore.newTask(2)

    processorStore.acceptTask(processor.id, task, 0)
    processorStore.stepTime(1, taskStore)

    expect(processor.currentTask).toBe(task)

    processorStore.stepTime(2, taskStore)

    expect(processor.currentTask).toBeNull()

    const reused = taskStore.newTask()
    expect(reused).toBe(task)
  })

  it('resets processors and id counter', () => {
    const processorStore = useProcessorStore()
    processorStore.createProcessor()
    processorStore.reset()

    expect(processorStore.processors.length).toBe(0)

    const processor = processorStore.createProcessor()
    expect(processor.id).toBe(1)
  })
})
