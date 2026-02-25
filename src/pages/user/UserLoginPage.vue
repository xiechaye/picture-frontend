<template>
  <div id="userLoginPage">
    <h2 class="title">茶叶云图库 - 用户登录</h2>
    <a-form :model="formState" name="basic" autocomplete="off" @finish="handleSubmit">
      <a-form-item name="userAccount" :rules="[{ required: true, message: '请输入账号' }]">
        <a-input v-model:value="formState.userAccount" placeholder="请输入账号" />
      </a-form-item>
      <a-form-item
        name="userPassword"
        :rules="[
          { required: true, message: '请输入密码' },
          { min: 8, message: '密码长度不能小于 8 位' },
        ]"
      >
        <a-input-password v-model:value="formState.userPassword" placeholder="请输入密码" />
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
        没有账号？
        <RouterLink to="/user/register">去注册</RouterLink>
      </div>
      <a-form-item>
        <a-button type="primary" html-type="submit" style="width: 100%">登录</a-button>
      </a-form-item>
    </a-form>
  </div>
</template>
<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getCaptchaUsingPost, userLoginUsingPost } from '@/api/userController.ts'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'
import { message } from 'ant-design-vue'
import router from '@/router'

const route = useRoute()

const formState = reactive<API.UserLoginRequest>({
  userAccount: '',
  userPassword: '',
  captchaKey: '',
  captchaCode: '',
})

const captchaImageUrl = ref('')
const loginUserStore = useLoginUserStore()

const normalizeCaptchaImage = (raw?: string) => {
  if (!raw) {
    return ''
  }
  return raw.startsWith('data:image') ? raw : `data:image/png;base64,${raw}`
}

const fetchCaptcha = async () => {
  const res = await getCaptchaUsingPost()
  if (res.data.code === 0 && res.data.data) {
    formState.captchaKey = res.data.data.captchaKey || ''
    formState.captchaCode = ''
    captchaImageUrl.value = normalizeCaptchaImage(res.data.data.captchaImage)
  } else {
    message.error('获取验证码失败，' + res.data.message)
  }
}

onMounted(() => {
  fetchCaptcha()
})

const handleSubmit = async (values: API.UserLoginRequest) => {
  const payload: API.UserLoginRequest = {
    ...values,
    captchaKey: formState.captchaKey,
    captchaCode: formState.captchaCode,
  }
  try {
    const res = await userLoginUsingPost(payload)
    if (res.data.code === 0 && res.data.data) {
      await loginUserStore.fetchLoginUser()
      message.success('登录成功')
      const redirect = route.query.redirect as string
      router.push({
        path: redirect || '/',
        replace: true,
      })
      return
    }
    message.error('登录失败，' + res.data.message)
    await fetchCaptcha()
  } catch (e) {
    message.error('登录失败，请稍后重试')
    await fetchCaptcha()
  }
}
</script>

<style scoped>
#userLoginPage {
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
