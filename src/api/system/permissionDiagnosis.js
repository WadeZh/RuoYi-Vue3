import request from '@/utils/request'

/**
 * 权限诊断（V1，只读配置诊断）
 * 后端统一要求登录且为超级管理员；普通管理员即使配置同名菜单也不可调用。
 * 诊断结论（来源、原因、建议）全部由后端计算返回，前端仅展示。
 */

// 按账号/姓名搜索用户候选（仅返回 ID、账号、姓名、部门、状态）
export function listDiagnosisUsers(query) {
  return request({
    url: '/system/permission/diagnosis/users',
    method: 'get',
    params: query
  })
}

// 获取指定用户的完整配置诊断
export function getPermissionDiagnosis(userId) {
  return request({
    url: '/system/permission/diagnosis/' + userId,
    method: 'get'
  })
}

// 权限检查：判断指定权限标识的配置授权情况与来源
export function checkPermission(userId, permission) {
  return request({
    url: `/system/permission/diagnosis/${userId}/check`,
    method: 'get',
    params: { permission }
  })
}
