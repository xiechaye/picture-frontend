<template>
  <div id="userProfileEditPage">
    <a-card title="编辑个人信息" :bordered="false" style="max-width: 800px; margin: 0 auto">
      <a-form
        :model="editUser"
        :label-col="{ span: 4 }"
        :wrapper-col="{ span: 16 }"
        @finish="handleSubmit"
      >
        <a-form-item label="头像">
          <a-upload
            list-type="picture-card"
            :show-upload-list="false"
            :before-upload="beforeUpload"
            :custom-request="handleUpload"
          >
            <img v-if="editUser.userAvatar" :src="editUser.userAvatar" alt="avatar" style="width: 100%" />
            <div v-else>
              <loading-outlined v-if="loading" />
              <plus-outlined v-else />
              <div class="ant-upload-text">上传</div>
            </div>
          </a-upload>
        </a-form-item>
        <a-form-item label="账号">
          <a-input v-model:value="editUser.userAccount" disabled />
        </a-form-item>
        <a-form-item label="用户名" name="userName" :rules="[{ required: true, message: '请输入用户名！' }]">
          <a-input v-model:value="editUser.userName" placeholder="请输入用户名" />
        </a-form-item>
        <a-form-item label="简介">
          <a-textarea v-model:value="editUser.userProfile" placeholder="请输入简介" :rows="4" />
        </a-form-item>
        <a-form-item :wrapper-col="{ offset: 4, span: 16 }">
          <a-button type="primary" html-type="submit" :loading="submitting">提交</a-button>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getLoginUserUsingGet, updateUserUsingPost } from '@/api/userController'
import { uploadAvatarUsingPost } from '@/api/fileController'
import { message } from 'ant-design-vue'
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons-vue'
import type { UploadProps } from 'ant-design-vue'
import { useLoginUserStore } from '@/stores/useLoginUserStore'

const editUser = ref<API.UserUpdateRequest>({})
const loading = ref(false)
const submitting = ref(false)

const loginUserStore = useLoginUserStore()

const loadData = async () => {
  try {
    const res = await getLoginUserUsingGet()
    if (res.data.code === 0 && res.data.data) {
      editUser.value = {
        ...res.data.data,
      }
    } else {
      message.error('加载用户数据失败')
    }
  } catch (e: any) {
    message.error('加载用户数据失败: ' + e.message)
  }
}

onMounted(() => {
  loadData()
})

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

const handleUpload = async ({ file, onSuccess, onError }: any) => {
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
  } catch (e: any) {
    message.error('上传失败: ' + e.message)
    onError(e)
  } finally {
    loading.value = false
  }
}

const handleSubmit = async (values: any) => {
  submitting.value = true
  try {
    const res = await updateUserUsingPost({
      ...editUser.value,
      id: editUser.value.id,
    })
    if (res.data.code === 0) {
      message.success('更新成功')
      // Update Pinia store
      loginUserStore.fetchLoginUser()
    } else {
      message.error('更新失败: ' + res.data.message)
    }
  } catch (e: any) {
    message.error('更新失败: ' + e.message)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
#userProfileEditPage {
  margin-top: 16px;
}
</style>
