<template>
  <div id="homePage">
    <!-- 全能搜索栏 -->
    <div class="search-section">
      <OmniSearchBar
        v-model="searchParams.searchText"
        v-model:aiMode="isAiMode"
        v-model:similarity="similarityThreshold"
        :filterCount="activeFilterCount"
        @search="doSearch"
        @openFilter="filterDrawerOpen = true"
      />
    </div>

    <!-- 图片列表 -->
    <PictureList :dataList="dataList" :loading="loading" />

    <!-- 分页 -->
    <a-pagination
      v-if="!isAiMode && !filterValues.picColor"
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
import { computed, onMounted, reactive, ref } from 'vue'
import {
  listPictureTagCategoryUsingGet,
  listPictureVoByPageUsingPost,
  searchPictureBySemantic,
  searchPictureByColorUsingPost,
} from '@/api/pictureController.ts'
import { message } from 'ant-design-vue'
import PictureList from '@/components/PictureList.vue'
import OmniSearchBar from '@/components/OmniSearchBar.vue'
import SearchFilterDrawer, { type FilterValues } from '@/components/SearchFilterDrawer.vue'

// 搜索模式
const isAiMode = ref(false)

// 相似度阈值（仅用于AI语义搜索）
const similarityThreshold = ref<number>(0.5)

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

// 获取数据（普通搜索）
const fetchData = async () => {
  // 取消上一次未完成的请求
  fetchAbortController?.abort()
  fetchAbortController = new AbortController()
  const signal = fetchAbortController.signal

  loading.value = true
  // 转换搜索参数
  const params: API.PictureQueryRequest = {
    ...searchParams,
    tags: filterValues.value.tags || [],
  }

  // 应用筛选条件
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

// 页面加载时获取数据
onMounted(() => {
  fetchData()
  getTagCategoryOptions()
})

// 分页参数
const onPageChange = (page: number, pageSize: number) => {
  searchParams.current = page
  searchParams.pageSize = pageSize
  window.scrollTo({ top: 0, behavior: 'smooth' })
  fetchData()
}

// 搜索
const doSearch = () => {
  searchParams.current = 1
  // 如果有颜色筛选，使用颜色搜索
  if (filterValues.value.picColor) {
    fetchColorData()
  } else if (isAiMode.value) {
    fetchSemanticData()
  } else {
    fetchData()
  }
}

// 按颜色搜索（公共图库不传spaceId）
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

// 获取标签和分类选项
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
</style>
