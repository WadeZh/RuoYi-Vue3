<template>
  <div class="dashboard app-container">
    <!-- 欢迎区域 -->
    <section class="welcome-card">
      <div class="welcome-text">
        <h2 class="welcome-title">{{ greeting }}，{{ userStore.nickName || '管理员' }}</h2>
        <p class="welcome-desc">{{ todayText }}</p>
      </div>
      <div class="welcome-actions" v-if="hasAdminPerm">
        <el-button type="primary" @click="router.push('/system/user')">
          <el-icon><User /></el-icon>&nbsp;用户管理
        </el-button>
        <el-button @click="router.push('/system/notice')">
          <el-icon><Bell /></el-icon>&nbsp;发布公告
        </el-button>
        <el-button @click="router.push('/monitor/online')">
          <el-icon><Monitor /></el-icon>&nbsp;在线用户
        </el-button>
      </div>
    </section>

    <!-- 核心指标（真实接口数据，可点击跳转） -->
    <section class="stat-grid">
      <app-stat-card
        label="在线用户"
        :value="stats.online"
        :loading="statsLoading"
        icon="User"
        :to="auth.hasPermi('monitor:online:list') ? '/monitor/online' : ''"
      />
      <app-stat-card
        label="系统公告"
        :value="stats.notice"
        :loading="statsLoading"
        icon="Bell"
        icon-bg="rgba(22, 163, 74, 0.1)"
        icon-color="var(--color-success)"
        :to="auth.hasPermi('system:notice:list') ? '/system/notice' : ''"
      />
      <app-stat-card
        label="操作日志"
        :value="stats.operlog"
        :loading="statsLoading"
        icon="Document"
        icon-bg="rgba(245, 158, 11, 0.12)"
        icon-color="var(--color-warning)"
        :to="auth.hasPermi('monitor:operlog:list') ? '/monitor/operlog' : ''"
      />
      <app-stat-card
        label="登录记录"
        :value="stats.logininfor"
        :loading="statsLoading"
        icon="Key"
        icon-bg="rgba(220, 38, 38, 0.08)"
        icon-color="var(--color-danger)"
        :to="auth.hasPermi('monitor:logininfor:list') ? '/monitor/logininfor' : ''"
      />
    </section>

    <!-- 趋势图 + 快捷入口 -->
    <el-row :gutter="16" class="dash-row">
      <el-col :xs="24" :lg="16">
        <section class="panel-card">
          <header class="panel-head">
            <h3 class="panel-title">系统访问趋势</h3>
            <el-tag v-if="trendIsDemo" size="small" type="info" effect="plain">演示数据</el-tag>
          </header>
          <div ref="chartRef" class="trend-chart" v-loading="chartLoading" element-loading-text="图表加载中..." />
        </section>
      </el-col>
      <el-col :xs="24" :lg="8">
        <section class="panel-card">
          <header class="panel-head">
            <h3 class="panel-title">快捷入口</h3>
            <el-button link type="primary" @click="openQuickManage">
              <el-icon><Setting /></el-icon>&nbsp;编辑
            </el-button>
          </header>
          <div class="quick-grid">
            <button
              v-for="entry in quickEntries"
              :key="entry.path"
              type="button"
              class="quick-item"
              @click="router.push(entry.path)"
            >
              <span class="quick-icon" :style="{ background: entry.bg, color: entry.color }">
                <el-icon :size="18"><component :is="entry.icon" /></el-icon>
              </span>
              <span class="quick-label">{{ entry.label }}</span>
            </button>
          </div>
        </section>
      </el-col>
    </el-row>

    <!-- 最新公告 + 最近动态（真实接口数据） -->
    <el-row :gutter="16" class="dash-row">
      <el-col :xs="24" :lg="12">
        <section class="panel-card">
          <header class="panel-head">
            <h3 class="panel-title">最新公告</h3>
            <el-button
              v-if="auth.hasPermi('system:notice:list')"
              link
              type="primary"
              @click="router.push('/system/notice')"
            >
              查看全部
            </el-button>
          </header>
          <el-skeleton v-if="noticeLoading" :rows="4" animated class="list-skeleton" />
          <app-empty-state v-else-if="noticeList.length === 0" text="暂无公告" icon="Bell" />
          <ul v-else class="feed-list">
            <li
              v-for="item in noticeList"
              :key="item.noticeId"
              class="feed-item"
              :class="{ clickable: noticeClickable }"
              @click="noticeClickable && previewNotice(item)"
            >
              <el-tag size="small" :type="item.noticeType === '1' ? 'warning' : 'success'" effect="light">
                {{ item.noticeType === '1' ? '通知' : '公告' }}
              </el-tag>
              <span class="feed-title" :title="item.noticeTitle">{{ item.noticeTitle }}</span>
              <time class="feed-time">{{ parseTime(item.createTime, '{y}-{m}-{d}') }}</time>
            </li>
          </ul>
        </section>
      </el-col>
      <el-col :xs="24" :lg="12">
        <section class="panel-card">
          <header class="panel-head">
            <h3 class="panel-title">最近操作</h3>
            <el-button
              v-if="auth.hasPermi('monitor:operlog:list')"
              link
              type="primary"
              @click="router.push('/monitor/operlog')"
            >
              查看全部
            </el-button>
          </header>
          <el-skeleton v-if="operlogLoading" :rows="4" animated class="list-skeleton" />
          <app-empty-state v-else-if="operlogList.length === 0" text="暂无操作记录" icon="Document" />
          <ul v-else class="feed-list">
            <li
              v-for="item in operlogList"
              :key="item.operId"
              class="feed-item"
              :class="{ clickable: operlogClickable }"
              @click="operlogClickable && showOperDetail(item)"
            >
              <span class="feed-user">
                <el-icon><User /></el-icon>
                {{ item.nickName || item.operName }}
              </span>
              <span class="feed-title" :title="item.title">{{ item.title }}</span>
              <dict-tag :options="sys_oper_type" :value="item.businessType" size="small" />
              <time class="feed-time">{{ parseTime(item.operTime, '{y}-{m}-{d}') }}</time>
            </li>
          </ul>
        </section>
      </el-col>
    </el-row>

    <!-- 快捷入口自定义弹窗 -->
    <el-dialog title="自定义快捷入口" v-model="quickManageVisible" width="420px" append-to-body>
      <p class="quick-manage-tip">勾选要展示的入口，并通过箭头调整顺序。</p>
      <div v-for="(item, idx) in quickManageList" :key="item.path" class="quick-manage-item">
        <el-checkbox v-model="item.selected">{{ item.label }}</el-checkbox>
        <span class="quick-manage-ops">
          <el-button link :disabled="idx === 0" @click="moveQuick(idx, -1)">
            <el-icon><ArrowUp /></el-icon>
          </el-button>
          <el-button link :disabled="idx === quickManageList.length - 1" @click="moveQuick(idx, 1)">
            <el-icon><ArrowDown /></el-icon>
          </el-button>
        </span>
      </div>
      <template #footer>
        <el-button @click="quickManageVisible = false">取消</el-button>
        <el-button type="primary" @click="applyQuickManage">保存</el-button>
      </template>
    </el-dialog>

    <!-- 公告详情弹窗（复用通知中心组件） -->
    <notice-detail-view ref="noticeViewRef" />

    <!-- 操作日志详情弹窗（复用日志页组件） -->
    <operlog-detail v-model:visible="operlogVisible" :row="operlogRow" />
  </div>
