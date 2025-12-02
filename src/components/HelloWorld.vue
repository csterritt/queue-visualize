<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ msg: string }>()

const count = ref(0)
</script>

<template>
  <div class="min-h-screen flex flex-col items-center gap-6 p-8">
    <h1 class="text-4xl font-bold">{{ msg }}</h1>

    <div class="card bg-base-200 shadow-xl">
      <div class="card-body text-center">
        <button type="button" @click="count++" class="btn btn-primary btn-lg">
          count is {{ count }}
        </button>
      </div>
    </div>
  </div>
</template>
