<template>
  <div id="app">
    <a-config-provider :locale="zhCN" :theme="theme">
      <BasicLayout />
    </a-config-provider>
  </div>
</template>

<script setup lang="ts">
import zhCN from 'ant-design-vue/es/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
dayjs.locale('zh-cn');

import BasicLayout from '@/layouts/BasicLayout.vue'

// 茶叶云图库 - 主题配置
const theme = {
  token: {
    colorPrimary: '#2E7D32',
    colorSuccess: '#43A047',
    colorWarning: '#F9A825',
    colorError: '#D32F2F',
    colorInfo: '#1976D2',
    colorText: '#1F2937',
    colorTextSecondary: '#6B7280',
    colorBorder: '#E0E0E0',
    borderRadius: 8,
  },
}
</script>

<style scoped></style>

<style>
/* 移动端全局优化 */
@media (max-width: 768px) {
  /* 防止文本大小调整 */
  * {
    -webkit-text-size-adjust: 100%;
    -moz-text-size-adjust: 100%;
    text-size-adjust: 100%;
  }

  /* 移除点击高亮 */
  * {
    -webkit-tap-highlight-color: transparent;
  }

  /* 平滑滚动 */
  html,
  body {
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
  }

  /* 增大按钮触摸区域 */
  .ant-btn {
    min-height: 40px;
    min-height: 44px;
  }

  /* 优化输入框 */
  .ant-input,
  .ant-select-selector {
    min-height: 40px !important;
  }

  /* 优化卡片间距 */
  .ant-card {
    margin-bottom: 12px;
  }

  /* 优化表格在移动端的显示 */
  .ant-table {
    font-size: 13px;
  }

  .ant-table-thead > tr > th,
  .ant-table-tbody > tr > td {
    padding: 8px 12px;
  }

  /* 优化模态框 */
  .ant-modal {
    max-width: calc(100vw - 32px);
    margin: 16px auto;
  }

  .ant-modal-body {
    max-height: 70vh;
    overflow-y: auto;
  }

  /* 优化抽屉 */
  .ant-drawer-body {
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
}

/* 超小屏幕优化 */
@media (max-width: 480px) {
  .ant-col {
    margin-bottom: 8px;
  }

  /* 表单项全宽 */
  .ant-form-item {
    margin-bottom: 16px;
  }
}
</style>
