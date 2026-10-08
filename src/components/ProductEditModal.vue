<script setup>
import { ref, reactive, computed } from 'vue'
import { addProduct, updateProduct } from '../store.js'

const props = defineProps({
  // 傳入既有商品 = 編輯模式；null = 新增模式
  product: { type: Object, default: null },
})
const emit = defineEmits(['close'])

const isEdit = computed(() => !!props.product)

const CONDITIONS = ['九成新', '良好', '堪用']
const TYPES = [
  { v: 'sell', label: '整機販售' },
  { v: 'part', label: '零件拆售' },
  { v: 'bid', label: '競標' },
]
const COLORS = [
  { v: '#e0f2fe', label: '螢幕（藍）' },
  { v: '#f0fdf4', label: '桌機（綠）' },
  { v: '#faf5ff', label: '零件（紫）' },
  { v: '#fffbeb', label: '工作站（黃）' },
]

// 表單初始值
const blank = {
  type: 'sell', name: '', model: '', spec: '', condition: '良好',
  icon: 'ti-device-desktop', color: '#e0f2fe',
  price: 0, qty: 1, limit: 0,
  startPrice: 0, currentBid: 0, bidCount: 0, endHours: 48,
}

const form = reactive({ ...blank, ...(props.product || {}) })
// 編輯競標品時，把剩餘時間還原成 endHours 供調整
if (isEdit.value && form.type === 'bid' && form.endTime) {
  form.endHours = Math.max(0, Math.round((form.endTime - Date.now()) / 3600000))
}

const isBid = computed(() => form.type === 'bid')
const err = ref('')

function save() {
  if (!form.name.trim()) { err.value = '請填寫商品名稱'; return }
  if (!form.icon.trim()) { err.value = '請填寫 icon（ti-xxx）'; return }
  err.value = ''

  // 依類型整理欄位
  const base = {
    type: form.type,
    name: form.name.trim(),
    model: form.model.trim(),
    spec: form.spec.trim(),
    condition: form.condition,
    icon: form.icon.trim(),
    color: form.color,
  }
  let data
  if (isBid.value) {
    data = {
      ...base, qty: 1,
      startPrice: Number(form.startPrice) || 0,
      currentBid: Number(form.currentBid) || Number(form.startPrice) || 0,
      bidCount: Number(form.bidCount) || 0,
      endHours: Number(form.endHours) || 24,
    }
  } else {
    data = {
      ...base,
      price: Number(form.price) || 0,
      qty: Number(form.qty) || 0,
      limit: Number(form.limit) || 0,
    }
  }

  if (isEdit.value) updateProduct({ id: props.product.id, ...data })
  else addProduct(data)
  emit('close')
}
</script>

<template>
  <div class="overlay">
    <div class="modal">
      <div class="mhdr">
        <div class="mtitle">{{ isEdit ? '編輯商品' : '新增商品' }}</div>
        <button class="mclose" aria-label="關閉" @click="emit('close')"><i class="ti ti-x"></i></button>
      </div>
      <div class="mbody">
        <div class="fg">
          <label>商品類型</label>
          <select v-model="form.type" class="fsel">
            <option v-for="t in TYPES" :key="t.v" :value="t.v">{{ t.label }}</option>
          </select>
        </div>
        <div class="fg"><label>商品名稱</label><input v-model="form.name" placeholder="Dell UltraSharp U2422H 24吋螢幕" /></div>
        <div class="fg2">
          <div class="fg"><label>型號</label><input v-model="form.model" placeholder="U2422H" /></div>
          <div class="fg">
            <label>成色</label>
            <select v-model="form.condition" class="fsel">
              <option v-for="c in CONDITIONS" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
        </div>
        <div class="fg"><label>規格</label><input v-model="form.spec" placeholder="1920×1080 · IPS · HDMI / DisplayPort" /></div>

        <!-- 販售 / 零件 -->
        <template v-if="!isBid">
          <div class="fg2">
            <div class="fg"><label>單價</label><input v-model.number="form.price" type="number" min="0" /></div>
            <div class="fg"><label>庫存數量</label><input v-model.number="form.qty" type="number" min="0" /></div>
          </div>
          <div class="fg">
            <label>每人限購數量（0 = 不限）</label>
            <input v-model.number="form.limit" type="number" min="0" placeholder="0" />
          </div>
        </template>

        <!-- 競標 -->
        <template v-else>
          <div class="fg2">
            <div class="fg"><label>起標價格</label><input v-model.number="form.startPrice" type="number" min="0" /></div>
            <div class="fg"><label>目前最高出價</label><input v-model.number="form.currentBid" type="number" min="0" /></div>
          </div>
          <div class="fg2">
            <div class="fg"><label>出價人數</label><input v-model.number="form.bidCount" type="number" min="0" /></div>
            <div class="fg"><label>距截止（小時）</label><input v-model.number="form.endHours" type="number" min="0" /></div>
          </div>
        </template>

        <div class="fg2">
          <div class="fg">
            <label>Icon（<a href="https://tabler.io/icons" target="_blank" rel="noopener">tabler</a> ti-xxx）</label>
            <input v-model="form.icon" placeholder="ti-device-desktop" />
          </div>
          <div class="fg">
            <label>卡片底色</label>
            <select v-model="form.color" class="fsel">
              <option v-for="c in COLORS" :key="c.v" :value="c.v">{{ c.label }}</option>
            </select>
          </div>
        </div>

        <!-- 即時預覽 icon -->
        <div class="iprev" :style="{ background: form.color }">
          <i class="ti" :class="form.icon" aria-hidden="true"></i>
          <span>icon 預覽</span>
        </div>

        <div v-if="err" class="ebar">{{ err }}</div>
        <button class="bp" @click="save">{{ isEdit ? '儲存修改' : '新增上架' }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fg2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.fsel {
  width: 100%; padding: 9px 11px; border: 0.5px solid var(--bd);
  border-radius: var(--rs); font-size: 13px; background: #fff; color: var(--tx);
  outline: none; font-family: inherit;
}
.fsel:focus { border-color: var(--ac); }
.iprev {
  display: flex; align-items: center; gap: 10px;
  border-radius: var(--rs); padding: 12px 14px; margin-bottom: 14px;
  font-size: 12px; color: var(--sub);
}
.iprev i { font-size: 30px; color: rgba(0,0,0,0.25); }
.fg label a { color: var(--ac); text-decoration: none; }
</style>
