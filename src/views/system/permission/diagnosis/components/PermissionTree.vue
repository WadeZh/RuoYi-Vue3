<template>
  <section class="panel-card tree-card">
    <header class="panel-head">
      <h3 class="panel-title">菜单与按钮</h3>
      <span class="tree-count">{{ visibleCount }} 项</span>
    </header>
    <el-input
      v-model="filterText"
      placeholder="按名称或权限标识筛选"
      clearable
      size="small"
      class="tree-filter"
    >
      <template #prefix><el-icon><Search /></el-icon></template>
    </el-input>

    <el-scrollbar class="tree-scroll">
      <el-tree
        ref="treeRef"
        :data="tree"
        node-key="menuId"
        :props="{ label: 'menuName', children: 'children' }"
        :filter-node-method="filterNode"
        default-expand-all
        :expand-on-click-node="false"
        highlight-current
        @node-click="onNodeClick"
      >
        <template #default="{ data }">
          <span class="tree-node" :class="{ 'is-selected': data.menuId === selectedId }">
            <el-icon class="node-type-icon" :class="`type-${data.menuType}`">
              <Folder v-if="data.menuType === 'M'" />
              <Menu v-else-if="data.menuType === 'C'" />
              <Key v-else />
            </el-icon>
            <span class="node-name" :title="data.menuName">{{ data.menuName }}</span>
            <el-tag v-if="data.configured" size="small" type="success" effect="light">已配置授权</el-tag>
            <el-tag v-else size="small" type="info" effect="light">未授权</el-tag>
            <el-tag v-if="data.menuType === 'M' || data.menuType === 'C'" size="small" effect="plain" class="node-flag">
              {{ data.isRoute ? '生成路由' : '未生成路由' }}
            </el-tag>
            <el-tag v-if="data.visible === '1'" size="small" type="warning" effect="plain">隐藏</el-tag>
            <el-tag v-if="data.status === '1'" size="small" type="danger" effect="plain">停用</el-tag>
            <span v-if="data.menuType === 'F' && data.perms" class="node-perms">{{ data.perms }}</span>
          </span>
        </template>
      </el-tree>
      <app-empty-state v-if="visibleCount === 0" text="该用户没有可展示的菜单配置" icon="Menu" />
    </el-scrollbar>
  </section>
</template>

<script setup name="PermissionTree">
import AppEmptyState from '@/components/App/AppEmptyState.vue'

const props = defineProps({
  tree: { type: Array, default: () => [] },
  selectedId: { type: [Number, String], default: null }
})
const emit = defineEmits(['select'])

const treeRef = ref(null)
const filterText = ref('')

function filterNode(value, data) {
  if (!value) return true
  const v = value.toLowerCase()
  return (
    (data.menuName || '').toLowerCase().includes(v) ||
    (data.perms || '').toLowerCase().includes(v)
  )
}

watch(filterText, (val) => {
  treeRef.value?.filter(val)
})

// 统计通过筛选的节点数（含子级）
const visibleCount = computed(() => countNodes(props.tree, filterText.value))
function countNodes(nodes, kw) {
  let n = 0
  for (const node of nodes || []) {
    if (filterNode(kw, node)) n++
    n += countNodes(node.children || [], kw)
  }
  return n
}

function onNodeClick(data) {
  emit('select', data)
}
</script>

<style lang="scss" scoped>
.tree-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: var(--space-4) var(--space-5);
  background: var(--bg-surface);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);

  .panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-3);

    .panel-title {
      margin: 0;
      font-size: var(--text-md);
      font-weight: var(--weight-semibold);
      color: var(--text-primary);
    }

    .tree-count {
      font-size: var(--text-xs);
      color: var(--text-secondary);
    }
  }

  .tree-filter {
    margin-bottom: var(--space-2);
  }

  .tree-scroll {
    max-height: 460px;
  }

  .tree-node {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    min-width: 0;
    padding: 2px 4px;

    &.is-selected .node-name {
      color: var(--color-primary);
      font-weight: var(--weight-semibold, 600);
    }

    .node-type-icon {
      flex-shrink: 0;
      font-size: 14px;

      &.type-M { color: var(--color-warning); }
      &.type-C { color: var(--color-primary); }
      &.type-F { color: var(--text-secondary); }
    }

    .node-name {
      max-width: 140px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: var(--text-sm);
      color: var(--text-primary);
    }

    .node-flag {
      color: var(--text-secondary);
    }

    .node-perms {
      font-size: var(--text-xs);
      color: var(--text-secondary);
      font-family: var(--font-mono, monospace);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}
</style>
