<template>
  <div class="picture-upload">
    <a-upload
      list-type="picture-card"
      :show-upload-list="false"
      :custom-request="handleUpload"
      :before-upload="beforeUpload"
      :accept="IMAGE_ACCEPT_ATTRIBUTE"
    >
      <img v-if="picture?.url" :src="picture?.url" alt="avatar" />
      <div v-else>
        <loading-outlined v-if="loading"></loading-outlined>
        <plus-outlined v-else></plus-outlined>
        <div class="ant-upload-text">点击或拖拽上传图片</div>
      </div>
    </a-upload>
  </div>
</template>
<script lang="ts" setup>
import { ref } from 'vue'
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons-vue'
import type { UploadProps } from 'ant-design-vue'
import { message } from 'ant-design-vue'
import { uploadPictureUsingPost } from '@/api/pictureController.ts'
import { error } from '@/utils/logger'
import {
  MAX_UPLOAD_SIZE_MB,
  ALLOWED_IMAGE_MIME_TYPES,
  ALLOWED_IMAGE_EXTENSIONS,
  IMAGE_ACCEPT_ATTRIBUTE,
} from '@/constants/upload'

interface Props {
  picture?: API.PictureVO
  spaceId?: number | string
  onSuccess?: (newPicture: API.PictureVO) => void
}

const props = withDefaults(defineProps<Props>(), {
  spaceId: undefined,
})

/**
 * 上传图片
 * @param file
 */
const handleUpload = async ({ file }: { file: File }) => {
  loading.value = true
  try {
    const params: API.PictureUploadRequest = props.picture ? { id: props.picture.id } : {}
    if (props.spaceId !== undefined) {
      params.spaceId = props.spaceId
    }
    const res = await uploadPictureUsingPost(params, {}, file)
    if (res.data.code === 0 && res.data.data) {
      message.success('图片上传成功')
      // 将上传成功的图片信息传递给父组件
      props.onSuccess?.(res.data.data)
    } else {
      message.error('图片上传失败，' + res.data.message)
    }
  } catch (err) {
    error('图片上传失败', err)
    message.error('图片上传失败，' + (err instanceof Error ? err.message : String(err)))
  }
  loading.value = false
}

const loading = ref<boolean>(false)

/**
 * 上传前的校验
 * @param file
 */
const beforeUpload = (
  file: UploadProps['fileList'] extends (infer U)[] | undefined ? U : never,
) => {
  // MIME 类型白名单校验
  const fileType = file.type ?? ''
  const isAllowedMime = ALLOWED_IMAGE_MIME_TYPES.includes(fileType)
  // 文件扩展名校验（防止无扩展名或伪装MIME类型的文件）
  const isAllowedExtension = ALLOWED_IMAGE_EXTENSIONS.some((ext) =>
    file.name.toLowerCase().endsWith(ext),
  )

  if (!isAllowedMime || !isAllowedExtension) {
    message.error('上传失败：仅支持 jpg / png / webp 格式')
    return false
  }

  // 校验图片大小
  const isLtMaxSize = (file.size ?? 0) / 1024 / 1024 <= MAX_UPLOAD_SIZE_MB
  if (!isLtMaxSize) {
    message.error(`上传失败：图片大小不能超过 ${MAX_UPLOAD_SIZE_MB}MB`)
    return false
  }

  return true
}
</script>
<style scoped>
.picture-upload :deep(.ant-upload) {
  width: 100% !important;
  height: 100% !important;
  min-width: 152px;
  min-height: 152px;
}

.picture-upload img {
  max-width: 100%;
  max-height: 480px;
}

.ant-upload-select-picture-card i {
  font-size: 32px;
  color: #999;
}

.ant-upload-select-picture-card .ant-upload-text {
  margin-top: 8px;
  color: #666;
}
</style>
