<template>
  <div>
    <el-popover ref="noticePopover" placement="bottom-end" :width="320" trigger="manual" v-model:visible="noticeVisible" popper-class="notice-popover">
      <!-- 弹出内容 -->
      <div class="notice-header">
        <span class="notice-title">通知公告</span>
        <span class="notice-mark-all" @click="markAllRead">全部已读</span>
      </div>
      <div v-if="noticeLoading" class="notice-loading">
        <el-icon class="is-loading"><Loading /></el-icon> 加载中...
      </div>
      <div v-else-if="noticeList.length === 0" class="notice-empty">
        <el-icon style="font-size:24px;display:block;margin-bottom:6px;"><Postcard /></el-icon>
        暂无公告
      </div>
      <div v-else>
        <div v-for="item in noticeList" :key="item.noticeId" class="notice-item" :class="{ 'is-read': item.isRead }" @click="previewNotice(item)">
          <el-tag size="small" :type="item.noticeType === '1' ? 'warning' : 'success'" class="notice-tag">
            {{ item.noticeType === '1' ? '通知' : '公告' }}
          </el-tag>
          <span class="notice-item-title">{{ item.noticeTitle }}</span>
          <span class="notice-item-date">{{ item.createTime }}</span>
        </div>
      </div>

      <!-- 查看全部 -->
      <div v-if="canViewAll" class="notice-footer" @click="goNoticeList">查看全部通知</div>

      <!-- 触发器 -->
      <template #reference>
        <div class="right-menu-item hover-effect notice-trigger" @mouseenter="onNoticeEnter" @mouseleave="onNoticeLeave">
          <svg-icon icon-class="bell" />
          <span v-if="unreadCount > 0" class="notice-badge">{{ unreadCount }}</span>
        </div>
      </template>
    </el-popover>

    <!-- 预览弹窗 -->
    <notice-detail-view ref="noticeViewRef" />
  </div>
</template>

<script setup>
import { ElNotification } from 'element-plus'
import NoticeDetailView from './DetailView'
import { listNoticeTop, markNoticeRead, markNoticeReadAll } from '@/api/system/notice'
import auth from '@/plugins/auth'
import usePermissionStore from '@/store/modules/permission'

const noticePopover = ref(null)
const noticeList = ref([])
const unreadCount = ref(0)
const noticeLoading = ref(false)
const noticeVisible = ref(false)
const noticeLeaveTimer = ref(null)
const { proxy } = getCurrentInstance()
const router = useRouter()

// 有公告菜单权限时才展示「查看全部」入口
const canViewAll = computed(() => {
  const hasPerm = auth.hasPermi('system:notice:list')
  const hasRoute = usePermissionStore().sidebarRouters.some(
    r => r.path === '/system' && (r.children || []).some(c => c.path === 'notice')
  )
  return hasPerm && hasRoute
})

// 查看全部通知
function goNoticeList() {
  noticeVisible.value = false
  router.push('/system/notice')
}

// 加载顶部公告列表
function loadNoticeTop() {
  noticeLoading.value = true
  listNoticeTop().then(res => {
    applyNoticeData(res)
  }).finally(() => {
    noticeLoading.value = false
  })
}

// 应用公告数据并更新未读数
function applyNoticeData(res) {
  noticeList.value = res.data || []
  unreadCount.value = res.unreadCount !== undefined ? res.unreadCount : noticeList.value.filter(n => !n.isRead).length
}

/* ---------- 轮询提醒：每 5 分钟拉取一次，未读数增加时弹提示 ---------- */
const POLL_INTERVAL = 5 * 60 * 1000
let pollTimer = null

function pollNotice() {
  if (document.visibilityState !== 'visible') return
  const prevUnread = unreadCount.value
  listNoticeTop().then(res => {
    applyNoticeData(res)
    const diff = unreadCount.value - prevUnread
    if (diff > 0) {
      ElNotification({
        title: '消息提醒',
        message: `有 ${diff} 条新公告，点击查看`,
        duration: 4500,
        onClick: goNoticeList
      })
    }
  }).catch(() => {})
}

function onVisibilityChange() {
  if (document.visibilityState === 'visible') pollNotice()
}

