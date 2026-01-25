<template>
  <div class="search-form-container">
    <a-form
      :model="formData"
      layout="inline"
      class="search-form"
    >
      <a-form-item
        v-for="item in formItems"
        :key="item.name"
        :label="item.label"
      >
        <a-input
          v-if="item.type === 'input'"
          v-model:value="formData[item.name]"
          :placeholder="item.placeholder"
          allow-clear
          style="width: 200px"
          @press-enter="handleSearch"
        />
        <a-select
          v-else-if="item.type === 'select'"
          v-model:value="formData[item.name]"
          :placeholder="item.placeholder"
          allow-clear
          style="width: 200px"
          :options="item.options"
        />
        <a-select
          v-else-if="item.type === 'select-tags'"
          v-model:value="formData[item.name]"
          :placeholder="item.placeholder"
          mode="tags"
          allow-clear
          style="width: 300px"
          :options="item.options"
        />
      </a-form-item>
      <a-form-item>
        <a-space>
          <a-button type="primary" @click="handleSearch">
            <template #icon>
              <SearchOutlined />
            </template>
            搜索
          </a-button>
          <a-button @click="handleReset">
            <template #icon>
              <ReloadOutlined />
            </template>
            重置
          </a-button>
        </a-space>
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue'

interface FormItem {
  name: string
  label: string
  type: 'input' | 'select' | 'select-tags'
  placeholder: string
  options?: Array<{ label: string; value: string | number }>
}

interface Props {
  formItems: FormItem[]
  initialValues?: Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  formItems: () => [],
  initialValues: () => ({})
})

const emit = defineEmits<{
  search: [values: Record<string, any>]
  reset: []
}>()

const formData = reactive<Record<string, any>>(
  { ...props.initialValues }
)

const handleSearch = () => {
  emit('search', { ...formData })
}

const handleReset = () => {
  Object.keys(formData).forEach(key => {
    formData[key] = undefined
  })
  emit('reset')
}

// 暴露方法供外部调用
defineExpose({
  reset: handleReset,
  getValues: () => ({ ...formData })
})
</script>

<style scoped>
.search-form-container {
  margin-bottom: 20px;
  padding: 16px;
  background: #fafafa;
  border-radius: 6px;
}

.search-form :deep(.ant-form-item) {
  margin-bottom: 12px;
}

.search-form :deep(.ant-form-item-label > label) {
  font-weight: 500;
  color: #374151;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .search-form {
    flex-direction: column;
  }

  .search-form :deep(.ant-form-item) {
    width: 100%;
  }

  .search-form :deep(.ant-form-item-control-input),
  .search-form :deep(.ant-select),
  .search-form :deep(.ant-input) {
    width: 100% !important;
  }
}
</style>