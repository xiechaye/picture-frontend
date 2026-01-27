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