</template>

<script setup name="Index">
import * as echarts from 'echarts'
import { listNotice } from '@/api/system/notice'
import { list as listOnline } from '@/api/monitor/online'
import { list as listOperlog } from '@/api/monitor/operlog'
import { list as listLogininfor } from '@/api/monitor/logininfor'
import AppStatCard from '@/components/App/AppStatCard.vue'
import AppEmptyState from '@/components/App/AppEmptyState.vue'
import NoticeDetailView from '@/layout/components/HeaderNotice/DetailView'
import OperlogDetail from '@/views/monitor/operlog/detail'
import auth from '@/plugins/auth'
import cache from '@/plugins/cache'
import useUserStore from '@/store/modules/user'

const { proxy } = getCurrentInstance()
const router = useRouter()
const userStore = useUserStore()
const { sys_oper_type } = proxy.useDict('sys_oper_type')
const { parseTime } = proxy

/* ---------- 欢迎区 ---------- */
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 9) return '早上好'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

const todayText = computed(() => {
  const now = new Date()
  const week = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()]
  return `今天是 ${now.getFullYear()} 年 ${now.getMonth() + 1} 月 ${now.getDate()} 日 星期${week}`
})

const hasAdminPerm = computed(() =>
  auth.hasPermi('system:user:list') || auth.hasPermi('system:notice:list') || auth.hasPermi('monitor:online:list')
)

/* ---------- 核心指标（真实接口） ---------- */
const statsLoading = ref(true)
const stats = ref({ online: null, notice: null, operlog: null, logininfor: null })

