<template>
  <div class="error-page">
    <div class="error-page-icon">
      <el-icon :size="52"><component :is="icon" /></el-icon>
    </div>
    <div class="error-page-code">{{ code }}</div>
    <h2 class="error-page-title">{{ title }}</h2>
    <p class="error-page-desc">{{ desc }}</p>
    <div class="error-page-actions">
      <slot />
    </div>
  </div>
</template>

<script setup name="ErrorPage">
defineProps({
  /** 状态码（401 / 404） */
  code: { type: String, required: true },
  /** 标题 */
  title: { type: String, required: true },
  /** 描述 */
  desc: { type: String, default: '' },
  /** 状态图标（Element Plus 图标名） */
  icon: { type: [String, Object], default: 'WarningFilled' }
})
</script>

<style lang="scss" scoped>
.error-page {
  position: absolute;
  top: 45%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 0 var(--space-4);

  .error-page-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 96px;
    height: 96px;
    margin-bottom: var(--space-4);
    border-radius: var(--radius-full, 50%);
    background: color-mix(in srgb, var(--color-primary) 10%, transparent);
    color: var(--color-primary);
  }

  .error-page-code {
    font-size: 64px;
    font-weight: var(--weight-bold, 700);
    line-height: 1;
    color: var(--text-primary);
    letter-spacing: 0.04em;
    font-variant-numeric: tabular-nums;
  }

  .error-page-title {
    margin: var(--space-3) 0 var(--space-1);
    font-size: var(--text-xl, 18px);
    font-weight: var(--weight-semibold, 600);
    color: var(--text-primary);
  }

  .error-page-desc {
    margin: 0 0 var(--space-5);
    font-size: var(--text-sm);
    color: var(--text-secondary);
  }

  .error-page-actions {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>
