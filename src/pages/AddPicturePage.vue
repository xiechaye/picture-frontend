<template>
  <div id="addPicturePage">
    <h2 style="margin-bottom: 16px">
      {{ route.query?.id ? '修改图片' : '上传图片' }}
    </h2>

    <!-- 空间选择器 -->
    <a-form-item label="保存至空间" style="margin-bottom: 16px">
      <a-select
        v-model:value="selectedSpaceId"
        placeholder="请选择空间"
        :loading="spacesLoading"
        show-search
        :filter-option="filterSpaceOption"
      >
        <!-- 公共图库选项 -->
        <a-select-option :value="null">公共图库</a-select-option>
        <!-- 用户空间列表 -->
        <a-select-option
          v-for="space in spaceList"
          :key="space.id"
          :value="space.id"
        >
          {{ space.spaceName }}（{{ SPACE_TYPE_MAP[space.spaceType ?? 0] }}）
        </a-select-option>
      </a-select>
    </a-form-item>

    <!-- 选择上传方式 -->
    <a-tabs v-model:activeKey="uploadType">
      <a-tab-pane key="file" tab="文件上传">
        <!-- 图片上传组件 -->
        <PictureUpload :picture="picture" :spaceId="spaceId" :onSuccess="onSuccess" />
      </a-tab-pane>
      <a-tab-pane key="url" tab="URL 上传" force-render>
        <!-- URL 图片上传组件 -->
        <UrlPictureUpload :picture="picture" :spaceId="spaceId" :onSuccess="onSuccess" />
      </a-tab-pane>
    </a-tabs>
    <!-- 图片编辑 -->
    <div v-if="picture" class="edit-bar">
      <a-space size="middle">
        <a-button :icon="h(EditOutlined)" @click="doEditPicture">编辑图片</a-button>
        <a-button type="primary" :icon="h(FullscreenOutlined)" @click="doImagePainting">
          AI 扩图
        </a-button>
      </a-space>
      <ImageCropper
        ref="imageCropperRef"
        :imageUrl="picture?.url"
        :picture="picture"
        :spaceId="spaceId"
        :space="space"
        :onSuccess="onCropSuccess"
      />
      <ImageOutPainting
        ref="imageOutPaintingRef"
        :picture="picture"
        :spaceId="spaceId"
        :onSuccess="onImageOutPaintingSuccess"
      />
    </div>
    <!-- 图片信息表单 -->
    <a-form
      v-if="picture"
      name="pictureForm"
      layout="vertical"
      :model="pictureForm"
      @finish="handleSubmit"
    >
      <a-form-item name="name" label="名称">
        <a-input v-model:value="pictureForm.name" placeholder="请输入名称" allow-clear />
      </a-form-item>
      <a-form-item name="introduction" label="简介">
        <a-textarea
          v-model:value="pictureForm.introduction"
          placeholder="请输入简介"
          :auto-size="{ minRows: 2, maxRows: 5 }"
          allow-clear
        />
      </a-form-item>
      <a-form-item name="category" label="分类">
        <a-auto-complete
          v-model:value="pictureForm.category"
          placeholder="请输入分类"
          :options="categoryOptions"
          allow-clear
        />
      </a-form-item>
      <a-form-item name="tags" label="标签">
        <a-select
          v-model:value="pictureForm.tags"
          mode="tags"
          placeholder="请输入标签"
          :options="tagOptions"
          allow-clear
        />
      </a-form-item>
      <a-form-item>
        <a-button type="primary" html-type="submit" style="width: 100%">创建</a-button>
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import PictureUpload from '@/components/PictureUpload.vue'
import { computed, h, onMounted, reactive, ref, watchEffect, nextTick } from 'vue'
import { message } from 'ant-design-vue'
import {
  editPictureUsingPost,
  getPictureVoByIdUsingGet,
  listPictureTagCategoryUsingGet,
} from '@/api/pictureController.ts'
import { useRoute, useRouter } from 'vue-router'
import UrlPictureUpload from '@/components/UrlPictureUpload.vue'
import ImageCropper from '@/components/ImageCropper.vue'
import { EditOutlined, FullscreenOutlined } from '@ant-design/icons-vue'
import ImageOutPainting from '@/components/ImageOutPainting.vue'
import { debug } from '@/utils/logger'
import { getSpaceVoByIdUsingGet } from '@/api/spaceController.ts'
import { SPACE_TYPE_MAP } from '@/constants/space'
import { useSpaceStore } from '@/stores/useSpaceStore'

const router = useRouter()
const route = useRoute()

// 使用空间 Store
const spaceStore = useSpaceStore()

const picture = ref<API.PictureVO>()
const pictureForm = reactive<API.PictureEditRequest>({})
const uploadType = ref<'file' | 'url'>('file')

// 空间相关状态
const spaceList = ref<API.SpaceVO[]>([])
const spacesLoading = ref(false)
const selectedSpaceId = ref<number | null>(null)

// 空间 id（从 selectedSpaceId 获取）
const spaceId = computed(() => selectedSpaceId.value)

/**
 * 图片上传成功
 * @param newPicture
 */
const onSuccess = (newPicture: API.PictureVO) => {
  picture.value = newPicture
  pictureForm.name = newPicture.name
}

/**
 * 提交表单
 * @param values
 */
