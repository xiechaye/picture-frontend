<template>
  <CenterContainer max-width="500px">
    <div class="change-password-page">
      <div class="header">
        <h2>{{ isForceChange ? '请修改密码' : '修改密码' }}</h2>
        <p v-if="isForceChange" class="force-hint">为了您的账号安全，请修改初始密码后再继续使用</p>
      </div>

      <a-form
        :model="formState"
        layout="vertical"
        @finish="handleSubmit"
        class="password-form"
      >
        <a-form-item
          label="原密码"
          name="oldPassword"
          :rules="[{ required: true, message: '请输入原密码' }]"
        >
          <a-input-password
            v-model:value="formState.oldPassword"
            placeholder="请输入原密码"
            size="large"
          />
        </a-form-item>

        <a-form-item
          label="新密码"
          name="newPassword"
          :rules="[
            { required: true, message: '请输入新密码' },
            { min: 8, message: '密码长度不能小于 8 位' },
          ]"
        >
          <a-input-password
            v-model:value="formState.newPassword"
            placeholder="请输入新密码（至少 8 位）"
            size="large"
          />
        </a-form-item>

        <a-form-item
          label="确认新密码"
          name="confirmPassword"
          :rules="[
            { required: true, message: '请再次输入新密码' },
            { validator: validateConfirmPassword },
          ]"
        >
          <a-input-password
            v-model:value="formState.confirmPassword"
            placeholder="请再次输入新密码"
            size="large"
          />
        </a-form-item>

        <a-form-item style="margin-top: 24px">
          <a-button
            type="primary"
            html-type="submit"
            :loading="submitting"
            block
            size="large"
          >
            确认修改
          </a-button>
        </a-form-item>
      </a-form>
    </div>
  </CenterContainer>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import { changePasswordUsingPost } from '@/api/userController'
import CenterContainer from '@/components/CenterContainer.vue'

const router = useRouter()
const loginUserStore = useLoginUserStore()

// 是否为强制修改密码
const isForceChange = computed(
  () => loginUserStore.loginUser?.forceChangePassword === true
)

const formState = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const submitting = ref(false)

// 验证确认密码
const validateConfirmPassword = async (_rule: unknown, value: string) => {
  if (value !== formState.newPassword) {
    return Promise.reject(new Error('两次输入的密码不一致'))
  }
  return Promise.resolve()
}

// 提交表单
const handleSubmit = async () => {
  submitting.value = true
  try {
    // 调用修改密码 API
    const res = await changePasswordUsingPost({
      oldPassword: formState.oldPassword,
      newPassword: formState.newPassword,
      confirmPassword: formState.confirmPassword,
    })

    if (res.data.code === 0) {
      message.success('密码修改成功')

      // 刷新用户信息以清除 forceChangePassword 标记
      await loginUserStore.fetchLoginUser()

      // 如果是强制修改密码，跳转到首页；否则返回上一页
      if (isForceChange.value) {
        router.replace('/')
      } else {
        router.back()
      }
    } else {
      message.error('密码修改失败：' + (res.data.message || '未知错误'))
    }
  } catch (e: unknown) {
    message.error('密码修改失败：' + (e instanceof Error ? e.message : String(e)))
  } finally {
    submitting.value = false
  }
}

// 页面加载时检查是否为强制修改密码
onMounted(() => {
  // 如果不是强制修改密码且用户未登录，跳转到登录页
  if (!isForceChange.value && !loginUserStore.loginUser?.id) {
    message.warning('请先登录')
    router.push('/user/login')
  }
})
</script>

<style scoped>
.change-password-page {
  padding: 24px 0;
}

.header {
  text-align: center;
  margin-bottom: 32px;
}

.header h2 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #1f2937;
}

.force-hint {
  color: #f59e0b;
  font-size: 14px;
  margin: 0;
}

.password-form {
  background: #fff;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>
