<script setup>
import { reactive, provide, computed, watch } from 'vue'
import { state, isAdmin } from '../store.js'
import AppSidebar from './AppSidebar.vue'
import TopBar from './TopBar.vue'
import MarketView from './MarketView.vue'
import AdminView from './AdminView.vue'
import MyRecordsView from './MyRecordsView.vue'
import BuyModal from './BuyModal.vue'
import BidModal from './BidModal.vue'

// modal 控制：type = null | 'buy' | 'bid'
const modal = reactive({ type: null, product: null })

function open(product) {
  modal.product = product
  modal.type = product.type === 'bid' ? 'bid' : 'buy'
}
function close() {
  modal.type = null
  modal.product = null
}

// 提供給子元件（ProductCard）開啟 modal
provide('openProduct', open)

// 後台僅限管理員；非管理員若落在 admin 視圖，強制導回全部商品
const showAdmin = computed(() => state.view === 'admin' && isAdmin.value)
const isMarket = computed(() => !['admin', 'mine'].includes(state.view))
watch(
  () => state.view,
  (v) => { if (v === 'admin' && !isAdmin.value) state.view = 'all' }
)
</script>

<template>
  <div class="shell">
    <AppSidebar />
    <div class="main">
      <TopBar />
      <div class="cnt">
        <MarketView v-show="isMarket" />
        <MyRecordsView v-if="state.view === 'mine'" />
        <AdminView v-if="showAdmin" />
      </div>
    </div>
  </div>

  <BuyModal v-if="modal.type === 'buy'" :product="modal.product" @close="close" />
  <BidModal v-if="modal.type === 'bid'" :product="modal.product" @close="close" />
</template>