const handleSubmit = async (values: any) => {
  debug('提交图片表单', values)
  const pictureId = picture.value.id
  if (!pictureId) {
    return
  }
  const res = await editPictureUsingPost({
    id: pictureId,
    spaceId: spaceId.value,
    ...values,
  })
  // 操作成功
  if (res.data.code === 0 && res.data.data) {
    message.success('创建成功')
    // 跳转到图片详情页
    router.push({
      path: `/picture/${pictureId}`,
    })
  } else {
    message.error('创建失败，' + res.data.message)
  }
}

const categoryOptions = ref<string[]>([])
const tagOptions = ref<string[]>([])

/**
 * 获取标签和分类选项
 * @param values
 */
const getTagCategoryOptions = async () => {
  const res = await listPictureTagCategoryUsingGet()
  if (res.data.code === 0 && res.data.data) {
    tagOptions.value = (res.data.data.tagList ?? []).map((data: string) => {
      return {
        value: data,
        label: data,
      }
    })
    categoryOptions.value = (res.data.data.categoryList ?? []).map((data: string) => {
      return {
        value: data,
        label: data,
      }
    })
  } else {
    message.error('获取标签分类列表失败，' + res.data.message)
  }
}

/**
 * 前往创建空间页面
 */
const goToCreateSpace = () => {
  router.push('/add_space')
}

/**
 * 加载空间列表
 */
const loadSpaces = async () => {
  spacesLoading.value = true
  try {
    // 使用 store 获取空间列表
    await spaceStore.fetchSpaceList()
    spaceList.value = spaceStore.spaceList
  } catch (err) {
    message.error('加载空间列表失败')
  } finally {
    spacesLoading.value = false
  }

  // 等待 loading 状态结束和选项渲染完成后再设置选中值
  await nextTick()
  await nextTick()

  // 如果 URL 有 spaceId 参数，使用该参数
  const querySpaceId = route.query?.spaceId
  if (querySpaceId) {
    const spaceIdNum = Number(querySpaceId)
    // 先在 store 中查找
    let space = spaceStore.findSpaceById(spaceIdNum)

    if (space) {
      selectedSpaceId.value = spaceIdNum
    } else {
      // 如果空间不在列表中，尝试通过 API 获取该空间信息
      // 这可能是用户加入的团队空间
      try {
        const spaceRes = await getSpaceVoByIdUsingGet({ id: spaceIdNum })
        if (spaceRes.data.code === 0 && spaceRes.data.data) {
          // 成功获取空间信息，说明用户有权限访问
          // 将该空间添加到 store 中
          spaceStore.addSpace(spaceRes.data.data)
          spaceList.value = spaceStore.spaceList

          // 等待 Vue 重新渲染选项列表
          await nextTick()
          await nextTick()

          selectedSpaceId.value = spaceIdNum
        } else {
          // 无法获取空间信息，可能是权限不足或空间不存在
          selectedSpaceId.value = null
          message.warning('无法访问指定的空间，已切换到公共图库')
        }
      } catch (err) {
        // API 调用失败
        selectedSpaceId.value = null
        message.warning('无法访问指定的空间，已切换到公共图库')
      }
    }
  } else {
    // 否则默认选择公共图库（null）
    selectedSpaceId.value = null
  }
}

/**
 * 空间搜索过滤
 */
const filterSpaceOption = (input: string, option: any) => {
  const children = option.children
  if (!children || !children[0]) return false
  return children[0].children.toLowerCase().includes(input.toLowerCase())
}

/**
 * 获取老数据
 */
const getOldPicture = async () => {
  // 获取到 id
  const id = route.query?.id
  if (id) {
    const res = await getPictureVoByIdUsingGet({
      id,
    })
    if (res.data.code === 0 && res.data.data) {
      const data = res.data.data
      picture.value = data
      pictureForm.name = data.name
      pictureForm.introduction = data.introduction
      pictureForm.category = data.category
      pictureForm.tags = data.tags
    }
  }
}

onMounted(() => {
  getTagCategoryOptions()
  getOldPicture()
  loadSpaces()
})

// ----- 图片编辑器引用 ------
const imageCropperRef = ref()

// 编辑图片
const doEditPicture = async () => {
  imageCropperRef.value?.openModal()
}

// 编辑成功事件
const onCropSuccess = (newPicture: API.PictureVO) => {
  picture.value = newPicture
}

// ----- AI 扩图引用 -----
const imageOutPaintingRef = ref()

// 打开 AI 扩图弹窗
const doImagePainting = async () => {
  imageOutPaintingRef.value?.openModal()
}

// AI 扩图保存事件
const onImageOutPaintingSuccess = (newPicture: API.PictureVO) => {
  picture.value = newPicture
}

// 获取空间信息
const space = ref<API.SpaceVO>()

// 获取空间信息
const fetchSpace = async () => {
  // 获取数据
  if (spaceId.value) {
    const res = await getSpaceVoByIdUsingGet({
      id: spaceId.value,
    })
    if (res.data.code === 0 && res.data.data) {
      space.value = res.data.data
    }
  }
}

watchEffect(() => {
  fetchSpace()
})
</script>

<style scoped>
#addPicturePage {
  max-width: 720px;
  margin: 0 auto;
}

#addPicturePage .edit-bar {
  text-align: center;
  margin: 16px 0;
}
</style>
