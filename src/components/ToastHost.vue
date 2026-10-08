<script setup>
import { onMounted, onUnmounted } from 'vue'
import { state, dismissToast } from '../store.js'

const icons = {
  success: 'ti-circle-check',
  error: 'ti-alert-circle',
  info: 'ti-info-circle',
}

let timer = null
onMounted(() => {
  timer = setInterval(() => {
    for (const t of state.toasts) {
      t.remaining -= 1
      if (t.remaining <= 0) dismissToast(t.id)
    }
  }, 1000)
})
onUnmounted(() => clearInterval(timer))
</script>

<template>
  <div class="toasts">
    <transition-group name="toast">
      <div v-for="t in state.toasts" :key="t.id" class="toast" :class="t.type">
        <i class="ti" :class="icons[t.type] || icons.info" aria-hidden="true"></i>
        <span class="ttext">{{ t.text }}</span>
        <span class="tcount">{{ t.remaining }}s</span>
        <button class="tclose" aria-label="關閉" @click="dismissToast(t.id)"><i class="ti ti-x"></i></button>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toasts {
  position: fixed; bottom: 20px; right: 20px; z-index: 300;
  display: flex; flex-direction: column-reverse; gap: 8px; max-width: 360px;
}
.toast {
  display: flex; align-items: center; gap: 9px;
  background: var(--card); border: 0.5px solid var(--bd);
  border-left: 3px solid var(--sub);
  border-radius: var(--rs); padding: 11px 12px 11px 13px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.12); font-size: 13px; color: var(--tx);
}
.toast.success { border-left-color: var(--gn); }
.toast.success > i { color: var(--gn); }
.toast.error { border-left-color: var(--rd); }
.toast.error > i { color: var(--rd); }
.toast.info { border-left-color: var(--ac); }
.toast.info > i { color: var(--ac); }
.toast > i { font-size: 17px; flex-shrink: 0; }
.ttext { flex: 1; line-height: 1.4; }
.tcount { font-size: 11px; color: var(--sub); font-variant-numeric: tabular-nums; flex-shrink: 0; }
.tclose {
  background: none; border: none; cursor: pointer; color: var(--sub);
  font-size: 15px; line-height: 1; padding: 2px; flex-shrink: 0;
}
.tclose:hover { color: var(--tx); }

.toast-enter-active, .toast-leave-active { transition: all .25s ease; }
.toast-enter-from { opacity: 0; transform: translateY(16px); }
.toast-leave-to { opacity: 0; transform: translateY(16px); }
</style>
