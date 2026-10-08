<script setup>
import { computed, inject } from 'vue'
import { useCountdown } from '../composables/useCountdown.js'
import { myQtyOf, myBidOf } from '../store.js'

const props = defineProps({ product: { type: Object, required: true } })
const openProduct = inject('openProduct')

const p = computed(() => props.product)
const isBid = computed(() => p.value.type === 'bid')
const sold = computed(() => p.value.qty === 0 && !isBid.value)

const tag = computed(() => {
  if (sold.value) return { cls: 'tdone', text: '已售完' }
  if (p.value.type === 'sell') return { cls: 'ts', text: '整機販售' }
  if (p.value.type === 'part') return { cls: 'tp', text: '零件拆售' }
  return { cls: 'tb2', text: '競標' }
})

const unit = computed(() => (p.value.type === 'part' ? '個' : '台'))
const myQty = computed(() => myQtyOf(p.value.name))
const myBid = computed(() => myBidOf(p.value.id))
const leading = computed(() => isBid.value && myBid.value > 0 && myBid.value >= p.value.currentBid)

// 競標倒數
const { text: countdownText } = useCountdown(() => p.value.endTime ?? 0)

function open() { openProduct(p.value) }
function act(e) { e.stopPropagation(); openProduct(p.value) }
</script>

<template>
  <div class="pc" @click="open">
    <div class="pi" :style="{ background: p.color }">
      <i class="ti" :class="p.icon" aria-hidden="true"></i>
      <span class="ptag" :class="tag.cls">{{ tag.text }}</span>
      <span v-if="p.qty > 0 && !isBid" class="qc">庫存 {{ p.qty }}</span>
      <span v-if="myQty > 0" class="owned"><i class="ti ti-circle-check" aria-hidden="true"></i> 已認購 {{ myQty }}</span>
    </div>
    <div class="pb">
      <div class="pn">{{ p.name }}</div>
      <div class="ps">{{ p.spec }}</div>

      <!-- 競標 -->
      <div v-if="isBid" class="pf">
        <div style="width:100%">
          <div class="tmr"><i class="ti ti-clock" aria-hidden="true"></i><span>{{ countdownText }}</span></div>
          <div class="brow">
            <div>
              <div class="blab">目前最高出價</div>
              <div class="bamt">${{ p.currentBid.toLocaleString() }}</div>
              <div class="bcnt">{{ p.bidCount }} 人出價</div>
            </div>
            <button class="ab abbid" @click="act">{{ myBid > 0 ? '再次出價' : '立即出價' }}</button>
          </div>
          <div v-if="myBid > 0" class="mybid" :class="leading ? 'lead' : 'over'">
            <i class="ti" :class="leading ? 'ti-trophy' : 'ti-arrow-down'" aria-hidden="true"></i>
            您的出價 ${{ myBid.toLocaleString() }}・{{ leading ? '領先中' : '已被超越' }}
          </div>
        </div>
      </div>

      <!-- 販售 / 零件 -->
      <div v-else class="pf">
        <div class="pp">${{ p.price.toLocaleString() }} <span>/ {{ unit }}</span></div>
        <button v-if="!sold" class="ab" @click="act">立即認購</button>
        <span v-else style="font-size:12px;color:#9ca3af">已售完</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.owned {
  position: absolute; bottom: 10px; left: 10px;
  display: inline-flex; align-items: center; gap: 3px;
  font-size: 11px; font-weight: 500; padding: 3px 9px; border-radius: 99px;
  background: var(--gn); color: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.15);
}
.owned i { font-size: 12px; }
.mybid {
  display: flex; align-items: center; gap: 4px;
  margin-top: 8px; padding-top: 8px; border-top: 0.5px solid var(--bd);
  font-size: 12px; font-weight: 500;
}
.mybid.lead { color: var(--gn); }
.mybid.over { color: var(--rd); }
.mybid i { font-size: 13px; }
</style>
