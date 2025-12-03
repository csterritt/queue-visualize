<script setup lang="ts">
import { computed } from 'vue'

import type { ProcessorState } from '../stores/processor-store'

const props = defineProps<{ processor: ProcessorState; currentTime: number }>()

const isBusy = computed(() => props.processor.currentTask !== null)
const timeRemaining = computed(() => {
  if (!props.processor.currentTask) {
    return 0
  }

  return Math.max(props.processor.busyUntil - props.currentTime, 0)
})
</script>

<template>
  <div class="card border border-base-300 bg-base-200 shadow-sm">
    <div class="card-body flex items-center justify-between">
      <div>
        <p class="font-semibold">Processor {{ props.processor.id }}</p>
        <p class="text-sm text-base-content/70">
          <template v-if="isBusy">
            Busy with task #{{ props.processor.currentTask?.id }} ({{ timeRemaining }}s remaining)
          </template>
          <template v-else>Ready</template>
        </p>
      </div>
      <span class="badge" :class="isBusy ? 'badge-warning' : 'badge-success'">
        {{ isBusy ? 'Busy' : 'Ready' }}
      </span>
    </div>
  </div>
</template>
