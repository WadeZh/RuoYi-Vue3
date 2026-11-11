import { useIdle } from '@vueuse/core'
import useLockStore from '@/store/modules/lock'
import useSettingsStore from '@/store/modules/settings'
import useUserStore from '@/store/modules/user'

/**
 * 空闲自动锁屏
 *
 * 监听鼠标/键盘等用户活动事件；连续空闲超过设置时长（且开关开启、已登录、未锁屏）时，
 * 复用现有锁屏流程（lockStore.lockScreen + 路由跳转 /lock，由路由守卫接管）。
 *
 * 在 src/layout/index.vue 的 setup 中调用一次即可全局生效。
 */
export function useIdleLock() {
  const router = useRouter()
  const settingsStore = useSettingsStore()
  const lockStore = useLockStore()
  const userStore = useUserStore()

  // 关闭开关时给一个极小的非 0 超时，避免 useIdle(0) 每帧触发
  const timeout = computed(() =>
    settingsStore.autoLockEnabled ? settingsStore.autoLockMinutes * 60 * 1000 : 24 * 60 * 60 * 1000
  )

  const { idle } = useIdle(timeout, {
    events: ['mousemove', 'keydown', 'mousedown', 'touchstart', 'wheel'],
    listenTo: 'window'
  })

  watch(idle, (isIdle) => {
    if (!isIdle) return
    if (!settingsStore.autoLockEnabled) return
    if (lockStore.isLock) return
    if (!userStore.token) return
    if (router.currentRoute.value.path === '/lock') return
    lockStore.lockScreen(router.currentRoute.value.fullPath)
    router.push('/lock')
  })
}

export default useIdleLock
