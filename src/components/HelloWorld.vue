<script setup lang="ts">
import { useCounterStore } from '../store'

defineProps<{ msg: string }>()

const counterStore = useCounterStore()
</script>

<template>
  <div class="min-h-screen flex flex-col items-center gap-6 p-8">
    <h1 class="text-4xl font-bold">{{ msg }}</h1>

    <div class="card bg-base-200 shadow-xl">
      <div class="card-body text-center">
        <button
          type="button"
          @click="counterStore.increment()"
          class="btn btn-primary btn-lg"
        >
          count is {{ counterStore.count }}
        </button>
      </div>
    </div>
  </div>
</template>
