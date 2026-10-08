<script setup>
import { computed } from 'vue'

const props = defineProps({ product: { type: Object, required: true } })
const p = computed(() => props.product)
const isBid = computed(() => p.value.type === 'bid')
const unit = computed(() => (p.value.type === 'part' ? '個' : '台'))
</script>

<template>
  <div class="sg">
    <div class="si"><div class="sl">型號</div><div class="sv">{{ p.model }}</div></div>
    <div class="si"><div class="sl">成色</div><div class="sv">{{ p.condition }}</div></div>
    <div class="si"><div class="sl">規格</div><div class="sv" style="font-size:12px">{{ p.spec }}</div></div>
    <div class="si">
      <div class="sl">{{ isBid ? '起標價格' : '庫存' }}</div>
      <div class="sv">
        {{ isBid ? '$' + p.startPrice.toLocaleString() : p.qty + ' ' + unit }}
      </div>
    </div>
  </div>
</template>
