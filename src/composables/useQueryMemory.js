import cache from '@/plugins/cache'

/**
 * 列表页搜索条件记忆（会话级）
 *
 * 以当前路由 path 为 key，将 queryParams（含 pageNum/pageSize）持久化到 sessionStorage，
 * 页签切换/跳转返回后自动恢复上次的查询条件与页码。
 *
 * 用法：
 *   const qm = useQueryMemory()
 *   const queryParams = ref(qm.restore({ pageNum: 1, pageSize: 10, ... 默认条件 }))
 *   // getList() 内调用 qm.save(queryParams.value)
 *   // resetQuery() 内调用 qm.clear()
 */
export function useQueryMemory() {
  const route = useRoute()
  const key = `query-memory:${route.path}`

  /** 恢复上次的查询条件，与默认值合并（saved 优先）；无记录时返回默认值 */
  function restore(defaults) {
    try {
      const saved = cache.session.getJSON(key)
      if (saved && typeof saved === 'object') {
        return { ...defaults, ...saved }
      }
    } catch (e) { /* 忽略损坏的缓存 */ }
    return { ...defaults }
  }

  /** 保存当前查询条件（在每次发起列表请求时调用） */
  function save(params) {
    try {
      cache.session.setJSON(key, { ...params })
    } catch (e) { /* 序列化失败忽略 */ }
  }

  /** 清除记忆（重置查询时调用） */
  function clear() {
    cache.session.remove(key)
  }

  return { key, restore, save, clear }
}

export default useQueryMemory
