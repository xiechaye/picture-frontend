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
      <a-form-item name="captchaCode" :rules="captchaRules">
        <CaptchaInput v-model:captchaCode="formState.captchaCode" v-model:captchaId="formState.captchaId" ref="captchaRef" />
      </a-form-item>
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
import { reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { userLoginUsingPost } from '@/api/userController.ts'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'
import { message } from 'ant-design-vue'
import router from '@/router'
import CaptchaInput from '@/components/CaptchaInput.vue'

const route = useRoute()

// 用于接受表单输入的值
const formState = reactive<API.UserLoginRequest>({
  userAccount: '',
  userPassword: '',
  captchaCode: '',
  captchaId: '',
})

const loginUserStore = useLoginUserStore()
const captchaRef = ref<InstanceType<typeof CaptchaInput>>()

// 验证码验证规则
const captchaRules = [
  { required: true, message: '请输入验证码' },
  { type: 'string', min: 4, max: 4, message: '请输入 4 位验证码' },
]

/**
 * 提交表单
 * @param values
 */
const handleSubmit = async (values: API.UserLoginRequest) => {
  // 确保包含 captchaId（表单验证不会自动包含它）
  const submitData: API.UserLoginRequest = {
    ...values,
    captchaId: formState.captchaId,
  }

  const res = await userLoginUsingPost(submitData)
  // 登录成功，把登录态保存到全局状态中
  if (res.data.code === 0 && res.data.data) {
    await loginUserStore.fetchLoginUser()
    message.success('登录成功')
    // 获取 redirect 参数，登录成功后跳转回原页面
    const redirect = route.query.redirect as string
    router.push({
      path: redirect || '/',
      replace: true,
    })
  } else {
    message.error('登录失败，' + res.data.message)
    // 登录失败后刷新验证码
    captchaRef.value?.refresh()
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

.tips {
  color: #bbb;
  text-align: right;
  font-size: 13px;
  margin-bottom: 16px;
}
</style>
