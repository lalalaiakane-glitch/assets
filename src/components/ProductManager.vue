<script setup>
import { ref } from 'vue'
import {
  state, hasLocalEdits,
  deleteProduct, importProducts, exportProducts, resetToFile,
} from '../store.js'
import ProductEditModal from './ProductEditModal.vue'

const editing = ref(undefined) // undefined=關閉, null=新增, {物件}=編輯
const fileInput = ref(null)
const msg = ref('')

const typeLabel = { sell: '整機販售', part: '零件拆售', bid: '競標' }

function openAdd() { editing.value = null }
function openEdit(p) { editing.value = p }
function closeEdit() { editing.value = undefined }

function confirmDelete(p) {
  if (confirm(`確定刪除「${p.name}」？`)) deleteProduct(p.id)
}

function triggerImport() { fileInput.value?.click() }

async function onFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  try {
    const json = JSON.parse(await file.text())
    importProducts(json)
    msg.value = `已匯入 ${state.catalog.length} 筆商品`
  } catch (err) {
    msg.value = '匯入失敗：' + (err.message || '檔案格式錯誤')
  } finally {
    e.target.value = ''
    setTimeout(() => (msg.value = ''), 4000)
  }
}

function doExport() {
  exportProducts()
  msg.value = '已匯出 assets.json，請將檔案放到 public/ 並 git push 永久生效'
  setTimeout(() => (msg.value = ''), 6000)
}

async function doReset() {
  if (confirm('將捨棄所有本地修改，還原成 public/assets.json 的版本？')) {
    await resetToFile()
    msg.value = '已還原為檔案版本'
    setTimeout(() => (msg.value = ''), 4000)
  }
}
</script>

<template>
  <div>
    <div class="pmbar">
      <button class="bp pmadd" @click="openAdd">
        <i class="ti ti-plus" aria-hidden="true"></i> 新增商品
      </button>
      <button class="exbtn" @click="triggerImport"><i class="ti ti-upload" aria-hidden="true"></i> 匯入 JSON</button>
      <button class="exbtn" @click="doExport"><i class="ti ti-download" aria-hidden="true"></i> 匯出 assets.json</button>
      <button class="exbtn" @click="doReset"><i class="ti ti-rotate" aria-hidden="true"></i> 還原檔案版</button>
      <input ref="fileInput" type="file" accept="application/json,.json" style="display:none" @change="onFile" />
    </div>

    <div v-if="hasLocalEdits" class="pmnote">
      <i class="ti ti-alert-circle" aria-hidden="true"></i>
      目前有未匯出的本地修改（暫存於瀏覽器）。請按「匯出 assets.json」下載並提交，修改才會對所有人永久生效。
    </div>
    <div v-if="msg" class="pmmsg">{{ msg }}</div>

    <div class="tcard">
      <table class="tt">
        <colgroup><col style="width:46px"><col style="width:96px"><col><col style="width:120px"><col style="width:80px"><col style="width:96px"></colgroup>
        <thead>
          <tr><th></th><th>類型</th><th>名稱 / 型號</th><th>價格</th><th>庫存</th><th>操作</th></tr>
        </thead>
        <tbody>
          <tr v-if="!state.catalog.length"><td colspan="6" class="etd">尚無商品，點「新增商品」開始上架</td></tr>
          <tr v-for="p in state.catalog" :key="p.id">
            <td><span class="pmicon" :style="{ background: p.color }"><i class="ti" :class="p.icon"></i></span></td>
            <td>{{ typeLabel[p.type] }}</td>
            <td><div class="pmname" :title="p.name">{{ p.name }}</div><div class="pmmodel">{{ p.model }}</div></td>
            <td>
              <template v-if="p.type === 'bid'">${{ (p.currentBid || 0).toLocaleString() }}<span class="pmsub"> 競標</span></template>
              <template v-else>${{ (p.price || 0).toLocaleString() }}</template>
            </td>
            <td>{{ p.type === 'bid' ? '—' : p.qty }}</td>
            <td>
              <button class="pmbtn" @click="openEdit(p)"><i class="ti ti-edit"></i></button>
              <button class="pmbtn pmdel" @click="confirmDelete(p)"><i class="ti ti-trash"></i></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ProductEditModal v-if="editing !== undefined" :product="editing" @close="closeEdit" />
  </div>
</template>

<style scoped>
.pmbar { display: flex; gap: 8px; align-items: center; margin-bottom: 14px; flex-wrap: wrap; }
.bp.pmadd { width: auto; padding: 8px 16px; display: inline-flex; align-items: center; gap: 5px; font-size: 13px; }
.exbtn { display: inline-flex; align-items: center; gap: 5px; }
.pmnote {
  background: var(--amb); color: var(--am); border: 0.5px solid #fcd34d;
  border-radius: var(--rs); padding: 9px 13px; font-size: 12px; margin-bottom: 12px;
  display: flex; align-items: center; gap: 6px;
}
.pmmsg {
  background: var(--gnb); color: var(--gn); border-radius: var(--rs);
  padding: 9px 13px; font-size: 12px; margin-bottom: 12px;
}
.pmicon { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: var(--rs); }
.pmicon i { font-size: 16px; color: rgba(0,0,0,0.3); }
.pmname { font-weight: 500; overflow: hidden; text-overflow: ellipsis; }
.pmmodel { font-size: 11px; color: var(--sub); }
.pmsub { font-size: 11px; color: var(--sub); }
.pmbtn {
  border: 0.5px solid var(--bd); background: var(--card); cursor: pointer;
  border-radius: var(--rs); padding: 4px 8px; color: var(--sub); font-size: 14px; margin-right: 4px;
}
.pmbtn:hover { background: var(--bg); color: var(--tx); }
.pmdel:hover { color: var(--rd); border-color: var(--rd); }
</style>
