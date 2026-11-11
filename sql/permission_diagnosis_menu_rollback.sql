-- ============================================================
-- 权限诊断功能（V1）菜单回滚脚本
-- 说明：按权限标识精确删除，避免误删同名菜单；删除前请确认无其他菜单复用该标识。
-- ============================================================

-- 1. 删除诊断页面下挂的按钮权限（父级为其本身）
DELETE FROM sys_menu
WHERE menu_type = 'F'
  AND perms = 'system:permission:diagnose'
  AND menu_name = '权限诊断查询';

-- 2. 删除权限诊断菜单
DELETE FROM sys_menu
WHERE menu_type = 'C'
  AND perms = 'system:permission:diagnose'
  AND menu_name = '权限诊断'
  AND component = 'system/permission/diagnosis/index';

-- 3. 清理角色-菜单绑定（兜底：删除已不存在的 menu_id 关联）
DELETE rm FROM sys_role_menu rm
LEFT JOIN sys_menu m ON m.menu_id = rm.menu_id
WHERE m.menu_id IS NULL;

-- 4. 用户重新登录或由后端清理菜单缓存后生效。
