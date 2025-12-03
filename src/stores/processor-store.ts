import { defineStore } from 'pinia'
import { ref } from 'vue'

import type { Task, TaskStore } from './task-store'

export interface ProcessorState {
  id: number
  currentTask: Task | null
  busyUntil: number
}

export const useProcessorStore = defineStore('processor-store', () => {
  const processors = ref<ProcessorState[]>([])
  const nextId = ref(1)

  const reset = (): void => {
    processors.value = []
    nextId.value = 1
  }

  const createProcessor = (): ProcessorState => {
    const processor: ProcessorState = {
      id: nextId.value++,
      currentTask: null,
      busyUntil: 0,
    }

    processors.value.push(processor)
    return processor
  }

  const findProcessor = (processorId: number): ProcessorState => {
    const processor = processors.value.find((entry) => entry.id === processorId)

    if (!processor) {
      throw new Error(`Processor ${processorId} not found`)
    }

    return processor
  }

  const checkReady = (processorId: number): boolean => {
    const processor = findProcessor(processorId)
    return processor.currentTask === null
  }

  const acceptTask = (processorId: number, task: Task, currentTime: number): void => {
    const processor = findProcessor(processorId)

    if (processor.currentTask) {
      throw new Error(`Processor ${processorId} is busy`)
    }

    processor.currentTask = task
    processor.busyUntil = currentTime + task.duration
  }

  const stepTime = (currentTime: number, taskStore: TaskStore): void => {
    processors.value.forEach((processor) => {
      if (processor.currentTask && currentTime >= processor.busyUntil) {
        taskStore.returnTask(processor.currentTask)
        processor.currentTask = null
      }
    })
  }

  return {
    processors,
    createProcessor,
    checkReady,
    acceptTask,
    stepTime,
    reset,
  }
})

export type ProcessorStore = ReturnType<typeof useProcessorStore>
