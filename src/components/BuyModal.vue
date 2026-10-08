<script setup>
import { ref, computed } from 'vue'
import { CONFIG, placeOrder, state, myQtyOf, notify } from '../store.js'
import ProductSpecs from './ProductSpecs.vue'

const props = defineProps({ product: { type: Object, required: true } })
const emit = defineEmits(['close'])

const p = computed(() => props.product)
const unit = computed(() => (p.value.type === 'part' ? '個' : '台'))

// 每人限購
const limit = computed(() => p.value.limit || 0)
const bought = computed(() => myQtyOf(p.value.name))
const remaining = computed(() => (limit.value > 0 ? Math.max(0, limit.value - bought.value) : Infinity))
const maxQty = computed(() => Math.min(p.value.qty, remaining.value))

const name = ref('')
const qty = ref(1)
const note = ref('')
const err = ref('')
const submitting = ref(false)

async function submit() {
  if (!name.value.trim()) { err.value = '請填寫姓名'; return }
  err.value = ''
  submitting.value = true
  const r = await placeOrder(p.value, { name: name.value.trim(), qty: Number(qty.value) || 1, note: note.value.trim() })
  submitting.value = false
  if (!r.ok) { err.value = r.error; return }
  notify('認購成功！管理員將與您確認取貨時間。', { type: 'success', duration: 5 })
  emit('close')
}
</script>

<template>
  <div class="overlay">
    <div class="modal">
      <div class="mhdr">
        <div class="mtitle">{{ p.name }}</div>
        <button class="mclose" aria-label="關閉" @click="emit('close')"><i class="ti ti-x"></i></button>
      </div>
      <div class="mbody">
        <ProductSpecs :product="p" />
        <div class="pline">
          <span class="pbig">${{ p.price.toLocaleString() }}</span>
          <span class="pnote">/ {{ unit }}（員工內購價）</span>
        </div>
        <div class="fg"><label>您的姓名</label><input v-model="name" placeholder="王小明" /></div>
        <div class="fg"><label>公司 Email</label><input :value="state.user" readonly /></div>
        <div class="fg">
          <label>數量</label>
          <input v-model.number="qty" type="number" min="1" :max="maxQty" />
          <div v-if="limit > 0" class="hint" style="font-size:11px;color:var(--sub);margin-top:5px">
            每人限購 {{ limit }} {{ unit }}・您已認購 {{ bought }}・尚可認購 {{ remaining }}
          </div>
        </div>
        <div class="fg"><label>備註（選填）</label><textarea v-model="note" placeholder="取貨方式、需要配件等…"></textarea></div>
        <div v-if="CONFIG.pickupInfo" class="pickup">
          <i class="ti ti-map-pin" style="font-size:13px;vertical-align:-2px;margin-right:4px" aria-hidden="true"></i>{{ CONFIG.pickupInfo }}
        </div>
        <div v-if="err" class="ebar">{{ err }}</div>
        <button class="bp" :disabled="submitting || maxQty < 1" @click="submit">
          {{ limit > 0 && remaining < 1 ? '已達限購上限' : (submitting ? '處理中…' : '確認認購') }}
        </button>
      </div>
    </div>
  </div>
</template>
