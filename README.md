# 雨林資產認購平台

Vue 3 + Vite 單頁應用，`npm` 打包成靜態檔，部署到 Vercel 免費完成。
後端維持 Google Apps Script（寫入 Google Sheets），不需專職後端。

---

## 專案結構

```
assets/
├── index.html              Vite 進入點（掛載 #app）
├── package.json            npm 指令與相依
├── vite.config.js          Vite 設定（dev port 3000、build → dist/）
├── public/
│   └── assets.json         ← 設備清單（非技術人員只需改這個，免重新 build）
├── src/
│   ├── main.js             進入點
│   ├── App.vue             根元件（登入 / 主畫面切換）
│   ├── config.js           ← 公司資訊設定（domain、sheetsUrl…）
│   ├── api.js              Apps Script 串接層（mock / 正式自動切換）
│   ├── store.js            全域狀態（reactive）
│   ├── styles/main.css     全域樣式（設計調整集中於此）
│   ├── composables/
│   │   └── useCountdown.js 競標倒數計時
│   └── components/         UI 元件（Login / Sidebar / Modal / Admin…）
└── _legacy/                舊版純靜態 HTML 備份（可刪）
```

---

## 本地開發

> ⚠️ 需要 **Node.js 18 以上**（建議 20 LTS）。Node 14 無法跑 Vite 6。

```bash
npm install        # 第一次先安裝相依
npm run dev        # 啟動開發伺服器，預設 http://localhost:3000（HMR 熱更新）
npm run build      # 打包到 dist/
npm run preview    # 本地預覽打包結果
```

改任何 `.vue` / `.css` / `assets.json`，瀏覽器即時更新，不需重整。

---

## Step 1 — 填入真實設備資料

只需編輯 `public/assets.json`（純 JSON，免重新 build，存檔即生效）。

**整機販售 / 零件拆售**
```json
{
  "id": 1,
  "type": "sell",
  "name": "Dell UltraSharp U2422H 24吋螢幕",
  "model": "U2422H",
  "spec": "1920×1080 · IPS · HDMI / DisplayPort",
  "condition": "九成新",
  "price": 2200,
  "qty": 8,
  "icon": "ti-device-desktop",
  "color": "#e0f2fe"
}
```
- `type`：`"sell"` 整機 / `"part"` 零件（兩者都填 `price`、`qty`）
- `condition`：`"九成新"` | `"良好"` | `"堪用"`
- `icon`：參考 https://tabler.io/icons，填 `ti-xxx`（outline only）
- `color`：建議 螢幕 `#e0f2fe`、桌機 `#f0fdf4`、零件 `#faf5ff`、工作站 `#fffbeb`

**競標**
```json
{
  "id": 11,
  "type": "bid",
  "name": "Dell Precision 3650 工作站",
  "model": "Precision 3650",
  "spec": "Xeon W-1270 · 32GB · Quadro P2200",
  "condition": "良好",
  "startPrice": 12000,
  "currentBid": 12000,
  "bidCount": 0,
  "endHours": 48,
  "qty": 1,
  "icon": "ti-server",
  "color": "#fffbeb"
}
```
- `endHours`：距現在幾小時截止（載入時自動換算成截止時間）

---

## Step 2 — 設定公司資訊

編輯 `src/config.js`：

```js
export const CONFIG = {
  domain: 'rainforestretail.com.tw',
  companyName: '雨林新零售',
  sheetsUrl: '',          // ← Google Apps Script 串接後填入（Step 4）
  pickupInfo: '台北辦公室 3F IT 倉庫，週一至週五 10:00–18:00',
  bidStep: 200,           // 競標每次最低加價
  adminEmails: [          // ← 只有這些信箱看得到「管理後台」（留空 [] = 所有人可看）
    'it@rainforestretail.com.tw',
  ],
}
```

---

## 管理員功能（後台「商品管理」分頁）

只有 `adminEmails` 白名單內的帳號登入後，側欄才會出現「管理後台」，其中「商品管理」分頁可：

- **新增 / 編輯 / 刪除商品**（含整機、零件、競標三種類型，附 icon 即時預覽）
- **匯入 JSON**：上傳一份 `assets.json` 整批取代
- **匯出 assets.json**：把目前所有商品下載成標準格式

