<template>
  <div class="user-selector">
    <el-select
      v-model="innerValue"
      filterable
      remote
      clearable
      reserve-keyword
      :remote-method="searchUsers"
      :loading="loading"
      placeholder="输入账号或姓名搜索用户"
      style="width: 320px; max-width: 100%"
      @change="emitChange"
      @clear="emitChange"
    >
      <el-option
        v-for="u in options"
        :key="u.userId"
        :label="`${u.nickName}（${u.userName}）`"
        :value="u.userId"
      >
        <div class="option-row">
          <span>{{ u.nickName }}（{{ u.userName }}）</span>
          <span class="option-dept">{{ u.deptName || '—' }}</span>
        </div>
      </el-option>
      <el-option
        v-if="hasMore"
        key="__more__"
        label="__more__"
        value="__more__"
        class="more-option"
      >
        <el-button link type="primary" size="small" @click.stop="loadPage(false)">加载更多</el-button>
      </el-option>
      <el-option v-if="!loading && options.length === 0" key="__empty__" label="__empty__" value="__empty__" disabled>
        未找到匹配用户
      </el-option>
    </el-select>
  </div>
</template>

<script setup name="UserSelector">
import { listDiagnosisUsers } from "@/api/system/permissionDiagnosis"

const props = defineProps({
  selectedUserId: { type: [Number, String], default: null }
})
const emit = defineEmits(['update:selectedUserId', 'change'])

const loading = ref(false)
const options = ref([])
const keyword = ref('')
const pageNum = ref(1)
const total = ref(0)
const innerValue = computed({
  get: () => props.selectedUserId,
  set: (v) => emit('update:selectedUserId', v)
})
const hasMore = computed(() => options.value.length < total.value)

async function loadPage(reset = true) {
  loading.value = true
  try {
    if (reset) {
      pageNum.value = 1
      options.value = []
    }
    const res = await listDiagnosisUsers({ keyword: keyword.value, pageNum: pageNum.value, pageSize: 10 })
    const rows = res.rows || []
    total.value = res.total || 0
    options.value = reset ? rows : [...options.value, ...rows]
    pageNum.value += 1
    // 当前选中用户不在候选中（如通过 userId 直达），补一个占位项保证回显
    if (props.selectedUserId && !options.value.some(u => String(u.userId) === String(props.selectedUserId))) {
      options.value = [{ userId: props.selectedUserId, userName: String(props.selectedUserId), nickName: `用户 #${props.selectedUserId}`, deptName: '' }, ...options.value]
    }
  } finally {
    loading.value = false
  }
}

function searchUsers(query) {
  keyword.value = query || ''
  loadPage(true)
}

function emitChange(val) {
  if (val === '__more__') return
  emit('change', val || null)
}

// 供父组件在诊断返回后回显真实姓名
function applyLabel(user) {
  if (!user?.userId) return
  const exist = options.value.find(u => String(u.userId) === String(user.userId))
  if (exist) {
    exist.nickName = user.nickName || exist.nickName
    exist.userName = user.userName || exist.userName
  } else {
    options.value = [{ userId: user.userId, userName: user.userName, nickName: user.nickName, deptName: user.deptName || '' }, ...options.value]
  }
}

defineExpose({ applyLabel })

onMounted(() => loadPage(true))
</script>

<style lang="scss" scoped>
.option-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);

  .option-dept {
    font-size: 12px;
    color: var(--text-secondary);
  }
}

.more-option {
  text-align: center;
}
</style>