onMounted(() => {
  loadNoticeTop()
  pollTimer = setInterval(pollNotice, POLL_INTERVAL)
  document.addEventListener('visibilitychange', onVisibilityChange)
})

onBeforeUnmount(() => {
  clearInterval(pollTimer)
  document.removeEventListener('visibilitychange', onVisibilityChange)
})

// 鼠标移入铃铛区域
function onNoticeEnter() {
  clearTimeout(noticeLeaveTimer.value)
  noticeVisible.value = true
  nextTick(() => {
    const popper = noticePopover.value?.popperRef?.contentRef
    if (popper && !popper._noticeBound) {
      popper._noticeBound = true
      popper.addEventListener('mouseenter', () => clearTimeout(noticeLeaveTimer.value))
      popper.addEventListener('mouseleave', () => {
        noticeLeaveTimer.value = setTimeout(() => { noticeVisible.value = false }, 100)
      })
    }
  })
}

// 鼠标离开铃铛区域
function onNoticeLeave() {
  noticeLeaveTimer.value = setTimeout(() => { noticeVisible.value = false }, 150)
}

// 预览公告详情
function previewNotice(item) {
  if (!item.isRead) {
    markNoticeRead(item.noticeId).catch(() => {})
    const idx = noticeList.value.indexOf(item)
    if (idx !== -1) noticeList.value[idx] = { ...item, isRead: true }
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  }
  proxy.$refs["noticeViewRef"].open(item.noticeId)
}

// 全部已读
function markAllRead() {
  const ids = noticeList.value.map(n => n.noticeId).join(',')
  if (!ids) return
  markNoticeReadAll(ids).catch(() => {})
  noticeList.value = noticeList.value.map(n => ({ ...n, isRead: true }))
  unreadCount.value = 0
}
</script>

<style lang="scss" scoped>
.notice-trigger {
  position: relative;
  transform: translateX(-6px);
  .svg-icon { width: 1.2em; height: 1.2em; vertical-align: -0.2em; }
  .notice-badge {
    position: absolute;
    top: 7px;
    right: -3px;
    background: var(--color-danger, #f56c6c);
    color: #fff;
    border-radius: 10px;
    font-size: 10px;
    height: 16px;
    line-height: 16px;
    padding: 0 4px;
    min-width: 16px;
    text-align: center;
    white-space: nowrap;
    pointer-events: none;
  }
}
.notice-popover { padding: 0 !important; }
.notice-popover .notice-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: var(--bg-surface-2, #f7f9fb);
  border-bottom: 1px solid var(--border-light, #eee);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary, #333);
}
.notice-popover .notice-mark-all {
  font-size: 12px;
  color: var(--el-color-primary);
  font-weight: normal;
  cursor: pointer;
}
.notice-popover .notice-mark-all:hover { color: var(--color-primary-hover, #2b7cc1); }
.notice-popover .notice-loading,
.notice-popover .notice-empty {
  padding: 24px;
  text-align: center;
  color: var(--text-disabled, #bbb);
  font-size: 12px;
  line-height: 1.8;
}
.notice-popover .notice-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-lighter, #f5f5f5);
  cursor: pointer;
  transition: background 0.15s;
}
.notice-popover .notice-item:last-child { border-bottom: none; }
.notice-popover .notice-item:hover { background: var(--bg-surface-2, #f7f9fb); }
.notice-popover .notice-item.is-read .notice-tag,
.notice-popover .notice-item.is-read .notice-item-title,
.notice-popover .notice-item.is-read .notice-item-date { opacity: 0.45; filter: grayscale(1); color: var(--text-secondary, #999); }
.notice-popover .notice-tag { flex-shrink: 0; }
.notice-popover .notice-item-title {
  flex: 1;
  font-size: 12px;
  color: var(--text-primary, #333);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.notice-popover .notice-item-date {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--text-disabled, #bbb);
}
.notice-popover .notice-footer {
  padding: 10px 14px;
  text-align: center;
  font-size: 12px;
  color: var(--el-color-primary);
  border-top: 1px solid var(--border-light, #eee);
  cursor: pointer;
  transition: background 0.15s;
}
.notice-popover .notice-footer:hover { background: var(--bg-surface-2, #f7f9fb); }
</style>
