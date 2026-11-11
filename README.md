<p align="center">
	<img alt="logo" src="src/assets/logo/yunshu.svg" width="120">
</p>
<h1 align="center" style="margin: 30px 0 30px; font-weight: bold;">云枢（YunShu）管理系统</h1>
<h4 align="center">企业级前后端分离后台管理平台</h4>

## 平台简介

云枢是一套开箱即用的企业级后台管理系统，覆盖用户、权限、日志与系统运维的完整管理能力。

* 前端技术栈：[Vue3](https://cn.vuejs.org) + [Element Plus](https://element-plus.org/zh-CN) + [Vite](https://cn.vitejs.dev) + [Pinia](https://pinia.vuejs.org/zh/)
* 支持动态菜单、多标签页、亮暗主题切换与细粒度按钮级权限控制
* 内置操作/登录审计、在线用户监控、定时任务、代码生成等服务端配套能力

## 前端运行

```bash
# 进入项目目录
cd yunshu-admin

# 安装依赖
yarn --registry=https://registry.npmmirror.com

# 启动服务
yarn dev

# 构建测试环境 yarn build:stage
# 构建生产环境 yarn build:prod
# 前端访问地址 http://localhost:80
```

## 内置功能

1.  用户管理：系统操作者的配置与维护。
2.  部门管理：配置系统组织机构，树结构展现支持数据权限。
3.  岗位管理：配置系统用户所属担任职务。
4.  菜单管理：配置系统菜单、操作权限、按钮权限标识等。
5.  角色管理：角色菜单权限分配、按机构划分数据范围权限。
6.  字典管理：维护系统中经常使用的固定数据。
7.  参数管理：对系统动态配置常用参数。
8.  通知公告：系统通知公告信息发布维护。
9.  操作日志：系统操作日志记录、查询与审计。
10. 登录日志：系统登录日志记录查询，包含登录异常。
11. 在线用户：当前系统中活跃用户状态监控。
12. 定时任务：在线添加、修改、删除任务调度，含执行结果日志。
13. 代码生成：前后端代码生成，支持 CRUD 下载。
14. 系统接口：根据业务代码自动生成相关 API 接口文档。
15. 服务监控：监视当前系统 CPU、内存、磁盘、堆栈等信息。
16. 缓存监控：对系统的缓存信息查询、命令统计等。
17. 在线构建器：拖动表单元素生成相应的 HTML 代码。
18. 连接池监视：监视当前系统数据库连接池状态。