function fetchStat(request, key) {
  return request({ pageNum: 1, pageSize: 1 })
    .then(res => {
      stats.value[key] = res.total
    })
    .catch(() => {
      stats.value[key] = null
    })
}

/* ---------- 快捷入口（用户自定义 + 权限过滤） ---------- */
const QUICK_KEY = 'dashboard-quick-entries'
const allQuickEntries = [
  { label: '用户管理', path: '/system/user', icon: 'User', perm: 'system:user:list', bg: 'rgba(37, 99, 235, 0.1)', color: 'var(--color-primary)' },
  { label: '角色管理', path: '/system/role', icon: 'UserFilled', perm: 'system:role:list', bg: 'rgba(22, 163, 74, 0.1)', color: 'var(--color-success)' },
  { label: '菜单管理', path: '/system/menu', icon: 'Menu', perm: 'system:menu:list', bg: 'rgba(245, 158, 11, 0.12)', color: 'var(--color-warning)' },
  { label: '部门管理', path: '/system/dept', icon: 'OfficeBuilding', perm: 'system:dept:list', bg: 'rgba(100, 116, 139, 0.12)', color: 'var(--color-info)' },
  { label: '字典管理', path: '/system/dict', icon: 'Collection', perm: 'system:dict:list', bg: 'rgba(37, 99, 235, 0.1)', color: 'var(--color-primary)' },
  { label: '参数设置', path: '/system/config', icon: 'Setting', perm: 'system:config:list', bg: 'rgba(100, 116, 139, 0.12)', color: 'var(--color-info)' },
  { label: '通知公告', path: '/system/notice', icon: 'Bell', perm: 'system:notice:list', bg: 'rgba(22, 163, 74, 0.1)', color: 'var(--color-success)' },
  { label: '操作日志', path: '/monitor/operlog', icon: 'Document', perm: 'monitor:operlog:list', bg: 'rgba(245, 158, 11, 0.12)', color: 'var(--color-warning)' },
  { label: '登录日志', path: '/monitor/logininfor', icon: 'Key', perm: 'monitor:logininfor:list', bg: 'rgba(220, 38, 38, 0.08)', color: 'var(--color-danger)' },
  { label: '在线用户', path: '/monitor/online', icon: 'Monitor', perm: 'monitor:online:list', bg: 'rgba(37, 99, 235, 0.1)', color: 'var(--color-primary)' }
]

// 用户自定义选择（path 有序列表），null 表示未自定义过
const savedQuickPaths = ref(cache.local.getJSON(QUICK_KEY) || null)

const quickEntries = computed(() => {
  const permFiltered = allQuickEntries.filter(e => auth.hasPermi(e.perm))
  if (!savedQuickPaths.value || !savedQuickPaths.value.length) return permFiltered
  const byPath = Object.fromEntries(permFiltered.map(e => [e.path, e]))
  return savedQuickPaths.value.map(p => byPath[p]).filter(Boolean)
})

// 自定义弹窗
const quickManageVisible = ref(false)
const quickManageList = ref([])

function openQuickManage() {
  const selectedSet = new Set(quickEntries.value.map(e => e.path))
  quickManageList.value = allQuickEntries.map(e => ({ ...e, selected: selectedSet.has(e.path) }))
  quickManageVisible.value = true
}

function moveQuick(idx, delta) {
  const target = idx + delta
  if (target < 0 || target >= quickManageList.value.length) return
  const list = quickManageList.value
  ;[list[idx], list[target]] = [list[target], list[idx]]
}

function applyQuickManage() {
  savedQuickPaths.value = quickManageList.value.filter(e => e.selected).map(e => e.path)
  cache.local.setJSON(QUICK_KEY, savedQuickPaths.value)
  quickManageVisible.value = false
}

/* ---------- 最新公告 / 最近操作（真实接口 + 详情弹窗） ---------- */
const noticeLoading = ref(true)
const noticeList = ref([])
const operlogLoading = ref(true)
const operlogList = ref([])
const noticeClickable = computed(() => auth.hasPermi('system:notice:list'))
const operlogClickable = computed(() => auth.hasPermi('monitor:operlog:list'))

const noticeViewRef = ref(null)

function previewNotice(item) {
  noticeViewRef.value && noticeViewRef.value.open(item.noticeId)
}

const operlogVisible = ref(false)
const operlogRow = ref({})

function showOperDetail(item) {
  operlogRow.value = item
  operlogVisible.value = true
}

/* ---------- 趋势图（近 7 天登录日志聚合；无数据/失败时回退演示数据） ---------- */
const chartRef = ref(null)
const chartLoading = ref(true)
const trendIsDemo = ref(true)
let chart = null

