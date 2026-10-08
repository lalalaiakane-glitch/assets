<script setup>
import { ref, computed } from 'vue'
import { placeBid, state, notify, myBidOf } from '../store.js'
import { useCountdown } from '../composables/useCountdown.js'
import ProductSpecs from './ProductSpecs.vue'

const props = defineProps({ product: { type: Object, required: true } })
const emit = defineEmits(['close'])

const p = computed(() => props.product)
const QUICK_ADDS = [100, 200, 500, 1000]
const myBid = computed(() => myBidOf(p.value.id))
const leading = computed(() => myBid.value > 0 && myBid.value >= p.value.currentBid)

const name = ref('')
const amount = ref(props.product.currentBid) // 預設帶入當前最高價
const err = ref('')
const submitting = ref(false)

function addAmount(n) {
  amount.value = (Number(amount.value) || p.value.currentBid) + n
}
function resetAmount() {
  amount.value = p.value.currentBid
}

const { parts, ended, pad } = useCountdown(() => p.value.endTime ?? 0)

async function submit() {
  if (!name.value.trim()) { err.value = '請填寫姓名'; return }
  err.value = ''
  submitting.value = true
  const r = await placeBid(p.value, { name: name.value.trim(), amount: Number(amount.value) })
  submitting.value = false
  if (!r.ok) { err.value = r.error; return }
  notify(`出價成功 $${Number(amount.value).toLocaleString()}！得標後管理員將聯繫您。`, { type: 'success', duration: 5 })
  emit('close')
}
</script>

<template>
  <div class="overlay">
    <div class="modal">
      <div class="mhdr">
        <div class="mtitle">{{ p.name }}　競標</div>
        <button class="mclose" aria-label="關閉" @click="emit('close')"><i class="ti ti-x"></i></button>
      </div>
      <div class="mbody">
        <ProductSpecs :product="p" />
        <div class="bdisp">
          <div class="bdl">目前最高出價</div>
          <div class="bda">${{ p.currentBid.toLocaleString() }}</div>
          <div class="bdc">{{ p.bidCount }} 人出價</div>
        </div>

        <div v-if="myBid > 0" class="mybidbar" :class="leading ? 'lead' : 'over'">
          <i class="ti" :class="leading ? 'ti-trophy' : 'ti-arrow-down'" aria-hidden="true"></i>
          您目前出價 <b>${{ myBid.toLocaleString() }}</b>・{{ leading ? '領先中' : '已被超越' }}
        </div>

        <div v-if="!ended" class="cdrow">
          <div class="cdu"><span class="cdd">{{ pad(parts.h) }}</span><div class="cdl">小時</div></div>
          <span class="cdsp">:</span>
          <div class="cdu"><span class="cdd">{{ pad(parts.m) }}</span><div class="cdl">分鐘</div></div>
          <span class="cdsp">:</span>
          <div class="cdu"><span class="cdd">{{ pad(parts.s) }}</span><div class="cdl">秒</div></div>
        </div>
        <div v-else class="ebar" style="text-align:center">此競標已結束</div>

        <div class="fg"><label>您的姓名</label><input v-model="name" placeholder="王小明" /></div>
        <div class="fg"><label>公司 Email</label><input :value="state.user" readonly /></div>
        <div class="fg">
          <label>出價金額（目前最高 ${{ p.currentBid.toLocaleString() }}）</label>
          <input v-model.number="amount" type="number" />
          <div class="quickrow">
            <button v-for="n in QUICK_ADDS" :key="n" type="button" class="qadd" @click="addAmount(n)">+{{ n }}</button>
            <button type="button" class="qadd qreset" @click="resetAmount">重設</button>
          </div>
        </div>

        <div v-if="err" class="ebar">{{ err }}</div>
        <button class="bp bam" :disabled="submitting || ended" @click="submit">{{ submitting ? '處理中…' : '確認出價' }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mybidbar {
  display: flex; align-items: center; gap: 6px;
  border-radius: var(--rs); padding: 8px 12px; margin-bottom: 14px; font-size: 13px;
}
.mybidbar.lead { background: var(--gnb); color: var(--gn); }
.mybidbar.over { background: var(--rdb); color: var(--rd); }
.mybidbar i { font-size: 15px; }
.quickrow { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
.qadd {
  padding: 5px 12px; border: 0.5px solid #fcd34d; background: var(--amb);
  color: var(--am); border-radius: var(--rs); font-size: 12px; cursor: pointer;
  transition: background .12s; font-weight: 500;
}
.qadd:hover { background: #fef3c7; }
.qreset { border-color: var(--bd); background: var(--card); color: var(--sub); font-weight: 400; }
.qreset:hover { background: var(--bg); }
</style>
