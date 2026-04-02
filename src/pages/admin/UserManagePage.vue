<template>
  <AdminPageContainer title="用户管理" description="管理系统中的所有用户信息">
    <!-- 搜索表单 -->
    <SearchForm
      :form-items="searchFormItems"
      :initial-values="searchParams"
      @search="handleSearch"
      @reset="handleReset"
    />

    <!-- 表格 -->
    <a-table
      :columns="columns"
      :data-source="dataList"
      :pagination="pagination"
      :loading="loading"
      @change="doTableChange"
      row-key="id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'userAvatar'">
          <a-avatar :src="record.userAvatar" :size="48" />
        </template>
        <template v-else-if="column.dataIndex === 'userRole'">
          <a-tag v-if="record.userRole === 'admin'" color="green">管理员</a-tag>
          <a-tag v-else color="blue">普通用户</a-tag>
        </template>
        <template v-else-if="column.dataIndex === 'userProfile'">
          <span class="text-ellipsis">{{ record.userProfile || '-' }}</span>
        </template>
        <template v-else-if="column.dataIndex === 'createTime'">
          {{ dayjs(record.createTime).format('YYYY-MM-DD HH:mm:ss') }}
        </template>
        <template v-else-if="column.key === 'action'">
          <div class="action-buttons">
            <a-button type="link" size="small" @click="openResetPasswordModal(record)">
              重置密码
            </a-button>
            <a-popconfirm
              title="确定要删除该用户吗？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="doDelete(record.id)"
            >
              <a-button type="link" danger size="small">删除</a-button>
            </a-popconfirm>
          </div>
        </template>
      </template>
    </a-table>

    <!-- 重置密码弹窗 -->
    <a-modal
      v-model:open="resetPasswordVisible"
      title="重置用户密码"
      :confirm-loading="resetPasswordLoading"
      @ok="handleResetPassword"
      @cancel="closeResetPasswordModal"
    >
      <a-form
        ref="resetPasswordFormRef"
        :model="resetPasswordForm"
        :rules="resetPasswordRules"
        layout="vertical"
      >
        <a-descriptions :column="1" bordered size="small" style="margin-bottom: 16px">
          <a-descriptions-item label="用户账号">{{ currentUser?.userAccount }}</a-descriptions-item>
          <a-descriptions-item label="用户名">{{ currentUser?.userName }}</a-descriptions-item>
        </a-descriptions>
        <a-form-item name="userPassword" label="新密码">
          <a-input-password
            v-model:value="resetPasswordForm.userPassword"
            placeholder="请输入新密码（8-32位，必须包含字母和数字）"
          />
        </a-form-item>
        <a-form-item name="confirmPassword" label="确认密码">
          <a-input-password
            v-model:value="resetPasswordForm.confirmPassword"
            placeholder="请再次输入新密码"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </AdminPageContainer>
</template>
<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue'
import type { FormInstance } from 'ant-design-vue'
import { deleteUserUsingPost, listUserVoByPageUsingPost, resetUserPasswordUsingPost } from '@/api/userController.ts'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { handleApiResponse, handleException } from '@/utils/errorHandler'
import AdminPageContainer from '@/components/admin/AdminPageContainer.vue'
import SearchForm from '@/components/admin/SearchForm.vue'

// 搜索表单配置
const searchFormItems = [
  {
    name: 'userAccount',
    label: '账号',
    type: 'input' as const,
    placeholder: '输入账号'
  },
  {
    name: 'userName',
    label: '用户名',
    type: 'input' as const,
    placeholder: '输入用户名'
  }
]

const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    width: 80,
  },
  {
    title: '头像',
    dataIndex: 'userAvatar',
    width: 80,
    align: 'center',
  },
  {
    title: '账号',
    dataIndex: 'userAccount',
    width: 150,
  },
  {
    title: '用户名',
    dataIndex: 'userName',
    width: 150,
  },
  {
    title: '简介',
    dataIndex: 'userProfile',
    ellipsis: true,
  },
  {
    title: '用户角色',
    dataIndex: 'userRole',
    width: 100,
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    width: 180,
  },
  {
    title: '操作',
    key: 'action',
    width: 180,
    fixed: 'right',
  },
]

// 定义数据
const dataList = ref<API.UserVO[]>([])
const total = ref(0)
const loading = ref(false)

