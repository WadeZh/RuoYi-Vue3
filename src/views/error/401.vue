<template>
  <error-page
    code="401"
    title="无访问权限"
    desc="抱歉，您没有权限访问此页面，请登录具有相应权限的账号后再试。"
    icon="Lock"
  >
    <el-button @click="back">返回上一页</el-button>
    <el-button @click="router.push('/index')">回首页</el-button>
    <el-button type="primary" @click="reLogin">重新登录</el-button>
  </error-page>
</template>

<script setup>
import ErrorPage from './components/ErrorPage'
import useUserStore from '@/store/modules/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

function back() {
  if (route.query.noGoBack) {
    router.push({ path: '/' })
  } else {
    router.go(-1)
  }
}

// 清除登录态回到登录页（token 过期/无权限场景）
function reLogin() {
  userStore.logOut().finally(() => {
    location.href = '/login'
  })
}
</script>
