import { reactive, computed, watchEffect } from 'vue'
import { CONFIG } from './config.js'
import { loadCatalog, fetchData, submitOrderApi, submitBidApi, cancelOrderApi, verifyOtpApi } from './api.js'

const H = 3600000
const STORAGE_KEY = 'rf_products'   // 商品定義本地暫存（管理員編輯）
const USER_KEY = 'rf_user'          // 登入 session

/**
 * 資料模型
 *   catalog  — 商品「定義」（管理員維護，存 localStorage / assets.json）
 *   orders   — 認購交易紀錄（正式版來自 Google Sheets）
 *   bids     — 競標交易紀錄（正式版來自 Google Sheets）
 *   products — 由上述「推導」出的即時商品（庫存 = 總量−已認購；競標價 = max(底價, 最高出價)）
 */
export const state = reactive({
  user: '',
  catalog: [],         // 商品定義
  products: [],        // 推導後的即時商品（勿直接改，由 derive() 維護）
  orders: [],
  bids: [],
  loading: true,
  loadError: '',
  syncing: false,      // 與後端同步中
  view: 'all',
  filter: 'all',
  search: '',
  dirty: false,        // catalog 是否有未匯出的本地修改
  toasts: [],          // 全域提示訊息
})

/* ── 全域提示（toast）──
   notify(text, { type:'success'|'error'|'info', duration:秒 }) */
let toastSeq = 0
export function notify(text, { type = 'success', duration = 4 } = {}) {
  const id = ++toastSeq
  state.toasts.push({ id, text, type, remaining: duration })
  return id
}
export function dismissToast(id) {
  state.toasts = state.toasts.filter((t) => t.id !== id)
}

/* ──────────────────────────────────────────
   推導即時商品：catalog + orders + bids → products
   只要 catalog / orders / bids 變動就自動重算
   ────────────────────────────────────────── */
function derive() {
  state.products = state.catalog.map((c) => {
    if (c.type === 'bid') {
      const sb = state.bids.filter((b) => b.productId === c.id)
      const maxBid = sb.reduce((m, b) => Math.max(m, b.amount), 0)
      return {
        ...c,
        currentBid: Math.max(c.currentBid || c.startPrice || 0, maxBid),
        bidCount: (c.bidCount || 0) + sb.length,
      }
    }
    const ordered = state.orders
      .filter((o) => o.productId === c.id)
      .reduce((a, o) => a + o.qty, 0)
    return { ...c, qty: Math.max(0, (c.qty || 0) - ordered) }
  })
}
watchEffect(derive)

/* ── 衍生狀態 ── */
export const userName = computed(() => state.user.split('@')[0])
export const bidCount = computed(() => state.catalog.filter((p) => p.type === 'bid').length)

export const isAdmin = computed(() =>
  CONFIG.adminEmails.length === 0 || CONFIG.adminEmails.includes(state.user)
)

export const filteredProducts = computed(() => {
  const q = state.search.trim().toLowerCase()
  return state.products.filter((p) => {
    const tok =
      state.filter === 'all' ? true
      : state.filter === 'available' ? p.qty > 0
      : p.type === state.filter
    const qok = !q
      || p.name.toLowerCase().includes(q)
      || p.spec.toLowerCase().includes(q)
      || p.model.toLowerCase().includes(q)
    return tok && qok
  })
})

export const myOrders = computed(() => state.orders.filter((o) => o.email === state.user))
export const myBids = computed(() => state.bids.filter((b) => b.email === state.user))

/** 我已認購某商品的總數量（用於限購判斷） */
export function myQtyOf(productName) {
  return state.orders
    .filter((o) => o.email === state.user && o.product === productName)
    .reduce((a, o) => a + o.qty, 0)
}

/** 我對某競標品的目前最高出價（沒出過回 0） */
export function myBidOf(productId) {
  return state.bids
    .filter((b) => b.email === state.user && b.productId === productId)
    .reduce((m, b) => Math.max(m, b.amount), 0)
}

