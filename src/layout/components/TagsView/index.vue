<template>
  <div id="tags-view-container" class="tags-view-container" :class="{ 'tags-view-container--chrome': tagsViewStyle === 'chrome' }">
    <!-- 左切换箭头 -->
    <span class="tags-nav-btn tags-nav-btn--left" :class="{ disabled: !canScrollLeft }" @click="scrollLeft">
      <el-icon><arrow-left /></el-icon>
    </span>

    <!-- 标签滚动区 -->
    <scroll-pane ref="scrollPaneRef" class="tags-view-wrapper" @scroll="handleScroll" @update-arrows="updateArrowState">
      <router-link
        v-for="tag in visitedViews"
        :key="tag.path"
        :data-path="tag.path"
        :class="{ 'active': isActive(tag), 'has-icon': tagsIcon }"
        :to="{ path: tag.path, query: tag.query, fullPath: tag.fullPath }"
        class="tags-view-item"
        :style="tagActiveStyle(tag)"
        @click.middle="!isAffix(tag) && !isPinned(tag) ? closeSelectedTag(tag) : ''"
        @contextmenu.prevent="openMenu(tag, $event)"
      >
        <svg-icon v-if="tagsIcon && tag.meta && tag.meta.icon && tag.meta.icon !== '#'" :icon-class="tag.meta.icon" style="margin-right: 3px;" />
        {{ tag.title }}
        <el-icon v-if="isPinned(tag)" class="tag-pin" title="已固定"><flag /></el-icon>
        <span v-if="!isAffix(tag) && !isPinned(tag)" @click.prevent.stop="closeSelectedTag(tag)" class="tags-close-btn">
          <close class="el-icon-close" />
        </span>
      </router-link>
    </scroll-pane>

    <!-- 右切换箭头 -->
    <span class="tags-nav-btn tags-nav-btn--right" :class="{ disabled: !canScrollRight }" @click="scrollRight">
      <el-icon><arrow-right /></el-icon>
    </span>

    <!-- 下拉操作菜单 -->
    <el-dropdown class="tags-action-dropdown" trigger="click" placement="bottom-end" @command="handleDropdownCommand">
      <span class="tags-action-btn">
        <el-icon><arrow-down /></el-icon>
      </span>
      <template #dropdown>
        <el-dropdown-menu class="tags-dropdown-menu">
          <el-dropdown-item v-if="!isAffix(selectedDropdownTag) && !isPinned(selectedDropdownTag)" command="close"><close style="width: 1em; height: 1em;" />关闭当前</el-dropdown-item>
          <el-dropdown-item command="closeOthers"><circle-close style="width: 1em; height: 1em;" />关闭其他</el-dropdown-item>
          <el-dropdown-item command="closeLeft" :disabled="isFirstView()"><back style="width: 1em; height: 1em;" />关闭左侧</el-dropdown-item>
          <el-dropdown-item command="closeRight" :disabled="isLastView()"><right style="width: 1em; height: 1em;" />关闭右侧</el-dropdown-item>
          <el-dropdown-item command="closeAll"><circle-close style="width: 1em; height: 1em;" />全部关闭</el-dropdown-item>
          <el-dropdown-item v-if="hasClosedHistory" command="reopen"><refresh-left style="width: 1em; height: 1em;" />重新打开关闭的页签</el-dropdown-item>
          <el-dropdown-item command="fullscreen" divided>
            <template v-if="!isFullscreen"><full-screen style="width: 1em; height: 1em;" />全屏显示</template>
            <template v-else><close style="width: 1em; height: 1em;" />退出全屏</template>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <!-- 刷新按钮 -->
    <span class="tags-action-btn tags-refresh-btn" title="刷新页面" @click="refreshSelectedTag(selectedDropdownTag)">
      <el-icon><refresh-right/></el-icon> 刷新
    </span>

    <!-- 右键上下文菜单 -->
    <ul v-show="visible" :style="{ left: left + 'px', top: top + 'px' }" class="contextmenu">
      <li @click="refreshSelectedTag(selectedTag)"><refresh-right style="width: 1em; height: 1em;" />刷新页面</li>
      <li @click="togglePinTag(selectedTag)">
        <flag style="width: 1em; height: 1em;" />{{ isPinned(selectedTag) ? '取消固定' : '固定页签' }}
      </li>
      <li v-if="!isAffix(selectedTag) && !isPinned(selectedTag)" @click="closeSelectedTag(selectedTag)"><close style="width: 1em; height: 1em;" />关闭当前</li>
      <li v-if="hasClosedHistory" @click="reopenClosedTag"><refresh-left style="width: 1em; height: 1em;" />重新打开关闭的页签</li>
      <li @click="closeOthersTags"><circle-close style="width: 1em; height: 1em;" />关闭其他</li>
      <li v-if="!isFirstView()" @click="closeLeftTags"><back style="width: 1em; height: 1em;" />关闭左侧</li>
      <li v-if="!isLastView()" @click="closeRightTags"><right style="width: 1em; height: 1em;" />关闭右侧</li>
      <li @click="closeAllTags(selectedTag)"><circle-close style="width: 1em; height: 1em;" />全部关闭</li>
    </ul>
  </div>
