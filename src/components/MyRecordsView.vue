<script setup>
import { computed } from 'vue'
import { state, myOrders, myBids, cancelOrder } from '../store.js'

function onCancel(o) {
  if (confirm(`確定取消認購「${o.product}」× ${o.qty}？庫存將回補。`)) cancelOrder(o)
}

// 競標出價：比對目前最高價，標示是否仍領先
function bidStatus(b) {
  const p = state.products.find((x) => x.name === b.product)
  if (!p) return { text: '已結束', cls: 'tdone' }
  if (b.amount >= p.currentBid) return { text: '領先中', cls: 'lead' }
  return { text: '已被超越', cls: 'over' }
}

const totalSpend = computed(() =>
  myOrders.value.reduce((a, o) => {
    const p = state.products.find((x) => x.name === o.product)
    return a + (p ? (p.price || 0) * o.qty : 0)
  }, 0)
)
</script>

<template>
  <div>
    <!-- 我的認購 -->
    <div class="mrhead">
      <h3 class="mrtitle"><i class="ti ti-shopping-cart" aria-hidden="true"></i> 我的認購</h3>
      <span v-if="myOrders.length" class="mrsum">共 {{ myOrders.length }} 筆・預估 ${{ totalSpend.toLocaleString() }}</span>
    </div>
    <div v-if="!myOrders.length" class="emp">
      <i class="ti ti-package-off" aria-hidden="true"></i>
      <p>您尚未認購任何商品</p>
    </div>
    <div v-else class="tcard" style="margin-bottom:24px">
      <table class="tt">
        <colgroup><col style="width:230px"><col style="width:56px"><col style="width:80px"><col><col style="width:160px"><col style="width:84px"></colgroup>
        <thead><tr><th>商品</th><th>數量</th><th>單價</th><th>備註</th><th>時間</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="(o, i) in myOrders" :key="i">
            <td :title="o.product">{{ o.product }}</td>
            <td>{{ o.qty }}</td>
            <td>${{ ((state.products.find((p) => p.name === o.product) || {}).price || 0).toLocaleString() }}</td>
            <td style="color:var(--sub)" :title="o.note">{{ o.note || '—' }}</td>
            <td>{{ o.time }}</td>
            <td class="actcell"><button class="mrcancel" @click="onCancel(o)">取消</button></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 我的競標 -->
    <div class="mrhead">
      <h3 class="mrtitle"><i class="ti ti-gavel" aria-hidden="true"></i> 我的競標</h3>
      <span v-if="myBids.length" class="mrsum">共 {{ myBids.length }} 筆出價</span>
    </div>
    <div v-if="!myBids.length" class="emp">
      <i class="ti ti-mood-empty" aria-hidden="true"></i>
      <p>您尚未參與任何競標</p>
    </div>
    <div v-else class="tcard">
      <table class="tt">
        <colgroup><col><col style="width:110px"><col style="width:100px"><col style="width:160px"></colgroup>
        <thead><tr><th>商品</th><th>我的出價</th><th>狀態</th><th>時間</th></tr></thead>
        <tbody>
          <tr v-for="(b, i) in myBids" :key="i">
            <td :title="b.product">{{ b.product }}</td>
            <td style="font-weight:500;color:var(--am)">${{ b.amount.toLocaleString() }}</td>
            <td><span class="mrbadge" :class="bidStatus(b).cls">{{ bidStatus(b).text }}</span></td>
            <td>{{ b.time }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.mrhead { display: flex; align-items: baseline; gap: 10px; margin: 4px 0 12px; }
.mrtitle { font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
.mrtitle i { font-size: 16px; color: var(--sub); }
.mrsum { font-size: 12px; color: var(--sub); }
.mrbadge { font-size: 11px; padding: 2px 9px; border-radius: 99px; font-weight: 500; }
.mrbadge.lead { background: var(--gnb); color: var(--gn); }
.mrbadge.over { background: var(--rdb); color: var(--rd); }
.mrbadge.tdone { background: #f3f4f6; color: #9ca3af; }
.actcell { overflow: visible; text-overflow: clip; }
.mrcancel {
  border: 0.5px solid var(--bd); background: var(--card); color: var(--rd);
  border-radius: var(--rs); padding: 4px 12px; font-size: 12px; cursor: pointer; transition: all .12s;
}
.mrcancel:hover { background: var(--rdb); border-color: var(--rd); }
</style>
