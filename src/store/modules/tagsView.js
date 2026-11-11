import cache from '@/plugins/cache'
import useSettingsStore from '@/store/modules/settings'

const PERSIST_KEY = 'tags-view-visited'
const PIN_KEY = 'tags-view-pinned'

function isPersistEnabled() {
  return useSettingsStore().tagsViewPersist
}

function saveVisitedViews(views) {
  if (!isPersistEnabled()) return
  const toSave = views.filter(v => !(v.meta && v.meta.affix)).map(v => ({ path: v.path, fullPath: v.fullPath, name: v.name, title: v.title, query: v.query, meta: v.meta }))
  cache.local.setJSON(PERSIST_KEY, toSave)
}

function loadVisitedViews() {
  return cache.local.getJSON(PERSIST_KEY) || []
}

function clearVisitedViews() {
  cache.local.remove(PERSIST_KEY)
}

// 固定页签（用户手动固定，按 path 持久化）
function savePinnedPaths(paths) {
  cache.local.setJSON(PIN_KEY, paths)
}

const useTagsViewStore = defineStore(
  'tags-view',
  {
    state: () => ({
      visitedViews: [],
      cachedViews: [],
      iframeViews: [],
      pinnedPaths: cache.local.getJSON(PIN_KEY) || [],
      // 已关闭页签历史（会话级，供「重新打开」使用）
      closedHistory: []
    }),
    actions: {
      isPinned(view) {
        return !!view && this.pinnedPaths.includes(view.path)
      },
      togglePin(view) {
        if (!view) return
        const idx = this.pinnedPaths.indexOf(view.path)
        if (idx > -1) {
          this.pinnedPaths.splice(idx, 1)
        } else {
          this.pinnedPaths.push(view.path)
        }
        savePinnedPaths([...this.pinnedPaths])
      },
      // 记录已关闭页签（去重、上限 10 条）
      pushClosedHistory(view) {
        if (!view || (view.meta && view.meta.affix)) return
        const entry = { path: view.path, fullPath: view.fullPath, name: view.name, title: view.title, query: view.query, meta: view.meta }
        this.closedHistory = [entry, ...this.closedHistory.filter(h => h.path !== entry.path)].slice(0, 10)
      },
      // 弹出最近关闭的页签（供重新打开）
      popClosedHistory() {
        return this.closedHistory.shift() || null
      },
      // 拖拽排序：重排 visitedViews（affix 页签保持置首）
      reorderViews({ oldIndex, newIndex }) {
        if (oldIndex == null || newIndex == null || oldIndex === newIndex) return
        if (oldIndex < 0 || newIndex < 0 || oldIndex >= this.visitedViews.length || newIndex >= this.visitedViews.length) return
        const [moved] = this.visitedViews.splice(oldIndex, 1)
        this.visitedViews.splice(newIndex, 0, moved)
        // affix（首页）页签固定在最前
        const affixViews = this.visitedViews.filter(v => v.meta && v.meta.affix)
        if (affixViews.length && this.visitedViews[0] !== affixViews[0]) {
          const affixPaths = new Set(affixViews.map(v => v.path))
          this.visitedViews = [...affixViews, ...this.visitedViews.filter(v => !affixPaths.has(v.path))]
        }
        saveVisitedViews(this.visitedViews)
      },
      addView(view) {
        this.addVisitedView(view)
        this.addCachedView(view)
      },
      addIframeView(view) {
        if (this.iframeViews.some(v => v.path === view.path)) return
        this.iframeViews.push(
          Object.assign({}, view, {
            title: view.meta.title || 'no-name'
          })
        )
      },
      addVisitedView(view) {
        if (this.visitedViews.some(v => v.path === view.path)) return
        this.visitedViews.push(
          Object.assign({}, view, {
            title: view.meta.title || 'no-name'
          })
        )
        saveVisitedViews(this.visitedViews)
      },
      addAffixView(view) {
        if (this.visitedViews.some(v => v.path === view.path)) return
        this.visitedViews.unshift(
          Object.assign({}, view, {
            title: view.meta.title || 'no-name'
          })
        )
      },
      addCachedView(view) {
        if (this.cachedViews.includes(view.name)) return
        if (!view.meta.noCache) {
          this.cachedViews.push(view.name)
        }
      },
      delView(view) {
        return new Promise(resolve => {
          this.delVisitedView(view)
          this.delCachedView(view)
          resolve({
            visitedViews: [...this.visitedViews],
            cachedViews: [...this.cachedViews]
          })
        })
      },
      delVisitedView(view) {
        return new Promise(resolve => {
          for (const [i, v] of this.visitedViews.entries()) {
            if (v.path === view.path && !this.pinnedPaths.includes(v.path)) {
              const [removed] = this.visitedViews.splice(i, 1)
              this.pushClosedHistory(removed)
              break
            }
          }
          this.iframeViews = this.iframeViews.filter(item => item.path !== view.path)
          saveVisitedViews(this.visitedViews)
          resolve([...this.visitedViews])
        })
      },
      delIframeView(view) {
        return new Promise(resolve => {
          this.iframeViews = this.iframeViews.filter(item => item.path !== view.path)
          resolve([...this.iframeViews])
        })
      },
      delCachedView(view) {
        return new Promise(resolve => {
          const index = this.cachedViews.indexOf(view.name)
          index > -1 && this.cachedViews.splice(index, 1)
          resolve([...this.cachedViews])
        })
      },
      delOthersViews(view) {
        return new Promise(resolve => {
          this.delOthersVisitedViews(view)
          this.delOthersCachedViews(view)
          resolve({
            visitedViews: [...this.visitedViews],
            cachedViews: [...this.cachedViews]
          })
        })
      },
      delOthersVisitedViews(view) {
        return new Promise(resolve => {
          this.visitedViews = this.visitedViews.filter(v => {
            return v.meta.affix || v.path === view.path || this.pinnedPaths.includes(v.path)
          })
          this.iframeViews = this.iframeViews.filter(item => item.path === view.path)
          saveVisitedViews(this.visitedViews)
          resolve([...this.visitedViews])
        })
      },
      delOthersCachedViews(view) {
        return new Promise(resolve => {
          const index = this.cachedViews.indexOf(view.name)
          if (index > -1) {
            this.cachedViews = this.cachedViews.slice(index, index + 1)
          } else {
            this.cachedViews = []
          }
          resolve([...this.cachedViews])
        })
      },
      delAllViews(view) {
        return new Promise(resolve => {
          this.delAllVisitedViews(view)
          this.delAllCachedViews(view)
          resolve({
            visitedViews: [...this.visitedViews],
            cachedViews: [...this.cachedViews]
          })
        })
      },
      delAllVisitedViews(view) {
        return new Promise(resolve => {
          const affixTags = this.visitedViews.filter(tag => tag.meta.affix || this.pinnedPaths.includes(tag.path))
          this.visitedViews = affixTags
          this.iframeViews = []
          clearVisitedViews()
          resolve([...this.visitedViews])
        })
      },
      delAllCachedViews(view) {
        return new Promise(resolve => {
          this.cachedViews = []
          resolve([...this.cachedViews])
        })
      },
      updateVisitedView(view) {
        for (let v of this.visitedViews) {
          if (v.path === view.path) {
            v = Object.assign(v, view)
            break
          }
        }
      },
      delRightTags(view) {
        return new Promise(resolve => {
          const index = this.visitedViews.findIndex(v => v.path === view.path)
          if (index === -1) {
            return
          }
          this.visitedViews = this.visitedViews.filter((item, idx) => {
            if (idx <= index || (item.meta && item.meta.affix) || this.pinnedPaths.includes(item.path)) {
              return true
            }
            const i = this.cachedViews.indexOf(item.name)
            if (i > -1) {
              this.cachedViews.splice(i, 1)
            }
            if(item.meta.link) {
              const fi = this.iframeViews.findIndex(v => v.path === item.path)
              this.iframeViews.splice(fi, 1)
            }
            return false
          })
          saveVisitedViews(this.visitedViews)
          resolve([...this.visitedViews])
        })
      },
      delLeftTags(view) {
        return new Promise(resolve => {
          const index = this.visitedViews.findIndex(v => v.path === view.path)
          if (index === -1) {
            return
          }
          this.visitedViews = this.visitedViews.filter((item, idx) => {
            if (idx >= index || (item.meta && item.meta.affix) || this.pinnedPaths.includes(item.path)) {
              return true
            }
            const i = this.cachedViews.indexOf(item.name)
            if (i > -1) {
              this.cachedViews.splice(i, 1)
            }
            if(item.meta.link) {
              const fi = this.iframeViews.findIndex(v => v.path === item.path)
              this.iframeViews.splice(fi, 1)
            }
            return false
          })
          saveVisitedViews(this.visitedViews)
          resolve([...this.visitedViews])
        })
      },
      // 恢复持久化的 tags
      loadPersistedViews() {
        const views = loadVisitedViews()
        views.forEach(view => {
          this.addVisitedView(view)
        })
      }
    }
  })

export default useTagsViewStore
