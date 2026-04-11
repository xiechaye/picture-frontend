<template>
  <AdminPageContainer
    title="图片管理"
    description="管理系统中的所有图片，支持审核、编辑和删除操作"
  >
    <template #extra>
      <!-- 桌面端：显示所有按钮 -->
      <a-space v-if="!isMobile" class="desktop-actions">
        <a-button type="primary" href="/add_picture" target="_blank">
          <template #icon>
            <PlusOutlined />
          </template>
          上传图片
        </a-button>
        <a-button type="primary" href="/add_picture/batch" target="_blank" ghost>
          <template #icon>
            <UploadOutlined />
          </template>
          批量上传
        </a-button>
      </a-space>

      <!-- 移动端：下拉菜单 -->
      <a-dropdown v-else placement="bottomRight">
        <a-button type="primary">
          <template #icon>
            <AppstoreOutlined />
          </template>
          操作
          <DownOutlined />
        </a-button>
        <template #overlay>
          <a-menu>
            <a-menu-item>
              <a href="/add_picture" target="_blank" @click.stop>
                <PlusOutlined />
                上传图片
              </a>
            </a-menu-item>
            <a-menu-item>
              <a href="/add_picture/batch" target="_blank" @click.stop>
                <UploadOutlined />
                批量上传
              </a>
            </a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </template>

    <!-- 搜索表单 - 移动端可折叠 -->
    <div class="search-section">
      <div
        class="search-header"
        :class="{ 'is-collapsed': isSearchCollapsed }"
        @click="toggleSearch"
      >
        <SearchOutlined class="search-icon" />
        <span class="search-title">搜索筛选</span>
        <DownOutlined :class="{ 'is-collapsed': isSearchCollapsed }" class="collapse-icon" />
      </div>
      <div v-show="!isSearchCollapsed" class="search-content">
        <SearchForm
          :form-items="searchFormItems"
          :initial-values="searchParams"
          @search="handleSearch"
          @reset="handleReset"
        />
      </div>
    </div>

    <!-- 表格 -->
    <a-table
      :columns="responsiveColumns"
      :data-source="dataList"
      :pagination="pagination"
      :loading="loading"
      @change="doTableChange"
      row-key="id"
      :scroll="{ x: isMobile ? 700 : 'max-content' }"
      class="picture-table"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'url'">
          <a-image
            :src="record.url"
            :width="isMobile ? 50 : 80"
            :preview="{ src: record.url }"
          />
        </template>
        <template v-else-if="column.dataIndex === 'tags'">
          <a-space :size="isMobile ? 2 : 4" wrap>
            <a-tag v-for="tag in JSON.parse(record.tags || '[]')" :key="tag" color="blue">
              {{ tag }}
            </a-tag>
          </a-space>
        </template>
        <template v-else-if="column.dataIndex === 'picInfo'">
          <div class="pic-info">
            <span>{{ record.picFormat }}</span>
            <span>{{ record.picWidth }}×{{ record.picHeight }}</span>
            <span>{{ (record.picSize / 1024).toFixed(1) }}KB</span>
          </div>
        </template>
        <template v-else-if="column.dataIndex === 'reviewMessage'">
          <a-tag :color="getReviewStatusColor(record.reviewStatus)">
            {{ PIC_REVIEW_STATUS_MAP[record.reviewStatus] }}
          </a-tag>
          <div v-if="record.reviewMessage" class="review-message">
            {{ record.reviewMessage }}
          </div>
        </template>
        <template v-else-if="column.dataIndex === 'createTime'">
          {{ isMobile ? dayjs(record.createTime).format('MM-DD HH:mm') : dayjs(record.createTime).format('YYYY-MM-DD HH:mm:ss') }}
        </template>
        <template v-else-if="column.dataIndex === 'editTime'">
          {{ record.editTime ? (isMobile ? dayjs(record.editTime).format('MM-DD HH:mm') : dayjs(record.editTime).format('YYYY-MM-DD HH:mm:ss')) : '-' }}
        </template>
        <template v-else-if="column.key === 'action'">
          <a-space :size="isMobile ? 4 : 8" wrap>
            <a-button
              v-if="record.reviewStatus === PIC_REVIEW_STATUS_ENUM.REVIEWING"
              type="link"
              size="small"
              @click="handleReview(record, PIC_REVIEW_STATUS_ENUM.PASS)"
            >
              通过
            </a-button>
            <a-button
              v-if="record.reviewStatus === PIC_REVIEW_STATUS_ENUM.REVIEWING"
              type="link"
              size="small"
              danger
              @click="handleReview(record, PIC_REVIEW_STATUS_ENUM.REJECT)"
            >
              拒绝
            </a-button>
            <a-button
              type="link"
              size="small"
              :href="`/add_picture?id=${record.id}`"
              target="_blank"
            >
              编辑
            </a-button>
            <a-popconfirm
              title="确定要删除该图片吗？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="doDelete(record.id)"
            >
              <a-button type="link" size="small" danger>删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>
  </AdminPageContainer>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue'
