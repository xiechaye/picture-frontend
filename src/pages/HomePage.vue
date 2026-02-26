<template>
  <div id="homePage">
    <!-- 全能搜索栏 -->
    <div class="search-section">
      <OmniSearchBar
        v-model="searchParams.searchText"
        v-model:searchMode="searchMode"
        v-model:similarity="similarityThreshold"
        :filterCount="activeFilterCount"
        @search="doSearch"
        @openFilter="filterDrawerOpen = true"
      />
    </div>

    <!-- 以图搜图上传入口（点击上传 + 拖拽上传） -->
    <div v-if="searchMode === 'image'" class="image-search-upload-section">
      <a-upload-dragger
        name="file"
        :show-upload-list="false"
        accept="image/jpeg,image/png,image/webp"
        :before-upload="beforeImageUpload"
        :custom-request="handleImageUpload"
      >
        <p class="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p class="ant-upload-text">点击或拖拽上传参考图</p>
        <p class="ant-upload-hint">支持 jpg / png / webp，大小不超过 20MB。上传后将自动开始以图搜图</p>
      </a-upload-dragger>
    </div>

    <!-- 以图搜图：原图预览 -->
    <div v-if="searchMode === 'image' && sourcePicture" class="source-picture-section">
      <h3 style="margin-bottom: 8px">参考图</h3>
      <a-card hoverable style="width: 200px; display: inline-block; margin-bottom: 16px">
        <template #cover>
          <img
            :alt="sourcePicture.name"
            :src="sourcePicture.thumbnailUrl ?? sourcePicture.url"
            style="height: 150px; object-fit: cover"
          />
        </template>
      </a-card>
    </div>

    <!-- 以图搜图结果 -->
    <template v-if="searchMode === 'image'">
      <a-alert
        v-if="imageSearchError"
        style="margin-bottom: 16px"
        type="error"
        show-icon
        :message="imageSearchError"
      />

      <a-empty
        v-if="!loading && !sourcePictureId"
        description="请先上传参考图开始搜索"
      />

      <a-list
        v-else-if="imageSearchResults.length > 0"
        :grid="{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4, xl: 5, xxl: 6 }"
        :data-source="imageSearchResults"
        :loading="loading"
      >
        <template #renderItem="{ item: pic }">
          <a-list-item style="padding: 0">
            <a :href="pic.fromUrl" target="_blank">
              <a-card hoverable>
                <template #cover>
                  <img
                    :alt="pic.name"
                    :src="pic.thumbUrl"
                    style="height: 180px; object-fit: cover"
                  />
                </template>
              </a-card>
            </a>
          </a-list-item>
        </template>
      </a-list>

      <a-empty
        v-else-if="!loading"
        description="未找到相似图片，换一张参考图试试"
      />
    </template>

    <!-- 普通/语义搜索图片列表 -->
    <PictureList v-else :dataList="dataList" :loading="loading" />

    <!-- 分页（普通搜索模式） -->
    <a-pagination
      v-if="searchMode === 'normal' && !filterValues.picColor"
      style="text-align: right; margin-top: 16px"
      v-model:current="searchParams.current"
      v-model:pageSize="searchParams.pageSize"
      :total="total"
      @change="onPageChange"
    />

    <!-- 高级筛选抽屉 -->
    <SearchFilterDrawer
      v-model:open="filterDrawerOpen"
      v-model:filters="filterValues"
      :categoryList="categoryList"
      :tagList="tagList"
      :showColorPicker="true"
      @apply="handleFilterApply"
      @reset="handleFilterReset"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  listPictureTagCategoryUsingGet,
  listPictureVoByPageUsingPost,
  searchPictureBySemantic,
  searchPictureByColorUsingPost,
  searchPictureByPictureUsingPost,
  getPictureVoByIdUsingGet,
  uploadPictureUsingPost,
} from '@/api/pictureController.ts'
import { InboxOutlined } from '@ant-design/icons-vue'
import { message, type UploadProps } from 'ant-design-vue'
import PictureList from '@/components/PictureList.vue'
import OmniSearchBar from '@/components/OmniSearchBar.vue'
import SearchFilterDrawer, { type FilterValues } from '@/components/SearchFilterDrawer.vue'
import type { SearchMode } from '@/constants/search'
import { SEARCH_URL_PARAMS } from '@/constants/search'

