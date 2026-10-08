<script setup>
import { onMounted } from 'vue'
import { state, initData } from './store.js'
import LoginScreen from './components/LoginScreen.vue'
import AppShell from './components/AppShell.vue'
import ToastHost from './components/ToastHost.vue'

onMounted(initData)
</script>

<template>
  <LoginScreen v-if="!state.user" />
  <AppShell v-else />
  <ToastHost />
</template>
