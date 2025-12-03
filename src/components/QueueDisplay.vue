<script setup lang="ts">
import { toRef } from 'vue'

import type { QueueState } from '../stores/queue-store'

const props = defineProps<{ queue: QueueState }>()
const queue = toRef(props, 'queue')
</script>

<template>
  <div class="card border border-base-300 bg-base-200 shadow-sm">
    <div class="card-body space-y-2">
      <div class="flex items-center justify-between">
        <h4 class="font-semibold">Queue {{ queue.id }}</h4>
        <span class="badge" :class="queue.failed ? 'badge-error' : 'badge-success'">
          {{ queue.failed ? 'Failed' : 'Active' }}
        </span>
      </div>
      <div class="grid grid-cols-2 gap-2 text-sm">
        <p><span class="font-medium">Interval:</span> {{ queue.interval }}</p>
        <p><span class="font-medium">Limit:</span> {{ queue.lengthLimit }}</p>
        <p><span class="font-medium">Pending:</span> {{ queue.tasks.length }}</p>
        <p><span class="font-medium">Processors:</span> {{ queue.processors.length }}</p>
      </div>
    </div>
  </div>
</template>