const route = useRoute()
const router = useRouter()

// 搜索模式
const searchMode = ref<SearchMode>('normal')

// 相似度阈值（仅用于AI语义搜索）
const similarityThreshold = ref<number>(0.5)

// 以图搜图：源图片
const sourcePictureId = ref<string | undefined>(undefined)
const sourcePicture = ref<API.PictureVO | undefined>(undefined)
const imageSearchResults = ref<API.ImageSearchResult[]>([])
const imageSearchError = ref<string>('')

// 筛选抽屉状态
const filterDrawerOpen = ref(false)
const filterValues = ref<FilterValues>({
  category: undefined,
  tags: [],
  dateRange: null,
  picWidth: undefined,
  picHeight: undefined,
  picFormat: undefined,
  picColor: undefined,
})

// 计算活跃筛选数量
const activeFilterCount = computed(() => {
  let count = 0
  if (filterValues.value.category) count++
  if (filterValues.value.tags?.length) count++
  if (filterValues.value.dateRange) count++
  if (filterValues.value.picWidth) count++
  if (filterValues.value.picHeight) count++
  if (filterValues.value.picFormat) count++
  if (filterValues.value.picColor) count++
  return count
})

// 定义数据
const dataList = ref<API.PictureVO[]>([])
const total = ref(0)
const loading = ref(true)

// 用于取消进行中的请求
let fetchAbortController: AbortController | null = null

// 搜索条件
const searchParams = reactive<API.PictureQueryRequest>({
  current: 1,
  pageSize: 12,
  sortField: 'createTime',
  sortOrder: 'descend',
})

// ---------- URL 状态同步 ----------

/** 从 URL query 初始化搜索状态 */
const initFromUrl = () => {
  const mode = route.query[SEARCH_URL_PARAMS.MODE] as SearchMode | undefined
  const q = route.query[SEARCH_URL_PARAMS.QUERY] as string | undefined
  const similarity = route.query[SEARCH_URL_PARAMS.SIMILARITY]
  const pictureId = route.query[SEARCH_URL_PARAMS.PICTURE_ID] as string | undefined

  if (mode && (['normal', 'semantic', 'image'] as SearchMode[]).includes(mode)) {
    searchMode.value = mode
  }
  if (q) {
    searchParams.searchText = q
  }
  if (similarity) {
    const val = parseFloat(similarity as string)
    if (!isNaN(val) && val >= 0 && val <= 1) {
      similarityThreshold.value = val
    }
  }
  if (pictureId) {
    sourcePictureId.value = pictureId
  }
}

/** 将当前搜索状态同步到 URL（replace，不产生历史记录） */
const syncToUrl = () => {
  const query: Record<string, string> = {}
  if (searchMode.value !== 'normal') {
    query[SEARCH_URL_PARAMS.MODE] = searchMode.value
  }
  if (searchParams.searchText) {
    query[SEARCH_URL_PARAMS.QUERY] = searchParams.searchText
  }
  if (searchMode.value === 'semantic') {
    query[SEARCH_URL_PARAMS.SIMILARITY] = String(similarityThreshold.value)
  }
  if (searchMode.value === 'image' && sourcePictureId.value) {
    query[SEARCH_URL_PARAMS.PICTURE_ID] = sourcePictureId.value
  }
  router.replace({ query })
}

// 切换模式时同步 URL，离开图片搜索模式时清空图片搜索状态
watch(searchMode, (newMode) => {
  imageSearchError.value = ''
  if (newMode !== 'image') {
    sourcePictureId.value = undefined
    sourcePicture.value = undefined
    imageSearchResults.value = []
  }
  syncToUrl()
})

