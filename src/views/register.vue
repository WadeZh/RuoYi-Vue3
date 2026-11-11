<template>
  <div class="auth-page">
    <!-- 品牌信息区（移动端隐藏） -->
    <div class="auth-brand">
      <div class="brand-head">
        <img :src="logo" alt="logo" class="brand-logo" />
        <span class="brand-name">{{ title }}</span>
      </div>
      <div class="brand-body">
        <h2 class="brand-title">创建账号<br />开始使用系统</h2>
        <p class="brand-desc">注册后可使用角色权限体系内的全部功能，管理员审核通过后生效。</p>
      </div>
      <div class="brand-foot">{{ footerContent }}</div>
    </div>

    <!-- 注册表单区 -->
    <div class="auth-panel">
      <div class="auth-card">
        <h2 class="auth-title">注册账号</h2>
        <p class="auth-subtitle">填写以下信息创建新账号</p>
        <el-form ref="registerRef" :model="registerForm" :rules="registerRules">
          <el-form-item prop="username">
            <el-input
              v-model="registerForm.username"
              type="text"
              size="large"
              auto-complete="off"
              placeholder="账号"
            >
              <template #prefix><svg-icon icon-class="user" class="el-input__icon input-icon" /></template>
            </el-input>
          </el-form-item>
          <el-form-item prop="password" :rules="registerPwdValidator">
            <el-input
              v-model="registerForm.password"
              type="password"
              size="large"
              auto-complete="off"
              placeholder="密码"
              @keyup.enter="handleRegister"
            >
              <template #prefix><svg-icon icon-class="password" class="el-input__icon input-icon" /></template>
            </el-input>
          </el-form-item>
          <el-form-item prop="confirmPassword">
            <el-input
              v-model="registerForm.confirmPassword"
              type="password"
              size="large"
              auto-complete="off"
              placeholder="确认密码"
              @keyup.enter="handleRegister"
            >
              <template #prefix><svg-icon icon-class="password" class="el-input__icon input-icon" /></template>
            </el-input>
          </el-form-item>
          <el-form-item prop="code" v-if="captchaEnabled" class="auth-captcha">
            <el-input
              size="large"
              v-model="registerForm.code"
              auto-complete="off"
              placeholder="验证码"
              class="captcha-input"
              @keyup.enter="handleRegister"
            >
              <template #prefix><svg-icon icon-class="validCode" class="el-input__icon input-icon" /></template>
            </el-input>
            <img :src="codeUrl" @click="getCode" class="captcha-img" alt="验证码" />
          </el-form-item>
          <el-form-item style="width:100%;">
            <el-button
              :loading="loading"
              size="large"
              type="primary"
              class="auth-submit"
              @click.prevent="handleRegister"
            >
              <span v-if="!loading">注 册</span>
              <span v-else>注 册 中…</span>
            </el-button>
          </el-form-item>
          <div class="auth-alt">
            <router-link class="link-type" :to="'/login'">使用已有账户登录</router-link>
          </div>
        </el-form>
      </div>
      <div class="auth-foot">{{ footerContent }}</div>
    </div>
  </div>
</template>

<script setup>
import { ElMessageBox } from "element-plus"
import { getCodeImg, register } from "@/api/login"
import defaultSettings from '@/settings'
import { usePasswordRule } from "@/utils/passwordRule"
import logo from '@/assets/logo/yunshu.svg'

const title = import.meta.env.VITE_APP_TITLE
const footerContent = defaultSettings.footerContent
const router = useRouter()
const { proxy } = getCurrentInstance()
const { registerPwdValidator } = usePasswordRule()

const registerForm = ref({
  username: "",
  password: "",
  confirmPassword: "",
  code: "",
  uuid: ""
})

const equalToPassword = (rule, value, callback) => {
  if (registerForm.value.password !== value) {
    callback(new Error("两次输入的密码不一致"))
  } else {
    callback()
  }
}

const registerRules = {
  username: [
    { required: true, trigger: "blur", message: "请输入您的账号" },
    { min: 2, max: 20, message: "用户账号长度必须介于 2 和 20 之间", trigger: "blur" }
  ],
  confirmPassword: [
    { required: true, trigger: "blur", message: "请再次输入您的密码" },
    { required: true, validator: equalToPassword, trigger: "blur" }
  ],
  code: [{ required: true, trigger: "change", message: "请输入验证码" }]
}

const codeUrl = ref("")
const loading = ref(false)
const captchaEnabled = ref(true)

function handleRegister() {
  proxy.$refs.registerRef.validate(valid => {
    if (valid) {
      loading.value = true
      register(registerForm.value).then(res => {
        const username = registerForm.value.username
        ElMessageBox.alert("<font color='red'>恭喜你，您的账号 " + username + " 注册成功！</font>", "系统提示", {
          dangerouslyUseHTMLString: true,
          type: "success",
        }).then(() => {
          router.push("/login")
        }).catch(() => {})
      }).catch(() => {
        loading.value = false
        if (captchaEnabled) {
          getCode()
        }
      })
    }
  })
}

function getCode() {
  getCodeImg().then(res => {
    captchaEnabled.value = res.captchaEnabled === undefined ? true : res.captchaEnabled
    if (captchaEnabled.value) {
      codeUrl.value = "data:image/gif;base64," + res.img
      registerForm.value.uuid = res.uuid
    }
  })
}

getCode()
</script>
