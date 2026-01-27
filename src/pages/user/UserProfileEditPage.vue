<template>
  <CenterContainer max-width="600px">
    <!-- 头像上传区域 -->
    <div class="avatar-section">
      <a-upload
        class="avatar-uploader"
        :show-upload-list="false"
        :before-upload="beforeUpload"
        :custom-request="handleUpload"
      >
        <div class="avatar-wrapper">
          <a-avatar
            v-if="editUser.userAvatar"
            :src="editUser.userAvatar"
            :size="100"
          />
          <div v-else class="avatar-placeholder">
            <loading-outlined v-if="loading" />
            <UserOutlined v-else />
          </div>
          <div class="avatar-overlay">
            <CameraOutlined />
          </div>
        </div>
      </a-upload>
      <div class="avatar-hint">点击更换头像</div>
    </div>

    <!-- 表单区域 -->
    <a-form
      :model="editUser"
      layout="vertical"
      @finish="handleSubmit"
      class="profile-form"
    >
      <a-form-item label="用户ID">
        <a-input
          v-model:value="editUser.id"
          disabled
          size="large"
          class="form-input"
        >
          <template #addonAfter>
            <a-button type="text" size="small" @click="copyUserId">
              <CopyOutlined />
            </a-button>
          </template>
        </a-input>
      </a-form-item>

      <a-form-item label="账号">
        <a-input
          v-model:value="userAccount"
          disabled
          size="large"
          class="form-input"
        />
      </a-form-item>

      <a-form-item
        label="用户名"
        name="userName"
        :rules="[{ required: true, message: '请输入用户名！' }]"
      >
        <a-input
          v-model:value="editUser.userName"
          placeholder="请输入用户名"
          size="large"
          class="form-input"
        />
      </a-form-item>

      <a-form-item label="个人简介">
        <a-textarea
          v-model:value="editUser.userProfile"
          placeholder="介绍一下自己吧..."
          :rows="4"
          class="form-input"
        />
      </a-form-item>

      <a-form-item style="margin-bottom: 0; margin-top: 8px">
        <a-button
          type="primary"
          html-type="submit"
          :loading="submitting"
          block
          size="large"
          class="submit-btn"
        >
          保存修改
        </a-button>
      </a-form-item>
    </a-form>
  </CenterContainer>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getLoginUserUsingGet, updateUserUsingPost } from '@/api/userController'
import { uploadAvatarUsingPost } from '@/api/fileController'
import { message } from 'ant-design-vue'
import { LoadingOutlined, UserOutlined, CameraOutlined, CopyOutlined } from '@ant-design/icons-vue'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import CenterContainer from '@/components/CenterContainer.vue'

const editUser = ref<API.UserUpdateRequest>({})
const userAccount = ref<string>('')
const loading = ref(false)
const submitting = ref(false)

const loginUserStore = useLoginUserStore()

const loadData = async () => {
  try {
    const res = await getLoginUserUsingGet()
    if (res.data.code === 0 && res.data.data) {
      const userData = res.data.data
      userAccount.value = userData.userAccount || ''
      editUser.value = {
        id: userData.id,
        userName: userData.userName,
        userAvatar: userData.userAvatar,
        userProfile: userData.userProfile,
      }
    } else {
      message.error('加载用户数据失败')
    }
  } catch (e: unknown) {
    message.error('加载用户数据失败: ' + (e instanceof Error ? e.message : String(e)))
  }
}

onMounted(() => {
  loadData()
})

const copyUserId = async () => {
  if (editUser.value.id) {
    await navigator.clipboard.writeText(String(editUser.value.id))
    message.success('用户ID已复制')
  }
}

const beforeUpload = (file: File) => {
  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png'
  if (!isJpgOrPng) {
    message.error('只能上传 JPG/PNG 文件！')
  }
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) {
    message.error('图片大小不能超过 2MB！')
  }
  return isJpgOrPng && isLt2M
}

const handleUpload = async ({ file, onSuccess, onError }: {
  file: File;
  onSuccess: (response: unknown) => void;
  onError: (error: Error) => void
}) => {
  loading.value = true
  try {
    const res = await uploadAvatarUsingPost(file)
    if (res.data.code === 0) {
      editUser.value.userAvatar = res.data.data
      message.success('上传成功')
      onSuccess(res.data)
    } else {
      message.error('上传失败: ' + res.data.message)
      onError(new Error(res.data.message))
    }
  } catch (e: unknown) {
    message.error('上传失败: ' + (e instanceof Error ? e.message : String(e)))
    onError(e instanceof Error ? e : new Error(String(e)))
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    const res = await updateUserUsingPost({
      ...editUser.value,
      id: editUser.value.id,
    })
    if (res.data.code === 0) {
      message.success('更新成功')
      loginUserStore.fetchLoginUser()
    } else {
      message.error('更新失败: ' + res.data.message)
    }
  } catch (e: unknown) {
    message.error('更新失败: ' + (e instanceof Error ? e.message : String(e)))
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 32px;
}

.avatar-uploader {
  cursor: pointer;
}

.avatar-wrapper {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  color: #9ca3af;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 200ms ease;
  color: white;
  font-size: 24px;
}

.avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}

.avatar-hint {
  margin-top: 8px;
  font-size: 12px;
  color: #9ca3af;
}

.profile-form {
  width: 100%;
}

.form-input {
  border-radius: 12px;
}

.form-input :deep(input),
.form-input :deep(textarea) {
  border-radius: 12px;
}

.submit-btn {
  background: linear-gradient(135deg, #2E7D32 0%, #43A047 100%);
  border: none;
  border-radius: 12px;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
}

.submit-btn:hover {
  background: linear-gradient(135deg, #388E3C 0%, #2E7D32 100%);
}
</style>