// ---------- 数据获取 ----------

// 获取数据（普通搜索）
const fetchData = async () => {
  fetchAbortController?.abort()
  fetchAbortController = new AbortController()
  const signal = fetchAbortController.signal

  loading.value = true
  const params: API.PictureQueryRequest = {
    ...searchParams,
    tags: filterValues.value.tags || [],
  }

  if (filterValues.value.category) {
    params.category = filterValues.value.category
  }
  if (filterValues.value.picWidth) {
    params.picWidth = filterValues.value.picWidth
  }
  if (filterValues.value.picHeight) {
    params.picHeight = filterValues.value.picHeight
  }
  if (filterValues.value.picFormat) {
    params.picFormat = filterValues.value.picFormat
  }
  const dateRange = filterValues.value.dateRange
  if (dateRange?.length === 2) {
    params.startEditTime = dateRange[0].format('YYYY-MM-DD HH:mm:ss')
    params.endEditTime = dateRange[1].format('YYYY-MM-DD HH:mm:ss')
  }

  try {
    const res = await listPictureVoByPageUsingPost(params, { signal })
    if (signal.aborted) return
    if (res.data.code === 0 && res.data.data) {
      dataList.value = res.data.data.records ?? []
      total.value = res.data.data.total ?? 0
    } else {
      message.error('获取数据失败，' + res.data.message)
    }
  } catch (e: unknown) {
    if ((e as { name?: string })?.name === 'CanceledError') return
    message.error('获取数据失败')
  }
  loading.value = false
}

// 获取数据（AI语义搜索）
const fetchSemanticData = async () => {
  if (!searchParams.searchText?.trim()) {
    message.warning('请输入语义搜索内容')
    return
  }
  loading.value = true
  try {
    const res = await searchPictureBySemantic({
      searchText: searchParams.searchText,
      topK: searchParams.pageSize,
      similarityThreshold: similarityThreshold.value,
    })
    if (res.data.code === 0 && res.data.data) {
      dataList.value = res.data.data ?? []
      total.value = res.data.data.length ?? 0
    } else {
      message.error('语义搜索失败，' + res.data.message)
    }
  } catch (e: unknown) {
    message.error('语义搜索失败：' + (e instanceof Error ? e.message : String(e)))
  }
  loading.value = false
}

// 按颜色搜索
const fetchColorData = async () => {
  loading.value = true
  const res = await searchPictureByColorUsingPost({
    picColor: filterValues.value.picColor,
  })
  if (res.data.code === 0 && res.data.data) {
    dataList.value = res.data.data ?? []
    total.value = res.data.data.length ?? 0
  } else {
    message.error('按颜色搜索失败，' + res.data.message)
  }
  loading.value = false
}

// 以图搜图
const fetchImageData = async () => {
  imageSearchError.value = ''
  if (!sourcePictureId.value) {
    message.warning('请先上传参考图，再进行以图搜图')
    return
  }
  loading.value = true
  try {
    const res = await searchPictureByPictureUsingPost({ pictureId: sourcePictureId.value })
    if (res.data.code === 0 && res.data.data) {
      imageSearchResults.value = res.data.data ?? []
    } else {
      imageSearchResults.value = []
      imageSearchError.value = '以图搜图失败，' + res.data.message
      message.error(imageSearchError.value)
    }
  } catch (e: unknown) {
    imageSearchResults.value = []
    imageSearchError.value = '以图搜图失败：' + (e instanceof Error ? e.message : String(e))
    message.error(imageSearchError.value)
  }
  loading.value = false
}

// 获取源图片详情（以图搜图模式下展示原图）
const fetchSourcePicture = async () => {
  if (!sourcePictureId.value) return
  try {
    const res = await getPictureVoByIdUsingGet({ id: sourcePictureId.value })
    if (res.data.code === 0 && res.data.data) {
      sourcePicture.value = res.data.data
    }
  } catch {
    // 预览失败不影响搜索结果，静默处理
  }
}

