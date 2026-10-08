<script setup>
import { ref } from 'vue'
import { CONFIG, verifyLogin } from '../store.js'
import { sendOtpApi } from '../api.js'

const demoMode = !CONFIG.sheetsUrl
const email = ref('')
const otp = ref('')
const err = ref('')
const otpHint = ref(demoMode ? '（示範模式：任意填入 4 碼即可）' : '請先點「發送驗證碼」')
const sending = ref(false)
const verifying = ref(false)
const otpSent = ref(false)
const minOtpLen = demoMode ? 4 : 6

async function sendOtp() {
  const e = email.value.trim()
  if (!e.endsWith('@' + CONFIG.domain)) { err.value = '請填入正確的公司信箱'; return }
  err.value = ''
  sending.value = true
  try {
    await sendOtpApi(e)
    otpSent.value = true
    otpHint.value = demoMode
      ? '驗證碼已寄出（示範模式：任意 4 碼即可）'
      : '驗證碼已寄出，請查收公司信箱（10 分鐘內有效）'
  } catch {
    otpHint.value = '寄送失敗，請稍後再試'
  } finally {
    sending.value = false
  }
}

async function doLogin() {
  const e = email.value.trim()
  if (!e.endsWith('@' + CONFIG.domain)) { err.value = '請填入正確的公司信箱'; return }
  if (otp.value.trim().length < minOtpLen) { err.value = `請輸入 ${minOtpLen} 位驗證碼`; return }
  err.value = ''
  verifying.value = true
  const r = await verifyLogin(e, otp.value.trim())
  verifying.value = false
  if (!r.ok) { err.value = r.error; return }
}
</script>

<template>
  <div id="loginScreen">
    <div class="lcard">
      <div class="llogo">雨林資產認購平台</div>
      <div class="lsub">請以公司信箱登入，僅限內部員工使用</div>
      <div class="fd">
        <label>公司 Email</label>
        <input
          v-model="email"
          type="email"
          :placeholder="`yourname@${CONFIG.domain}`"
          autocomplete="email"
          @keyup.enter="doLogin"
        />
        <div class="hint">僅接受 @{{ CONFIG.domain }} 信箱</div>
      </div>
      <div class="fd">
        <label>驗證碼</label>
        <div class="orow">
          <input v-model="otp" type="text" placeholder="輸入 6 位驗證碼" maxlength="6" @keyup.enter="doLogin" />
          <button :disabled="sending" @click="sendOtp">{{ sending ? '發送中…' : (otpSent ? '重新發送' : '發送驗證碼') }}</button>
        </div>
        <div class="hint">{{ otpHint }}</div>
      </div>
      <button class="bp" :disabled="verifying" @click="doLogin">{{ verifying ? '驗證中…' : '進入平台' }}</button>
      <div v-if="err" class="lerr">{{ err }}</div>
    </div>
  </div>
</template>
