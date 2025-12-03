import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { useTaskStore } from './task-store'
import { useQueueStore } from './queue-store'
import { useProcessorStore } from './processor-store'
import type { QueueState } from './queue-store'
import type { ProcessorState } from './processor-store'

export const ConnectionMode = {
  ONE_TO_ONE: 'ONE_TO_ONE',
  ONE_TO_MANY: 'ONE_TO_MANY',
} as const

export type ConnectionMode = (typeof ConnectionMode)[keyof typeof ConnectionMode]

export const SimulationStatus = {
  STOPPED: 'STOPPED',
  RUNNING: 'RUNNING',
} as const

export type SimulationStatus = (typeof SimulationStatus)[keyof typeof SimulationStatus]

export const DEFAULT_QUEUE_INTERVAL = 1
export const DEFAULT_QUEUE_LENGTH_LIMIT = 3

const validateCount = (value: number, label: string): void => {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive integer`)
  }
}

export const useSimulationManager = defineStore('simulation-manager', () => {
  const taskStore = useTaskStore()
  const queueStore = useQueueStore()
  const processorStore = useProcessorStore()

  const currentTime = ref(0)
  const status = ref<SimulationStatus>(SimulationStatus.STOPPED)

  const isRunning = computed(() => status.value === SimulationStatus.RUNNING)
  const isReady = computed(
    () => queueStore.queues.length > 0 && processorStore.processors.length > 0,
  )

  const startSimulation = (
    queueCount: number,
    processorCount: number,
    connectionMode: ConnectionMode,
  ): void => {
    validateCount(queueCount, 'Queue count')
    validateCount(processorCount, 'Processor count')

    if (connectionMode === ConnectionMode.ONE_TO_ONE && queueCount !== processorCount) {
      throw new Error('Queue and processor counts must match for one-to-one connections')
    }

    taskStore.reset()
    queueStore.reset()
    processorStore.reset()

    currentTime.value = 0

    const queues: QueueState[] = []
    for (let index = 0; index < queueCount; index++) {
      queues.push(queueStore.createQueue(DEFAULT_QUEUE_INTERVAL, DEFAULT_QUEUE_LENGTH_LIMIT))
    }

    const processors: ProcessorState[] = []
    for (let index = 0; index < processorCount; index++) {
      processors.push(processorStore.createProcessor())
    }

    if (connectionMode === ConnectionMode.ONE_TO_ONE) {
      queues.forEach((queue, index) => {
        const processor = processors[index]

        if (!processor) {
          throw new Error('Missing processor for one-to-one connection')
        }

        queueStore.connectToProcessor(queue.id, processor)
      })
    } else {
      queues.forEach((queue) => {
        processors.forEach((processor) => queueStore.connectToProcessor(queue.id, processor))
      })
    }

    status.value = SimulationStatus.RUNNING
  }

  const stopSimulation = (): void => {
    status.value = SimulationStatus.STOPPED
  }

  const stepSimulation = (): void => {
    if (!isRunning.value || !isReady.value) {
      return
    }

    processorStore.stepTime(currentTime.value, taskStore)
    const failedQueues = queueStore.stepTime(currentTime.value, processorStore, taskStore)

    if (failedQueues.length) {
      status.value = SimulationStatus.STOPPED
      return
    }

    currentTime.value += 1
  }

  return {
    currentTime,
    status,
    isRunning,
    isReady,
    startSimulation,
    stopSimulation,
    stepSimulation,
  }
})