import {
  deletePictureUsingPost,
  doPictureReviewUsingPost,
  listPictureByPageUsingPost,
} from '@/api/pictureController.ts'
import { message } from 'ant-design-vue'
import {
  PIC_REVIEW_STATUS_ENUM,
  PIC_REVIEW_STATUS_MAP,
  PIC_REVIEW_STATUS_OPTIONS,
} from '../../constants/picture.ts'
import dayjs from 'dayjs'
import {
  PlusOutlined,
  UploadOutlined,
  SearchOutlined,
  DownOutlined,
  AppstoreOutlined,
} from '@ant-design/icons-vue'
import AdminPageContainer from '@/components/admin/AdminPageContainer.vue'
import SearchForm from '@/components/admin/SearchForm.vue'
import { useBreakpoint } from '@/composables/useBreakpoint.ts'

// 移动端检测
const { isMobile } = useBreakpoint(768)

// 搜索表单折叠状态
const isSearchCollapsed = ref(false)

const toggleSearch = () => {
  isSearchCollapsed.value = !isSearchCollapsed.value
}

// 搜索表单配置
const searchFormItems = [
  {
    name: 'searchText',
    label: '关键词',
    type: 'input' as const,
    placeholder: '从名称和简介搜索'
  },
  {
    name: 'category',
    label: '类型',
    type: 'input' as const,
    placeholder: '请输入类型'
  },
  {
    name: 'tags',
    label: '标签',
    type: 'select-tags' as const,
    placeholder: '请输入标签',
    options: []
  },
  {
    name: 'reviewStatus',
    label: '审核状态',
    type: 'select' as const,
    placeholder: '请选择审核状态',
    options: PIC_REVIEW_STATUS_OPTIONS
  }
]

// 所有列定义（桌面端）
const allColumns = [
  {
    title: 'ID',
    dataIndex: 'id',
    width: 80,
  },
  {
    title: '图片',
    dataIndex: 'url',
    width: 100,
  },
  {
    title: '名称',
    dataIndex: 'name',
    width: 150,
    ellipsis: true,
  },
  {
    title: '简介',
    dataIndex: 'introduction',
    ellipsis: true,
  },
  {
    title: '类型',
    dataIndex: 'category',
    width: 100,
  },
  {
    title: '标签',
    dataIndex: 'tags',
    width: 150,
  },
  {
    title: '图片信息',
    dataIndex: 'picInfo',
    width: 150,
  },
  {
    title: '审核状态',
    dataIndex: 'reviewMessage',
    width: 120,
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    width: 180,
  },
  {
    title: '操作',
    key: 'action',
    width: 200,
    fixed: 'right' as const,
  },
]

// 移动端列定义（精简）
const mobileColumns = [
  {
    title: '图片',
    dataIndex: 'url',
    width: 60,
  },
  {
    title: '名称',
    dataIndex: 'name',
    width: 100,
    ellipsis: true,
  },
  {
    title: '审核',
    dataIndex: 'reviewMessage',
    width: 80,
  },
  {
    title: '图片信息',
    dataIndex: 'picInfo',
    width: 120,
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    width: 90,
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
    fixed: 'right' as const,
  },
]

// 响应式列
const responsiveColumns = computed(() => {
  return isMobile.value ? mobileColumns : allColumns
})

// 定义数据
const dataList = ref<API.Picture[]>([])
const total = ref(0)
const loading = ref(false)