> ⚠️ 因為前端無法直接寫入 `public/assets.json`，管理員的編輯先暫存在瀏覽器（localStorage），
> 重整不會遺失，但**僅限該瀏覽器可見**。要讓所有人永久生效，請按「匯出 assets.json」，
> 把下載的檔案放回 `public/assets.json`，`git push` 後 Vercel 重新部署即可。
> （未來串接 Apps Script 後，可改為直接寫回後端，免手動匯出。）

---

## Step 3 — 部署到 Vercel

```bash
git init
git add .
git commit -m "init: Vue 3 asset marketplace"
git remote add origin https://github.com/你的帳號/asset-market.git
git push -u origin main
```

到 vercel.com → Add New Project → Import → 選 repo。Vercel 會自動偵測 Vite：
- Framework Preset：**Vite**
- Build Command：`npm run build`
- Output Directory：`dist`

按 Deploy，約 30 秒完成。之後每次 `git push` 自動重新部署。

> 更新設備資料：改 `public/assets.json` → `git push` 即可。

---

## Step 4 — 串接 Google Sheets（讓訂單真實落地）

### 4-1 建立 Google Sheet
新增試算表，建立三個工作表，**第一列填標題**：
- `orders` — `id  time  productId  product  employee  email  qty  note`
- `bids`   — `id  time  productId  product  employee  email  amount`
- `otp`    — `email  otp  time`（若要真實 OTP）

### 4-2 Apps Script
試算表 → 擴充功能 → Apps Script，把專案根目錄 **`apps-script.gs`** 的全部內容貼入。
（內含 `doGet`(讀回 orders/bids)、`doPost`(認購/取消/競標/OTP)，競標會在後端判定是否高於當前最高價）

### 4-3 部署 Web App
部署 → 新增部署 → 類型「網頁應用程式」→ 執行身分「我」→ 存取權「所有人」→ 部署，複製 URL。

### 4-4 填回 config.js
```js
sheetsUrl: 'https://script.google.com/macros/s/AKfy.../exec',
```
`api.js` 偵測到 `sheetsUrl` 有值即自動改走後端（載入時 `fetchData` 讀回訂單/競標），否則維持本地 mock。

---

## 資料模型與持久化

- **商品定義（catalog）**：`public/assets.json`，管理員可在後台編輯（暫存 localStorage）→ 匯出回 json → push 永久生效。
- **認購 / 競標（交易紀錄）**：填入 `sheetsUrl` 後存於 Google Sheets，頁面載入時讀回，**重整不消失**；未串接時為前端記憶體（mock，重整清空）。
- **即時庫存 / 競標價**：前端「推導」——庫存 = 定義總量 − 已認購；競標價 = max(底價, 最高出價)。不另存可變狀態，避免不一致。
- **登入 session**：存 localStorage，重整免重新登入。
- **取消認購**：前端移除並呼叫後端 `cancelOrder` 依 id 刪列，庫存自動回補。

> ⚠️ CORS：POST 採 `text/plain` 簡單請求避開 preflight；GET 讀取若遇瀏覽器 CORS 阻擋，
> 可改用 JSONP 或在 Apps Script 加轉址處理（多數情況直接 fetch 即可）。

**Q: OTP 怎麼運作？**
A: 填好 `sheetsUrl` 後即為真實驗證：「發送驗證碼」呼叫 `sendOtp`，Apps Script 產生 6 碼存入 `otp` 表並寄信；「進入平台」呼叫 `verifyOtp`，後端比對該 email 最新一筆且須在 10 分鐘內、碼相符才放行。
未填 `sheetsUrl`（mock）時維持示範模式，任意 4 碼可過，方便開發。

---

## 後續可擴充

- [ ] 庫存 / 訂單持久化（Sheets 讀取）
- [x] 真實 OTP 驗證（mock 模式仍任意 4 碼可過）
- [ ] 競標結束自動寄信通知
- [ ] 員工認購上限（每人限購 N 台）
- [x] 管理後台權限分離（admin email 白名單）
- [x] 管理員上架 / 編輯 / 匯入 / 匯出商品
- [ ] 商品圖片（assets.json 新增 imageUrl 欄位）
- [ ] 商品管理直接寫回後端（免手動匯出 assets.json）