// 搜索条件
const searchParams = reactive<API.UserQueryRequest>({
  current: 1,
  pageSize: 10,
  sortField: 'createTime',
  sortOrder: 'ascend',
})

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    const res = await listUserVoByPageUsingPost({
      ...searchParams,
    })
    if (handleApiResponse(res, { operation: '获取用户列表' })) {
      dataList.value = res.data.data?.records ?? []
      total.value = Number(res.data.data?.total ?? 0)
    }
  } catch (error) {
    handleException(error, { operation: '获取用户列表' })
  } finally {
    loading.value = false
  }
}

// 页面加载时获取数据，请求一次
onMounted(() => {
  fetchData()
})

// 分页参数
const pagination = computed(() => {
  return {
    current: searchParams.current,
    pageSize: searchParams.pageSize,
    total: total.value,
    showSizeChanger: true,
    showTotal: (total: number) => `共 ${total} 条`,
  }
})

// 表格变化之后，重新获取数据
const doTableChange = (page: { current: number; pageSize: number }) => {
  searchParams.current = page.current
  searchParams.pageSize = page.pageSize
  fetchData()
}

// 搜索数据
const handleSearch = (values: Record<string, any>) => {
  Object.assign(searchParams, values)
  searchParams.current = 1
  fetchData()
}

// 重置搜索
const handleReset = () => {
  searchParams.userAccount = undefined
  searchParams.userName = undefined
  searchParams.current = 1
  fetchData()
}

// 删除数据
const doDelete = async (id: string) => {
  if (!id) {
    return
  }
  try {
    const res = await deleteUserUsingPost({ id })
    if (handleApiResponse(res, { operation: '删除用户' })) {
      message.success('删除成功')
      // 刷新数据
      fetchData()
    }
  } catch (error) {
    handleException(error, { operation: '删除用户' })
  }
}

// 重置密码相关
const resetPasswordVisible = ref(false)
const resetPasswordLoading = ref(false)
const resetPasswordFormRef = ref<FormInstance>()
const currentUser = ref<API.UserVO>()

const resetPasswordForm = reactive({
  userPassword: '',
  confirmPassword: ''
})

// 密码验证规则
const validatePassword = async (_rule: any, value: string) => {
  if (!value) {
    return Promise.reject('请输入密码')
  }
  if (value.length < 8 || value.length > 32) {
    return Promise.reject('密码长度必须在 8-32 个字符之间')
  }
  if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(value)) {
    return Promise.reject('密码必须包含字母和数字')
  }
  return Promise.resolve()
}

const validateConfirmPassword = async (_rule: any, value: string) => {
  if (!value) {
    return Promise.reject('请输入确认密码')
  }
  if (value !== resetPasswordForm.userPassword) {
    return Promise.reject('两次输入的密码不一致')
  }
  return Promise.resolve()
}

const resetPasswordRules = {
  userPassword: [{ validator: validatePassword, trigger: 'change' }],
  confirmPassword: [{ validator: validateConfirmPassword, trigger: 'change' }]
}

// Modal 控制函数
const openResetPasswordModal = (user: API.UserVO) => {
  currentUser.value = user
  resetPasswordForm.userPassword = ''
  resetPasswordForm.confirmPassword = ''
  resetPasswordVisible.value = true
}

const closeResetPasswordModal = () => {
  resetPasswordVisible.value = false
  resetPasswordFormRef.value?.resetFields()
}

// 重置密码处理
const handleResetPassword = async () => {
  try {
    await resetPasswordFormRef.value?.validate()
  } catch {
    return
  }

  if (!currentUser.value?.id) {
    return
  }

  resetPasswordLoading.value = true
  try {
    const res = await resetUserPasswordUsingPost({
      id: currentUser.value.id,
      userPassword: resetPasswordForm.userPassword
    })
    if (handleApiResponse(res, { operation: '重置密码' })) {
      message.success('密码重置成功')
      closeResetPasswordModal()
      fetchData()
    }
  } catch (error) {
    handleException(error, { operation: '重置密码' })
  } finally {
    resetPasswordLoading.value = false
  }
}
</script>

<style scoped>
.text-ellipsis {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
}

.action-buttons {
  display: flex;
  gap: 8px;
}
</style>
