<template>
  <div id="spaceDetailPage">
    <!-- 加载状态 -->
    <div v-if="!space.id" style="text-align: center; padding: 100px 0">
      <a-spin size="large" tip="加载空间信息中..." />
    </div>

    <!-- 空间内容 - 只在数据加载完成后显示 -->
    <template v-else>
      <!-- 空间信息 -->
      <a-flex justify="space-between">
        <h2>
          {{ space.spaceName }}（{{ SPACE_TYPE_MAP[space.spaceType ?? 0] }}）
          <a-tag :color="getSpaceLevelColor(space.spaceLevel ?? 0)" style="margin-left: 8px">
            {{ SPACE_LEVEL_MAP[space.spaceLevel ?? 0] }}
          </a-tag>
        </h2>
        <a-space size="middle">
          <a-button
            v-if="canUploadPicture"
            type="primary"
            :href="`/add_picture?spaceId=${id}`"
            target="_blank"
          >
            + 上传图片
          </a-button>
          <a-button
            v-if="canManageSpaceUser"
            type="primary"
            ghost
            :icon="h(TeamOutlined)"
            :href="`/spaceUserManage/${id}`"
            target="_blank"
          >
            成员管理
          </a-button>
          <a-button
            v-if="canManageSpaceUser"
            type="primary"
            ghost
            :icon="h(BarChartOutlined)"
            :href="`/space_analyze?spaceId=${id}`"
            target="_blank"
          >
            空间分析
          </a-button>
          <a-button v-if="canEditPicture" :icon="h(EditOutlined)" @click="doBatchEdit">
            批量编辑
          </a-button>
          <a-popconfirm
            v-if="canDeleteSpace"
            title="确定要删除该空间吗？删除后空间内的所有图片将无法恢复。"
            ok-text="确定删除"
            cancel-text="取消"
            ok-type="danger"
            @confirm="doDeleteSpace"
          >
            <a-button type="primary" danger :icon="h(DeleteOutlined)">
              删除空间
            </a-button>
          </a-popconfirm>
          <a-tooltip
            :title="`占用空间 ${formatSize(space.totalSize ?? 0)} / ${formatSize(space.maxSize ?? 0)}`"
          >
            <a-progress
              type="circle"
              :size="42"
              :percent="((space.totalSize ?? 0) * 100) / (space.maxSize ?? 1)"
            />
          </a-tooltip>
        </a-space>
      </a-flex>
      <div style="margin-bottom: 16px" />
      <!-- 全能搜索栏 -->
      <div class="search-section">
        <OmniSearchBar
          v-model="searchText"
          v-model:aiMode="isAiMode"
          v-model:similarity="similarityThreshold"
          :filterCount="activeFilterCount"
          @search="doSearch"
          @openFilter="filterDrawerOpen = true"
        />
      </div>

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
      <!-- 图片列表 -->
      <PictureList
        :dataList="dataList"
        :loading="loading"
        :showOp="true"
        :canEdit="canEditPicture"
        :canDelete="canDeletePicture"
        :onReload="fetchData"
      />
      <!-- 分页 -->
      <a-pagination
        style="text-align: right"
        v-model:current="searchParams.current"
        v-model:pageSize="searchParams.pageSize"
        :total="total"
        @change="onPageChange"
      />
      <BatchEditPictureModal
        ref="batchEditPictureModalRef"
        :spaceId="id"
        :pictureList="dataList"
        :onSuccess="onBatchEditPictureSuccess"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getSpaceVoByIdUsingGet, deleteSpaceUsingPost } from '@/api/spaceController.ts'
import { message } from 'ant-design-vue'
import {
  listPictureVoByPageUsingPost,
  listPictureTagCategoryUsingGet,
  searchPictureByColorUsingPost,
  searchPictureBySemantic,
} from '@/api/pictureController.ts'
import { formatSize } from '@/utils'
import PictureList from '@/components/PictureList.vue'
import OmniSearchBar from '@/components/OmniSearchBar.vue'
import SearchFilterDrawer, { type FilterValues } from '@/components/SearchFilterDrawer.vue'
import BatchEditPictureModal from '@/components/BatchEditPictureModal.vue'
import { BarChartOutlined, DeleteOutlined, EditOutlined, TeamOutlined } from '@ant-design/icons-vue'
import { SPACE_LEVEL_MAP, SPACE_PERMISSION_ENUM, SPACE_TYPE_ENUM, SPACE_TYPE_MAP } from '../constants/space.ts'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'

interface Props {
  id: string
}

const props = defineProps<Props>()
const space = ref<API.SpaceVO>({})
const router = useRouter()
const loginUserStore = useLoginUserStore()

// 通用权限检查函数
function createPermissionChecker(permission: string) {
  return computed(() => {
    return (space.value.permissionList ?? []).includes(permission)
  })
}

