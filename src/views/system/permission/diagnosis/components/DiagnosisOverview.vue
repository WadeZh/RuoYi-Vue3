<template>
  <section class="panel-card overview-card">
    <h3 class="panel-title">用户概览</h3>
    <el-descriptions :column="isNarrow ? 1 : 3" border size="small" class="overview-desc">
      <el-descriptions-item label="账号">{{ overview.userName }}</el-descriptions-item>
      <el-descriptions-item label="姓名">{{ overview.nickName || '—' }}</el-descriptions-item>
      <el-descriptions-item label="部门">{{ overview.deptName || '—' }}</el-descriptions-item>
      <el-descriptions-item label="账号状态">
        <el-tag size="small" :type="overview.status === '0' ? 'success' : 'danger'">
          {{ overview.status === '0' ? '正常' : '已停用' }}
        </el-tag>
        <span v-if="overview.status !== '0'" class="status-tip">（配置仍可检查，账号状态不影响配置展示）</span>
      </el-descriptions-item>
      <el-descriptions-item label="关联角色" :span="isNarrow ? 1 : 2">
        <template v-if="roles.length">
          <el-tag
            v-for="r in roles"
            :key="r.roleId"
            size="small"
            :type="r.roleStatus === '0' ? 'primary' : 'danger'"
            effect="plain"
            class="role-tag"
          >
            {{ r.roleName }}<template v-if="r.roleStatus !== '0'">（已停用）</template>
          </el-tag>
        </template>
        <span v-else class="muted">未关联任何角色</span>
      </el-descriptions-item>
      <el-descriptions-item v-if="overview.remark" label="诊断说明">{{ overview.remark }}</el-descriptions-item>
    </el-descriptions>
  </section>
</template>

<script setup name="DiagnosisOverview">
import { useWindowSize } from '@vueuse/core'

defineProps({
  overview: { type: Object, required: true },
  roles: { type: Array, default: () => [] }
})

const { width } = useWindowSize()
const isNarrow = computed(() => width.value < 992)
</script>

<style lang="scss" scoped>
.overview-card {
  padding: var(--space-4) var(--space-5);
  background: var(--bg-surface);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-4);

  .panel-title {
    margin: 0 0 var(--space-3);
    font-size: var(--text-md);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
  }

  .role-tag {
    margin-right: var(--space-1);
    margin-bottom: var(--space-1);
  }

  .muted {
    color: var(--text-secondary);
    font-size: var(--text-sm);
  }

  .status-tip {
    margin-left: var(--space-2);
    font-size: var(--text-xs);
    color: var(--text-secondary);
  }
}
</style>
