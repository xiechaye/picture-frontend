<template>
  <div id="promptManagePage">
    <!-- 标题和新增按钮 -->
    <a-flex justify="space-between" style="margin-bottom: 16px">
      <h2>提示词管理</h2>
      <a-button type="primary" @click="showAddModal">+ 新增提示词</a-button>
    </a-flex>

    <!-- 搜索表单 -->
    <a-form layout="inline" :model="searchParams" @finish="doSearch">
      <a-form-item label="标题">
        <a-input v-model:value="searchParams.title" placeholder="请输入标题" allow-clear />
      </a-form-item>
      <a-form-item label="分类">
        <a-select
          v-model:value="searchParams.category"
          placeholder="请选择分类"
          allow-clear
          style="width: 150px"
        >
          <a-select-option v-for="cat in PROMPT_CATEGORIES" :key="cat" :value="cat">
            {{ cat }}
          </a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item label="提示词内容">
        <a-input v-model:value="searchParams.prompt" placeholder="请输入提示词内容" allow-clear />
      </a-form-item>
      <a-form-item>
        <a-button type="primary" html-type="submit">搜索</a-button>
      </a-form-item>
    </a-form>

    <div style="margin-bottom: 16px" />

    <!-- 数据表格 -->
    <a-table
      :columns="columns"
      :data-source="dataList"
      :pagination="pagination"
      :loading="loading"
      @change="doTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'prompt'">
          <a-tooltip :title="record.prompt">
            {{ record.prompt.substring(0, 50) }}{{ record.prompt.length > 50 ? '...' : '' }}
          </a-tooltip>
        </template>
        <template v-else-if="column.key === 'createTime'">
          {{ dayjs(record.createTime).format('YYYY-MM-DD HH:mm:ss') }}
        </template>
        <template v-else-if="column.key === 'action'">
          <a-space wrap>
            <a-button type="link" @click="showEditModal(record)">编辑</a-button>
            <a-popconfirm title="确定删除吗？" @confirm="doDelete(record.id)">
              <a-button type="link" danger>删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- 新增/编辑弹窗 -->
    <a-modal
      v-model:open="modalVisible"
      :title="isEdit ? '编辑提示词' : '新增提示词'"
      :confirm-loading="submitting"
      @ok="handleSubmit"
      @cancel="handleCancel"
    >
      <a-form :model="formData" layout="vertical">
        <a-form-item label="标题" required>
          <a-input
            v-model:value="formData.title"
            placeholder="请输入标题（最大128字符）"
            :maxlength="128"
          />
        </a-form-item>
        <a-form-item label="分类" required>
          <a-select v-model:value="formData.category" placeholder="请选择分类">
            <a-select-option v-for="cat in PROMPT_CATEGORIES" :key="cat" :value="cat">
              {{ cat }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="提示词内容" required>
          <a-textarea
            v-model:value="formData.prompt"
            placeholder="请输入提示词内容"
            :auto-size="{ minRows: 4, maxRows: 8 }"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
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
} from '@/api/promptController'
import { PROMPT_CATEGORIES } from '@/constants/prompt'
import { handleApiResponse, handleException } from '@/utils/errorHandler'

// 表格列定义
const columns = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: '标题', dataIndex: 'title', width: 150 },
  { title: '分类', dataIndex: 'category', width: 120 },
  { title: '提示词内容', key: 'prompt' },
  { title: '创建时间', key: 'createTime', width: 180 },
  { title: '操作', key: 'action', width: 150 },
]

// 数据列表
const dataList = ref<API.SamplePrompt[]>([])
const total = ref(0)
const loading = ref(false)

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
  id?: number
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
const doSearch = () => {
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
        id: formData.id,
        title: formData.title,
        category: formData.category,
        prompt: formData.prompt,
      })
      if (res.data.code === 0) {
        message.success('更新成功')
        modalVisible.value = false
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
  fetchData()
})
</script>

<style scoped>
#promptManagePage {
  padding: 20px;
}
</style>
