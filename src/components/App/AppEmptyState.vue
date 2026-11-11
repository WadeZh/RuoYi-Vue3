<template>
  <div class="app-empty-state">
    <el-icon :size="iconSize" class="empty-icon"><component :is="icon" /></el-icon>
    <p class="empty-text">{{ text }}</p>
    <div v-if="$slots.default" class="empty-actions">
      <slot />
    </div>
  </div>
</template>

<script setup name="AppEmptyState">
defineProps({
  /** 提示文案 */
  text: { type: String, default: '暂无数据' },
  /** 状态图标（Element Plus 图标名） */
  icon: { type: [String, Object], default: 'Box' },
  iconSize: { type: Number, default: 40 }
})
</script>

<style lang="scss" scoped>
.app-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-8) var(--space-4);
  color: var(--text-secondary);

  .empty-icon {
    color: var(--text-disabled);
  }

  .empty-text {
    margin: 0;
    font-size: var(--text-sm);
  }

  .empty-actions {
    margin-top: var(--space-2);
  }
}
</style>
