import router from './router'
import { ElMessage } from 'element-plus'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { getToken } from '@/utils/auth'
import { isHttp, isPathMatch } from '@/utils/validate'
import { isRelogin } from '@/utils/request'
import useUserStore from '@/store/modules/user'
import useLockStore from '@/store/modules/lock'
import useSettingsStore from '@/store/modules/settings'
import usePermissionStore from '@/store/modules/permission'

NProgress.configure({ showSpinner: false })

const whiteList = ['/login', '/register']

const isWhiteList = (path) => {
  return whiteList.some(pattern => isPathMatch(pattern, path))
}

router.beforeEach(async (to, from) => {
  NProgress.start()
  if (getToken()) {
    to.meta.title && useSettingsStore().setTitle(to.meta.title)
    const isLock = useLockStore().isLock
    if (to.path === '/login') {
      NProgress.done()
      return { path: '/' }
    }
    if (isWhiteList(to.path)) {
      return true
    }
    if (isLock && to.path !== '/lock') {
      NProgress.done()
      return { path: '/lock' }
    }
    if (!isLock && to.path === '/lock') {
      NProgress.done()
      return { path: '/' }
    }
    if (useUserStore().roles.length === 0) {
      isRelogin.show = true
      try {
        // 拉取user_info信息
        await useUserStore().getInfo()
        isRelogin.show = false
        // 根据roles权限生成可访问的路由
        const accessRoutes = await usePermissionStore().generateRoutes()
        accessRoutes.forEach(route => {
          if (!isHttp(route.path)) {
            router.addRoute(route)
          }
        })
        // 重新导航到目标路由，确保动态路由已注册
        return { ...to, replace: true }
      } catch (err) {
        await useUserStore().logOut()
        ElMessage.error(err)
        return { path: '/' }
      }
    }
    return true
  } else {
    // 没有token
    if (isWhiteList(to.path)) {
      // 在免登录白名单，直接进入
      return true
    }
    NProgress.done()
    return `/login?redirect=${to.fullPath}` // 否则全部重定向到登录页
  }
})

router.afterEach(() => {
  NProgress.done()
  closeLingeringTooltips()
})

/**
 * 关闭因路由切换而残留的 tooltip 气泡：
 * 页面被 keep-alive 缓存时，hover 中的行内按钮/侧栏菜单（如「重置密码」）在跳转后
 * 不会触发 mouseleave，其 tooltip 会一直挂在 body 上，出现"上个界面的东西"。
 * 两段处理：① 对仍有关联的 trigger 派发 mouseleave 让 EP 正常收尾；
 * ② 对关联已断的孤儿 popper（如菜单 tooltip）直接强制隐藏。
 */
function closeLingeringTooltips() {
  document.querySelectorAll('[aria-describedby]').forEach(el => {
    el.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false }))
    el.blur?.()
  })
  document.querySelectorAll('.el-popper.el-tooltip[aria-hidden="false"]').forEach(popper => {
    popper.setAttribute('aria-hidden', 'true')
    popper.style.display = 'none'
  })
}