// 搜索条件
const searchParams = reactive<API.PictureQueryRequest>({
  current: 1,
  pageSize: 10,
  sortField: 'createTime',
  sortOrder: 'descend',
})

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    const res = await listPictureByPageUsingPost({
      ...searchParams,
      nullSpaceId: true,
    })
    if (res.data.code === 0 && res.data.data) {
      dataList.value = res.data.data.records ?? []
      total.value = Number(res.data.data.total ?? 0)
    } else {
      message.error('获取数据失败，' + res.data.message)
    }
  } catch (error) {
    message.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 页面加载时获取数据，请求一次
onMounted(() => {
  fetchData()
})

// 分页参数
const pagination = computed(() => {
  return {
    current: searchParams.current,
    pageSize: searchParams.pageSize,
    total: total.value,
    showSizeChanger: !isMobile.value,
    showTotal: (total: number) => `共 ${total} 条`,
    simple: isMobile.value,
  }
})

// 表格变化之后，重新获取数据
const doTableChange = (page: { current: number; pageSize: number }) => {
  searchParams.current = page.current
  searchParams.pageSize = page.pageSize
  fetchData()
}

// 搜索数据
const handleSearch = (values: Record<string, any>) => {
  Object.assign(searchParams, values)
  searchParams.current = 1
  fetchData()
}

// 重置搜索
const handleReset = () => {
  searchParams.searchText = undefined
  searchParams.category = undefined
  searchParams.tags = undefined
  searchParams.reviewStatus = undefined
  searchParams.current = 1
  fetchData()
}

// 删除数据
const doDelete = async (id: number) => {
  if (!id) {
    return
  }
  try {
    const res = await deletePictureUsingPost({ id })
    if (res.data.code === 0) {
      message.success('删除成功')
      // 刷新数据
      fetchData()
    } else {
      message.error('删除失败，' + res.data.message)
    }
  } catch (error) {
    message.error('删除失败')
  }
}

// 审核图片
const handleReview = async (record: API.Picture, reviewStatus: number) => {
  const reviewMessage =
    reviewStatus === PIC_REVIEW_STATUS_ENUM.PASS ? '管理员操作通过' : '管理员操作拒绝'
  try {
    const res = await doPictureReviewUsingPost({
      id: record.id,
      reviewStatus,
      reviewMessage,
    })
    if (res.data.code === 0) {
      message.success('审核操作成功')
      // 重新获取列表数据
      fetchData()
    } else {
      message.error('审核操作失败，' + res.data.message)
    }
  } catch (error) {
    message.error('审核操作失败')
  }
}

// 获取审核状态颜色
const getReviewStatusColor = (status: number) => {
  const colorMap: Record<number, string> = {
    [PIC_REVIEW_STATUS_ENUM.PASS]: 'green',
    [PIC_REVIEW_STATUS_ENUM.REJECT]: 'red',
    [PIC_REVIEW_STATUS_ENUM.REVIEWING]: 'orange',
  }
  return colorMap[status] || 'default'
}
</script>

<style scoped>
.pic-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #666;
}

.review-message {
  margin-top: 4px;
  font-size: 12px;
  color: #666;
}

/* 搜索区域 */
.search-section {
  margin-bottom: 16px;
  border-radius: 8px;
  overflow: hidden;
  background: #fafafa;
  border: 1px solid #f0f0f0;
}

.search-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: white;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s;
}

.search-header:hover {
  background: #f9f9f9;
}

.search-header.is-collapsed {
  border-bottom: none;
}

.search-icon {
  color: #2E7D32;
}

.search-title {
  flex: 1;
  font-weight: 500;
  color: #333;
}

.collapse-icon {
  transition: transform 0.2s;
}

.collapse-icon.is-collapsed {
  transform: rotate(-90deg);
}

.search-content {
  padding-top: 12px;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .desktop-actions {
    display: none;
  }

  .search-section {
    background: transparent;
    border: none;
  }

  .search-header {
    background: #f5f5f5;
    padding: 10px 12px;
    border-radius: 6px;
  }

  .search-content {
    padding: 12px 0;
  }

  /* 表格优化 */
  .picture-table :deep(.ant-table) {
    font-size: 13px;
  }

  .picture-table :deep(.ant-table-thead > tr > th),
  .picture-table :deep(.ant-table-tbody > tr > td) {
    padding: 8px 10px;
  }

  .picture-table :deep(.ant-table-cell) {
    padding: 8px 10px !important;
  }

  /* 标签缩小 */
  .picture-table :deep(.ant-tag) {
    font-size: 10px;
    padding: 0 3px;
    margin: 2px;
  }

  /* 图片预览优化 */
  .picture-table :deep(.ant-image-img) {
    border-radius: 4px;
  }
}
</style>
