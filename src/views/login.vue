<template>
  <div class="auth-page">
    <!-- 品牌信息区（移动端隐藏） -->
    <div class="auth-brand">
      <div class="brand-head">
        <img :src="logo" alt="logo" class="brand-logo" />
        <span class="brand-name">{{ title }}</span>
      </div>
      <div class="brand-body">
        <h2 class="brand-title">云枢 · 企业级<br />后台管理系统</h2>
        <p class="brand-desc">开箱即用的后台管理平台，覆盖用户、权限、日志与系统运维的完整管理能力。</p>
        <ul class="brand-points">
          <li><el-icon><Check /></el-icon>细粒度的角色与接口权限控制</li>
          <li><el-icon><Check /></el-icon>动态菜单、多标签页与主题切换</li>
          <li><el-icon><Check /></el-icon>操作与登录全链路审计</li>
        </ul>
      </div>
      <div class="brand-foot">{{ footerContent }}</div>
    </div>

    <!-- 登录表单区 -->
    <div class="auth-panel">
      <div class="auth-card">
        <h2 class="auth-title">欢迎回来</h2>
        <p class="auth-subtitle">请登录你的账号</p>
        <el-alert
          v-if="loginError"
          :title="loginError"
          type="error"
          :closable="false"
          show-icon
          class="login-error-alert"
        />
        <el-form ref="loginRef" :model="loginForm" :rules="loginRules">
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              type="text"
              size="large"
              auto-complete="off"
              placeholder="账号"
            >
              <template #prefix><svg-icon icon-class="user" class="el-input__icon input-icon" /></template>
            </el-input>
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              size="large"
              auto-complete="off"
              placeholder="密码"
              @keyup.enter="handleLogin"
            >
              <template #prefix><svg-icon icon-class="password" class="el-input__icon input-icon" /></template>
            </el-input>
          </el-form-item>
          <el-form-item prop="code" v-if="captchaEnabled" class="auth-captcha">
            <el-input
              v-model="loginForm.code"
              ref="codeInputRef"
              size="large"
              auto-complete="off"
              placeholder="验证码"
              class="captcha-input"
              @keyup.enter="handleLogin"
            >
              <template #prefix><svg-icon icon-class="validCode" class="el-input__icon input-icon" /></template>
            </el-input>
            <img :src="codeUrl" @click="getCode" class="captcha-img" alt="验证码" />
          </el-form-item>
          <div class="auth-options">
            <el-checkbox v-model="loginForm.rememberMe">记住密码</el-checkbox>
            <router-link v-if="register" class="link-type" :to="'/register'">立即注册</router-link>
          </div>
          <el-form-item style="width:100%;">
            <el-button
              :loading="loading"
              size="large"
              type="primary"
              class="auth-submit"
              @click.prevent="handleLogin"
            >
              <span v-if="!loading">登 录</span>
              <span v-else>登 录 中…</span>
            </el-button>
          </el-form-item>
        </el-form>
      </div>
      <div class="auth-foot">{{ footerContent }}</div>
    </div>
  </div>
</template>

<script setup>
import { getCodeImg } from "@/api/login"
import Cookies from "js-cookie"
import { encrypt, decrypt } from "@/utils/jsencrypt"
import useUserStore from '@/store/modules/user'
import defaultSettings from '@/settings'
import logo from '@/assets/logo/yunshu.svg'

const title = import.meta.env.VITE_APP_TITLE
const footerContent = defaultSettings.footerContent
const userStore = useUserStore()
const route = useRoute()
const router = useRouter()
const { proxy } = getCurrentInstance()

const loginForm = ref({
  username: "admin",
  password: "admin123",
  rememberMe: false,
  code: "",
  uuid: ""
})

const loginRules = {
  username: [{ required: true, trigger: "blur", message: "请输入您的账号" }],
  password: [{ required: true, trigger: "blur", message: "请输入您的密码" }],
  code: [{ required: true, trigger: "change", message: "请输入验证码" }]
}

const codeUrl = ref("")
const loading = ref(false)
// 验证码开关
const captchaEnabled = ref(true)
// 注册开关（跟随后端配置）
const register = ref(false)
const redirect = ref(undefined)
// 登录失败内联提示
const loginError = ref("")
const codeInputRef = ref(null)

watch(route, (newRoute) => {
    redirect.value = newRoute.query && newRoute.query.redirect
}, { immediate: true })

function handleLogin() {
  proxy.$refs.loginRef.validate(valid => {
    if (valid) {
      loading.value = true
      loginError.value = ""
      // 勾选了需要记住密码设置在 cookie 中设置记住用户名和密码
      if (loginForm.value.rememberMe) {
        Cookies.set("username", loginForm.value.username, { expires: 30 })
        Cookies.set("password", encrypt(loginForm.value.password), { expires: 30 })
        Cookies.set("rememberMe", loginForm.value.rememberMe, { expires: 30 })
      } else {
        // 否则移除
        Cookies.remove("username")
        Cookies.remove("password")
        Cookies.remove("rememberMe")
      }
      // 调用action的登录方法
      userStore.login(loginForm.value).then(() => {
        const query = route.query
        const otherQueryParams = Object.keys(query).reduce((acc, cur) => {
          if (cur !== "redirect") {
            acc[cur] = query[cur]
          }
          return acc
        }, {})
        router.push({ path: redirect.value || "/", query: otherQueryParams })
      }).catch(err => {
        loading.value = false
        loginError.value = (err && (err.msg || err.message)) || "登录失败，请稍后重试"
        // 验证码错误时自动聚焦验证码输入框
        if (loginError.value.indexOf("验证码") !== -1 && codeInputRef.value) {
          codeInputRef.value.focus()
        }
        // 重新获取验证码
        if (captchaEnabled.value) {
          getCode()
        }
      })
    }
  })
}

function getCode() {
  getCodeImg().then(res => {
    captchaEnabled.value = res.captchaEnabled === undefined ? true : res.captchaEnabled
    // 注册开关跟随后端配置（未返回时保持关闭）
    register.value = res.register === true
    if (captchaEnabled.value) {
      codeUrl.value = "data:image/gif;base64," + res.img
      loginForm.value.uuid = res.uuid
    }
  })
}

function getCookie() {
  const username = Cookies.get("username")
  const password = Cookies.get("password")
  const rememberMe = Cookies.get("rememberMe")
  loginForm.value = {
    username: username === undefined ? loginForm.value.username : username,
    password: password === undefined ? loginForm.value.password : decrypt(password),
    rememberMe: rememberMe === undefined ? false : Boolean(rememberMe)
  }
}

getCode()
getCookie()
</script>
