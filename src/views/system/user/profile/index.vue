<template>
   <div class="app-container">
      <el-row :gutter="20">
         <el-col :span="6" :xs="24">
            <el-card class="box-card">
               <template v-slot:header>
                 <div class="clearfix">
                   <span>个人信息</span>
                 </div>
               </template>
               <div>
                  <div class="text-center">
                     <userAvatar />
                  </div>
                  <ul class="list-group list-group-striped">
                     <li class="list-group-item">
                        <svg-icon icon-class="user" />用户名称
                        <div class="pull-right">{{ state.user.userName }}</div>
                     </li>
                     <li class="list-group-item">
                        <svg-icon icon-class="phone" />手机号码
                        <div class="pull-right">{{ state.user.phonenumber }}</div>
                     </li>
                     <li class="list-group-item">
                        <svg-icon icon-class="email" />用户邮箱
                        <div class="pull-right">{{ state.user.email }}</div>
                     </li>
                     <li class="list-group-item">
                        <svg-icon icon-class="tree" />所属部门
                        <div class="pull-right" v-if="state.user.dept">{{ state.user.dept.deptName }} / {{ state.postGroup }}</div>
                     </li>
                     <li class="list-group-item">
                        <svg-icon icon-class="peoples" />所属角色
                        <div class="pull-right">{{ state.roleGroup }}</div>
                     </li>
                     <li class="list-group-item">
                        <svg-icon icon-class="date" />创建日期
                        <div class="pull-right">{{ state.user.createTime }}</div>
                     </li>
                  </ul>
               </div>
            </el-card>
         </el-col>
         <el-col :span="18" :xs="24">
            <el-card>
               <template v-slot:header>
                 <div class="clearfix">
                   <span>基本资料</span>
                 </div>
               </template>
               <el-tabs v-model="selectedTab">
                  <el-tab-pane label="基本资料" name="userinfo">
                     <userInfo :user="state.user" />
                  </el-tab-pane>
                  <el-tab-pane label="修改密码" name="resetPwd">
                     <resetPwd />
                  </el-tab-pane>
                  <el-tab-pane label="登录日志" name="logininfor" v-if="hasLoginLogPerm" lazy>
                     <el-table :data="loginLogList" v-loading="loginLogLoading" size="small">
                        <el-table-column label="登录时间" prop="loginTime" width="170" />
                        <el-table-column label="IP 地址" prop="ipaddr" width="140" />
                        <el-table-column label="登录地点" prop="loginLocation" :show-overflow-tooltip="true" />
                        <el-table-column label="浏览器" prop="browser" :show-overflow-tooltip="true" />
                        <el-table-column label="操作系统" prop="os" :show-overflow-tooltip="true" />
                        <el-table-column label="状态" width="80" align="center">
                           <template #default="scope">
                              <el-tag size="small" :type="scope.row.status === '0' ? 'success' : 'danger'">
                                 {{ scope.row.status === '0' ? '成功' : '失败' }}
                              </el-tag>
                           </template>
                        </el-table-column>
                     </el-table>
                     <pagination :total="loginLogTotal" v-model:page="loginLogQuery.pageNum" v-model:limit="loginLogQuery.pageSize" @pagination="getLoginLog" />
                  </el-tab-pane>
                  <el-tab-pane label="操作日志" name="operlog" v-if="hasOperLogPerm" lazy>
                     <el-table :data="operLogList" v-loading="operLogLoading" size="small">
                        <el-table-column label="操作时间" prop="operTime" width="170" />
                        <el-table-column label="系统模块" prop="title" :show-overflow-tooltip="true" />
                        <el-table-column label="操作类型" width="100" align="center">
                           <template #default="scope">
                              <dict-tag :options="sys_oper_type" :value="scope.row.businessType" size="small" />
                           </template>
                        </el-table-column>
                        <el-table-column label="操作地址" prop="operIp" width="140" />
                        <el-table-column label="耗时" width="90" align="center">
                           <template #default="scope">{{ scope.row.costTime }} ms</template>
                        </el-table-column>
                        <el-table-column label="状态" width="80" align="center">
                           <template #default="scope">
                              <el-tag size="small" :type="scope.row.status === 0 ? 'success' : 'danger'">
                                 {{ scope.row.status === 0 ? '正常' : '异常' }}
                              </el-tag>
                           </template>
                        </el-table-column>
                     </el-table>
                     <pagination :total="operLogTotal" v-model:page="operLogQuery.pageNum" v-model:limit="operLogQuery.pageSize" @pagination="getOperLog" />
                  </el-tab-pane>
               </el-tabs>
            </el-card>
         </el-col>
      </el-row>
   </div>
