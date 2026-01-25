<template>
  <div id="basicLayout">
    <a-layout style="min-height: 100vh">
      <a-layout-header class="header">
        <GlobalHeader />
      </a-layout-header>
      <a-layout class="main-layout">
        <GlobalSider />
        <a-layout-content class="content" :class="{ 'content-admin': isAdminUser }">
          <router-view />
        </a-layout-content>
      </a-layout>
      <a-layout-footer class="footer">
        <a href="https://github.com/xiechaye" target="_blank"> 茶叶 </a>
      </a-layout-footer>
    </a-layout>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import GlobalHeader from '@/components/GlobalHeader.vue'
import GlobalSider from '@/components/GlobalSider.vue'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'

const loginUserStore = useLoginUserStore()

/**
 * 判断当前用户是否是 admin
 */
const isAdminUser = computed(() => {
  const { userRole } = loginUserStore.loginUser
  return userRole === 'admin'
})
</script>

<style scoped>
#basicLayout .header {
  padding-inline: 20px;
  background: white;
  color: unset;
  margin-bottom: 1px;
  position: sticky;
  top: 0;
  z-index: 101;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
}

#basicLayout .main-layout {
  background: #f3f4f6;
}

#basicLayout .content {
  padding: 24px;
  padding-left: 104px; /* 侧边栏宽度64px + 左边距16px + 间距24px */
  background: #f3f4f6;
  margin-bottom: 60px;
  min-height: calc(100vh - 64px - 60px);
}

/* admin 用户隐藏侧边栏时的布局调整 */
#basicLayout .content.content-admin {
  padding-left: 24px;
}

#basicLayout .footer {
  background: white;
  padding: 16px;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  text-align: center;
  border-top: 1px solid #e5e7eb;
  z-index: 99;
}

#basicLayout .footer a {
  color: #059669;
  text-decoration: none;
  transition: color 200ms ease;
}

#basicLayout .footer a:hover {
  color: #047857;
}

/* 响应式：移动端隐藏侧边栏时调整内容区 */
@media (max-width: 992px) {
  #basicLayout .content {
    padding-left: 24px;
  }
}
</style>
