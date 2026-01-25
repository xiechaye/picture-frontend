<template>
  <div class="admin-page-container">
    <!-- 页面头部 -->
    <div v-if="title || $slots.extra" class="page-header">
      <div class="page-title-section">
        <h1 class="page-title">{{ title }}</h1>
        <p v-if="description" class="page-description">{{ description }}</p>
      </div>
      <div v-if="$slots.extra" class="page-extra">
        <slot name="extra"></slot>
      </div>
    </div>

    <!-- 页面内容 -->
    <div class="page-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string
  description?: string
}

withDefaults(defineProps<Props>(), {
  title: '',
  description: ''
})
</script>

<style scoped>
.admin-page-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 24px;
  min-height: calc(100vh - 160px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.page-title-section {
  flex: 1;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.4;
}

.page-description {
  margin: 8px 0 0 0;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
}

.page-extra {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-content {
  flex: 1;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .admin-page-container {
    padding: 16px;
    border-radius: 0;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
  }

  .page-extra {
    width: 100%;
    flex-wrap: wrap;
  }

  .page-title {
    font-size: 18px;
  }
}
</style>
