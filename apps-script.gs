/**
 * 雨林資產認購平台 — Google Apps Script 後端
 * ────────────────────────────────────────────
 * 部署方式：
 *   1. 建立一份 Google 試算表，新增三個工作表：orders / bids / otp
 *      orders 第一列(標題)：id  time  productId  product  employee  email  qty  note
 *      bids   第一列(標題)：id  time  productId  product  employee  email  amount
 *      otp    第一列(標題)：email  otp  time
 *   2. 擴充功能 → Apps Script，貼入本檔全部內容
 *   3. 部署 → 新增部署 → 類型「網頁應用程式」
 *      執行身分：我　／　存取權：所有人
 *   4. 複製產生的 /exec URL，填入前端 src/config.js 的 sheetsUrl
 */

const SS = SpreadsheetApp.getActiveSpreadsheet();

/* ── 工具：讀整張工作表成物件陣列（依標題列） ── */
function readSheet(name) {
  const sh = SS.getSheetByName(name);
  if (!sh) return [];
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  const header = values[0];
  return values.slice(1).map(function (row) {
    const obj = {};
    header.forEach(function (key, i) { obj[key] = row[i]; });
    return obj;
  });
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ── GET：讀回交易紀錄 ── */
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'getData';
  if (action === 'getData') {
    return jsonOut({
      orders: readSheet('orders'),
      bids: readSheet('bids'),
    });
  }
  return jsonOut({ ok: true });
}

/* ── POST：寫入 / 取消 / 競標 / OTP ── */
function doPost(e) {
  const data = JSON.parse(e.postData.contents);

  // 認購
  if (data.action === 'order') {
    SS.getSheetByName('orders').appendRow([
      data.id, data.time, data.productId, data.product,
      data.employee, data.email, data.qty, data.note || '',
    ]);
    return jsonOut({ ok: true });
  }

  // 取消認購：依 id 刪除該列
  if (data.action === 'cancelOrder') {
    const sh = SS.getSheetByName('orders');
    const values = sh.getDataRange().getValues();
    for (let r = values.length - 1; r >= 1; r--) {
      if (String(values[r][0]) === String(data.id)) {
        sh.deleteRow(r + 1); // 1-based，含標題列
      }
    }
    return jsonOut({ ok: true });
  }

  // 競標出價：後端判定是否高於當前最高價（處理並發）
  if (data.action === 'bid') {
    const bids = readSheet('bids').filter(function (b) {
      return String(b.productId) === String(data.productId);
    });
    const maxBid = bids.reduce(function (m, b) { return Math.max(m, Number(b.amount) || 0); }, 0);
    if (Number(data.amount) <= maxBid) {
      return jsonOut({ ok: false, error: '出價已被超越，目前最高 $' + maxBid, currentBid: maxBid });
    }
    SS.getSheetByName('bids').appendRow([
      data.id, data.time, data.productId, data.product,
      data.employee, data.email, data.amount,
    ]);
    return jsonOut({ ok: true, currentBid: Number(data.amount) });
  }

  // 寄送 OTP
  if (data.action === 'sendOtp') {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    SS.getSheetByName('otp').appendRow([data.email, otp, new Date()]);
    MailApp.sendEmail(data.email, '【雨林資產認購平台】驗證碼',
      '您的驗證碼為：' + otp + '\n\n此驗證碼 10 分鐘內有效。');
    return jsonOut({ ok: true });
  }

  // 驗證 OTP：比對該 email 最新一筆，且須在 10 分鐘內
  if (data.action === 'verifyOtp') {
    const rows = readSheet('otp').filter(function (r) {
      return String(r.email) === String(data.email);
    });
    if (!rows.length) return jsonOut({ ok: false, error: '請先發送驗證碼' });
    const last = rows[rows.length - 1];
    const age = new Date().getTime() - new Date(last.time).getTime();
    if (age > 10 * 60 * 1000) return jsonOut({ ok: false, error: '驗證碼已過期，請重新發送' });
    if (String(last.otp) !== String(data.otp).trim()) return jsonOut({ ok: false, error: '驗證碼錯誤' });
    return jsonOut({ ok: true });
  }

  return jsonOut({ ok: true });
}
