<template>
  <AdminPageContainer
    title="空间管理"
    description="管理所有图片空间，支持创建、编辑、删除和数据分析"
  >
    <template #extra>
      <!-- 桌面端：显示所有按钮 -->
      <a-space v-if="!isMobile" class="desktop-actions">
        <a-button type="primary" href="/add_space" target="_blank">
          <template #icon>
            <PlusOutlined />
          </template>
          创建空间
        </a-button>
        <a-button type="primary" ghost href="/space_analyze?queryPublic=1" target="_blank">
          <template #icon>
            <BarChartOutlined />
          </template>
          分析公共图库
        </a-button>
        <a-button type="primary" ghost href="/space_analyze?queryAll=1" target="_blank">
          <template #icon>
            <BarChartOutlined />
          </template>
          分析全部空间
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
              <a href="/add_space" target="_blank" @click.stop>
                <PlusOutlined />
                创建空间
              </a>
            </a-menu-item>
            <a-menu-item>
              <a href="/space_analyze?queryPublic=1" target="_blank" @click.stop>
                <BarChartOutlined />
                分析公共图库
              </a>
            </a-menu-item>
            <a-menu-item>
              <a href="/space_analyze?queryAll=1" target="_blank" @click.stop>
                <BarChartOutlined />
                分析全部空间
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
      :scroll="{ x: isMobile ? 800 : 'max-content' }"
      class="space-table"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'spaceLevel'">
          <a-tag :color="getSpaceLevelColor(record.spaceLevel)">
            {{ SPACE_LEVEL_MAP[record.spaceLevel] }}
          </a-tag>
        </template>
        <template v-else-if="column.dataIndex === 'spaceType'">
          <a-tag color="blue">{{ SPACE_TYPE_MAP[record.spaceType] }}</a-tag>
        </template>
        <template v-else-if="column.dataIndex === 'spaceUseInfo'">
          <div class="space-use-info">
            <div class="use-item">
              <span class="label">大小：</span>
              <span class="value">{{ formatSize(record.totalSize) }} / {{ formatSize(record.maxSize) }}</span>
            </div>
            <div class="use-item">
              <span class="label">数量：</span>
              <span class="value">{{ record.totalCount }} / {{ record.maxCount }}</span>
            </div>
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
              type="link"
              :size="isMobile ? 'small' : 'small'"
              :href="`/space_analyze?spaceId=${record.id}`"
              target="_blank"
            >
              分析
            </a-button>
            <a-button
              type="link"
              size="small"
              :href="`/add_space?id=${record.id}`"
              target="_blank"
            >
              编辑
            </a-button>
            <a-popconfirm
              title="确定要删除该空间吗？"
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
import { deleteSpaceUsingPost, listSpaceByPageUsingPost } from '@/api/spaceController.ts'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import {
  SPACE_LEVEL_MAP,
  SPACE_LEVEL_OPTIONS,
  SPACE_TYPE_MAP,
  SPACE_TYPE_OPTIONS,
} from '../../constants/space.ts'
import { formatSize } from '../../utils'
import {
  PlusOutlined,
  BarChartOutlined,
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
    name: 'spaceName',
    label: '空间名称',
    type: 'input' as const,
    placeholder: '请输入空间名称'
  },
  {
    name: 'spaceLevel',
    label: '空间级别',
    type: 'select' as const,
    placeholder: '请选择空间级别',
    options: SPACE_LEVEL_OPTIONS
  },
  {
    name: 'spaceType',
    label: '空间类别',
    type: 'select' as const,
    placeholder: '请选择空间类别',
    options: SPACE_TYPE_OPTIONS
  },
  {
    name: 'userId',
    label: '用户ID',
    type: 'input' as const,
    placeholder: '请输入用户ID'
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
    title: '空间名称',
    dataIndex: 'spaceName',
    width: 150,
    ellipsis: true,
  },
  {
    title: '空间级别',
    dataIndex: 'spaceLevel',
    width: 100,
  },
  {
    title: '空间类别',
    dataIndex: 'spaceType',
    width: 100,
  },
  {
    title: '使用情况',
    dataIndex: 'spaceUseInfo',
    width: 200,
  },
  {
    title: '用户ID',
    dataIndex: 'userId',
    width: 100,
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    width: 180,
  },
  {
    title: '编辑时间',
    dataIndex: 'editTime',
    width: 180,
  },
  {
    title: '操作',
    key: 'action',
    width: 180,
    fixed: 'right' as const,
  },
]

// 移动端列定义（精简）
const mobileColumns = [
  {
    title: '空间名称',
    dataIndex: 'spaceName',
    width: 120,
    ellipsis: true,
  },
  {
    title: '级别',
    dataIndex: 'spaceLevel',
    width: 70,
  },
  {
    title: '使用情况',
    dataIndex: 'spaceUseInfo',
    width: 180,
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    width: 100,
  },
  {
    title: '操作',
    key: 'action',
    width: 140,
    fixed: 'right' as const,
  },
]

// 响应式列
const responsiveColumns = computed(() => {
  return isMobile.value ? mobileColumns : allColumns
})

// 定义数据
const dataList = ref<API.Space[]>([])
const total = ref(0)
const loading = ref(false)

// 搜索条件
const searchParams = reactive<API.SpaceQueryRequest>({
  current: 1,
  pageSize: 10,
  sortField: 'createTime',
  sortOrder: 'descend',
})

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    const res = await listSpaceByPageUsingPost({
      ...searchParams,
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
  searchParams.spaceName = undefined
  searchParams.spaceLevel = undefined
  searchParams.spaceType = undefined
  searchParams.userId = undefined
  searchParams.current = 1
  fetchData()
}

// 删除数据
const doDelete = async (id: string) => {
  if (!id) {
    return
  }
  try {
    const res = await deleteSpaceUsingPost({ id })
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

// 获取空间级别颜色
const getSpaceLevelColor = (level: number) => {
  const colorMap: Record<number, string> = {
    0: 'default',
    1: 'blue',
    2: 'purple',
    3: 'gold',
  }
  return colorMap[level] || 'default'
}
</script>

<style scoped>
.space-use-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
}

.use-item {
  display: flex;
  align-items: center;
}

.use-item .label {
  color: #999;
  margin-right: 4px;
}

.use-item .value {
  color: #333;
  font-weight: 500;
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
  .space-table :deep(.ant-table) {
    font-size: 13px;
  }

  .space-table :deep(.ant-table-thead > tr > th),
  .space-table :deep(.ant-table-tbody > tr > td) {
    padding: 8px 10px;
  }

  .space-table :deep(.ant-table-cell) {
    padding: 8px 10px !important;
  }

  /* 标签缩小 */
  .space-table :deep(.ant-tag) {
    font-size: 11px;
    padding: 0 4px;
  }
}
</style>
