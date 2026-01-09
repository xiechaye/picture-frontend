<template>
  <div id="homePage">
    <!-- 搜索框 -->
    <div class="search-bar">
      <a-input-group compact size="large">
        <a-select v-model:value="searchMode" style="width: 140px" size="large">
          <a-select-option value="normal">普通搜索</a-select-option>
          <a-select-option value="semantic">AI语义搜索</a-select-option>
        </a-select>
        <a-input-search
          v-model:value="searchParams.searchText"
          :placeholder="searchMode === 'semantic' ? '输入语义描述，如：雪中的宫殿' : '从海量图片中搜索'"
          enter-button="搜索"
          style="width: calc(100% - 140px)"
          @search="doSearch"
        />
      </a-input-group>
      <!-- 相似度阈值滑块（仅在AI语义搜索模式下显示） -->
      <div v-if="searchMode === 'semantic'" class="similarity-slider">
        <span class="slider-label">匹配程度：</span>
        <a-slider
          v-model:value="similarityThreshold"
          :min="0"
          :max="1"
          :step="0.05"
          style="width: 200px; display: inline-block; margin: 0 12px"
        />
        <a-tag :color="similarityTagColor">{{ similarityLabel }}</a-tag>
      </div>
    </div>
    <!-- 分类和标签筛选 -->
    <a-tabs v-model:active-key="selectedCategory" @change="doSearch">
      <a-tab-pane key="all" tab="全部" />
      <a-tab-pane v-for="category in categoryList" :tab="category" :key="category" />
    </a-tabs>
    <div class="tag-bar">
      <span style="margin-right: 8px">标签：</span>
      <a-space :size="[0, 8]" wrap>
        <a-checkable-tag
          v-for="(tag, index) in tagList"
          :key="tag"
          v-model:checked="selectedTagList[index]"
          @change="doSearch"
        >
          {{ tag }}
        </a-checkable-tag>
      </a-space>
    </div>
    <!-- 图片列表 -->
    <PictureList :dataList="dataList" :loading="loading" />
    <!-- 分页 -->
    <a-pagination
      style="text-align: right"
      v-model:current="searchParams.current"
      v-model:pageSize="searchParams.pageSize"
      :total="total"
      @change="onPageChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import {
  listPictureTagCategoryUsingGet,
  listPictureVoByPageUsingPost,
  searchPictureBySemantic,
} from '@/api/pictureController.ts'
import { message } from 'ant-design-vue'
import PictureList from '@/components/PictureList.vue'

// 搜索模式：normal(普通) / semantic(AI语义)
const searchMode = ref<'normal' | 'semantic'>('normal')

// 相似度阈值（仅用于AI语义搜索）
const similarityThreshold = ref<number>(0.5)

// 根据相似度阈值计算动态标签文字
const similarityLabel = computed(() => {
  const value = similarityThreshold.value
  if (value < 0.3) {
    return '宽松 - 匹配更多图片'
  } else if (value < 0.7) {
    return '均衡 - 推荐'
  } else {
    return '严格 - 精确匹配'
  }
})

// 根据相似度阈值计算标签颜色
const similarityTagColor = computed(() => {
  const value = similarityThreshold.value
  if (value < 0.3) {
    return 'green'
  } else if (value < 0.7) {
    return 'blue'
  } else {
    return 'orange'
  }
})

// 定义数据
const dataList = ref<API.PictureVO[]>([])
const total = ref(0)
const loading = ref(true)

// 搜索条件
const searchParams = reactive<API.PictureQueryRequest>({
  current: 1,
  pageSize: 12,
  sortField: 'createTime',
  sortOrder: 'descend',
})

// 获取数据（普通搜索）
const fetchData = async () => {
  loading.value = true
  // 转换搜索参数
  const params = {
    ...searchParams,
    tags: [] as string[],
  }
  if (selectedCategory.value !== 'all') {
    params.category = selectedCategory.value
  }
  // [true, false, false] => ['java']
  selectedTagList.value.forEach((useTag, index) => {
    if (useTag) {
      params.tags.push(tagList.value[index])
    }
  })
  const res = await listPictureVoByPageUsingPost(params)
  if (res.data.code === 0 && res.data.data) {
    dataList.value = res.data.data.records ?? []
    total.value = res.data.data.total ?? 0
  } else {
    message.error('获取数据失败，' + res.data.message)
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
  } catch (e: any) {
    message.error('语义搜索失败：' + e.message)
  }
  loading.value = false
}

// 页面加载时获取数据，请求一次
onMounted(() => {
  fetchData()
})

// 分页参数
const onPageChange = (page: number, pageSize: number) => {
  searchParams.current = page
  searchParams.pageSize = pageSize
  fetchData()
}

// 搜索
const doSearch = () => {
  // 重置搜索条件
  searchParams.current = 1
  if (searchMode.value === 'semantic') {
    fetchSemanticData()
  } else {
    fetchData()
  }
}

// 标签和分类列表
const categoryList = ref<string[]>([])
const selectedCategory = ref<string>('all')
const tagList = ref<string[]>([])
const selectedTagList = ref<boolean[]>([])

/**
 * 获取标签和分类选项
 * @param values
 */
const getTagCategoryOptions = async () => {
  const res = await listPictureTagCategoryUsingGet()
  if (res.data.code === 0 && res.data.data) {
    tagList.value = res.data.data.tagList ?? []
    categoryList.value = res.data.data.categoryList ?? []
  } else {
    message.error('获取标签分类列表失败，' + res.data.message)
  }
}

onMounted(() => {
  getTagCategoryOptions()
})
</script>

<style scoped>
#homePage {
  margin-bottom: 16px;
}

#homePage .search-bar {
  max-width: 480px;
  margin: 0 auto 16px;
}

#homePage .similarity-slider {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

#homePage .slider-label {
  color: #666;
  font-size: 14px;
}

#homePage .tag-bar {
  margin-bottom: 16px;
}
</style>
