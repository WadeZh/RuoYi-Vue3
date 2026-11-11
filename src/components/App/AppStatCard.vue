<template>
  <div class="app-stat-card" :class="{ 'is-loading': loading, 'is-clickable': !!to }" @click="goTo">
    <el-skeleton v-if="loading" :rows="1" animated class="stat-skeleton">
      <template #template>
        <el-skeleton-item variant="circle" style="width: 40px; height: 40px" />
        <div class="stat-skeleton-lines">
          <el-skeleton-item variant="text" style="width: 56px" />
          <el-skeleton-item variant="h3" style="width: 80px" />
        </div>
      </template>
    </el-skeleton>
    <template v-else>
      <div class="stat-icon" :style="{ background: iconBg, color: iconColor }">
        <el-icon :size="20"><component :is="icon" /></el-icon>
      </div>
      <div class="stat-meta">
        <span class="stat-label">{{ label }}</span>
        <span class="stat-value">{{ displayValue }}</span>
      </div>
      <div v-if="$slots.extra" class="stat-extra">
        <slot name="extra" />
      </div>
    </template>
  </div>
</template>

<script setup name="AppStatCard">
const props = defineProps({
  /** 指标名称 */
  label: { type: String, required: true },
  /** 指标值（number / string） */
  value: { type: [Number, String], default: null },
  /** 加载中显示骨架屏 */
  loading: { type: Boolean, default: false },
  /** 加载失败时的占位文本 */
  errorText: { type: String, default: '--' },
  /** el-icon 组件名（Element Plus 图标） */
  icon: { type: [String, Object], default: 'Odometer' },
  /** 图标底色 / 图标色（CSS 颜色值或变量） */
  iconBg: { type: String, default: 'var(--brand-50)' },
  iconColor: { type: String, default: 'var(--color-primary)' },
  /** 点击跳转的路由地址（可选） */
  to: { type: String, default: '' }
})

const router = useRouter()

const displayValue = computed(() => {
  if (props.value === null || props.value === undefined || props.value === '') return props.errorText
  return props.value
})

function goTo() {
  if (props.to) router.push(props.to)
}
</script>

<style lang="scss" scoped>
.app-stat-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-5);
  background: var(--bg-surface);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  min-height: 96px;
  transition: box-shadow var(--transition-fast) var(--ease-in-out),
    border-color var(--transition-fast) var(--ease-in-out);

  &:hover {
    border-color: var(--border-base);
    box-shadow: var(--shadow-sm);
  }

  &.is-clickable {
    cursor: pointer;

    &:hover {
      border-color: var(--color-primary);
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
    }
  }

  .stat-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: var(--radius-md);
  }

  .stat-meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .stat-label {
    font-size: var(--text-sm);
    color: var(--text-secondary);
    white-space: nowrap;
  }

  .stat-value {
    font-size: 22px;
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
    line-height: 1.2;
    font-variant-numeric: tabular-nums;
  }

  .stat-extra {
    margin-left: auto;
  }

  .stat-skeleton {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    width: 100%;

    :deep(.el-skeleton__item) {
      --el-skeleton-color: var(--bg-muted);
      --el-skeleton-to-color: var(--bg-hover);
    }
  }

  .stat-skeleton-lines {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    width: 100%;
  }
}
</style>
