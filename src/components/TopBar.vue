<script setup>
import { computed } from 'vue'
import { state, userName, logout } from '../store.js'

const titles = { all: '全部商品', sell: '整機販售', part: '零件拆售', bid: '競標專區', mine: '我的紀錄', admin: '管理後台' }
const title = computed(() => titles[state.view] || '全部商品')
</script>

<template>
  <div class="topbar">
    <div class="tbtitle">{{ title }}</div>
    <div class="sw">
      <i class="ti ti-search" aria-hidden="true"></i>
      <input v-model="state.search" type="text" placeholder="搜尋型號、規格…" />
    </div>
    <div class="chip">
      <i class="ti ti-shield-check" aria-hidden="true"></i><span>{{ userName }}</span>
    </div>
    <button class="tblogout" title="登出" @click="logout">
      <i class="ti ti-logout" aria-hidden="true"></i><span>登出</span>
    </button>
  </div>
</template>

<style scoped>
.tblogout {
  display: flex; align-items: center; gap: 5px;
  border: 0.5px solid var(--bd); background: var(--card); color: var(--sub);
  border-radius: var(--rs); padding: 6px 12px; font-size: 12px; cursor: pointer;
  transition: all .12s;
}
.tblogout:hover { background: var(--bg); color: var(--tx); border-color: #aaa; }
.tblogout i { font-size: 14px; }
</style>
