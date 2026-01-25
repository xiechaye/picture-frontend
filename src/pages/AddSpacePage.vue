<template>
  <CenterContainer max-width="700px" :vertical-center="false">
    <h2 class="page-title">
      <TeamOutlined v-if="spaceType === SPACE_TYPE_ENUM.TEAM" class="title-icon" />
      <FolderOutlined v-else class="title-icon" />
      {{ route.query?.id ? '修改' : '创建' }} {{ SPACE_TYPE_MAP[spaceType] }}
    </h2>

    <!-- 空间信息表单 -->
    <a-form
      name="spaceForm"
      layout="vertical"
      :model="spaceForm"
      @finish="handleSubmit"
      class="space-form"
    >
      <a-form-item
        name="spaceName"
        label="空间名称"
        :rules="[{ required: true, message: '请输入空间名称' }]"
      >
        <a-input
          v-model:value="spaceForm.spaceName"
          placeholder="请输入空间名称"
          allow-clear
          size="large"
          class="form-input"
        />
      </a-form-item>

      <a-form-item name="spaceLevel" label="选择套餐">
        <div class="level-cards">
          <div
            v-for="level in spaceLevelList"
            :key="level.value"
            class="level-card"
            :class="{
              active: spaceForm.spaceLevel === level.value,
            }"
            @click="selectLevel(level)"
          >
            <div class="level-icon">
              <RocketOutlined v-if="level.value === 2" />
              <ThunderboltOutlined v-else-if="level.value === 1" />
              <CloudOutlined v-else />
            </div>
            <div class="level-name">{{ level.text }}</div>
            <div class="level-specs">
              <div class="spec-item">
                <DatabaseOutlined />
                <span>{{ formatSize(level.maxSize) }}</span>
              </div>
              <div class="spec-item">
                <PictureOutlined />
                <span>{{ level.maxCount }} 张</span>
              </div>
            </div>
            <div v-if="level.value === 0" class="level-badge free">免费</div>
          </div>
        </div>
      </a-form-item>

      <a-form-item style="margin-top: 24px; margin-bottom: 0">
        <a-button
          type="primary"
          html-type="submit"
          :loading="loading"
          block
          size="large"
          class="submit-btn"
        >
          {{ route.query?.id ? '保存修改' : '立即创建' }}
        </a-button>
      </a-form-item>
    </a-form>
  </CenterContainer>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import {
  addSpaceUsingPost,
  getSpaceVoByIdUsingGet,
  listSpaceLevelUsingGet,
  updateSpaceUsingPost,
} from '@/api/spaceController.ts'
import { useRoute, useRouter } from 'vue-router'
import { SPACE_TYPE_ENUM, SPACE_TYPE_MAP } from '@/constants/space.ts'
import { formatSize } from '../utils'
import CenterContainer from '@/components/CenterContainer.vue'
import {
  TeamOutlined,
  FolderOutlined,
  CloudOutlined,
  ThunderboltOutlined,
  RocketOutlined,
  DatabaseOutlined,
  PictureOutlined,
} from '@ant-design/icons-vue'

const space = ref<API.SpaceVO>()
const spaceForm = reactive<API.SpaceAddRequest>({
  spaceLevel: 0,
})
const loading = ref(false)

const route = useRoute()
const router = useRouter()

// 空间类别，默认为私有空间
const spaceType = computed(() => {
  if (route.query?.type) {
    return Number(route.query.type)
  } else {
    return SPACE_TYPE_ENUM.PRIVATE
  }
})

const spaceLevelList = ref<API.SpaceLevel[]>([])

// 选择套餐级别
const selectLevel = (level: API.SpaceLevel) => {
  spaceForm.spaceLevel = level.value
}

// 获取空间级别
const fetchSpaceLevelList = async () => {
  const res = await listSpaceLevelUsingGet()
  if (res.data.code === 0 && res.data.data) {
    spaceLevelList.value = res.data.data
  } else {
    message.error('获取空间级别失败，' + res.data.message)
  }
}

/**
 * 提交表单
 */
const handleSubmit = async () => {
  const spaceId = space.value?.id
  loading.value = true
  let res
  if (spaceId) {
    res = await updateSpaceUsingPost({
      id: spaceId,
      ...spaceForm,
    })
  } else {
    res = await addSpaceUsingPost({
      ...spaceForm,
      spaceType: spaceType.value,
    })
  }
  if (res.data.code === 0 && res.data.data) {
    message.success('操作成功')
    if (spaceId) {
      // 修改模式：跳转到空间管理页面
      router.push('/admin/spaceManage')
    } else {
      // 创建模式：跳转到空间详情页面
      router.push({
        path: `/space/${res.data.data}`,
      })
    }
  } else {
    message.error('操作失败，' + res.data.message)
  }
  loading.value = false
}

// 获取老数据
const getOldSpace = async () => {
  const id = route.query?.id
  if (id) {
    const idValue: string = Array.isArray(id) ? id[0] : (id as string)
    const res = await getSpaceVoByIdUsingGet({ id: idValue })
    if (res.data.code === 0 && res.data.data) {
      const data = res.data.data
      space.value = data
      spaceForm.spaceName = data.spaceName
      spaceForm.spaceLevel = data.spaceLevel
    }
  }
}

onMounted(() => {
  fetchSpaceLevelList()
  getOldSpace()
})
</script>

<style scoped>
.page-title {
  margin: 0 0 28px 0;
  font-size: 22px;
  font-weight: 600;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-icon {
  color: #059669;
}

.space-form {
  width: 100%;
}

.form-input :deep(input) {
  border-radius: 12px;
}

.level-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.level-card {
  position: relative;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  padding: 20px 16px;
  text-align: center;
  cursor: pointer;
  transition: all 200ms ease;
}

.level-card:hover {
  border-color: #059669;
  background: #f0fdf4;
}

.level-card.active {
  border-color: #059669;
  background: #f0fdf4;
  box-shadow: 0 0 0 4px rgba(5, 150, 105, 0.1);
}

.level-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 12px;
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.level-name {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 12px;
}

.level-specs {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.spec-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  color: #6b7280;
}

.level-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #6b7280;
  color: white;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
}

.level-badge.free {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
}

.submit-btn {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  border: none;
  border-radius: 12px;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
}

.submit-btn:hover {
  background: linear-gradient(135deg, #047857 0%, #059669 100%);
}

/* 响应式 */
@media (max-width: 600px) {
  .level-cards {
    grid-template-columns: 1fr;
  }
}
</style>
