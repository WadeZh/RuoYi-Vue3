<template>
  <section class="panel-card detail-card">
    <header class="panel-head">
      <h3 class="panel-title">权限来源详情</h3>
    </header>

    <template v-if="node">
      <!-- 基础信息 -->
      <el-descriptions :column="1" border size="small" class="detail-desc">
        <el-descriptions-item label="节点">
          {{ node.menuName }}
          <el-tag size="small" effect="plain" class="ml8">{{ typeText }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item v-if="node.perms" label="权限标识">
          <code class="perm-code">{{ node.perms }}</code>
        </el-descriptions-item>
        <el-descriptions-item v-else-if="node.menuType === 'F'" label="权限标识">
          <span class="muted">未配置权限标识（不代表对应接口公开）</span>
        </el-descriptions-item>
        <el-descriptions-item label="配置状态">
          <el-tag size="small" :type="node.configured ? 'success' : 'info'">
            {{ node.configured ? '已配置授权' : '未授权' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item v-if="node.menuType !== 'F'" label="菜单可见性">
          {{ node.visible === '1' ? '隐藏（仅影响导航可见性，不代表接口无权限）' : '显示' }}
        </el-descriptions-item>
        <el-descriptions-item v-if="node.menuType !== 'F'" label="路由生成">
          {{ node.isRoute ? '已生成路由' : '未生成路由（不出现在动态菜单中）' }}
        </el-descriptions-item>
        <el-descriptions-item v-if="node.menuType !== 'F'" label="菜单状态">
          <el-tag size="small" :type="node.status === '1' ? 'danger' : 'success'">
            {{ node.status === '1' ? '已停用' : '正常' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <!-- 父级异常提示 -->
      <el-alert
        v-if="node.parentIssue"
        type="warning"
        :closable="false"
        show-icon
        class="detail-alert"
        :title="'父级节点异常：' + node.parentIssue"
      />

      <!-- 诊断说明（后端结论） -->
      <div class="detail-block">
        <h4 class="block-title">诊断说明</h4>
        <p class="reason-text">{{ node.reason || '—' }}</p>
      </div>

      <!-- 来源角色 -->
      <div class="detail-block">
        <h4 class="block-title">授权来源（全部）</h4>
        <el-table v-if="sources.length" :data="sources" size="small" class="source-table">
          <el-table-column label="角色" prop="roleName" min-width="120" />
          <el-table-column label="角色状态" width="90" align="center">
            <template #default="scope">
              <el-tag size="small" :type="scope.row.roleStatus === '0' ? 'success' : 'danger'">
                {{ scope.row.roleStatus === '0' ? '正常' : '已停用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="说明" prop="sourceNote" min-width="180" :show-overflow-tooltip="true" />
        </el-table>
        <p v-else class="muted">{{ wildcard ? '超级管理员 / 通配权限：不体现逐项角色授权来源，实际权限以通配规则为准。' : '该节点无角色授权来源。' }}</p>
      </div>
    </template>

    <app-empty-state v-else text="点击左侧菜单或按钮节点查看来源详情" icon="Document" />
  </section>
</template>

<script setup name="NodeDetail">
import AppEmptyState from '@/components/App/AppEmptyState.vue'

const props = defineProps({
  node: { type: Object, default: null },
  wildcard: { type: Boolean, default: false }
})

const typeText = computed(() => ({ M: '目录', C: '菜单', F: '按钮' }[props.node?.menuType] || '节点'))
const sources = computed(() => props.node?.sources || [])
</script>

<style lang="scss" scoped>
.detail-card {
  height: 100%;
  padding: var(--space-4) var(--space-5);
  background: var(--bg-surface);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);

  .panel-head .panel-title {
    margin: 0 0 var(--space-3);
    font-size: var(--text-md);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
  }

  .ml8 { margin-left: 8px; }

  .detail-alert {
    margin: var(--space-3) 0;
  }

  .detail-block {
    margin-top: var(--space-4);

    .block-title {
      margin: 0 0 var(--space-2);
      font-size: var(--text-sm);
      font-weight: var(--weight-semibold);
      color: var(--text-primary);
    }

    .reason-text {
      margin: 0;
      font-size: var(--text-sm);
      color: var(--text-regular);
      line-height: 1.7;
    }

    .source-table {
      width: 100%;
    }
  }

  .perm-code {
    padding: 2px 6px;
    border-radius: var(--radius-sm);
    background: var(--bg-surface-2);
    font-family: var(--font-mono, monospace);
    font-size: var(--text-sm);
    color: var(--text-primary);
  }

  .muted {
    color: var(--text-secondary);
    font-size: var(--text-sm);
    margin: 0;
  }
}
</style>
