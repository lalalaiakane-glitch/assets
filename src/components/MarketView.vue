<script setup>
import { state, filteredProducts } from '../store.js'
import ProductCard from './ProductCard.vue'

const filters = [
  { f: 'all', label: '全部' },
  { f: 'sell', label: '整機販售' },
  { f: 'part', label: '零件拆售' },
  { f: 'bid', label: '競標' },
  { f: 'available', label: '有庫存' },
]
</script>

<template>
  <div>
    <div class="fbar">
      <button
        v-for="b in filters"
        :key="b.f"
        class="fb"
        :class="{ active: state.filter === b.f }"
        @click="state.filter = b.f"
      >{{ b.label }}</button>
      <span class="fc">
        {{ state.loading ? '載入中…' : filteredProducts.length + ' 件' }}
      </span>
    </div>

    <div v-if="state.loadError" class="emp">
      <i class="ti ti-alert-triangle" aria-hidden="true"></i>
      <p>{{ state.loadError }}</p>
    </div>
    <div v-else-if="!state.loading && !filteredProducts.length" class="emp">
      <i class="ti ti-mood-empty" aria-hidden="true"></i>
      <p>沒有符合條件的商品</p>
    </div>
    <div v-else class="grid">
      <ProductCard v-for="p in filteredProducts" :key="p.id" :product="p" />
    </div>
  </div>
</template>