// 定义权限检查
const canManageSpaceUser = createPermissionChecker(SPACE_PERMISSION_ENUM.SPACE_USER_MANAGE)
// 判断是否为团队空间的创建者（只有创建者可以删除团队空间）
const canDeleteSpace = computed(() => {
  const isTeamSpace = space.value.spaceType === SPACE_TYPE_ENUM.TEAM
  const isCreator = space.value.userId === loginUserStore.loginUser?.id
  return isTeamSpace && isCreator
})
const canUploadPicture = createPermissionChecker(SPACE_PERMISSION_ENUM.PICTURE_UPLOAD)
const canEditPicture = createPermissionChecker(SPACE_PERMISSION_ENUM.PICTURE_EDIT)
const canDeletePicture = createPermissionChecker(SPACE_PERMISSION_ENUM.PICTURE_DELETE)

// 删除空间
const doDeleteSpace = async () => {
  if (!props.id) {
    return
  }
  try {
    const res = await deleteSpaceUsingPost({ id: props.id })
    if (res.data.code === 0) {
      message.success('删除成功')
      router.push('/')
    } else {
      message.error('删除失败，' + res.data.message)
    }
  } catch (e) {
    message.error('删除失败')
  }
}

// 空间版本颜色
const getSpaceLevelColor = (level: number) => {
  const colorMap: Record<number, string> = {
    0: 'default',
    1: 'blue',
    2: 'purple',
  }
  return colorMap[level] || 'default'
}

// -------- 搜索相关状态 --------
const searchText = ref('')
const isAiMode = ref(false)
const similarityThreshold = ref(0.5)
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

// 标签和分类列表
const categoryList = ref<string[]>([])
const tagList = ref<string[]>([])

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

// 获取标签和分类选项
const getTagCategoryOptions = async () => {
  const res = await listPictureTagCategoryUsingGet()
  if (res.data.code === 0 && res.data.data) {
    tagList.value = res.data.data.tagList ?? []
    categoryList.value = res.data.data.categoryList ?? []
  }
}

// 获取空间详情
const fetchSpaceDetail = async () => {
  if (!props.id) {
    message.error('空间 ID 为空，无法获取空间详情')
    return
  }
  try {
    const res = await getSpaceVoByIdUsingGet({
      id: props.id,
    })
    if (res.data.code === 0 && res.data.data) {
      space.value = res.data.data
    } else {
      message.error('获取空间详情失败，' + res.data.message)
    }
  } catch (e: unknown) {
    message.error('获取空间详情失败：' + (e instanceof Error ? e.message : String(e)))
  }
}

onMounted(() => {
  fetchSpaceDetail()
  getTagCategoryOptions()
})

// --------- 获取图片列表 --------

// 定义数据
const dataList = ref<API.PictureVO[]>([])
const total = ref(0)
const loading = ref(true)

// 搜索条件
const searchParams = ref<API.PictureQueryRequest>({
  current: 1,
  pageSize: 12,
  sortField: 'createTime',
  sortOrder: 'descend',
})

// 获取数据
const fetchData = async () => {
  loading.value = true
  // 转换搜索参数
  const params: API.PictureQueryRequest = {
    spaceId: props.id,
    ...searchParams.value,
    searchText: searchText.value || undefined,
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

  const res = await listPictureVoByPageUsingPost(params)
  if (res.data.code === 0 && res.data.data) {
    dataList.value = res.data.data.records ?? []
    total.value = res.data.data.total ?? 0
  } else {
    message.error('获取数据失败，' + res.data.message)
  }
  loading.value = false
}

// 页面加载时获取数据，请求一次
onMounted(() => {
  fetchData()
})

// 分页参数
const onPageChange = (page: number, pageSize: number) => {
  searchParams.value.current = page
  searchParams.value.pageSize = pageSize
  fetchData()
}

// 搜索
const doSearch = () => {
  searchParams.value.current = 1
  // 如果有颜色筛选，使用颜色搜索
  if (filterValues.value.picColor) {
    fetchColorData()
  } else if (isAiMode.value) {
    fetchSemanticData()
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

// 按颜色搜索
const fetchColorData = async () => {
  loading.value = true
  const res = await searchPictureByColorUsingPost({
    picColor: filterValues.value.picColor,
    spaceId: props.id,
  })
  if (res.data.code === 0 && res.data.data) {
    dataList.value = res.data.data ?? []
    total.value = res.data.data.length ?? 0
  } else {
    message.error('获取数据失败，' + res.data.message)
  }
  loading.value = false
}

// AI语义搜索
const fetchSemanticData = async () => {
  if (!searchText.value?.trim()) {
    message.warning('请输入语义搜索内容')
    return
  }
  loading.value = true
  try {
    const res = await searchPictureBySemantic({
      searchText: searchText.value,
      spaceId: props.id,
      topK: searchParams.value.pageSize,
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

// ---- 批量编辑图片 -----
const batchEditPictureModalRef = ref()

// 批量编辑图片成功
const onBatchEditPictureSuccess = () => {
  fetchData()
}

// 打开批量编辑图片弹窗
const doBatchEdit = () => {
  if (batchEditPictureModalRef.value) {
    batchEditPictureModalRef.value.openModal()
  }
}

// 空间 id 改变时，必须重新获取数据
watch(
  () => props.id,
  () => {
    fetchSpaceDetail()
    fetchData()
  },
)
</script>

<style scoped>
#spaceDetailPage {
  margin-bottom: 16px;
}

.search-section {
  margin-bottom: 20px;
  padding: 8px 0;
}
</style>
