<script setup>
import { ref } from 'vue'
import { state, stats } from '../store.js'
import ProductManager from './ProductManager.vue'

const tab = ref('orders')

function exportCSV() {
  const rows = tab.value === 'orders'
    ? [['時間', '商品', '員工', 'Email', '數量'], ...state.orders.map((o) => [o.time, o.product, o.employee, o.email, o.qty])]
    : [['商品', '出價者', 'Email', '金額', '時間'], ...state.bids.map((b) => [b.product, b.employee, b.email, b.amount, b.time])]
  const csv = rows.map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n')
  const time = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/:/g, '-')
  const a = document.createElement('a')
  a.href = 'data:text/csv;charset=utf-8,﻿' + encodeURIComponent(csv)
  a.download = (tab.value === 'orders' ? 'orders' : 'bids') + '_' + time + '.csv'
  a.click()
}
</script>

<template>
  <div>
    <div class="srow">
      <div class="scard"><div class="slb">商品總數</div><div class="svl">{{ stats.products }}</div><div class="ssu">上架中</div></div>
      <div class="scard"><div class="slb">認購訂單</div><div class="svl">{{ stats.orders }}</div><div class="ssu">筆</div></div>
      <div class="scard"><div class="slb">競標出價</div><div class="svl">{{ stats.bids }}</div><div class="ssu">筆</div></div>
      <div class="scard"><div class="slb">預估認購金額</div><div class="svl" style="font-size:18px">${{ stats.total.toLocaleString() }}</div><div class="ssu">員工認購</div></div>
    </div>

    <div class="atbar">
      <div class="atabs">
        <div class="atab" :class="{ active: tab === 'orders' }" @click="tab = 'orders'">認購訂單</div>
        <div class="atab" :class="{ active: tab === 'bids' }" @click="tab = 'bids'">競標記錄</div>
        <div class="atab" :class="{ active: tab === 'manage' }" @click="tab = 'manage'">商品管理</div>
      </div>
      <button v-if="tab !== 'manage'" class="exbtn" @click="exportCSV">
        <i class="ti ti-download" style="font-size:13px;vertical-align:-2px;margin-right:4px" aria-hidden="true"></i>匯出 CSV
      </button>
    </div>

    <!-- 商品管理 -->
    <ProductManager v-if="tab === 'manage'" />

    <div v-else class="tcard">
      <!-- 訂單 -->
      <table v-if="tab === 'orders'" class="tt">
        <colgroup><col style="width:150px"><col style="width:180px"><col style="width:80px"><col style="width:170px"><col style="width:50px"><col style="width:80px"></colgroup>
        <thead><tr><th>時間</th><th>商品</th><th>員工</th><th>Email</th><th>數量</th><th>狀態</th></tr></thead>
        <tbody>
          <tr v-if="!state.orders.length"><td colspan="6" class="etd">尚無訂單記錄</td></tr>
          <tr v-for="(o, i) in state.orders" :key="i">
            <td>{{ o.time }}</td>
            <td :title="o.product">{{ o.product }}</td>
            <td>{{ o.employee }}</td>
            <td style="color:var(--sub)">{{ o.email }}</td>
            <td>{{ o.qty }}</td>
            <td><span class="bdg bnew">新訂單</span></td>
          </tr>
        </tbody>
      </table>

      <!-- 競標 -->
      <table v-else class="tt">
        <colgroup><col style="width:180px"><col style="width:80px"><col style="width:170px"><col style="width:100px"><col style="width:150px"></colgroup>
        <thead><tr><th>商品</th><th>出價者</th><th>Email</th><th>出價金額</th><th>時間</th></tr></thead>
        <tbody>
          <tr v-if="!state.bids.length"><td colspan="5" class="etd">尚無競標記錄</td></tr>
          <tr v-for="(b, i) in state.bids" :key="i">
            <td :title="b.product">{{ b.product }}</td>
            <td>{{ b.employee }}</td>
            <td style="color:var(--sub)">{{ b.email }}</td>
            <td style="font-weight:500;color:var(--am)">${{ b.amount.toLocaleString() }}</td>
            <td>{{ b.time }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