</template>

<script setup>
import Sortable from 'sortablejs'
import ScrollPane from './ScrollPane'
import { getNormalPath } from '@/utils/yunshu'
import useTagsViewStore from '@/store/modules/tagsView'
import useSettingsStore from '@/store/modules/settings'
import usePermissionStore from '@/store/modules/permission'

const visible = ref(false)
const top = ref(0)
const left = ref(0)
const selectedTag = ref({})
const affixTags = ref([])
const scrollPaneRef = ref(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)
const isFullscreen = ref(false)
const hiddenElements = ref([])

const { proxy } = getCurrentInstance()
const route = useRoute()
const router = useRouter()
const settingsStore = useSettingsStore()

const visitedViews = computed(() => useTagsViewStore().visitedViews)
const routes = computed(() => usePermissionStore().routes)
const theme = computed(() => useSettingsStore().theme)
const tagsIcon = computed(() => useSettingsStore().tagsIcon)
const tagsViewPersist = computed(() => useSettingsStore().tagsViewPersist)
const tagsViewStyle = computed(() => useSettingsStore().tagsViewStyle)

// 下拉菜单针对当前激活的 tag
const selectedDropdownTag = computed(() => visitedViews.value.find(v => isActive(v)) || {})

watch(route, () => {
  addTags()
  moveToCurrentTag()
})

watch(visible, (value) => {
  if (value) {
    document.body.addEventListener('click', closeMenu)
  } else {
    document.body.removeEventListener('click', closeMenu)
  }
})

watch(visitedViews, () => {
  nextTick(() => updateArrowState())
})

onMounted(() => {
  initTags()
  addTags()
  initSortable()
  window.addEventListener('resize', updateArrowState)
  window.addEventListener('keydown', handleKeyDown)
})

onBeforeUnmount(() => {
  if (sortableInstance) {
    sortableInstance.destroy()
    sortableInstance = null
  }
  window.removeEventListener('resize', updateArrowState)
  window.removeEventListener('keydown', handleKeyDown)
})

/* ---------- 页签拖拽排序（affix 页签置首由 store 保证） ---------- */
let sortableInstance = null

function initSortable() {
  const wrapper = scrollPaneRef.value?.$el?.querySelector('.el-scrollbar__view')
  if (!wrapper) return
  sortableInstance = Sortable.create(wrapper, {
    animation: 150,
    draggable: '.tags-view-item',
    onEnd: (evt) => {
      useTagsViewStore().reorderViews({ oldIndex: evt.oldIndex, newIndex: evt.newIndex })
    }
  })
}

function handleKeyDown(event) {
  // 当按下Esc键且处于全屏状态时，退出全屏
  if (event.key === 'Escape' && isFullscreen.value) {
    toggleFullscreen()
  }
}

function isActive(r) {
  return r.path === route.path
}

function tagActiveStyle(tag) {
  if (!isActive(tag) || tagsViewStyle.value !== 'card') return {}
  // 激活页签使用主题色淡染底 + 主题色文字（--current-color 由 Layout 注入）
  return {
    'background-color': 'var(--current-color-light, rgba(37, 99, 235, 0.1))',
    'border-color': 'transparent',
    'color': theme.value
  }
}

