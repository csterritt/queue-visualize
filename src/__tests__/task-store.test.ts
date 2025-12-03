import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useTaskStore } from '../stores/task-store'

describe('task store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('creates tasks with incrementing ids and minimum duration enforcement', () => {
    const taskStore = useTaskStore()
    const taskA = taskStore.newTask()
    const taskB = taskStore.newTask(0)

    expect(taskA.id).toBe(1)
    expect(taskA.duration).toBe(1)
    expect(taskB.id).toBe(2)
    expect(taskB.duration).toBe(1)
  })

  it('reuses returned tasks with updated id and duration', () => {
    const taskStore = useTaskStore()
    const task = taskStore.newTask(2)

    taskStore.returnTask(task)
    const reused = taskStore.newTask(5)

    expect(reused).toBe(task)
    expect(reused.duration).toBe(5)
    expect(reused.id).toBe(2)
  })

  it('resets the pool and id counter', () => {
    const taskStore = useTaskStore()
    const task = taskStore.newTask(3)
    taskStore.returnTask(task)

    taskStore.reset()
    const resetTask = taskStore.newTask()

    expect(resetTask.id).toBe(1)
    expect(taskStore.pool.length).toBe(0)
  })
})