function buildDemoData() {
  const days = []
  const visits = []
  const pages = []
  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000)
    days.push(`${d.getMonth() + 1}/${d.getDate()}`)
    // 稳定的伪随机序列，保证每次进入图形一致
    const seed = (d.getDate() * 7 + 3) % 10
    visits.push(820 + seed * 60)
    pages.push(1200 + seed * 95)
  }
  return { days, visits, pages }
}

// 拉取近 7 天登录日志并按天聚合
async function loadTrend() {
  try {
    const pad = n => String(n).padStart(2, '0')
    const fmtDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    const begin = new Date(Date.now() - 6 * 86400000)
    const res = await listLogininfor({ pageNum: 1, pageSize: 1000, params: { beginTime: fmtDate(begin) } })
    const rows = res.rows || []
    if (!rows.length) return
    const counts = {}
    rows.forEach(r => {
      if (!r.loginTime) return
      const key = parseTime(r.loginTime, '{y}-{m}-{d}')
      counts[key] = (counts[key] || 0) + 1
    })
    const days = []
    const visits = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000)
      days.push(`${d.getMonth() + 1}/${d.getDate()}`)
      visits.push(counts[fmtDate(d)] || 0)
    }
    trendIsDemo.value = false
    renderChart({ days, visits, name: '登录次数' })
  } catch (e) {
    // 聚合失败保持演示图
    console.error('[trend] 登录日志聚合失败，回退演示数据:', e)
  }
}

function renderChart(realData) {
  if (!chartRef.value) return
  const styles = getComputedStyle(document.documentElement)
  const primary = styles.getPropertyValue('--color-primary').trim() || '#2563eb'
  const success = styles.getPropertyValue('--color-success').trim() || '#16a34a'
  const textSecondary = styles.getPropertyValue('--text-secondary').trim() || '#64748b'
  const border = styles.getPropertyValue('--border-lighter').trim() || '#eef2f7'
  const isDark = document.documentElement.classList.contains('dark')
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  let days
  let legendData
  let series
  if (realData) {
    days = realData.days
    legendData = [realData.name]
    series = [{
      name: realData.name,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      showSymbol: false,
      data: realData.visits,
      lineStyle: { width: 2, color: primary },
      itemStyle: { color: primary },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: isDark ? 'rgba(59, 130, 246, 0.28)' : 'rgba(37, 99, 235, 0.16)' },
          { offset: 1, color: 'rgba(37, 99, 235, 0)' }
        ])
      },
      animation: !reduceMotion
    }]
  } else {
    const demo = buildDemoData()
    days = demo.days
    legendData = ['访问量', '浏览量']
    series = [
      {
        name: '访问量',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: false,
        data: demo.visits,
        lineStyle: { width: 2, color: primary },
        itemStyle: { color: primary },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: isDark ? 'rgba(59, 130, 246, 0.28)' : 'rgba(37, 99, 235, 0.16)' },
            { offset: 1, color: 'rgba(37, 99, 235, 0)' }
          ])
        },
        animation: !reduceMotion
      },
      {
        name: '浏览量',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: false,
        data: demo.pages,
        lineStyle: { width: 2, color: success },
        itemStyle: { color: success },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: isDark ? 'rgba(74, 222, 128, 0.22)' : 'rgba(22, 163, 74, 0.12)' },
            { offset: 1, color: 'rgba(22, 163, 74, 0)' }
          ])
        },
        animation: !reduceMotion
      }
    ]
  }

  chart = chart || echarts.init(chartRef.value)
  // notMerge：演示数据（双系列）与真实数据（单系列）切换时不残留旧系列
  chart.setOption({
    tooltip: { trigger: 'axis' },
    legend: {
      data: legendData,
      right: 0,
      top: 0,
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { color: textSecondary }
    },
    grid: { left: 8, right: 8, top: 36, bottom: 0, containLabel: true },
    xAxis: {
      type: 'category',
      data: days,
      boundaryGap: false,
      axisLine: { lineStyle: { color: border } },
      axisTick: { show: false },
      axisLabel: { color: textSecondary }
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { color: border, type: 'dashed' } },
      axisLabel: { color: textSecondary }
    },
    series
  }, true)
  chartLoading.value = false
}

function resizeChart() {
  chart && chart.resize()
}

