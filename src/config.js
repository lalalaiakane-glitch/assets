/* ════════════════════════════════
   設定區 — 只需修改這裡
   ════════════════════════════════ */
export const CONFIG = {
  domain: 'rainforestretail.com.tw',          // 公司信箱 domain（Email 驗證）
  companyName: '雨林新零售',                    // 顯示名稱
  sheetsUrl: 'https://script.google.com/macros/s/AKfycbwdheoRVsVFHETl2txXJVXhvu5MlNJWph65H4E7ixlwj4PnpMPvNqIHzrWUaaKqs7a4/exec',                               // Google Apps Script URL（串接後填入）
  pickupInfo: '台北辦公室 3F IT 倉庫，週一至週五 10:00–18:00', // 取貨說明
  bidStep: 200,                                // 競標每次最低加價

  // 管理後台白名單：只有清單內的 Email 能看到並進入「管理後台」與「商品管理」
  // 留空陣列 [] 代表所有登入員工都可進入（開發用，正式請填入管理員信箱）
  adminEmails: [
    'it@rainforestretail.com.tw',
    'tom_ren@rainforestretail.com.tw',
  ],
}