export const stats = computed(() => {
  const total = state.orders.reduce((a, o) => {
    const p = state.catalog.find((x) => x.name === o.product)
    return a + (p ? (p.price || 0) * o.qty : 0)
  }, 0)
  return {
    products: state.catalog.length,
    orders: state.orders.length,
    bids: state.bids.length,
    total,
  }
})

export const hasLocalEdits = computed(() => state.dirty)

/* ── 工具 ── */
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}
function nowTime() {
  // 完整日期＋時間，避免 Google Sheets 把純時間誤判成 1899-12-30
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}
function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.catalog))
    state.dirty = true
  } catch (e) {
    console.warn('localStorage 寫入失敗', e)
  }
}

/* ──────────────────────────────────────────
   初始化：載入商品定義 + 從後端讀回交易紀錄
   ────────────────────────────────────────── */
export async function initData() {
  state.loading = true
  state.loadError = ''
  // 還原登入 session
  state.user = localStorage.getItem(USER_KEY) || ''
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      state.catalog = JSON.parse(saved)
      state.dirty = true
    } else {
      state.catalog = await loadCatalog()
    }
    // 正式版：從 Google Sheets 讀回訂單與競標
    await refresh()
  } catch (e) {
    state.loadError = e.message || '資料載入失敗'
  } finally {
    state.loading = false
  }
}

/** 向後端重新拉取訂單 / 競標（後端為單一真實來源） */
export async function refresh() {
  if (!CONFIG.sheetsUrl) return
  state.syncing = true
  try {
    const d = await fetchData()
    if (Array.isArray(d.orders)) state.orders = d.orders
    if (Array.isArray(d.bids)) state.bids = d.bids
  } catch (e) {
    console.warn('讀取後端失敗', e)
  } finally {
    state.syncing = false
  }
}

/* ── 商品管理（CRUD，操作 catalog） ── */
function nextId() {
  return state.catalog.reduce((m, p) => Math.max(m, p.id), 0) + 1
}

export function addProduct(data) {
  const p = { ...data, id: nextId() }
  if (p.type === 'bid') p.endTime = Date.now() + (Number(p.endHours) || 24) * H
  state.catalog = [...state.catalog, p]
  persist()
  return p
}

export function updateProduct(data) {
  const i = state.catalog.findIndex((x) => x.id === data.id)
  if (i === -1) return
  const merged = { ...state.catalog[i], ...data }
  if (merged.type === 'bid' && data.endHours != null) {
    merged.endTime = Date.now() + Number(data.endHours) * H
  }
  state.catalog = state.catalog.map((x) => (x.id === data.id ? merged : x))
  persist()
}

export function deleteProduct(id) {
  state.catalog = state.catalog.filter((p) => p.id !== id)
  persist()
}

export function importProducts(json) {
  const list = Array.isArray(json) ? json : json.products
  if (!Array.isArray(list)) throw new Error('格式錯誤：找不到 products 陣列')
  const now = Date.now()
  state.catalog = list.map((p) =>
    p.type === 'bid'
      ? { ...p, endTime: now + (Number(p.endHours) || 24) * H }
      : { ...p }
  )
  persist()
}

