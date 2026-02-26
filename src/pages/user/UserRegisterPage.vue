<template>
  <div id="userRegisterPage">
    <h2 class="title">茶叶云图库 - 用户注册</h2>
    <a-form :model="formState" name="basic" autocomplete="off" @finish="handleSubmit">
      <a-form-item
        name="userAccount"
        :rules="[
          { required: true, message: '请输入账号' },
          { min: 4, max: 20, message: '用户账号长度必须在 4-20 个字符之间' },
          { pattern: /^[a-zA-Z0-9_]+$/, message: '用户账号仅包含字母、数字、下划线' },
        ]"
      >
        <a-input v-model:value="formState.userAccount" placeholder="请输入账号（4-20位，仅字母、数字、下划线）" />
      </a-form-item>
      <a-form-item name="userPassword" :rules="[{ validator: validatePassword }]">
        <a-input-password v-model:value="formState.userPassword" placeholder="请输入密码（8-32位，必须包含字母和数字）" />
      </a-form-item>
      <a-form-item
        name="checkPassword"
        :rules="[
          { required: true, message: '请输入确认密码' },
        ]"
      >
        <a-input-password v-model:value="formState.checkPassword" placeholder="请再次输入密码" />
      </a-form-item>
      <a-form-item name="captchaCode" :rules="[{ required: true, message: '请输入验证码' }]">
        <div class="captcha-row">
          <a-input v-model:value="formState.captchaCode" placeholder="请输入验证码" />
          <img
            class="captcha-image"
            :src="captchaImageUrl"
            alt="验证码"
            @click="fetchCaptcha"
            title="点击刷新验证码"
          />
        </div>
      </a-form-item>
      <div class="captcha-refresh" @click="fetchCaptcha">看不清？点击刷新验证码</div>
      <div class="tips">
        已有账号？
        <RouterLink to="/user/login">去登录</RouterLink>
      </div>
      <a-form-item>
        <a-button type="primary" html-type="submit" style="width: 100%">注册</a-button>
      </a-form-item>
    </a-form>
  </div>
</template>
<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { getCaptchaUsingGet, userRegisterUsingPost } from '@/api/userController.ts'
import { message } from 'ant-design-vue'
import router from '@/router' // 用于接受表单输入的值

type UserRegisterFormState = API.UserRegisterRequest & {
  captchaKey?: string
  captchaCode?: string
}

// 用于接受表单输入的值
const formState = reactive<UserRegisterFormState>({
  userAccount: '',
  userPassword: '',
  checkPassword: '',
  captchaKey: '',
  captchaCode: '',
})

const captchaImageUrl = ref('')

const normalizeCaptchaImage = (raw?: string) => {
  if (!raw) {
    return ''
  }
  return raw.startsWith('data:image') ? raw : `data:image/png;base64,${raw}`
}

const fetchCaptcha = async () => {
  try {
    const res = await getCaptchaUsingGet()
    if (res.data.code === 0 && res.data.data) {
      formState.captchaKey = res.data.data.captchaKey || ''
      formState.captchaCode = ''
      const rawCaptchaImage = res.data.data.captchaImg || res.data.data.captchaImage
      captchaImageUrl.value = normalizeCaptchaImage(rawCaptchaImage)
      return
    }
    message.error('获取验证码失败，' + res.data.message)
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response?.status
    if (status === 405) {
      message.error('获取验证码失败：接口请求方法不匹配（405）')
      return
    }
    message.error('获取验证码失败，请稍后重试')
  }
}

onMounted(() => {
  fetchCaptcha()
})

/**
 * 密码验证函数
 */
const validatePassword = async (_rule: unknown, value: string) => {
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

/**
 * 提交表单
 * @param values
 */
const handleSubmit = async (values: UserRegisterFormState) => {
  // 校验两次输入的密码是否一致
  if (values.userPassword !== values.checkPassword) {
    message.error('两次输入的密码不一致')
    return
  }
  const payload: UserRegisterFormState = {
    ...values,
    captchaKey: formState.captchaKey,
    captchaCode: formState.captchaCode,
  }
  try {
    const res = await userRegisterUsingPost(payload)
    // 注册成功，跳转到登录页面
    if (res.data.code === 0 && res.data.data) {
      message.success('注册成功')
      router.push({
        path: '/user/login',
        replace: true,
      })
      return
    }
    message.error('注册失败，' + res.data.message)
    await fetchCaptcha()
  } catch {
    message.error('注册失败，请稍后重试')
    await fetchCaptcha()
  }
}
</script>

<style scoped>
#userRegisterPage {
  max-width: 360px;
  margin: 0 auto;
}

.title {
  text-align: center;
  margin-bottom: 16px;
}

.desc {
  text-align: center;
  color: #bbb;
  margin-bottom: 16px;
}

.captcha-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.captcha-image {
  width: 120px;
  height: 40px;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  cursor: pointer;
  object-fit: cover;
}

.captcha-refresh {
  color: #999;
  text-align: right;
  font-size: 12px;
  margin-bottom: 12px;
  cursor: pointer;
}

.tips {
  color: #bbb;
  text-align: right;
  font-size: 13px;
  margin-bottom: 16px;
}
</style>
