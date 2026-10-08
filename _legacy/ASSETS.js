/**
 * ASSETS.js — 雨林資產認購平台 · 設備清單
 *
 * 修改說明：
 *   - 新增商品：複製任一物件，修改欄位，id 不可重複
 *   - type:
 *       'sell' → 整機販售（填 price, qty）
 *       'part' → 零件拆售（填 price, qty）
 *       'bid'  → 競標（填 startPrice, currentBid, bidCount, endHours）
 *   - condition: '九成新' | '良好' | '堪用'
 *   - icon: 參考 https://tabler.io/icons，填 'ti-xxx' 格式
 *   - color: 商品卡背景色（建議：螢幕 #e0f2fe、桌機 #f0fdf4、零件 #faf5ff、工作站 #fffbeb）
 */

const NOW = Date.now();
const H = 3600000;

const PRODUCTS = [

  // ── 螢幕（整機販售）────────────────────────────────
  {
    id: 1,
    type: 'sell',
    name: 'Dell UltraSharp U2422H 24吋螢幕',
    model: 'U2422H',
    spec: '1920×1080 · IPS · HDMI / DisplayPort / USB-C Hub',
    condition: '九成新',
    price: 2200,
    qty: 8,
    icon: 'ti-device-desktop',
    color: '#e0f2fe',
  },
  {
    id: 2,
    type: 'sell',
    name: 'HP E27q G4 QHD 27吋螢幕',
    model: 'HP E27q G4',
    spec: '2560×1440 · IPS · HDMI / DisplayPort / USB-A Hub',
    condition: '良好',
    price: 2800,
    qty: 5,
    icon: 'ti-device-desktop',
    color: '#e0f2fe',
  },
  {
    id: 3,
    type: 'sell',
    name: 'LG 24MK430H 24吋 FHD 螢幕',
    model: '24MK430H',
    spec: '1920×1080 · IPS · HDMI / D-Sub',
    condition: '堪用',
    price: 900,
    qty: 12,
    icon: 'ti-device-desktop',
    color: '#e0f2fe',
  },
  {
    id: 4,
    type: 'sell',
    name: 'BenQ GW2780 27吋 IPS 螢幕',
    model: 'GW2780',
    spec: '1920×1080 · IPS · HDMI / DP / Eye-Care',
    condition: '良好',
    price: 1600,
    qty: 6,
    icon: 'ti-device-desktop',
    color: '#e0f2fe',
  },

  // ── 套裝桌機（整機販售）────────────────────────────
  {
    id: 5,
    type: 'sell',
    name: 'Dell OptiPlex 7080 SFF 套裝機',
    model: 'OptiPlex 7080',
    spec: 'i7-10700 · 16GB DDR4 · SSD 512GB · Win11 Pro',
    condition: '九成新',
    price: 6200,
    qty: 3,
    icon: 'ti-device-laptop',
    color: '#f0fdf4',
  },
  {
    id: 6,
    type: 'sell',
    name: 'HP EliteDesk 800 G6 SFF 套裝機',
    model: 'EliteDesk 800 G6',
    spec: 'i5-10500 · 8GB DDR4 · SSD 256GB · Win11 Pro',
    condition: '良好',
    price: 3600,
    qty: 5,
    icon: 'ti-device-laptop',
    color: '#f0fdf4',
  },
  {
    id: 7,
    type: 'sell',
    name: 'Lenovo ThinkCentre M720s 套裝機',
    model: 'ThinkCentre M720s',
    spec: 'i5-9400 · 8GB DDR4 · HDD 1TB · Win10 Pro',
    condition: '堪用',
    price: 2200,
    qty: 4,
    icon: 'ti-device-laptop',
    color: '#f0fdf4',
  },

  // ── 零件拆售 ────────────────────────────────────────
  {
    id: 8,
    type: 'part',
    name: 'Kingston 8GB DDR4 記憶體',
    model: 'KVR26N19S8/8',
    spec: 'DDR4 2666MHz · 單條 · 桌機用',
    condition: '良好',
    price: 380,
    qty: 32,
    icon: 'ti-circuit-board',
    color: '#faf5ff',
  },
  {
    id: 9,
    type: 'part',
    name: 'Samsung 870 EVO 256GB SSD',
    model: 'MZ-77E250B',
    spec: 'SATA 2.5吋 · 讀 560MB/s · 寫 530MB/s',
    condition: '良好',
    price: 680,
    qty: 14,
    icon: 'ti-circuit-board',
    color: '#faf5ff',
  },
  {
    id: 10,
    type: 'part',
    name: 'Intel Core i7-10700 CPU',
    model: 'BX8070110700',
    spec: '8核16緒 · 2.9GHz · LGA1200 · 含散熱器',
    condition: '良好',
    price: 3200,
    qty: 4,
    icon: 'ti-cpu',
    color: '#faf5ff',
  },

  // ── 競標 ────────────────────────────────────────────
  {
    id: 11,
    type: 'bid',
    name: 'Dell Precision 3650 Tower 工作站',
    model: 'Precision 3650',
    spec: 'Xeon W-1270 · 32GB ECC · SSD 512GB · Quadro P2200',
    condition: '良好',
    startPrice: 12000,
    currentBid: 14200,
    bidCount: 6,
    endTime: NOW + 48 * H,   // ← 距截止幾小時，改這裡
    qty: 1,
    icon: 'ti-server',
    color: '#fffbeb',
  },
  {
    id: 12,
    type: 'bid',
    name: 'HP Z4 G4 Workstation',
    model: 'Z4 G4',
    spec: 'i9-10900X · 64GB DDR4 · NVMe 1TB · RTX 3060 12GB',
    condition: '九成新',
    startPrice: 22000,
    currentBid: 25500,
    bidCount: 9,
    endTime: NOW + 26 * H,
    qty: 1,
    icon: 'ti-server',
    color: '#fffbeb',
  },
];
