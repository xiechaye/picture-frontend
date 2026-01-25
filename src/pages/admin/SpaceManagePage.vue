<template>
  <AdminPageContainer
    title="空间管理"
    description="管理所有图片空间，支持创建、编辑、删除和数据分析"
  >
    <template #extra>
      <a-space>
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
    </template>

    <!-- 搜索表单 -->
    <SearchForm
      :form-items="searchFormItems"
      :initial-values="searchParams"
      @search="handleSearch"
      @reset="handleReset"
    />

    <!-- 表格 -->
    <a-table
      :columns="columns"
      :data-source="dataList"
      :pagination="pagination"
      :loading="loading"
      @change="doTableChange"
      row-key="id"
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
          {{ dayjs(record.createTime).format('YYYY-MM-DD HH:mm:ss') }}
        </template>
        <template v-else-if="column.dataIndex === 'editTime'">
          {{ record.editTime ? dayjs(record.editTime).format('YYYY-MM-DD HH:mm:ss') : '-' }}
        </template>
        <template v-else-if="column.key === 'action'">
          <a-space wrap>
            <a-button
              type="link"
              size="small"
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
import { PlusOutlined, BarChartOutlined } from '@ant-design/icons-vue'
import AdminPageContainer from '@/components/admin/AdminPageContainer.vue'
import SearchForm from '@/components/admin/SearchForm.vue'

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

const columns = [
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
    fixed: 'right',
  },
]

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
      total.value = res.data.data.total ?? 0
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
    showSizeChanger: true,
    showTotal: (total: number) => `共 ${total} 条`,
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
</style>
