<template>
  <el-drawer v-model="visible" title="公告详情" direction="rtl" size="50%" append-to-body :before-close="handleClose" class="notice-detail-drawer">
    <div v-loading="loading" class="notice-detail-drawer__body">
      <div v-if="!detail" class="notice-empty">
        <el-icon><Document /></el-icon>
        <span>暂无数据</span>
      </div>
      <div v-else class="notice-page">
        <div class="notice-type-wrap">
          <span v-if="detail.noticeType === '1'" class="notice-type-tag type-notify">
            <el-icon><Bell /></el-icon> 通知
          </span>
          <span v-else-if="detail.noticeType === '2'" class="notice-type-tag type-announce">
            <el-icon><Message /></el-icon> 公告
          </span>
          <span v-else class="notice-type-tag type-notify">
            <el-icon><Document /></el-icon> 消息
          </span>
        </div>

        <h1 class="notice-title">{{ detail.noticeTitle }}</h1>

        <div class="notice-meta">
          <span class="meta-item">
            <el-icon><User /></el-icon>
            <span>{{ detail.createBy || '—' }}</span>
          </span>
          <span class="meta-item">
            <el-icon><Clock /></el-icon>
            <span>{{ detail.createTime || '—' }}</span>
          </span>
          <span class="meta-item">
            <span :class="['status-dot', isStatusNormal ? 'status-ok' : 'status-off']"></span>
            <span>{{ isStatusNormal ? '正常' : '已关闭' }}</span>
          </span>
        </div>

        <div class="notice-divider">
          <span class="notice-divider-dot"></span>
          <span class="notice-divider-dot"></span>
          <span class="notice-divider-dot"></span>
        </div>

        <div class="notice-body">
          <div v-if="hasContent" class="notice-content" v-html="detail.noticeContent" />
          <div v-else class="notice-empty notice-empty--inner">
            <el-icon><Document /></el-icon> 暂无内容
          </div>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import { getNotice } from '@/api/system/notice'

const visible = ref(false)
const loading = ref(false)
const detail = ref(null)

const isStatusNormal = computed(() => {
  const status = detail.value && detail.value.status
  return status === '0' || status === 0
})

const hasContent = computed(() => {
  const content = detail.value && detail.value.noticeContent
  return content != null && String(content).trim() !== ''
})

function open(payload) {
  let id = null
  let preset = null
  if (payload != null && typeof payload === 'object') {
    id = payload.noticeId
    if (payload.noticeContent != null) {
      preset = payload
    }
  } else {
    id = payload
  }
  visible.value = true
  if (preset) {
    detail.value = preset
    return
  }
  if (id == null || id === '') {
    detail.value = null
    return
  }
  loading.value = true
  detail.value = null
  getNotice(id).then(res => {
    detail.value = res.data
  }).catch(() => {
    detail.value = null
  }).finally(() => {
    loading.value = false
  })
}

function handleClose() {
  visible.value = false
  detail.value = null
  loading.value = false
}

defineExpose({
  open
})
</script>

<style lang="scss" scoped>
.notice-page {
  max-width: 760px;
  margin: 0 auto;
  padding: 8px 8px 20px;
  animation: notice-fade-up 0.28s ease both;
}

@keyframes notice-fade-up {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}

.notice-type-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 2px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: normal;
  text-transform: none;
  margin-bottom: 16px;
}

.type-notify {
  background: var(--notice-tag-notify-bg);
  color: var(--notice-tag-notify-color);
  border-left: 3px solid var(--notice-type-notify);
}

.type-announce {
  background: var(--notice-tag-announce-bg);
  color: var(--notice-tag-announce-color);
  border-left: 3px solid var(--notice-type-announce);
}

.notice-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--notice-title-color);
  line-height: 1.45;
  margin: 0 0 16px;
  letter-spacing: -0.2px;
  overflow-wrap: break-word;
  min-width: 0;
}

.notice-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  padding: 12px 0;
  border-top: 1px solid var(--notice-border-color);
  border-bottom: 1px solid var(--notice-border-color);
  margin-bottom: 28px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--notice-meta-color);
}

.meta-item .el-icon {
  font-size: 12px;
  color: var(--notice-meta-icon-color);
}

.status-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  margin-right: 4px;
}

.status-ok  { background: var(--notice-status-ok); }
.status-off { background: var(--notice-status-off); }

.notice-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.notice-divider::before,
.notice-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--notice-divider-gradient);
}

.notice-divider-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--notice-divider-dot-color);
}

.notice-body {
  background: var(--notice-body-bg);
  border-radius: 6px;
  padding: 28px 32px;
  box-shadow: var(--notice-body-shadow);
  min-height: 120px;
}

.notice-content {
  font-size: 14px;
  line-height: 1.85;
  color: var(--notice-content-color);
  word-break: break-word;
}

.notice-content :deep(p) { margin: 0 0 1em; }

.notice-content :deep(h1),
.notice-content :deep(h2),
.notice-content :deep(h3) {
  font-weight: 700;
  color: var(--notice-title-color);
  margin: 1.4em 0 0.6em;
}

.notice-content :deep(h1) { font-size: 18px; }
.notice-content :deep(h2) { font-size: 16px; }
.notice-content :deep(h3) { font-size: 14px; }

.notice-content :deep(a) {
  color: var(--notice-link);
  text-decoration: underline;
}
.notice-content :deep(a:hover) { color: var(--notice-link-hover); }

.notice-content :deep(img) {
  max-width: 100%;
  border-radius: 4px;
  margin: 8px 0;
}

.notice-content :deep(ul),
.notice-content :deep(ol) {
  padding-left: 20px;
  margin: 0 0 1em;
}
.notice-content :deep(li) { margin-bottom: 4px; }

.notice-content :deep(blockquote) {
  border-left: 3px solid var(--notice-blockquote-border);
  margin: 1em 0;
  padding: 8px 16px;
  color: var(--notice-meta-color);
  background: var(--notice-blockquote-bg);
}

.notice-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
  font-size: 13px;
}
.notice-content :deep(table th),
.notice-content :deep(table td) {
  border: 1px solid var(--notice-table-border);
  padding: 8px 12px;
}
.notice-content :deep(table th) {
  background: var(--notice-table-header-bg);
  font-weight: 600;
}

.notice-empty {
  text-align: center;
  padding: 40px 0;
  color: var(--notice-meta-icon-color);
  font-size: 13px;
}
.notice-empty .el-icon {
  font-size: 28px;
  display: inline-flex;
  margin-bottom: 12px;
}
.notice-empty--inner { padding: 32px 0; }

.notice-detail-drawer__body {
  height: 100%;
  overflow: auto;
  padding: 12px 16px 24px;
}
</style>

<style lang="scss">
.notice-detail-drawer {
  .el-drawer__header {
    margin-bottom: 0;
    padding: 16px 20px;
    border-bottom: 1px solid var(--notice-border-color);
    font-size: 16px;
    font-weight: 600;
    color: var(--notice-title-color);
  }

  .el-drawer__body {
    background: var(--notice-drawer-body-bg);
    padding: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .notice-page {
    animation: none;
  }
}


/* focus-visible 兜底（26a）：与全局 tokens.scss 焦点环一致 */
a:focus-visible,
button:focus-visible,
.el-input__inner:focus-visible,
[tabindex]:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

</style>
