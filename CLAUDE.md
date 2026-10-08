# CLAUDE.md — 雨林資產認購平台

> 給本地端 Claude Code 的開發交接文件。
> 閱讀本文件後即可接續開發，無需回顧原始對話。

---

## 專案背景

雨林新零售（rainforestretail.com.tw）進行資產盤點，需要處理約 100 台螢幕與數十台主機。為讓員工優先認購，建立這個內部平台。目標是快速上線、低維護成本、無需專職後端。

---

## 技術決策

> 2026-06 重構：由純靜態單檔遷移至 Vue 3 + Vite（為了 npm 打包、HMR 開發、元件化迭代）。
> 舊版完整備份在 `_legacy/`。

| 決策 | 選擇 | 原因 |
|------|------|------|
| 架構 | Vue 3 + Vite（SPA） | npm 打包成靜態 `dist/`、HMR 快速迭代、元件化好維護 |
| 樣式 | 全域 CSS（`src/styles/main.css`） | 沿用舊版設計，集中調整；顏色走 `:root` 變數 |
| 圖示 | Tabler Icons webfont（CDN） | outline 風格，`ti-xxx`，於 index.html 引入 |
| 資料 | `public/assets.json`（runtime fetch） | 非技術人員只改這一個 JSON，免重新 build |
| 狀態 | `src/store.js`（Vue `reactive`） | 輕量，不引入 Pinia |
| 後端 | Google Apps Script Web App | 免費、公司已有 Google Workspace、寫入 Sheets |
| 部署 | Vercel（接 GitHub，Vite preset） | `git push` 自動 build + 部署 |

---

## 檔案結構

```
assets/
├── index.html              Vite 進入點
├── package.json            npm 指令與相依（需 Node 18+）
├── vite.config.js
├── public/assets.json      設備清單：唯一需要業務人員修改的檔案
├── src/
│   ├── main.js
│   ├── App.vue             登入 / 主畫面切換
│   ├── config.js           公司資訊設定
│   ├── api.js              Apps Script 串接層（mock / 正式自動切換，含 fetchData 讀回）
│   ├── store.js            全域狀態 + actions（catalog/orders/bids → 推導 products）
│   ├── styles/main.css     全域樣式
│   ├── composables/useCountdown.js
│   └── components/         Login / AppShell / Sidebar / TopBar /
│                           MarketView / ProductCard / ProductSpecs /
│                           BuyModal / BidModal / AdminView
├── apps-script.gs          Google Apps Script 後端（doGet 讀回 + doPost 寫入/取消/競標/OTP）
├── _legacy/                舊版純靜態 HTML 備份
├── README.md               部署 SOP + Google Sheets 串接
└── CLAUDE.md               本文件

## 資料模型（重要）

- **catalog**（商品定義）：localStorage / assets.json，管理員 CRUD 的對象。
- **orders / bids**（交易）：正式版存 Google Sheets，載入時 `fetchData` 讀回；mock 時為記憶體。
- **products**（即時商品）：`store.js` 的 `derive()` 由 catalog + orders + bids 推導（庫存=總量−已認購、競標價=max(底價,最高出價)），`watchEffect` 自動重算。元件只讀 `state.products`，不直接改。
- 競標 `endTime` 存在 catalog（載入時由 endHours 換算一次），推導時保留，避免倒數被重置。
```

---

## 核心設定區（src/config.js）

```js
export const CONFIG = {
  domain: 'rainforestretail.com.tw',       // Email 驗證 domain
  companyName: '雨林新零售',
  sheetsUrl: '',                            // Google Apps Script URL，串接後填入
  pickupInfo: '台北辦公室 3F IT 倉庫，週一至週五 10:00–18:00',
  bidStep: 200,                             // 競標每次最低加價
}
```

修改這裡即可調整公司資訊，不需動其他邏輯。

---

## 商品資料格式（public/assets.json）

三種 `type`，欄位不同（JSON 格式）：

```jsonc
// 整機販售 / 零件拆售
{ "id", "type": "sell"|"part", "name", "model", "spec", "condition", "price", "qty", "icon", "color" }

// 競標（用 endHours，載入時 api.js 換算成 endTime）
{ "id", "type": "bid", "name", "model", "spec", "condition",
  "startPrice", "currentBid", "bidCount",
  "endHours": 48,   // 距現在 N 小時截止
  "qty": 1, "icon", "color" }
```

`condition` 固定值：`'九成新'` | `'良好'` | `'堪用'`

`icon` 參考 https://tabler.io/icons，填 `'ti-xxx'` 格式（outline only）

`color` 建議：螢幕 `#e0f2fe`、桌機 `#f0fdf4`、零件 `#faf5ff`、工作站 `#fffbeb`