onMounted(() => {
  // 并行拉取真实数据
  statsLoading.value = true
  Promise.allSettled([
    fetchStat(listOnline, 'online'),
    fetchStat(listNotice, 'notice'),
    fetchStat(listOperlog, 'operlog'),
    fetchStat(listLogininfor, 'logininfor')
  ]).finally(() => {
    statsLoading.value = false
  })

  listNotice({ pageNum: 1, pageSize: 6 })
    .then(res => {
      noticeList.value = res.rows || []
    })
    .catch(() => {
      noticeList.value = []
    })
    .finally(() => {
      noticeLoading.value = false
    })

  listOperlog({ pageNum: 1, pageSize: 6 })
    .then(res => {
      operlogList.value = res.rows || []
    })
    .catch(() => {
      operlogList.value = []
    })
    .finally(() => {
      operlogLoading.value = false
    })

  nextTick(() => {
    renderChart()
    loadTrend()
  })
  window.addEventListener('resize', resizeChart)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart)
  if (chart) {
    chart.dispose()
    chart = null
  }
})
</script>

<style scoped lang="scss">
.dashboard {
  /* ---------- 欢迎区 ---------- */
  .welcome-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    flex-wrap: wrap;
    padding: var(--space-6);
    background: var(--bg-surface);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-lg);
    margin-bottom: var(--space-4);

    .welcome-title {
      margin: 0 0 var(--space-1);
      font-size: var(--text-xl);
      font-weight: var(--weight-semibold);
      color: var(--text-primary);
      overflow-wrap: break-word;
      min-width: 0;
    }

    .welcome-desc {
      margin: 0;
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    .welcome-actions {
      display: flex;
      gap: var(--space-2);
      flex-wrap: wrap;
    }
  }

  /* ---------- 指标卡片 ---------- */
  .stat-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--space-4);
    margin-bottom: var(--space-4);

    @media (max-width: 1199px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (max-width: 575px) {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  .dash-row {
    margin-bottom: 0;

    [class*='el-col-'] {
      margin-bottom: var(--space-4);
    }
  }

  /* ---------- 面板卡片 ---------- */
  .panel-card {
    height: 100%;
    padding: var(--space-5);
    background: var(--bg-surface);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-lg);

    .panel-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-4);

      .panel-title {
        margin: 0;
        font-size: var(--text-md);
        font-weight: var(--weight-semibold);
        color: var(--text-primary);
      }
    }
  }

  .trend-chart {
    height: 300px;
    width: 100%;
  }

  /* ---------- 快捷入口 ---------- */
  .quick-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: var(--space-3);
  }

  .quick-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-1);
    border: none;
    background: transparent;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background-color var(--transition-fast) var(--ease-in-out),
      transform var(--transition-fast) var(--ease-in-out);

    &:hover {
      background: var(--bg-hover);
    }

    &:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: -2px;
    }

    &:active {
      transform: scale(0.97);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .quick-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
    }

    .quick-label {
      font-size: var(--text-xs);
      color: var(--text-regular);
      white-space: nowrap;
    }
  }

  /* ---------- 列表流 ---------- */
  .list-skeleton {
    padding: var(--space-2) 0;
  }

  /* ---------- 快捷入口自定义弹窗 ---------- */
  .quick-manage-tip {
    margin: 0 0 var(--space-3);
    font-size: var(--text-sm);
    color: var(--text-secondary);
  }

  .quick-manage-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-2) var(--space-1);
    border-bottom: 1px solid var(--border-lighter);

    &:last-child {
      border-bottom: none;
    }

    .quick-manage-ops {
      display: inline-flex;
      align-items: center;
      gap: 2px;

      .el-button + .el-button {
        margin-left: 0;
      }
    }
  }

  .feed-list {
    margin: 0;
    padding: 0;
    list-style: none;

    .feed-item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-1);
      border-bottom: 1px solid var(--border-lighter);
      font-size: var(--text-sm);

      &:last-child {
        border-bottom: none;
      }

      &.clickable {
        cursor: pointer;
        transition: background-color var(--transition-fast) var(--ease-in-out);

        &:hover {
          background: var(--bg-hover);
        }
      }

      .feed-user {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: var(--text-secondary);
        flex-shrink: 0;
      }

      .feed-title {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--text-primary);
      }

      .feed-time {
        flex-shrink: 0;
        font-size: var(--text-xs);
        color: var(--text-disabled);
        font-variant-numeric: tabular-nums;
      }
    }
  }

  /* 尊重系统减少动画偏好（ECharts 动画已在 JS 侧判断） */
  @media (prefers-reduced-motion: reduce) {
    .quick-item,
    .feed-item.clickable {
      transition: none;
    }

    .quick-item:active {
      transform: none;
    }
  }
}
</style>
