import { CONFIG } from './config.js'

/**
 * 後端串接層（Google Apps Script Web App）
 *   - 未填 CONFIG.sheetsUrl → mock 模式（純前端，方便開發）
 *   - 填入後自動改走後端：讀回訂單/競標、寫入、取消
 *
 * 註：POST 一律用預設 text/plain（簡單請求，避開 CORS preflight）；
 *     Apps Script 端 JSON.parse(e.postData.contents) 即可解析。
 */

const H = 3600000

/** 載入商品「定義」（catalog）：runtime fetch public/assets.json */
export async function loadCatalog() {
  const res = await fetch(`${import.meta.env.BASE_URL}assets.json`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`assets.json 載入失敗 (${res.status})`)
  const data = await res.json()
  const now = Date.now()
  return (data.products || []).map((p) =>
    p.type === 'bid'
      ? { ...p, endTime: now + (p.endHours ?? 24) * H }
      : { ...p }
  )
}

/** 讀回所有交易紀錄 { orders:[...], bids:[...] } */
export async function fetchData() {
  if (!CONFIG.sheetsUrl) return { orders: [], bids: [], mock: true }
  const res = await fetch(`${CONFIG.sheetsUrl}?action=getData`)
  if (!res.ok) throw new Error(`後端讀取失敗 (${res.status})`)
  return res.json()
}

function post(payload) {
  return fetch(CONFIG.sheetsUrl, {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then((r) => r.json().catch(() => ({ ok: true })))
}

export async function submitOrderApi(order) {
  if (!CONFIG.sheetsUrl) return { ok: true, mock: true }
  return post({ action: 'order', ...order })
}

export async function cancelOrderApi(id) {
  if (!CONFIG.sheetsUrl) return { ok: true, mock: true }
  return post({ action: 'cancelOrder', id })
}

export async function submitBidApi(bid) {
  if (!CONFIG.sheetsUrl) return { ok: true, mock: true }
  return post({ action: 'bid', ...bid })
}

export async function sendOtpApi(email) {
  if (!CONFIG.sheetsUrl) return { ok: true, mock: true }
  return post({ action: 'sendOtp', email })
}

export async function verifyOtpApi(email, otp) {
  if (!CONFIG.sheetsUrl) return { ok: true, mock: true }
  return post({ action: 'verifyOtp', email, otp })
}
