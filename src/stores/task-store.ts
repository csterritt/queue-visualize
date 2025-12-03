import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Task {
  id: number
  duration: number
}

const sanitizeDuration = (value?: number): number => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 1
  }

  const wholeNumber = Math.floor(value)
  return wholeNumber > 0 ? wholeNumber : 1
}

export const useTaskStore = defineStore('task-store', () => {
  const nextId = ref(1)
  const pool = ref<Task[]>([])

  const reset = (): void => {
    nextId.value = 1
    pool.value = []
  }

  const newTask = (duration = 1): Task => {
    const sanitizedDuration = sanitizeDuration(duration)
    const task = pool.value.shift() ?? { id: nextId.value, duration: sanitizedDuration }

    task.id = nextId.value++
    task.duration = sanitizedDuration

    return task
  }

  const returnTask = (task: Task): void => {
    pool.value.push(task)
  }

  return {
    nextId,
    pool,
    newTask,
    returnTask,
    reset,
  }
})

export type TaskStore = ReturnType<typeof useTaskStore>