function isAffix(tag) {
  return tag && tag.meta && tag.meta.affix
}

// 固定页签（用户手动固定，豁免关闭类操作）
function isPinned(tag) {
  return useTagsViewStore().isPinned(tag)
}

function togglePinTag(tag) {
  if (!tag || !tag.path) return
  useTagsViewStore().togglePin(tag)
  closeMenu()
}

// 重新打开已关闭页签
const hasClosedHistory = computed(() => useTagsViewStore().closedHistory.length > 0)

function reopenClosedTag() {
  const entry = useTagsViewStore().popClosedHistory()
  if (!entry) return
  useTagsViewStore().addView(entry)
  router.push(entry.fullPath || entry.path)
  closeMenu()
}

function isFirstView() {
  try {
    const tag = selectedTag.value && selectedTag.value.fullPath ? selectedTag.value : selectedDropdownTag.value
    return tag.fullPath === '/index' || tag.fullPath === visitedViews.value[1].fullPath
  } catch (err) {
    return false
  }
}

function isLastView() {
  try {
    const tag = selectedTag.value && selectedTag.value.fullPath ? selectedTag.value : selectedDropdownTag.value
    return tag.fullPath === visitedViews.value[visitedViews.value.length - 1].fullPath
  } catch (err) {
    return false
  }
}

function filterAffixTags(routes, basePath = '') {
  let tags = []
  routes.forEach(route => {
    if (route.meta && route.meta.affix) {
      const tagPath = getNormalPath(basePath + '/' + route.path)
      tags.push({
        fullPath: tagPath,
        path: tagPath,
        name: route.name,
        meta: { ...route.meta }
      })
    }
    if (route.children) {
      const tempTags = filterAffixTags(route.children, route.path)
      if (tempTags.length >= 1) {
        tags = [...tags, ...tempTags]
      }
    }
  })
  return tags
}

function initTags() {
  if (tagsViewPersist.value) {
    useTagsViewStore().loadPersistedViews()
  }
  const res = filterAffixTags(routes.value)
  affixTags.value = res
  for (const tag of res) {
    if (tag.name) {
      useTagsViewStore().addAffixView(tag)
    }
  }
}

function addTags() {
  const { name } = route
  if (name) {
    useTagsViewStore().addView(route)
  }
}

function moveToCurrentTag() {
  nextTick(() => {
    for (const r of visitedViews.value) {
      if (r.path === route.path) {
        scrollPaneRef.value.moveToTarget(r)
        if (r.fullPath !== route.fullPath) {
          useTagsViewStore().updateVisitedView(route)
        }
      }
    }
  })
}

function scrollLeft() {
  if (!canScrollLeft.value) return
  scrollPaneRef.value.scrollToStart()
}

function scrollRight() {
  if (!canScrollRight.value) return
  scrollPaneRef.value.scrollToEnd()
}

function updateArrowState() {
  nextTick(() => {
    if (scrollPaneRef.value) {
      const state = scrollPaneRef.value.getScrollState()
      canScrollLeft.value = state.canLeft
      canScrollRight.value = state.canRight
    }
  })
}

function toggleFullscreen() {
  const mainContainer = document.querySelector('.main-container')
  const navbar = document.querySelector('.navbar')
  const sidebar = document.querySelector('.sidebar-container')
  if (!mainContainer) return

  if (!isFullscreen.value) {
    mainContainer.classList.add('fullscreen-mode')
    document.body.style.overflow = 'hidden'
    const elementsToHide = [{ el: navbar, originalDisplay: navbar?.style.display || '' }, { el: sidebar, originalDisplay: sidebar?.style.display || '' }]
    elementsToHide.forEach(item => {
      if (item.el && item.el.style.display !== 'none') {
        item.originalDisplay = item.el.style.display
        item.el.style.display = 'none'
        hiddenElements.value.push(item)
      }
    })
    isFullscreen.value = true
  } else {
    mainContainer.classList.remove('fullscreen-mode')
    document.body.style.overflow = ''
    hiddenElements.value.forEach(item => {
      if (item.el) {
        item.el.style.display = item.originalDisplay
      }
    })
    hiddenElements.value = []
    document.querySelector('.tags-action-btn').blur()
    isFullscreen.value = false
  }
}

