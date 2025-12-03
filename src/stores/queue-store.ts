import { defineStore } from 'pinia'
import { ref } from 'vue'

import type { Task, TaskStore } from './task-store'
import type { ProcessorState, ProcessorStore } from './processor-store'

export interface QueueConfig {
  id: number
  interval: number
  lengthLimit: number
}

export interface QueueState extends QueueConfig {
  tasks: Task[]
  processors: ProcessorState[]
  lastProducedAt: number
  failed: boolean
}

const validatePositiveInteger = (value: number, label: string): number => {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive integer`)
  }

  return value
}

export const useQueueStore = defineStore('queue-store', () => {
  const queues = ref<QueueState[]>([])
  const nextId = ref(1)

  const reset = (): void => {
    queues.value = []
    nextId.value = 1
  }

  const createQueue = (interval: number, lengthLimit: number): QueueState => {
    const sanitizedInterval = validatePositiveInteger(interval, 'Interval')
    const sanitizedLimit = validatePositiveInteger(lengthLimit, 'Length limit')

    const queue: QueueState = {
      id: nextId.value++,
      interval: sanitizedInterval,
      lengthLimit: sanitizedLimit,
      tasks: [],
      processors: [],
      lastProducedAt: -sanitizedInterval,
      failed: false,
    }

    queues.value.push(queue)
    return queue
  }

  const connectToProcessor = (queueId: number, processor: ProcessorState): void => {
    const queue = queues.value.find((entry) => entry.id === queueId)

    if (!queue) {
      throw new Error(`Queue ${queueId} not found`)
    }

    const alreadyConnected = queue.processors.some((existing) => existing.id === processor.id)

    if (!alreadyConnected) {
      queue.processors.push(processor)
    }
  }

  const stepTime = (
    currentTime: number,
    processorStore: ProcessorStore,
    taskStore: TaskStore,
  ): QueueState[] => {
    const newlyFailed: QueueState[] = []

    queues.value.forEach((queue) => {
      if (queue.failed) {
        return
      }

      const shouldProduce = currentTime - queue.lastProducedAt >= queue.interval

      if (shouldProduce) {
        queue.lastProducedAt = currentTime
        const task = taskStore.newTask()
        queue.tasks.push(task)

        if (queue.tasks.length > queue.lengthLimit) {
          queue.failed = true
          newlyFailed.push(queue)
          return
        }
      }

      if (!queue.tasks.length) {
        return
      }

      queue.processors.forEach((processor) => {
        if (!queue.tasks.length) {
          return
        }

        if (!processorStore.checkReady(processor.id)) {
          return
        }

        const task = queue.tasks.shift()

        if (task) {
          processorStore.acceptTask(processor.id, task, currentTime)
        }
      })
    })

    return newlyFailed
  }

  return {
    queues,
    createQueue,
    connectToProcessor,
    stepTime,
    reset,
  }
})

export type QueueStore = ReturnType<typeof useQueueStore>
