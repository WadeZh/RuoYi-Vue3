-- ============================================================
-- 权限诊断功能（V1）菜单初始化脚本
-- 适用：云枢管理系统（RuoYi 体系 sys_menu / sys_role_menu）
-- 说明：
--   1. 权限标识 system:permission:diagnose 默认不分配给普通角色，
--      仅写入超级管理员（sys_role_menu 角色可按需调整）。
--   2. 菜单挂在「系统管理」（parent_id = 1）下；若根目录 ID 不同，
--      请先执行下方查询确认后替换 @parentId。
--   3. 后端接口部署完成后，再执行本脚本并重新登录刷新菜单缓存。
-- ============================================================

-- 查看系统管理目录 ID（默认应为 1）
-- SELECT menu_id, menu_name FROM sys_menu WHERE menu_type = 'M' AND menu_name = '系统管理';

SET @parentId = (SELECT menu_id FROM sys_menu WHERE menu_type = 'M' AND menu_name = '系统管理' LIMIT 1);

-- 1. 权限诊断菜单（C 类型，挂在系统管理下）
INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
VALUES ('权限诊断', @parentId, 12, 'permission-diagnosis', 'system/permission/diagnosis/index', '', '', 1, 0, 'C', '0', '0', 'system:permission:diagnose', 'checkbox', 'admin', NOW(), '', NULL, '权限诊断菜单（V1，只读配置诊断）');

SET @diagMenuId = LAST_INSERT_ID();

-- 2. 诊断页面自身的按钮权限（预留扩展，V1 页面为只读可暂不分配）
INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
VALUES ('权限诊断查询', @diagMenuId, 1, '', '', '', '', 1, 0, 'F', '0', '0', 'system:permission:diagnose', '#', 'admin', NOW(), '', NULL, '权限诊断查询按钮');

SET @diagBtnId = LAST_INSERT_ID();

-- 3. 分配给超级管理员角色（role_key = admin；按需调整角色 ID）
INSERT INTO sys_role_menu (role_id, menu_id)
SELECT r.role_id, @diagMenuId FROM sys_role r WHERE r.role_key = 'admin';

INSERT INTO sys_role_menu (role_id, menu_id)
SELECT r.role_id, @diagBtnId FROM sys_role r WHERE r.role_key = 'admin';

-- 4. 记录操作日志：本次变更写 sys_oper_log 由后端统一处理，无需在此脚本中插入。
