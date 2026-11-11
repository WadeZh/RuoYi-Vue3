<template>
  <section class="panel-card scope-card">
    <header class="panel-head">
      <h3 class="panel-title">数据范围（按角色）</h3>
      <span class="head-tip">仅展示配置，不代表最终可访问数据量</span>
    </header>

    <el-table v-if="roles.length" :data="roles" size="small" class="scope-table">
      <el-table-column label="角色" prop="roleName" min-width="110" />
      <el-table-column label="角色状态" width="90" align="center">
        <template #default="scope">
          <el-tag size="small" :type="scope.row.roleStatus === '0' ? 'success' : 'danger'">
            {{ scope.row.roleStatus === '0' ? '正常' : '已停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="数据范围" prop="dataScopeText" min-width="110" />
      <el-table-column label="自定义部门" min-width="140">
        <template #default="scope">
          <template v-if="scope.row.customDeptNames?.length">
            <el-tag
              v-for="d in scope.row.customDeptNames"
              :key="d"
              size="small"
              effect="plain"
              class="dept-tag"
            >
              {{ d }}
            </el-tag>
          </template>
          <span v-else class="muted">—</span>
        </template>
      </el-table-column>
    </el-table>
    <app-empty-state v-else text="该用户未关联角色，无数据范围配置" icon="Lock" />
  </section>
</template>

<script setup name="DataScopePanel">
import AppEmptyState from '@/components/App/AppEmptyState.vue'

defineProps({
  roles: { type: Array, default: () => [] }
})
</script>

<style lang="scss" scoped>
.scope-card {
  height: 100%;
  padding: var(--space-4) var(--space-5);
  background: var(--bg-surface);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);

  .panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-bottom: var(--space-3);

    .panel-title {
      margin: 0;
      font-size: var(--text-md);
      font-weight: var(--weight-semibold);
      color: var(--text-primary);
    }

    .head-tip {
      font-size: var(--text-xs);
      color: var(--text-secondary);
    }
  }

  .dept-tag {
    margin-right: 4px;
    margin-bottom: 4px;
  }

  .muted {
    color: var(--text-secondary);
    font-size: var(--text-sm);
  }
}
</style>
