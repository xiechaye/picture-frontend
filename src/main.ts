import { createApp } from 'vue'
import { createPinia } from 'pinia'
import type { ThemeConfig } from 'ant-design-vue/es/config-provider/context'

import App from './App.vue'
import router from './router'
import Antd from 'ant-design-vue'
import VueCropper from 'vue-cropper'
import 'vue-cropper/dist/index.css'
import 'ant-design-vue/dist/reset.css'
import '@/access.ts'
import '@/styles/variables.css'

// 茶叶云图库 - Ant Design 主题配置
const theme: ThemeConfig = {
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

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(Antd)
app.use(VueCropper)

app.mount('#app')
