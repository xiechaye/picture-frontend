<template>
  <div id="basicLayout">
    <a-layout class="root-layout">
      <a-layout-header class="header">
        <GlobalHeader />
      </a-layout-header>
      <a-layout class="main-layout">
        <a-layout-content class="content">
          <div class="content-inner">
            <router-view />
          </div>
        </a-layout-content>
      </a-layout>
      <a-layout-footer class="footer">
        <a href="https://github.com/xiechaye" target="_blank"> 茶叶 </a>
      </a-layout-footer>
    </a-layout>
  </div>
</template>

<script setup lang="ts">
import GlobalHeader from '@/components/GlobalHeader.vue'
</script>

<style scoped>
#basicLayout .root-layout {
  min-height: 100vh;
  background: var(--color-bg-primary);
}

#basicLayout .header {
  height: var(--layout-header-height);
  display: flex;
  align-items: center;
  padding-inline: var(--spacing-md);
  background: var(--color-bg-secondary);
  color: unset;
  margin-bottom: 1px;
  position: sticky;
  top: 0;
  z-index: var(--z-header);
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
}

#basicLayout .main-layout {
  flex: 1;
  background: var(--color-bg-primary);
}

#basicLayout .content {
  padding: var(--spacing-md);
  background: var(--color-bg-primary);
}

#basicLayout .content-inner {
  max-width: var(--layout-content-max-width);
  margin: 0 auto;
  min-height: calc(100vh - var(--layout-header-height) - var(--layout-footer-height));
}

#basicLayout .footer {
  background: var(--color-bg-secondary);
  padding: var(--spacing-md);
  display: flex;
  justify-content: center;
  align-items: center;
  border-top: 1px solid var(--color-border-primary);
  min-height: var(--layout-footer-height);
}

#basicLayout .footer a {
  color: var(--color-primary);
  text-decoration: none;
  transition: color var(--transition-base);
}

#basicLayout .footer a:hover {
  color: var(--color-primary-active);
}

@media (min-width: 768px) {
  #basicLayout .header,
  #basicLayout .content {
    padding-inline: var(--spacing-lg);
  }
}
</style>