const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGE_SIZE_MB = 20

const beforeImageUpload: UploadProps['beforeUpload'] = (file) => {
  const isAllowedType =
    ALLOWED_IMAGE_MIME_TYPES.includes(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name)
  if (!isAllowedType) {
    message.error('上传失败：仅支持 jpg / png / webp 格式')
    return false
  }

  const isLtMaxSize = (file.size ?? 0) / 1024 / 1024 <= MAX_IMAGE_SIZE_MB
  if (!isLtMaxSize) {
    message.error(`上传失败：图片大小不能超过 ${MAX_IMAGE_SIZE_MB}MB`)
    return false
  }

  imageSearchError.value = ''
  return true
}

const handleImageUpload: UploadProps['customRequest'] = async (options) => {
  const rawFile = options.file as File
  loading.value = true
  imageSearchError.value = ''
  try {
    const uploadRes = await uploadPictureUsingPost({}, {}, rawFile)
    if (uploadRes.data.code !== 0 || !uploadRes.data.data?.id) {
      const errMsg = '上传失败，' + (uploadRes.data.message || '请稍后重试')
      imageSearchError.value = errMsg
      message.error(errMsg)
      options.onError?.(new Error(errMsg))
      return
    }

    const uploadedPicture = uploadRes.data.data
    sourcePictureId.value = String(uploadedPicture.id)
    sourcePicture.value = uploadedPicture
    imageSearchResults.value = []
    syncToUrl()
    await fetchImageData()
    if (!imageSearchError.value) {
      message.success('上传成功，已完成以图搜图')
    }
    options.onSuccess?.(uploadedPicture)
  } catch (e) {
    const errMsg = '上传失败：' + (e instanceof Error ? e.message : String(e))
    imageSearchError.value = errMsg
    message.error(errMsg)
    options.onError?.(e as Error)
  } finally {
    loading.value = false
  }
}

// 页面加载时获取数据
onMounted(() => {
  initFromUrl()
  getTagCategoryOptions()
  if (searchMode.value === 'image' && sourcePictureId.value) {
    fetchSourcePicture()
    fetchImageData()
  } else {
    fetchData()
  }
})

// 分页参数
const onPageChange = (page: number, pageSize: number) => {
  searchParams.current = page
  searchParams.pageSize = pageSize
  window.scrollTo({ top: 0, behavior: 'smooth' })
  fetchData()
}

// 搜索（统一入口）
const doSearch = () => {
  searchParams.current = 1
  syncToUrl()
  if (filterValues.value.picColor) {
    fetchColorData()
  } else if (searchMode.value === 'semantic') {
    fetchSemanticData()
  } else if (searchMode.value === 'image') {
    fetchImageData()
  } else {
    fetchData()
  }
}

// 筛选应用
const handleFilterApply = () => {
  doSearch()
}

// 筛选重置
const handleFilterReset = () => {
  filterValues.value = {
    category: undefined,
    tags: [],
    dateRange: null,
    picWidth: undefined,
    picHeight: undefined,
    picFormat: undefined,
    picColor: undefined,
  }
  doSearch()
}

// 标签和分类列表
const categoryList = ref<string[]>([])
const tagList = ref<string[]>([])

const getTagCategoryOptions = async () => {
  const res = await listPictureTagCategoryUsingGet()
  if (res.data.code === 0 && res.data.data) {
    tagList.value = res.data.data.tagList ?? []
    categoryList.value = res.data.data.categoryList ?? []
  } else {
    message.error('获取标签分类列表失败，' + res.data.message)
  }
}
</script>

<style scoped>
#homePage {
  margin-bottom: 16px;
}

.search-section {
  margin-bottom: 24px;
  padding: 16px 0;
}

.image-search-upload-section {
  margin-bottom: 16px;
}

.source-picture-section {
  margin-bottom: 16px;
}
</style>
