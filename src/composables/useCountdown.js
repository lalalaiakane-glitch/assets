import { ref, computed, onMounted, onUnmounted } from 'vue'

const H = 3600000

/** 全域共用的每秒 tick，避免每張卡片各開一個 interval */
const now = ref(Date.now())
let timer = null
let refCount = 0

function start() {
  refCount += 1
  if (!timer) {
    timer = setInterval(() => { now.value = Date.now() }, 1000)
  }
}
function stop() {
  refCount -= 1
  if (refCount <= 0 && timer) {
    clearInterval(timer)
    timer = null
    refCount = 0
  }
}

/**
 * 倒數計時 composable
 * @param {() => number} endTimeGetter 回傳截止時間戳記的 getter
 */
export function useCountdown(endTimeGetter) {
  onMounted(start)
  onUnmounted(stop)

  const diff = computed(() => Math.max(0, endTimeGetter() - now.value))
  const ended = computed(() => diff.value <= 0)

  const parts = computed(() => {
    const d = diff.value
    return {
      h: Math.floor(d / H),
      m: Math.floor((d % H) / 60000),
      s: Math.floor((d % 60000) / 1000),
    }
  })

  // 卡片用文字："2小時 30分 10秒"
  const text = computed(() => {
    if (ended.value) return '已結束'
    const { h, m, s } = parts.value
    return (h > 0 ? `${h}小時 ` : '') + `${m}分 ${s}秒`
  })

  const pad = (n) => String(n).padStart(2, '0')

  return { diff, ended, parts, text, pad }
}