</template>

<script setup name="Profile">
import userAvatar from "./userAvatar"
import userInfo from "./userInfo"
import resetPwd from "./resetPwd"
import { getUserProfile } from "@/api/system/user"
import { list as listLogininfor } from "@/api/monitor/logininfor"
import { list as listOperlog } from "@/api/monitor/operlog"
import auth from "@/plugins/auth"

const route = useRoute()
const { proxy } = getCurrentInstance()
const { sys_oper_type } = proxy.useDict('sys_oper_type')
const selectedTab = ref("userinfo")
const state = reactive({
  user: {},
  roleGroup: {},
  postGroup: {}
})

// 日志 tab 按权限展示（无权限时不渲染，避免 403）
const hasLoginLogPerm = computed(() => auth.hasPermi('monitor:logininfor:list'))
const hasOperLogPerm = computed(() => auth.hasPermi('monitor:operlog:list'))

/* ---------- 我的登录日志 / 操作日志（按当前用户过滤） ---------- */
const loginLogList = ref([])
const loginLogLoading = ref(false)
const loginLogTotal = ref(0)
const loginLogQuery = ref({
  pageNum: 1,
  pageSize: 10,
  userName: undefined
})
const loginLogLoaded = ref(false)

const operLogList = ref([])
const operLogLoading = ref(false)
const operLogTotal = ref(0)
const operLogQuery = ref({
  pageNum: 1,
  pageSize: 10,
  operName: undefined
})
const operLogLoaded = ref(false)

function getLoginLog() {
  loginLogLoading.value = true
  loginLogQuery.value.userName = state.user.userName
  listLogininfor(loginLogQuery.value).then(res => {
    loginLogList.value = res.rows || []
    loginLogTotal.value = res.total || 0
    loginLogLoaded.value = true
  }).finally(() => {
    loginLogLoading.value = false
  })
}

function getOperLog() {
  operLogLoading.value = true
  operLogQuery.value.operName = state.user.userName
  listOperlog(operLogQuery.value).then(res => {
    operLogList.value = res.rows || []
    operLogTotal.value = res.total || 0
    operLogLoaded.value = true
  }).finally(() => {
    operLogLoading.value = false
  })
}

// 首次切换到日志 tab 时拉取数据
watch(selectedTab, (tab) => {
  if (tab === 'logininfor' && hasLoginLogPerm.value && !loginLogLoaded.value) {
    getLoginLog()
  }
  if (tab === 'operlog' && hasOperLogPerm.value && !operLogLoaded.value) {
    getOperLog()
  }
})

function getUser() {
  getUserProfile().then(response => {
    state.user = response.data
    state.roleGroup = response.roleGroup
    state.postGroup = response.postGroup
    // 个人资料返回后再查询日志（依赖 userName 过滤）
    if (hasLoginLogPerm.value && route.params.activeTab === 'logininfor') {
      getLoginLog()
    }
    if (hasOperLogPerm.value && route.params.activeTab === 'operlog') {
      getOperLog()
    }
  })
}

onMounted(() => {
  const activeTab = route.params && route.params.activeTab
  if (activeTab) {
    selectedTab.value = activeTab
  }
  getUser()
})
</script>