function handleDropdownCommand(command) {
  const tag = selectedDropdownTag.value
  selectedTag.value = tag
  switch (command) {
    case 'refresh':     refreshSelectedTag(tag); break
    case 'fullscreen':  toggleFullscreen(); break
    case 'close':       closeSelectedTag(tag); break
    case 'closeOthers': closeOthersTags(); break
    case 'closeLeft':   closeLeftTags(); break
    case 'closeRight':  closeRightTags(); break
    case 'closeAll':    closeAllTags(tag); break
    case 'reopen':      reopenClosedTag(); break
  }
}

function refreshSelectedTag(view) {
  proxy.$tab.refreshPage(view)
  if (route.meta.link) {
    useTagsViewStore().delIframeView(route)
  }
}

function closeSelectedTag(view) {
  proxy.$tab.closePage(view).then(({ visitedViews }) => {
    if (isActive(view)) {
      toLastView(visitedViews, view)
    }
  })
}

function closeRightTags() {
  proxy.$tab.closeRightPage(selectedTag.value).then(visitedViews => {
    if (!visitedViews.find(i => i.fullPath === route.fullPath)) {
      toLastView(visitedViews)
    }
  })
}

function closeLeftTags() {
  proxy.$tab.closeLeftPage(selectedTag.value).then(visitedViews => {
    if (!visitedViews.find(i => i.fullPath === route.fullPath)) {
      toLastView(visitedViews)
    }
  })
}

function closeOthersTags() {
  router.push(selectedTag.value).catch(() => { })
  proxy.$tab.closeOtherPage(selectedTag.value).then(() => {
    moveToCurrentTag()
  })
}

function closeAllTags(view) {
  proxy.$tab.closeAllPage().then(({ visitedViews }) => {
    if (affixTags.value.some(tag => tag.path === route.path)) {
      return
    }
    toLastView(visitedViews, view)
  })
}

function toLastView(visitedViews, view) {
  const latestView = visitedViews.slice(-1)[0]
  if (latestView) {
    router.push(latestView.fullPath)
  } else {
    if (view && view.name === 'Dashboard') {
      router.replace({ path: '/redirect' + view.fullPath })
    } else {
      router.push('/')
    }
  }
}

function openMenu(tag, e) {
  left.value = e.clientX
  top.value = e.clientY
  visible.value = true
  selectedTag.value = tag
}

function closeMenu() {
  visible.value = false
}

function handleScroll() {
  closeMenu()
  updateArrowState()
}
</script>

<style lang="scss" scoped>
$tags-bar-height: 40px;

