# 雨林資產認購平台

單檔靜態網站，無需後端框架，部署到 Vercel 免費完成。

---

## 專案結構

```
asset-market/
├── index.html     ← 主程式（UI + 邏輯）
├── ASSETS.js      ← 設備清單（只需改這個）
└── README.md
```

---

## Step 1 — 填入真實設備資料

只需編輯 `ASSETS.js`，依照檔案內的欄位說明填入設備資訊。

**整機販售範例**
```js
{
  id: 1,
  type: 'sell',
  name: 'Dell UltraSharp U2422H 24吋螢幕',
  model: 'U2422H',
  spec: '1920×1080 · IPS · HDMI / DisplayPort',
  condition: '九成新',   // '九成新' | '良好' | '堪用'
  price: 2200,
  qty: 8,
  icon: 'ti-device-desktop',
  color: '#e0f2fe',
}
```

**競標範例**
```js
{
  id: 11,
  type: 'bid',
  name: 'Dell Precision 3650 工作站',
  model: 'Precision 3650',
  spec: 'Xeon W-1270 · 32GB · Quadro P2200',
  condition: '良好',
  startPrice: 12000,
  currentBid: 12000,   // 初始設同 startPrice
  bidCount: 0,
  endTime: Date.now() + 48 * 3600000,   // 48 小時後截止
  qty: 1,
  icon: 'ti-server',
  color: '#fffbeb',
}
```

---

## Step 2 — 設定 index.html 的 CONFIG

開啟 `index.html`，找到 `CONFIG` 區塊（約第 180 行）：

```js
const CONFIG = {
  domain: 'rainforestretail.com.tw',
  companyName: '雨林新零售',
  sheetsUrl: '',          // ← Google Sheets 串接後填入（Step 4）
  pickupInfo: '台北辦公室 3F IT 倉庫，週一至週五 10:00–18:00',
};
```

---

## Step 3 — 部署到 Vercel

```bash
# 1. 初始化 Git repo
git init
git add .
git commit -m "init: asset marketplace"

# 2. 推到 GitHub（先在 github.com 建立空白 repo）
git remote add origin https://github.com/你的帳號/asset-market.git
git push -u origin main

# 3. 到 vercel.com
#    → Add New Project → Import Git Repository
#    → 選你剛建的 repo
#    → Framework Preset: Other
#    → Deploy（約 30 秒完成）

# 4. 拿到網址（例如 https://asset-market-xyz.vercel.app）
#    → 傳給員工，完成
```

之後每次更新設備資料：

```bash
git add ASSETS.js
git commit -m "update: 新增螢幕庫存"
git push
# Vercel 自動重新部署，約 30 秒生效
```

---

## Step 4 — 串接 Google Sheets（讓訂單真實落地）

### 4-1 建立 Google Sheet

新增一份 Google 試算表，建立兩個工作表：
- `orders` — 欄位：時間 / 商品 / 員工 / Email / 數量 / 備註
- `bids`   — 欄位：時間 / 商品 / 出價者 / Email / 金額

### 4-2 建立 Apps Script

在試算表選單 → **擴充功能 → Apps Script**，貼入以下程式碼：

```js
const SHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const ss = SpreadsheetApp.openById(SHEET_ID);

  if (data.action === 'order') {
    ss.getSheetByName('orders').appendRow([
      data.time, data.product, data.employee,
      data.email, data.qty, data.note || ''
    ]);
  }

  if (data.action === 'bid') {
    ss.getSheetByName('bids').appendRow([
      data.time, data.product, data.employee,
      data.email, data.amount
    ]);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  // 預留：OTP 寄送、查詢等功能可在此擴充
  return ContentService.createTextOutput('ok');
}
```

### 4-3 部署 Web App

1. Apps Script 右上角 → **部署 → 新增部署**
2. 類型選「**網頁應用程式**」
3. 執行身分：**我**
4. 存取權：**所有人**（包括匿名）
5. 點「部署」，複製產生的 URL

### 4-4 填回 CONFIG

將 URL 貼入 `index.html` 的 `CONFIG.sheetsUrl`：

```js
sheetsUrl: 'https://script.google.com/macros/s/AKfy.../exec',
```

重新 `git push`，Vercel 自動部署，訂單從此寫入 Google Sheet。

---

## 常見問題

**Q: 員工重新整理後庫存消失？**
A: 目前庫存存在前端記憶體，重整會重置。正式解法是把庫存也寫進 Sheets，每次頁面載入時 fetch 讀取。可在後續迭代加入。

**Q: 競標截止後要怎麼通知得標者？**
A: Apps Script 可在 `doPost` 中加入 `MailApp.sendEmail()` 自動寄信給得標者和管理員。

**Q: 要換掉 mock OTP，用真實寄信？**
A: 推薦 [Resend](https://resend.com)（每月 3,000 封免費），或直接用 Apps Script 的 `MailApp.sendEmail()` 寄 OTP，不需額外服務。

---

## 後續可擴充的功能

- [ ] 庫存持久化（Sheets 讀取）
- [ ] 競標結束自動寄信通知
- [ ] 員工認購上限（每人限購 N 台）
- [ ] 管理員後台密碼保護（分離 admin domain）
- [ ] 圖片上傳（改用 Google Drive 公開連結）