---

## 已完成功能

- [x] Email domain 驗證登入（目前為 mock OTP，任意 4 碼可過）
- [x] 三種商品模式：整機販售、零件拆售、競標
- [x] 競標倒數計時（卡片 + modal 雙重顯示）
- [x] 競標出價驗證（須高於當前最高價，每次加 $200）
- [x] 管理後台：訂單列表、競標記錄、統計卡
- [x] 匯出 CSV（訂單 / 競標分開）
- [x] 搜尋（名稱 / 型號 / 規格）
- [x] 篩選（整機 / 零件 / 競標 / 有庫存）
- [x] Google Apps Script 串接預留（CONFIG.sheetsUrl 填入即啟用）
- [x] 取貨地點說明顯示在認購 modal

---

## 待完成（優先順序）

### 高優先
- [ ] **真實 OTP 寄信**：在 `sendOtp()` 函式中呼叫 Apps Script 寄送 6 位數 OTP，並在 `doLogin()` 驗證
- [ ] **Google Sheets 串接**：在 `CONFIG.sheetsUrl` 填入 Apps Script URL 即自動啟用，邏輯已預留在 `submitOrder()` 和 `submitBid()` 中
- [ ] **庫存持久化**：目前庫存存在前端記憶體，重整後重置；需在 Apps Script 新增 `getInventory` endpoint，頁面載入時 fetch 讀取

### 中優先
- [ ] **競標結束通知**：Apps Script 定時觸發（每小時），檢查 `endTime` 已過的競標，寄信給最高出價者和管理員
- [ ] **圖片支援**：目前用 icon 代替，可改為 Google Drive 公開圖片連結，在 ASSETS.js 新增 `imageUrl` 欄位
- [ ] **員工認購上限**：每人每類商品限購 N 台，在 `submitOrder()` 中加入判斷

### 低優先
- [ ] **管理員獨立驗證**：管理後台目前所有登入員工均可看到，考慮加入 admin email 白名單
- [ ] **競標紀錄匯出 Email**：競標截止後自動寄出競標紀錄給管理員

---

## Google Apps Script 完整程式碼

串接時貼入 Apps Script 編輯器：

```js
const SS = SpreadsheetApp.getActiveSpreadsheet();

function doPost(e) {
  const data = JSON.parse(e.postData.contents);

  if (data.action === 'order') {
    SS.getSheetByName('orders').appendRow([
      data.time, data.product, data.employee,
      data.email, data.qty, data.note || ''
    ]);
  }

  if (data.action === 'bid') {
    SS.getSheetByName('bids').appendRow([
      data.time, data.product, data.employee,
      data.email, data.amount
    ]);
  }

  if (data.action === 'sendOtp') {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    SS.getSheetByName('otp').appendRow([data.email, otp, Date.now()]);
    MailApp.sendEmail(data.email, '【雨林資產認購平台】驗證碼',
      `您的驗證碼為：${otp}\n\n此驗證碼 10 分鐘內有效。`);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

Sheets 需建立三個工作表：`orders`、`bids`、`otp`

---

## 開發注意事項

1. **設計調整集中在 `src/styles/main.css`**：沿用舊版 class 命名（`.pc`、`.modal`、`.fb`…），元件直接套用全域 class
2. **CSS 用 CSS variable**：所有顏色走 `:root` 的 `--` 變數，不要 hardcode hex
3. **icon 只用 outline**：Tabler Icons 的 `-filled` 後綴在此 CDN 版本不存在，會渲染空白
4. **assets.json 格式**：`id` 必須唯一整數，`type` 只接受 `"sell"`、`"part"`、`"bid"`；競標用 `endHours`
5. **狀態管理**：全域狀態與 actions 都在 `store.js`；新功能優先在這裡加 action，元件保持輕薄
6. **後端串接**：所有對外請求集中在 `api.js`，未填 `sheetsUrl` 時為 mock，方便純前端開發

---

## 本地開發

> 需要 Node.js 18+。本機用 nvs 管理版本，開新終端先切換：`nvs use 22`

```bash
nvs use 22         # 切到 Node 22（本機已裝 22.17.0）
npm install        # 第一次
npm run dev        # http://localhost:3000，HMR 熱更新
npm run build      # 打包到 dist/
npm run preview    # 預覽打包結果
```

---

## 部署

Vercel 接 GitHub，Framework Preset 選 **Vite**（Build: `npm run build`，Output: `dist`）。

```bash
git add public/assets.json   # 通常只需更新設備資料
git commit -m "update: 更新設備清單"
git push                     # Vercel 自動 build + 部署，約 30 秒生效
```
