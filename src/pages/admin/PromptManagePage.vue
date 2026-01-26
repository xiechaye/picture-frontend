<template>
  <AdminPageContainer
    title="提示词管理"
    description="管理AI图片生成的提示词模板，支持创建、编辑和删除"
  >
    <template #extra>
      <a-button type="primary" @click="showAddModal">
        <template #icon>
          <PlusOutlined />
        </template>
        新增提示词
      </a-button>
    </template>

    <!-- 搜索表单 -->
    <SearchForm
      :form-items="searchFormItems"
      :initial-values="searchParams"
      @search="handleSearch"
      @reset="handleReset"
    />

    <!-- 数据表格 -->
    <a-table
      :columns="columns"
      :data-source="dataList"
      :pagination="pagination"
      :loading="loading"
      @change="doTableChange"
      row-key="id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'category'">
          <a-tag color="blue">{{ record.category }}</a-tag>
        </template>
        <template v-else-if="column.key === 'prompt'">
          <a-tooltip :title="record.prompt">
            <span class="prompt-text">
              {{ record.prompt.substring(0, 50) }}{{ record.prompt.length > 50 ? '...' : '' }}
            </span>
          </a-tooltip>
        </template>
        <template v-else-if="column.key === 'createTime'">
          {{ dayjs(record.createTime).format('YYYY-MM-DD HH:mm:ss') }}
        </template>
        <template v-else-if="column.key === 'action'">
          <a-space wrap>
            <a-button type="link" size="small" @click="showEditModal(record)">编辑</a-button>
            <a-popconfirm
              title="确定要删除该提示词吗？"
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

  <!-- 新增/编辑弹窗 -->
  <a-modal
    v-model:open="modalVisible"
    :title="isEdit ? '编辑提示词' : '新增提示词'"
    :confirm-loading="submitting"
    @ok="handleSubmit"
    @cancel="handleCancel"
    width="600px"
  >
    <a-form :model="formData" layout="vertical">
      <a-form-item label="标题" required>
        <a-input
          v-model:value="formData.title"
          placeholder="请输入标题（最大128字符）"
          :maxlength="128"
          show-count
        />
      </a-form-item>
      <a-form-item label="分类" required>
        <a-auto-complete
          v-model:value="formData.category"
          :options="categoryOptions.map((cat) => ({ value: cat }))"
          placeholder="请选择或输入分类"
          :loading="categoriesLoading"
          allow-clear
          style="width: 100%"
        />
      </a-form-item>
      <a-form-item label="提示词内容" required>
        <a-textarea
          v-model:value="formData.prompt"
          placeholder="请输入提示词内容"
          :auto-size="{ minRows: 4, maxRows: 8 }"
          show-count
          :maxlength="2000"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import {
  listPromptByPageUsingPost,
  addPromptUsingPost,
  updatePromptUsingPost,
  deletePromptUsingPost,
  getPromptCategoriesUsingGet,
} from '@/api/promptController'
import { handleException } from '@/utils/errorHandler'
import { PlusOutlined } from '@ant-design/icons-vue'
import AdminPageContainer from '@/components/admin/AdminPageContainer.vue'
import SearchForm from '@/components/admin/SearchForm.vue'

// 搜索表单配置
const searchFormItems = computed(() => [
  {
    name: 'title',
    label: '标题',
    type: 'input' as const,
    placeholder: '请输入标题'
  },
  {
    name: 'category',
    label: '分类',
    type: 'select' as const,
    placeholder: '请选择分类',
    options: categoryOptions.value.map((cat) => ({ label: cat, value: cat }))
  },
  {
    name: 'prompt',
    label: '提示词内容',
    type: 'input' as const,
    placeholder: '请输入提示词内容'
  }
])

// 表格列定义
const columns = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: '标题', dataIndex: 'title', width: 150 },
  { title: '分类', dataIndex: 'category', width: 120 },
  { title: '提示词内容', key: 'prompt', ellipsis: true },
  { title: '创建时间', key: 'createTime', width: 180 },
  { title: '操作', key: 'action', width: 150, fixed: 'right' },
]

// 数据列表
const dataList = ref<API.SamplePrompt[]>([])
const total = ref(0)
const loading = ref(false)

