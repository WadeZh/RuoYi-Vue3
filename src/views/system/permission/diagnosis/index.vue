<template>
  <div class="app-container diag-page">
    <!-- 查询区 -->
    <section class="panel-card query-card">
      <user-selector
        ref="selectorRef"
        v-model:selected-user-id="selectedUserId"
        @change="onUserChange"
      />
      <div class="query-meta">
        <el-tag size="small" type="info" effect="plain">基于当前配置</el-tag>
        <span v-if="diagnosis" class="diag-time">诊断时间：{{ diagnosis.diagnosisTime }}</span>
        <el-button
          v-if="selectedUserId"
          link
          type="primary"
          icon="Refresh"
          :loading="loading"
          @click="loadDiagnosis(selectedUserId, true)"
        >刷新</el-button>
      </div>
    </section>

    <!-- 诊断结果 -->
    <template v-if="selectedUserId">
      <!-- 加载中 -->
      <el-skeleton v-if="loading" :rows="8" animated class="diag-skeleton" />

      <!-- 诊断服务未接入 / 请求失败 -->
      <section v-else-if="errorType" class="panel-card error-card">
        <app-empty-state
          :icon="errorType === 'notAvailable' ? 'Connection' : 'WarningFilled'"
          :text="errorMsg"
        >
          <el-button type="primary" plain icon="Refresh" @click="loadDiagnosis(selectedUserId, true)">重试</el-button>
        </app-empty-state>
        <p v-if="errorType === 'notAvailable'" class="error-tip">诊断接口由后端提供；后端部署后方可使用完整诊断。</p>
      </section>

      <!-- 正常结果 -->
      <template v-else-if="diagnosis">
        <diagnosis-overview :overview="diagnosis.overview" :roles="diagnosis.roles" />

        <el-row :gutter="16" class="diag-row">
          <el-col :xs="24" :lg="10">
            <permission-tree
              :tree="diagnosis.menuTree"
              :selected-id="selectedNode?.menuId"
              @select="onNodeSelect"
            />
          </el-col>
          <el-col :xs="24" :lg="14">
            <node-detail :node="selectedNode" :wildcard="diagnosis.wildcard" />
          </el-col>
        </el-row>

        <el-row :gutter="16" class="diag-row">
          <el-col :xs="24" :lg="14">
            <permission-check :user-id="selectedUserId" />
          </el-col>
          <el-col :xs="24" :lg="10">
            <data-scope-panel :roles="diagnosis.roles" />
          </el-col>
        </el-row>

        <!-- 窄屏：详情区改为抽屉 -->
        <el-drawer v-model="drawerVisible" title="权限来源详情" direction="rtl" size="85%" append-to-body>
          <node-detail v-if="selectedNode" :node="selectedNode" :wildcard="diagnosis.wildcard" />
        </el-drawer>
      </template>
    </template>
  </div>
</template>

<script setup name="PermissionDiagnosis">
import { listDiagnosisUsers, getPermissionDiagnosis } from "@/api/system/permissionDiagnosis"
import UserSelector from "./components/UserSelector"
import DiagnosisOverview from "./components/DiagnosisOverview"
import PermissionTree from "./components/PermissionTree"
import NodeDetail from "./components/NodeDetail"
import PermissionCheck from "./components/PermissionCheck"
import DataScopePanel from "./components/DataScopePanel"
import AppEmptyState from "@/components/App/AppEmptyState.vue"
import { useWindowSize } from '@vueuse/core'

const route = useRoute()
const { width } = useWindowSize()
const isNarrow = computed(() => width.value < 992)

const selectorRef = ref(null)
const selectedUserId = ref(null)
const diagnosis = ref(null)
const loading = ref(false)
const errorType = ref(null)   // 'error' 请求失败 | 'notAvailable' 诊断服务未接入
const errorMsg = ref('')
const selectedNode = ref(null)
const drawerVisible = ref(false)
// 快速切换用户时丢弃过期响应
let requestId = 0

/** 加载指定用户的诊断；force 用于同用户刷新 */
function loadDiagnosis(userId, force = false) {
  if (!userId) return
  if (!force && selectedUserId.value === userId && (diagnosis.value || loading.value)) return
  selectedUserId.value = userId
  const rid = ++requestId
  loading.value = true
  errorType.value = null
  errorMsg.value = ''
  selectedNode.value = null
  getPermissionDiagnosis(userId).then(res => {
    if (rid !== requestId) return
    diagnosis.value = res.data || null
    // 默认选中第一个节点，便于查看
    selectedNode.value = firstNode(diagnosis.value?.menuTree) || null
  }).catch(err => {
    if (rid !== requestId) return
    diagnosis.value = null
    const msg = String(err?.message || err?.msg || '')
    if (msg.includes('404')) {
      errorType.value = 'notAvailable'
      errorMsg.value = '诊断服务未接入'
    } else {
      errorType.value = 'error'
      errorMsg.value = msg || '诊断查询失败'
    }
  }).finally(() => {
    if (rid === requestId) loading.value = false
  })
}

function firstNode(nodes) {
  for (const n of nodes || []) {
    return n
  }
  return null
}

function onUserChange(userId) {
  // 切换用户立即清空上一用户结果
  diagnosis.value = null
  selectedNode.value = null
  errorType.value = null
  loadDiagnosis(userId)
}

function onNodeSelect(node) {
  selectedNode.value = node
  if (isNarrow.value) drawerVisible.value = true
}

onMounted(() => {
  // 支持 ?userId= 自动选中
  const uid = route.query.userId
  if (uid) {
    nextTick(() => loadDiagnosis(Number(uid) || uid))
  }
})
</script>

<style lang="scss" scoped>
.diag-page {
  .query-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--space-3);
    padding: var(--space-4) var(--space-5);
    background: var(--bg-surface);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-lg);
    margin-bottom: var(--space-4);
  }

  .query-meta {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    flex-wrap: wrap;

    .diag-time {
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }
  }

  .diag-skeleton {
    padding: var(--space-6);
    background: var(--bg-surface);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-lg);
  }

  .error-card {
    background: var(--bg-surface);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-lg);

    .error-tip {
      margin: 0;
      text-align: center;
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }
  }

  .diag-row {
    margin-bottom: 0;

    [class*='el-col-'] {
      margin-bottom: var(--space-4);
    }
  }
}
</style>
