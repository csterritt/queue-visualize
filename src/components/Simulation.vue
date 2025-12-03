<script setup lang="ts">
import { computed, ref } from 'vue'

import QueueDisplay from './QueueDisplay.vue'
import ProcessorDisplay from './ProcessorDisplay.vue'
import { useQueueStore } from '../stores/queue-store'
import { useProcessorStore } from '../stores/processor-store'
import {
  ConnectionMode,
  SimulationStatus,
  useSimulationManager,
} from '../stores/simulation-manager'

const manager = useSimulationManager()
const queueStore = useQueueStore()
const processorStore = useProcessorStore()

const queueCount = ref(2)
const processorCount = ref(2)
const connectionMode = ref<ConnectionMode>(ConnectionMode.ONE_TO_ONE)
const errorMessage = ref<string | null>(null)

const countOptions = Array.from({ length: 10 }, (_, index) => index + 1)

const statusLabel = computed(() =>
  manager.status === SimulationStatus.RUNNING ? 'Running' : 'Stopped'
)
const statusVariant = computed(() =>
  manager.status === SimulationStatus.RUNNING
    ? 'badge-success'
    : 'badge-neutral'
)

const canStep = computed(() => manager.isReady && manager.isRunning)

const handleStart = (): void => {
  try {
    manager.startSimulation(
      queueCount.value,
      processorCount.value,
      connectionMode.value
    )
    errorMessage.value = null
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Unable to start the simulation'
  }
}

const handleStop = (): void => {
  manager.stopSimulation()
}
</script>

<template>
  <div class="min-h-screen bg-base-200 p-6">
    <div class="mx-auto flex max-w-6xl flex-col gap-6">
      <div class="card bg-base-100 shadow">
        <div class="card-body space-y-4">
          <div class="flex flex-col gap-1">
            <h2 class="card-title">Simulation Setup</h2>
            <p class="text-sm text-base-content/70">
              Configure entity counts and a connection mode, then press Start to
              begin stepping through time.
            </p>
          </div>

          <div v-if="errorMessage" class="alert alert-error">
            <span>{{ errorMessage }}</span>
          </div>

          <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <label class="form-control w-full">
              <div class="label"><span class="label-text">Queues</span></div>
              <select
                v-model.number="queueCount"
                class="select select-bordered"
              >
                <option
                  v-for="option in countOptions"
                  :key="`queue-${option}`"
                  :value="option"
                >
                  {{ option }}
                </option>
              </select>
            </label>

            <label class="form-control w-full">
              <div class="label">
                <span class="label-text">Processors</span>
              </div>
              <select
                v-model.number="processorCount"
                class="select select-bordered"
              >
                <option
                  v-for="option in countOptions"
                  :key="`processor-${option}`"
                  :value="option"
                >
                  {{ option }}
                </option>
              </select>
            </label>

            <div class="form-control lg:col-span-2">
              <div class="label">
                <span class="label-text">Connection Mode</span>
              </div>
              <div class="flex flex-wrap gap-4">
                <label
                  class="label cursor-pointer gap-2 rounded-box border border-base-300 px-3 py-2"
                >
                  <input
                    class="radio radio-primary"
                    type="radio"
                    name="connection"
                    :value="ConnectionMode.ONE_TO_ONE"
                    v-model="connectionMode"
                  />
                  <span class="label-text">One to One</span>
                </label>
                <label
                  class="label cursor-pointer gap-2 rounded-box border border-base-300 px-3 py-2"
                >
                  <input
                    class="radio radio-primary"
                    type="radio"
                    name="connection"
                    :value="ConnectionMode.ONE_TO_MANY"
                    v-model="connectionMode"
                  />
                  <span class="label-text">One to Many</span>
                </label>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap gap-3">
            <button class="btn btn-primary" type="button" @click="handleStart">
              Start
            </button>
            <button
              class="btn btn-secondary"
              type="button"
              @click="handleStop"
              :disabled="!manager.isRunning"
            >
              Stop
            </button>
            <button
              class="btn btn-accent"
              type="button"
              @click="manager.stepSimulation()"
              :disabled="!canStep"
            >
              Step
            </button>
          </div>
        </div>
      </div>

      <div class="card bg-base-100 shadow">
        <div class="card-body flex flex-row flex-wrap items-center gap-6">
          <div>
            <p class="text-sm text-base-content/70">Current Time</p>
            <p class="text-4xl font-bold">{{ manager.currentTime }}</p>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-sm text-base-content/70">Status</span>
            <span class="badge" :class="statusVariant">{{ statusLabel }}</span>
          </div>
          <div class="flex flex-row flex-wrap justify-end gap-2">
            <div>
              <div class="stat">
                <div class="stat-title">Queues</div>
                <div class="stat-value text-primary">
                  {{ queueStore.queues.length }}
                </div>
              </div>
            </div>
            <div>
              <div class="stat">
                <div class="stat-title">Processors</div>
                <div class="stat-value text-secondary">
                  {{ processorStore.processors.length }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <section class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-semibold">Queues</h3>
            <span class="badge badge-outline">{{
              queueStore.queues.length
            }}</span>
          </div>
          <QueueDisplay
            v-for="queue in queueStore.queues"
            :key="queue.id"
            :queue="queue"
          />
          <p v-if="!queueStore.queues.length" class="text-base-content/70">
            No queues configured yet. Start a simulation to see queue state.
          </p>
        </section>

        <section class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-semibold">Processors</h3>
            <span class="badge badge-outline">{{
              processorStore.processors.length
            }}</span>
          </div>
          <ProcessorDisplay
            v-for="processor in processorStore.processors"
            :key="processor.id"
            :processor="processor"
            :current-time="manager.currentTime"
          />
          <p
            v-if="!processorStore.processors.length"
            class="text-base-content/70"
          >
            No processors have been created.
          </p>
        </section>
      </div>
    </div>
  </div>
</template>