.tags-view-container {
  height: $tags-bar-height;
  width: 100%;
  background: var(--tags-bg, var(--header-bg, #fff));
  border-bottom: 1px solid var(--header-border, var(--tags-item-border, #d8dce5));
  display: flex;
  align-items: center;
  overflow: hidden;

  $btn-width: 32px;

  .tags-nav-btn {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: $btn-width;
    height: $tags-bar-height;
    cursor: pointer;
    color: var(--text-secondary, #71717a);
    font-size: 13px;
    user-select: none;
    transition: background-color var(--transition-fast, 0.15s) var(--ease-in-out, ease),
      color var(--transition-fast, 0.15s) var(--ease-in-out, ease);

    &:hover:not(.disabled) {
      background: var(--bg-hover, #f0f2f5);
      color: var(--text-primary, #303133);
    }

    &:focus-visible {
      outline: 2px solid var(--color-primary, #2563eb);
      outline-offset: -2px;
    }

    &.disabled {
      color: var(--text-disabled, #c0c4cc);
      cursor: not-allowed;
    }

    &--left,
    &--right {
      border-color: transparent;
    }
  }

  .tags-view-wrapper {
    flex: 1;
    min-width: 0;
    height: 100%;

    .tags-view-item {
      display: inline-flex;
      align-items: center;
      position: relative;
      cursor: pointer;
      height: 26px;
      line-height: 1;
      border: 1px solid transparent;
      color: var(--tags-item-text, var(--text-secondary, #495060));
      background: transparent;
      padding: 0 10px;
      font-size: 12px;
      margin-left: 6px;
      border-radius: var(--radius-full, 999px);
      text-decoration: none;
      vertical-align: middle;
      transition: background-color var(--transition-fast, 0.15s) var(--ease-in-out, ease),
        color var(--transition-fast, 0.15s) var(--ease-in-out, ease),
        border-color var(--transition-fast, 0.15s) var(--ease-in-out, ease);

      &:hover:not(.active) {
        background: var(--tags-item-hover, var(--bg-hover, #f0f2f5));
        color: var(--text-primary, #303133);
      }

      &:focus-visible {
        outline: 2px solid var(--color-primary, #2563eb);
        outline-offset: -2px;
      }

      &:first-of-type { margin-left: 8px; }
      &:last-of-type  { margin-right: 15px; }

      .tag-pin {
        margin-left: 4px;
        font-size: 12px;
        color: var(--current-color, #2563eb);
        opacity: 0.85;
      }
    }
  }

  /* card 模式激活态：主题色淡染胶囊（内联样式来自 tagActiveStyle） */
  &:not(.tags-view-container--chrome) .tags-view-wrapper .tags-view-item.active {
    font-weight: var(--weight-medium, 500);
    color: var(--current-color, #2563eb);

    &::before {
      content: '';
      background: var(--current-color, #2563eb);
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      position: relative;
      margin-right: 6px;
    }
  }

  &:not(.tags-view-container--chrome) .tags-view-wrapper .tags-view-item.active.has-icon::before {
    content: none !important;
  }

  .tags-action-dropdown {
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }

  .tags-action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: $btn-width;
    height: $tags-bar-height;
    cursor: pointer;
    color: var(--text-secondary, #71717a);
    font-size: 13px;
    border-color: transparent;
    user-select: none;
    transition: background-color var(--transition-fast, 0.15s) var(--ease-in-out, ease),
      color var(--transition-fast, 0.15s) var(--ease-in-out, ease);

    &:hover {
      background: var(--bg-hover, #f0f2f5);
      color: var(--text-primary, #303133);
    }

    &:focus-visible {
      outline: 2px solid var(--color-primary, #2563eb);
      outline-offset: -2px;
    }
  }

  .tags-refresh-btn {
    width: 60px;
  }

  .contextmenu {
    margin: 0;
    background: var(--el-bg-color-overlay, #fff);
    z-index: 3000;
    position: fixed;
    list-style-type: none;
    padding: 5px;
    border-radius: var(--radius-lg, 12px);
    font-size: 12px;
    font-weight: 400;
    color: var(--tags-item-text, var(--text-regular, #333));
    box-shadow: var(--shadow-lg, 0 12px 32px rgba(15, 23, 42, 0.12));
    border: 1px solid var(--border-light, #e4e7ed);
    min-width: 132px;

    li {
      margin: 0;
      padding: 7px 12px;
      cursor: pointer;
      border-radius: var(--radius-sm, 6px);
      transition: background-color var(--transition-fast, 0.15s) var(--ease-in-out, ease);

      &:hover {
        background: var(--bg-hover, #eee);
      }
    }
  }

  &.tags-view-container--chrome {
    --chrome-strip-bg: var(--header-bg, #ffffff);
    --chrome-strip-border: var(--header-border, var(--el-border-color-lighter, #e4e7ed));
    --chrome-tab-active-bg: var(--bg-surface, #ffffff);
    --chrome-tab-text: var(--el-text-color-regular, #606266);
    --chrome-tab-text-active: var(--el-color-primary);
    --chrome-wing-r: 10px;

    overflow: visible;
    background: var(--chrome-strip-bg);
    border-bottom: 1px solid var(--chrome-strip-border);
    align-items: flex-end;

    .tags-nav-btn {
      align-self: stretch;
      height: auto;
      min-height: $tags-bar-height;
      border-color: var(--chrome-strip-border);
    }

    .tags-action-btn {
      border-color: var(--chrome-strip-border);
    }

    .tags-view-wrapper {
      .tags-view-item {
        display: inline-flex !important;
        align-items: center;
        justify-content: center;
        position: relative;
        z-index: 1;
        height: 32px;
        min-height: 32px;
        margin: 0 0 -1px;
        padding: 0 12px;
        font-size: 13px;
        font-weight: 400;
        line-height: 1.2;
        border: none !important;
        border-radius: 0;
        background: transparent !important;
        color: var(--chrome-tab-text);
        padding-top: 0 !important;
        box-shadow: none !important;
        transition: background var(--transition-fast, 0.15s) ease,
          color var(--transition-fast, 0.15s) ease,
          border-radius var(--transition-fast, 0.15s) ease;

        &::before,
        &::after {
          content: '' !important;
          display: block !important;
          position: absolute;
          bottom: 0;
          width: var(--chrome-wing-r);
          height: var(--chrome-wing-r);
          margin: 0 !important;
          pointer-events: none;
          background: transparent !important;
          border-radius: 0 !important;
          transition: box-shadow var(--transition-fast, 0.15s) ease;
        }

        &::before {
          left: calc(-1 * var(--chrome-wing-r));
          border-bottom-right-radius: var(--chrome-wing-r) !important;
          box-shadow: none;
        }

        &::after {
          right: calc(-1 * var(--chrome-wing-r));
          border-bottom-left-radius: var(--chrome-wing-r) !important;
          box-shadow: none;
        }

        &:first-of-type {
          margin-left: 6px;
        }

        &:last-of-type {
          margin-right: 10px;
        }

        &:not(.active) + .tags-view-item:not(.active) {
          border-left: 1px solid var(--el-border-color-lighter, #e4e7ed);
          padding-left: 11px;
        }

        &:hover:not(.active) {
          background: var(--el-fill-color-light, #f5f7fa) !important;
          border-radius: 8px 8px 0 0;
          color: var(--el-text-color-primary, #303133);
        }

        &.active {
          height: 33px;
          min-height: 33px;
          padding: 0 14px;
          color: var(--chrome-tab-text-active) !important;
          font-weight: 500;
          background: var(--chrome-tab-active-bg) !important;
          border: none !important;
          border-top: 2px solid var(--el-color-primary) !important;
          border-radius: var(--radius-md, 8px) var(--radius-md, 8px) 0 0;
          box-shadow: none;

          &::before {
            box-shadow: calc(var(--chrome-wing-r) * 0.5) calc(var(--chrome-wing-r) * 0.5) 0 calc(var(--chrome-wing-r) * 0.5) var(--chrome-tab-active-bg);
          }

          &::after {
            box-shadow: calc(var(--chrome-wing-r) * -0.5) calc(var(--chrome-wing-r) * 0.5) 0 calc(var(--chrome-wing-r) * 0.5) var(--chrome-tab-active-bg);
          }
        }
      }
    }
  }
}
</style>

<style lang="scss">
.tags-view-wrapper {
  .tags-view-item {
    .tags-close-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      margin-left: 4px;
      border-radius: 50%;
      transition: background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1), color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      
      .el-icon-close {
        width: 1em;
        height: 1em;
        vertical-align: 0;
        line-height: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      
      &:hover {
        background-color: var(--tags-close-hover, #b4bccc);
        
        .el-icon-close {
          color: #fff;
        }
      }
    }
  }
}

/* 页签全屏模式样式 */
.main-container.fullscreen-mode {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  margin-left: 0 !important;
  transition: none !important;
}

.main-container.fullscreen-mode .fixed-header {
  display: block !important;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100% !important;
  z-index: 1000;
  transition: none !important;
}

.main-container.fullscreen-mode .fixed-header .navbar {
  display: none !important;
}

.main-container.fullscreen-mode .app-main {
  position: fixed;
  top: 40px;
  left: 0;
  right: 0;
  bottom: 0;
  margin: 0 !important;
  padding: 0 !important;
  height: calc(100vh - 40px) !important;
  min-height: calc(100vh - 40px) !important;
  overflow: auto;
}
</style>