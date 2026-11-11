<template>
  <section class="panel-card check-card">
    <header class="panel-head">
      <h3 class="panel-title">权限检查</h3>
      <span class="head-tip">输入完整权限标识，如 system:user:edit</span>
    </header>

    <div class="check-input">
      <el-input
        v-model="permission"
        placeholder="例如：system:user:edit"
        clearable
        @keyup.enter="doCheck"
      />
      <el-button type="primary" :loading="checking" @click="doCheck">检查</el-button>
    </div>

    <template v-if="result">
      <el-descriptions :column="1" border size="small" class="check-desc">
        <el-descriptions-item label="配置判断">
          <el-tag size="small" :type="result.configured ? 'success' : 'danger'">
            {{ result.configured ? '已配置授权' : '未配置授权' }}
          </el-tag>
          <el-tag v-if="result.wildcard" size="small" type="warning" effect="plain" class="ml8">
            通配权限
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="匹配菜单">
          <template v-if="result.matchedMenus?.length">
            <el-tag
              v-for="m in result.matchedMenus"
              :key="m.menuId"
              size="small"
              effect="plain"
              class="ml8 menu-tag"
            >
              {{ m.menuName }}（{{ { M: '目录', C: '菜单', F: '按钮' }[m.menuType] || '节点' }}）
            </el-tag>
          </template>
          <span v-else class="muted">{{ result.menuNotFound || '未找到菜单配置' }}；权限计算结果以配置判断为准，不代表对应接口不存在。</span>
        </el-descriptions-item>
        <el-descriptions-item label="来源角色">
          <template v-if="result.sources?.length">
            <el-tag
              v-for="s in result.sources"
              :key="s.roleId"
              size="small"
              :type="s.roleStatus === '0' ? 'success' : 'danger'"
              effect="plain"
              class="ml8 menu-tag"
            >
              {{ s.roleName }}<template v-if="s.roleStatus !== '0'">（已停用）</template>
            </el-tag>
          </template>
          <span v-else-if="result.wildcard" class="muted">通配权限：以超级管理员/通配规则为准，不体现逐项来源。</span>
          <span v-else class="muted">无角色授权来源</span>
        </el-descriptions-item>
        <el-descriptions-item label="原因">{{ result.reason || '—' }}</el-descriptions-item>
        <el-descriptions-item label="排查建议">{{ result.suggestion || '—' }}</el-descriptions-item>
      </el-descriptions>
    </template>

    <app-empty-state v-else-if="!checking" text="输入权限标识后点击「检查」查看配置判断与来源" icon="Search" />
  </section>
</template>

<script setup name="PermissionCheck">
import { checkPermission } from "@/api/system/permissionDiagnosis"
import AppEmptyState from '@/components/App/AppEmptyState.vue'

const props = defineProps({
  userId: { type: [Number, String], required: true }
})

const permission = ref('')
const checking = ref(false)
const result = ref(null)
// 快速重复检查时丢弃过期响应
let reqId = 0

function doCheck() {
  const perm = permission.value.trim()
  if (!perm) return
  const rid = ++reqId
  checking.value = true
  result.value = null
  checkPermission(props.userId, perm).then(res => {
    if (rid !== reqId) return
    result.value = res.data || null
  }).finally(() => {
    if (rid === reqId) checking.value = false
  })
}
</script>

<style lang="scss" scoped>
.check-card {
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

  .check-input {
    display: flex;
    gap: var(--space-2);
    margin-bottom: var(--space-4);
  }

  .check-desc {
    margin-top: var(--space-2);
  }

  .ml8 { margin-left: 8px; }

  .menu-tag {
    margin-bottom: 4px;
  }

  .muted {
    color: var(--text-secondary);
    font-size: var(--text-sm);
  }
}
</style>
