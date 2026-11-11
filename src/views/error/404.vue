<template>
  <error-page
    code="404"
    title="页面不存在"
    desc="抱歉，您访问的页面不存在或已被移除，请检查地址是否正确。"
    icon="QuestionFilled"
  >
    <el-button @click="router.back()">返回上一页</el-button>
    <el-button type="primary" @click="router.push('/index')">回首页</el-button>
  </error-page>
</template>

<script setup>
import ErrorPage from './components/ErrorPage'

const router = useRouter()
</script>