export function exportProducts() {
  const now = Date.now()
  const products = state.catalog.map((p) => {
    if (p.type !== 'bid') return { ...p }
    const { endTime, ...rest } = p
    const endHours = Math.max(0, Math.round((endTime - now) / H))
    return { ...rest, endHours }
  })
  const blob = new Blob([JSON.stringify({ products }, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'assets.json'
  a.click()
  URL.revokeObjectURL(a.href)
  state.dirty = false
}

export async function resetToFile() {
  localStorage.removeItem(STORAGE_KEY)
  state.dirty = false
  await initData()
}

/* ── 登入 ── */
export function login(email) {
  state.user = email
  try { localStorage.setItem(USER_KEY, email) } catch {}
}

/** 驗證 OTP 後登入（後端比對；mock 模式直接放行） */
export async function verifyLogin(email, otp) {
  try {
    const r = await verifyOtpApi(email, otp)
    if (r && r.ok === false) return { ok: false, error: r.error || '驗證碼錯誤' }
  } catch (e) {
    return { ok: false, error: '驗證失敗，請稍後再試' }
  }
  login(email)
  return { ok: true }
}
export function logout() {
  state.user = ''
  try { localStorage.removeItem(USER_KEY) } catch {}
}

/* ── 認購 ──
   本地驗證通過即「樂觀更新」並立刻回傳成功（dialog 馬上關閉）；
   後端寫入在背景進行，失敗才還原並提示。 */
export function placeOrder(product, { name, qty, note }) {
  if (qty > product.qty) return { ok: false, error: '數量超出庫存' }
  if (product.limit > 0) {
    const already = myQtyOf(product.name)
    if (already + qty > product.limit) {
      const left = Math.max(0, product.limit - already)
      return { ok: false, error: `本商品每人限購 ${product.limit} ${product.type === 'part' ? '個' : '台'}，您尚可認購 ${left}` }
    }
  }
  const order = {
    id: genId(),
    time: nowTime(),
    productId: product.id,
    product: product.name,
    employee: name,
    email: state.user,
    qty,
    note: note || '',
  }
  state.orders = [...state.orders, order] // 樂觀更新（庫存即時反映）
  if (CONFIG.sheetsUrl) syncOrder(order)  // 背景寫入，不阻塞 UI
  return { ok: true }
}

function syncOrder(order) {
  submitOrderApi(order)
    .then((r) => {
      if (r && r.ok === false) {
        state.orders = state.orders.filter((o) => o.id !== order.id)
        notify(`「${order.product}」認購未成功：${r.error || '後端拒絕'}`, { type: 'error', duration: 6 })
      } else {
        refresh()
      }
    })
    .catch((e) => {
      console.warn('Sheets 寫入失敗', e)
      state.orders = state.orders.filter((o) => o.id !== order.id)
      notify(`「${order.product}」認購同步失敗，請重試`, { type: 'error', duration: 6 })
    })
}

/** 取消認購：移除紀錄（庫存自動回補），並通知後端刪除 */
export async function cancelOrder(order) {
  state.orders = state.orders.filter((o) => o.id !== order.id)
  if (CONFIG.sheetsUrl) {
    try {
      await cancelOrderApi(order.id)
      await refresh()
    } catch (e) {
      console.warn('後端取消失敗', e)
    }
  }
  return { ok: true }
}

/* ── 競標 ──
   同樣樂觀更新、立刻關閉；後端裁決（並發）在背景進行，被超越才還原並提示。 */
export function placeBid(product, { name, amount }) {
  if (!amount || amount <= product.currentBid) {
    return { ok: false, error: `出價須高於目前最高出價 $${product.currentBid.toLocaleString()}` }
  }
  const bid = {
    id: genId(),
    time: nowTime(),
    productId: product.id,
    product: product.name,
    employee: name,
    email: state.user,
    amount,
  }
  state.bids = [...state.bids, bid] // 樂觀更新
  if (CONFIG.sheetsUrl) syncBid(bid) // 背景送出，不阻塞 UI
  return { ok: true }
}

function syncBid(bid) {
  submitBidApi(bid)
    .then((r) => {
      if (r && r.ok === false) {
        state.bids = state.bids.filter((b) => b.id !== bid.id)
        refresh()
        notify(`「${bid.product}」出價 $${bid.amount.toLocaleString()} 已被超越，請重新出價`, { type: 'error', duration: 6 })
      } else {
        refresh()
      }
    })
    .catch((e) => {
      console.warn('Sheets 寫入失敗', e)
      state.bids = state.bids.filter((b) => b.id !== bid.id)
      notify(`「${bid.product}」出價同步失敗，請重試`, { type: 'error', duration: 6 })
    })
}

export { CONFIG }
