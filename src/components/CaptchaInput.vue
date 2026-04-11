<template>
  <!-- 移动端使用纵向布局 -->
  <div v-if="isMobile" class="captcha-mobile">
    <a-input
      v-model:value="innerCode"
      placeholder="请输入验证码"
      @pressEnter="handlePressEnter"
    />
    <div class="captcha-image-container" @click="refresh" title="点击刷新验证码">
      <div v-if="loading" class="captcha-loading">
        <a-spin />
      </div>
      <img v-if="imageData && !loading" :src="imageData" class="captcha-image" alt="验证码" />
      <div v-if="!imageData && !loading" class="captcha-placeholder">点击获取</div>
    </div>
  </div>

  <!-- 桌面端使用横向紧凑布局 -->
  <a-input-group v-else compact>
    <a-input
      v-model:value="innerCode"
      placeholder="请输入验证码"
      style="width: calc(100% - 110px)"
      @pressEnter="handlePressEnter"
    />
    <div class="captcha-image-container" @click="refresh" title="点击刷新验证码">
      <div v-if="loading" class="captcha-loading">
        <a-spin />
      </div>
      <img v-if="imageData && !loading" :src="imageData" class="captcha-image" alt="验证码" />
      <div v-if="!imageData && !loading" class="captcha-placeholder">点击获取</div>
    </div>
  </a-input-group>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getCaptchaUsingGet } from '@/api/userController.ts'
import { useBreakpoint } from '@/composables/useBreakpoint.ts'

// 移动端检测
const { isMobile } = useBreakpoint(768)

interface Props {
  captchaCode?: string
  captchaId?: string
}

interface Emits {
  (e: 'update:captchaCode', value: string): void
  (e: 'update:captchaId', value: string): void
  (e: 'pressEnter'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 使用 computed 实现双向绑定
const innerCode = computed<string>({
  get: () => props.captchaCode || '',
  set: (value: string) => emit('update:captchaCode', value),
})

const innerId = ref('')
const imageData = ref('')
const loading = ref(false)

/**
 * 获取验证码
 */
const fetchCaptcha = async () => {
  loading.value = true
  try {
    const res = await getCaptchaUsingGet()
    if (res.data.code === 0 && res.data.data) {
      const base64Data = res.data.data.captchaImage || ''
      // 添加 Data URL 前缀（如果后端没有返回）
      if (base64Data && !base64Data.startsWith('data:')) {
        imageData.value = `data:image/png;base64,${base64Data}`
      } else {
        imageData.value = base64Data
      }
      const newCaptchaId = res.data.data.captchaId || ''
      innerId.value = newCaptchaId
      emit('update:captchaId', newCaptchaId)
    }
  } catch (error) {
    // 获取验证码失败，保持静默
  } finally {
    loading.value = false
  }
}

/**
 * 刷新验证码
 */
const refresh = () => {
  // 清空输入框
  emit('update:captchaCode', '')
  fetchCaptcha()
}

/**
 * 处理回车事件
 */
const handlePressEnter = () => {
  emit('pressEnter')
}

onMounted(() => {
  fetchCaptcha()
})

defineExpose({
  refresh,
  getCaptchaId: () => innerId.value,
})
</script>

<style scoped>
/* 移动端纵向布局 */
.captcha-mobile {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.captcha-mobile :deep(.ant-input) {
  height: 44px;
  font-size: 16px;
}

.captcha-mobile .captcha-image-container {
  width: 110px;
  height: 44px;
  align-self: flex-start;
}

/* 桌面端横向布局 */
.captcha-image-container {
  display: inline-block;
  width: 110px;
  height: 32px;
  cursor: pointer;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  overflow: hidden;
  background: #f5f5f5;
  vertical-align: top;
  transition: border-color 0.3s;
  position: relative;
}

.captcha-image-container:hover {
  border-color: #4096ff;
}

.captcha-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.captcha-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #999;
}

.captcha-loading {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
