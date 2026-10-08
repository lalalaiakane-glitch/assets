<script setup>
import { computed } from 'vue'
import { state, userName, bidCount, isAdmin } from '../store.js'

const allItems = [
  { v: 'all', icon: 'ti-layout-grid', label: '全部商品', section: '商品瀏覽' },
  { v: 'sell', icon: 'ti-device-desktop', label: '整機販售' },
  { v: 'part', icon: 'ti-components', label: '零件拆售' },
  { v: 'bid', icon: 'ti-gavel', label: '競標專區', badge: true },
  { v: 'mine', icon: 'ti-receipt', label: '我的紀錄', section: '我的' },
  { v: 'admin', icon: 'ti-layout-dashboard', label: '管理後台', section: '管理', admin: true },
]

const MARKET_VIEWS = ['all', 'sell', 'part', 'bid']

// 非管理員看不到「管理後台」
const items = computed(() => allItems.filter((i) => !i.admin || isAdmin.value))

function nav(v) {
  state.view = v
  if (MARKET_VIEWS.includes(v)) state.filter = v
}
</script>

<template>
  <div class="sb">
    <div class="sbh">
      <div class="sblogo">資產認購平台</div>
      <div class="sbsub">雨林新零售 · 內部限定</div>
    </div>
    <div class="sbnav">
      <template v-for="item in items" :key="item.v">
        <div v-if="item.section" class="nsc">{{ item.section }}</div>
        <div class="ni" :class="{ active: state.view === item.v }" @click="nav(item.v)">
          <i class="ti" :class="item.icon" aria-hidden="true"></i>
          {{ item.label }}
          <span v-if="item.badge" class="nbadge">{{ bidCount }}</span>
        </div>
      </template>
    </div>
    <div class="sbft">
      <i class="ti ti-user" aria-hidden="true"></i><span>{{ userName }}</span>
    </div>
  </div>
</template>
