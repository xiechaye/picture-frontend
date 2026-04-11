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

/* 移动端适配 */
@media (max-width: 768px) {
  #userLoginPage {
    max-width: 100%;
    padding: calc(24px + env(safe-area-inset-top, 0px)) 16px calc(32px + env(safe-area-inset-bottom, 0px));
  }

  .title {
    font-size: 20px;
    margin-bottom: 20px;
  }

  /* 确保输入框有足够的触摸目标 */
  :deep(.ant-input),
  :deep(.ant-input-password) {
    height: 44px;
    font-size: 16px;
    border-radius: 12px;
  }

  /* 确保密码输入框容器高度正确 */
  :deep(.ant-input-password) {
    display: flex;
    align-items: center;
  }

  /* 密码输入框内部元素 */
  :deep(.ant-input-password .ant-input) {
    height: 44px;
    font-size: 16px;
    border-radius: 12px;
    background: transparent;
    border: none;
    box-shadow: none;
  }

  /* 密码输入框容器背景 */
  :deep(.ant-input-password) {
    background: #fff;
    border: 1px solid #d9d9d9;
    border-radius: 12px;
    transition: all 0.3s;
  }

  :deep(.ant-input-password:focus),
  :deep(.ant-input-password-focused) {
    border-color: #2E7D32;
    box-shadow: 0 0 0 2px rgba(46, 125, 50, 0.1);
  }

  /* 密码显示/隐藏按钮 */
  :deep(.ant-input-password-icon) {
    color: rgba(0, 0, 0, 0.45);
    transition: color 0.3s;
    background: transparent;
    border: none;
  }

  :deep(.ant-input-password-icon:hover) {
    color: rgba(0, 0, 0, 0.88);
  }

  /* 提交按钮 */
  :deep(.ant-btn-primary) {
    height: 48px;
    font-size: 16px;
    font-weight: 600;
    border-radius: 12px;
  }

  /* 表单项间距 */
  :deep(.ant-form-item) {
    margin-bottom: 16px;
  }

  :deep(.ant-form-item-control-input) {
    min-height: 44px;
  }

  /* 验证码输入框增加上边距 - 第三个表单项 */
  :deep(.ant-form-item:nth-child(3)) {
    margin-top: 24px;
  }
}
</style>