// 分类选项数据
const categoryOptions = ref<string[]>([])
const categoriesLoading = ref(false)

// 获取分类列表
const fetchCategories = async () => {
  categoriesLoading.value = true
  try {
    const res = await getPromptCategoriesUsingGet()
    if (res.data.code === 0) {
      categoryOptions.value = res.data.data || []
    }
  } catch (e) {
    handleException(e, { operation: '获取分类列表' })
  } finally {
    categoriesLoading.value = false
  }
}

// 搜索参数
const searchParams = reactive<API.SamplePromptQueryRequest>({
  current: 1,
  pageSize: 10,
  sortField: 'createTime',
  sortOrder: 'descend',
})

// 弹窗状态
const modalVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)

// 表单数据
const formData = reactive<{
  id?: number | string
  title: string
  category: string
  prompt: string
}>({
  title: '',
  category: '',
  prompt: '',
})

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    const res = await listPromptByPageUsingPost(searchParams)
    if (res.data.code === 0 && res.data.data) {
      dataList.value = res.data.data.records
      total.value = res.data.data.total
    } else {
      message.error('获取数据失败：' + res.data.message)
    }
  } catch (e) {
    handleException(e, { operation: '获取提示词列表' })
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = (values: Record<string, any>) => {
  Object.assign(searchParams, values)
  searchParams.current = 1
  fetchData()
}

// 重置搜索
const handleReset = () => {
  searchParams.title = undefined
  searchParams.category = undefined
  searchParams.prompt = undefined
  searchParams.current = 1
  fetchData()
}

// 分页变化
const doTableChange = (page: any) => {
  searchParams.current = page.current
  searchParams.pageSize = page.pageSize
  fetchData()
}

// 分页配置
const pagination = computed(() => ({
  current: searchParams.current,
  pageSize: searchParams.pageSize,
  total: total.value,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
}))

// 显示新增弹窗
const showAddModal = () => {
  isEdit.value = false
  formData.id = undefined
  formData.title = ''
  formData.category = ''
  formData.prompt = ''
  modalVisible.value = true
}

// 显示编辑弹窗
const showEditModal = (record: API.SamplePrompt) => {
  isEdit.value = true
  formData.id = record.id
  formData.title = record.title
  formData.category = record.category
  formData.prompt = record.prompt
  modalVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  // 验证
  if (!formData.title || !formData.category || !formData.prompt) {
    message.error('请填写完整信息')
    return
  }

  submitting.value = true
  try {
    if (isEdit.value && formData.id) {
      // 编辑
      const res = await updatePromptUsingPost({
        id: String(formData.id),
        title: formData.title,
        category: formData.category,
        prompt: formData.prompt,
      })
      if (res.data.code === 0) {
        message.success('更新成功')
        modalVisible.value = false
        // 如果是新分类，添加到缓存列表
        if (formData.category && !categoryOptions.value.includes(formData.category)) {
          categoryOptions.value.push(formData.category)
        }
        fetchData()
      } else {
        message.error('更新失败：' + res.data.message)
      }
    } else {
      // 新增
      const res = await addPromptUsingPost({
        title: formData.title,
        category: formData.category,
        prompt: formData.prompt,
      })
      if (res.data.code === 0) {
        message.success('新增成功')
        modalVisible.value = false
        // 如果是新分类，添加到缓存列表
        if (formData.category && !categoryOptions.value.includes(formData.category)) {
          categoryOptions.value.push(formData.category)
        }
        fetchData()
      } else {
        message.error('新增失败：' + res.data.message)
      }
    }
  } catch (e) {
    handleException(e, { operation: isEdit.value ? '更新提示词' : '新增提示词' })
  } finally {
    submitting.value = false
  }
}

// 取消
const handleCancel = () => {
  modalVisible.value = false
}

// 删除
const doDelete = async (id: number) => {
  try {
    const res = await deletePromptUsingPost({ id })
    if (res.data.code === 0) {
      message.success('删除成功')
      fetchData()
    } else {
      message.error('删除失败：' + res.data.message)
    }
  } catch (e) {
    handleException(e, { operation: '删除提示词' })
  }
}

// 页面加载时获取数据
onMounted(() => {
  fetchCategories()
  fetchData()
})
</script>

<style scoped>
.prompt-text {
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
}
</style>
