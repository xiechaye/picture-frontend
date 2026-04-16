<template>
  <div id="globalHeader">
    <a-row :wrap="false" align="middle" class="header-row">
      <!-- 移动端汉堡菜单按钮 -->
      <a-col v-if="isMobile" flex="auto">
        <a-button class="hamburger-btn" type="text" @click="openDrawer">
          <MenuOutlined />
        </a-button>
      </a-col>

      <!-- Logo -->
      <a-col :flex="isMobile ? 'auto' : '200px'" :class="{ 'mobile-logo': isMobile }">
        <router-link to="/" @click="handleLogoClick">
          <div class="title-bar">
            <img class="logo" src="../assets/logo.svg" alt="logo" />
            <div v-if="!isMobile" class="title">茶叶云图库</div>
          </div>
        </router-link>
      </a-col>

      <!-- 桌面端水平菜单 -->
      <a-col v-if="!isMobile" flex="auto">
        <a-menu
          v-model:selectedKeys="current"
          mode="horizontal"
          :items="headerItems"
          :key="teamSpaceList.length"
          @click="doMenuClick"
        />
      </a-col>

      <!-- 用户信息展示栏 -->
      <a-col flex="0 0 auto" :class="{ 'mobile-user': isMobile }">
        <div class="user-login-status">
          <div v-if="loginUserStore.loginUser.id">
            <a-dropdown placement="bottomLeft">
              <a-space :size="isMobile ? 4 : 8" class="user-trigger">
                <a-avatar :size="isMobile ? 28 : 32" :src="loginUserStore.loginUser.userAvatar" />
                <span v-if="!isMobile" class="user-name">{{
                  loginUserStore.loginUser.userName ?? '无名'
                }}</span>
              </a-space>
              <template #overlay>
                <a-menu>
                  <a-menu-item>
                    <router-link to="/user/profile">
                      <UserOutlined />
                      个人信息
                    </router-link>
                  </a-menu-item>
                  <a-menu-item>
                    <router-link to="/my_space">
                      <InboxOutlined />
                      我的空间
                    </router-link>
                  </a-menu-item>
                  <a-menu-item @click="doLogout">
                    <LogoutOutlined />
                    退出
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>
          <div v-else>
            <a-button type="primary" href="/user/login">登录</a-button>
          </div>
        </div>
      </a-col>
    </a-row>

    <!-- 移动端导航抽屉 -->
    <a-drawer
      v-if="isMobile"
      v-model:open="drawerVisible"
      placement="left"
      :closable="false"
      :width="280"
      class="mobile-drawer"
      :body-style="{ padding: 0, display: 'flex', flexDirection: 'column' }"
    >
      <!-- 抽屉头部 -->
      <div class="drawer-header">
        <div class="drawer-title">
          <img class="drawer-logo" src="../assets/logo.svg" alt="logo" />
          <span class="drawer-title-text">茶叶云图库</span>
        </div>
        <a-button type="text" class="drawer-close-btn" @click="closeDrawer">
          <CloseOutlined />
        </a-button>
      </div>

      <!-- 抽屉内容区域 -->
      <div class="drawer-content">
        <!-- 用户信息卡片 -->
        <div v-if="loginUserStore.loginUser.id" class="user-card">
          <a-avatar :size="48" :src="loginUserStore.loginUser.userAvatar" />
          <div class="user-card-info">
            <div class="user-card-name">{{ loginUserStore.loginUser.userName ?? '无名' }}</div>
            <div class="user-card-role">{{ getRoleText(loginUserStore.loginUser.userRole) }}</div>
          </div>
        </div>

        <!-- 导航菜单 -->
        <div class="drawer-menu-section">
          <div class="section-title">导航</div>
          <a-menu
            v-model:selectedKeys="current"
            v-model:openKeys="openKeys"
            mode="inline"
            :items="mobileMenuItems"
            @click="handleMobileMenuClick"
            class="drawer-menu"
          />
        </div>
      </div>

      <!-- 抽屉底部用户操作 -->
      <div v-if="loginUserStore.loginUser.id" class="drawer-footer">
        <a-menu mode="inline" class="footer-menu" @click="handleFooterMenuClick">
          <a-menu-item key="/user/profile">
            <UserOutlined />
            <span>个人信息</span>
          </a-menu-item>
          <a-menu-item key="/my_space">
            <InboxOutlined />
            <span>我的空间</span>
          </a-menu-item>
          <a-menu-item key="logout" class="logout-item">
            <LogoutOutlined />
            <span>退出登录</span>
          </a-menu-item>
        </a-menu>
      </div>

      <!-- 未登录提示 -->
      <div v-else class="drawer-footer">
        <a-button type="primary" block href="/user/login" @click="closeDrawer">
          登录 / 注册
        </a-button>
      </div>
    </a-drawer>
  </div>
</template>

<script lang="ts" setup>
import { computed, h, ref, watchEffect, watch } from 'vue'
import {
  HomeOutlined,
  LogoutOutlined,
  UserOutlined,
  InboxOutlined,
  BulbOutlined,
  FolderOutlined,
  TeamOutlined,
  AppstoreOutlined,
  BgColorsOutlined,
  MenuOutlined,
  CloseOutlined,
} from '@ant-design/icons-vue'
import type { MenuProps } from 'ant-design-vue'
import { message } from 'ant-design-vue'
import { useRouter, useRoute } from 'vue-router'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'
import { userLogoutUsingPost } from '@/api/userController.ts'
import { SPACE_TYPE_ENUM } from '@/constants/space.ts'
import { listMyTeamSpaceUsingPost } from '@/api/spaceUserController.ts'
import { useBreakpoint } from '@/composables/useBreakpoint.ts'

const loginUserStore = useLoginUserStore()
const router = useRouter()
const route = useRoute()

// 移动端断点检测
const { isMobile } = useBreakpoint(768)

// 移动端抽屉状态
const drawerVisible = ref(false)

// 移动端子菜单展开状态
const openKeys = ref<string[]>([])

const openDrawer = () => {
  drawerVisible.value = true
}

const closeDrawer = () => {
  drawerVisible.value = false
}

const handleLogoClick = () => {
  if (isMobile.value) {
    closeDrawer()
  }
}

// 获取角色文本
const getRoleText = (role: string) => {
  const roleMap: Record<string, string> = {
    admin: '管理员',
    user: '普通用户',
  }
  return roleMap[role] || '用户'
}

// 团队空间列表
const teamSpaceList = ref<API.SpaceUserVO[]>([])

// 加载团队空间列表
const fetchTeamSpaceList = async () => {
  try {
    const res = await listMyTeamSpaceUsingPost()
    if (res.data.code === 0) {
      teamSpaceList.value = res.data.data ?? []
      return res.data.data
    }
  } catch (e) {
    // 忽略错误
  }
  return null
}

// 监听登录状态变化，加载团队空间
watchEffect(() => {
  const { id, userRole } = loginUserStore.loginUser
  if (id && userRole !== 'admin') {
    fetchTeamSpaceList()
  }
})

// 监听路由变化，刷新团队空间列表
watch(
  () => route.path,
  () => {
    const { id, userRole } = loginUserStore.loginUser
    if (id && userRole !== 'admin') {
      fetchTeamSpaceList()
    }
  }
)

// 判断是否是管理员
const isAdminUser = computed(() => {
  const { userRole } = loginUserStore.loginUser
  return userRole === 'admin'
})

// 管理员菜单项
const adminMenuItems = [
  {
    key: '/',
    icon: () => h(HomeOutlined),
    label: '主页',
    title: '主页',
  },
  {
    key: '/add_picture',
    label: '上传图片',
    title: '上传图片',
  },
  {
    key: '/admin/userManage',
    label: '用户管理',
    title: '用户管理',
  },
  {
    key: '/admin/pictureManage',
    label: '图片管理',
    title: '图片管理',
  },
  {
    key: '/admin/spaceManage',
    label: '空间管理',
    title: '空间管理',
  },
  {
    key: '/admin/promptManage',
    label: '提示词管理',
    title: '提示词管理',
  },
]

// 普通用户菜单项
const userMenuItems = computed(() => {
  const items: MenuProps['items'] = [
    {
      key: '/',
      icon: () => h(HomeOutlined),
      label: '主页',
      title: '主页',
    },
    {
      key: '/add_picture',
      label: '上传图片',
      title: '上传图片',
    },
    {
      key: '/image_generation',
      icon: () => h(BulbOutlined),
      label: 'AI 创作',
      title: 'AI 创作',
    },
    {
      key: '/ai_picture_edit',
      icon: () => h(BgColorsOutlined),
      label: 'AI 编辑',
      title: 'AI 编辑',
    },
    {
      key: '/my_space',
      icon: () => h(FolderOutlined),
      label: '我的空间',
      title: '我的空间',
    },
  ]

  // 添加团队空间下拉菜单（分类显示）
  // 始终显示团队空间菜单项，保持菜单结构稳定
  // 分组：我创建的和我加入的
  const createdSpaces = teamSpaceList.value.filter((s) => s.spaceRole === 'admin')
  const joinedSpaces = teamSpaceList.value.filter((s) => s.spaceRole !== 'admin')

  // 构建嵌套菜单结构
  const teamChildren: MenuProps['items'] = []

  // 我创建的团队
  if (createdSpaces.length > 0) {
    teamChildren.push({
      type: 'group',
      label: '我创建的',
      children: createdSpaces.map((spaceUser) => ({
        key: `/space/${spaceUser.spaceId}`,
        label: spaceUser.space?.spaceName ?? '未命名空间',
        title: spaceUser.space?.spaceName ?? '未命名空间',
      })),
    })
  }

  // 我加入的团队
  if (joinedSpaces.length > 0) {
    teamChildren.push({
      type: 'group',
      label: '我加入的',
      children: joinedSpaces.map((spaceUser) => ({
        key: `/space/${spaceUser.spaceId}`,
        label: spaceUser.space?.spaceName ?? '未命名空间',
        title: spaceUser.space?.spaceName ?? '未命名空间',
      })),
    })
  }

  // 始终添加团队空间菜单项，如果没有团队空间则显示提示
  items.push({
    key: 'team',
    icon: () => h(TeamOutlined),
    label: '团队空间',
    title: '团队空间',
    children: teamChildren.length > 0 ? teamChildren : [{ key: '_empty_', label: '暂无团队空间', disabled: true }],
  })

  // 添加创建团队菜单
  items.push({
    key: '/add_space?type=' + SPACE_TYPE_ENUM.TEAM,
    icon: () => h(AppstoreOutlined),
    label: '创建团队',
    title: '创建团队',
  })

  return items
})

// 根据用户角色返回不同的菜单项
const headerItems = computed(() => {
  return isAdminUser.value ? adminMenuItems : userMenuItems.value
})

// 移动端菜单项（扁平化的团队空间）
const mobileMenuItems = computed(() => {
  const items: MenuProps['items'] = [
    {
      key: '/',
      icon: () => h(HomeOutlined),
      label: '主页',
    },
    {
      key: '/add_picture',
      icon: () => h(AppstoreOutlined),
      label: '上传图片',
    },
    {
      key: '/image_generation',
      icon: () => h(BulbOutlined),
      label: 'AI 创作',
    },
    {
      key: '/ai_picture_edit',
      icon: () => h(BgColorsOutlined),
      label: 'AI 编辑',
    },
    {
      key: '/my_space',
      icon: () => h(FolderOutlined),
      label: '我的空间',
    },
  ]

  // 移动端：扁平化团队空间列表（始终显示，保持菜单结构稳定）
  // 添加团队空间分隔符
  items.push({
    type: 'divider',
  })

  // 添加团队空间标题
  items.push({
    key: '_team_header_',
    icon: () => h(TeamOutlined),
    label: '团队空间',
    disabled: true,
  })

  // 直接列出所有团队空间，不使用分组
  if (teamSpaceList.value.length > 0) {
    teamSpaceList.value.forEach((spaceUser) => {
      items.push({
        key: `/space/${spaceUser.spaceId}`,
        icon: () => h(TeamOutlined),
        label: spaceUser.space?.spaceName ?? '未命名空间',
      })
    })
  } else {
    // 没有团队空间时显示提示
    items.push({
      key: '_no_team_',
      label: '暂无团队空间',
      disabled: true,
      style: { color: '#999', fontSize: '12px' },
    })
  }

  // 添加创建团队
  items.push({
    key: '/add_space?type=' + SPACE_TYPE_ENUM.TEAM,
    icon: () => h(AppstoreOutlined),
    label: '创建团队',
  })

  return items
})

// 当前要高亮的菜单项
const current = ref<string[]>([])

// 更新菜单高亮状态
const updateCurrentHighlight = (path: string) => {
  if (path.startsWith('/space/')) {
    const spaceId = path.replace('/space/', '')
    const isTeamSpace = teamSpaceList.value.some(
      (item) => String(item.spaceId) === spaceId
    )
    if (isTeamSpace) {
      current.value = [path]
    } else {
      current.value = ['/my_space']
    }
  } else if (path === '/add_space') {
    const type = route.query.type
    if (String(type) === '1') {
      current.value = ['/add_space?type=' + SPACE_TYPE_ENUM.TEAM]
    } else {
      current.value = ['/my_space']
    }
  } else {
    current.value = [path]
  }
}

// 监听路由变化，更新高亮菜单项
router.afterEach((to) => {
  const path = to.path
  if (isAdminUser.value) {
    current.value = [path]
  } else {
    updateCurrentHighlight(path)
  }
})

// 桌面端路由跳转事件
const doMenuClick = ({ key }: { key: string }) => {
  // 如果 key 包含查询参数，直接使用字符串形式保留参数
  if (key.includes('?')) {
    router.push(key)
  } else {
    router.push({ path: key })
  }
}

// 移动端菜单点击处理
const handleMobileMenuClick = ({ key }: { key: string }) => {
  // 如果是子菜单标题（如 team），不关闭抽屉
  if (key === 'team') {
    return
  }

  // 关闭抽屉并导航
  closeDrawer()

  if (key.includes('?')) {
    router.push(key)
  } else {
    router.push({ path: key })
  }
}

// 移动端底部菜单点击处理
const handleFooterMenuClick = ({ key }: { key: string }) => {
  if (key === 'logout') {
    doLogout()
    return
  }

  closeDrawer()
  router.push({ path: key })
}

// 用户注销
const doLogout = async () => {
  const res = await userLogoutUsingPost()
  if (res.data.code === 0) {
    loginUserStore.setLoginUser({
      userName: '未登录',
    })
    message.success('退出登录成功')
    closeDrawer()
    await router.push('/user/login')
  } else {
    message.error('退出登录失败，' + res.data.message)
  }
}
</script>

<style scoped>
#globalHeader {
  background: white;
}

.header-row {
  height: 64px;
}

/* 移动端导航栏优化 */
@media (max-width: 767px) {
  #globalHeader {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }

  .header-row {
    height: calc(56px + env(safe-area-inset-top, 0px));
    padding: 0 16px;
    padding-top: env(safe-area-inset-top, 0px);
  }

  /* 汉堡菜单按钮 - 触摸友好 */
  .hamburger-btn {
    width: 44px;
    height: 44px;
    border-radius: 12px;
  }

  .hamburger-btn:active {
    background: rgba(46, 125, 50, 0.1);
  }
}

#globalHeader .title-bar {
  display: flex;
  align-items: center;
}

.title {
  color: black;
  font-size: 18px;
  margin-left: 16px;
  font-weight: 500;
}

.logo {
  height: 48px;
}

.user-login-status {
  white-space: nowrap;
  display: flex;
  justify-content: flex-end;
  padding-right: 16px;
}

.user-name {
  font-size: 14px;
}

.user-trigger {
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.user-trigger:hover {
  background-color: #f5f5f5;
}

/* 移动端样式 */
.mobile-logo {
  display: none;
}

.mobile-user {
  min-width: auto !important;
  padding-right: 8px;
}

.mobile-user .user-login-status {
  padding-right: 0;
  display: flex;
  align-items: center;
}

/* 移动端登录按钮 */
.mobile-user :deep(.ant-btn) {
  height: 28px !important;
  padding: 0 10px !important;
  font-size: 12px !important;
  line-height: 26px !important;
  margin: 0 !important;
}

.mobile-user :deep(.ant-btn-primary) {
  background: #2E7D32;
  border-color: #2E7D32;
}

/* 汉堡按钮 */
.hamburger-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.hamburger-btn:hover {
  background-color: #f5f5f5;
}

.hamburger-btn :deep(.anticon) {
  font-size: 20px !important;
}

/* 抽屉头部 */
.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--color-border-primary, #f0f0f0);
}

.drawer-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.drawer-logo {
  height: 28px;
}

.drawer-title-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary, #1f2937);
}

.drawer-close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.drawer-close-btn:hover {
  background-color: #f5f5f5;
}

/* 抽屉内容区域 */
.drawer-content {
  flex: 1;
  overflow-y: auto;
}

/* 用户卡片 */
.user-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  margin: 12px 16px;
  background: linear-gradient(135deg, #2E7D32 0%, #43A047 100%);
  border-radius: 12px;
  color: white;
}

.user-card-info {
  flex: 1;
  min-width: 0;
}

.user-card-name {
  font-size: 15px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-card-role {
  font-size: 12px;
  opacity: 0.9;
  margin-top: 2px;
}

/* 抽屉菜单区域 */
.drawer-menu-section {
  padding: 8px 0;
}

.section-title {
  padding: 8px 16px;
  font-size: 12px;
  color: var(--color-text-secondary, #6b7280);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.drawer-menu {
  border: none;
}

.drawer-menu :deep(.ant-menu-item) {
  height: 44px;
  line-height: 44px;
  padding: 0 16px;
  margin: 2px 8px;
  border-radius: 8px;
}

.drawer-menu :deep(.ant-menu-item-selected) {
  background-color: #f1f8e9;
  color: #2E7D32;
}

.drawer-menu :deep(.ant-menu-item .anticon) {
  font-size: 16px;
}

.drawer-menu :deep(.ant-menu-submenu-title) {
  height: 44px;
  line-height: 44px;
  padding: 0 16px;
  margin: 2px 8px;
  border-radius: 8px;
}

/* 抽屉底部 */
.drawer-footer {
  border-top: 1px solid var(--color-border-primary, #f0f0f0);
  padding: 8px 0;
  background: #fafafa;
}

.footer-menu {
  border: none;
  background: transparent;
}

.footer-menu :deep(.ant-menu-item) {
  height: 44px;
  line-height: 44px;
  padding: 0 16px;
  margin: 2px 0;
}

.footer-menu :deep(.logout-item) {
  color: #ef4444;
}

.footer-menu :deep(.logout-item .anticon) {
  color: #ef4444;
}

.footer-menu :deep(.anticon) {
  margin-right: 8px;
}
</style>

<style>
/* 修复用户下拉菜单换行问题 - 使用全局样式 */
.ant-dropdown-menu {
  width: auto !important;
  min-width: unset !important;
}

.ant-dropdown-menu-item {
  white-space: nowrap !important;
}

.ant-dropdown-menu-item a {
  display: flex !important;
  align-items: center;
  gap: 6px;
  white-space: nowrap !important;
  font-size: 14px;
  color: #333;
}

.ant-dropdown-menu-item a:hover {
  color: #2E7D32;
}

/* 移动端抽屉覆盖样式 */
.mobile-drawer .ant-drawer-body {
  display: flex;
  flex-direction: column;
}

/* 移动端抽屉安全区域优化 */
@media (max-width: 767px) {
  .drawer-header {
    padding-top: calc(16px + env(safe-area-inset-top, 0px));
  }

  .drawer-footer {
    padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px));
  }

  /* 触摸反馈 */
  .drawer-menu :deep(.ant-menu-item):active,
  .footer-menu :deep(.ant-menu-item):active {
    background: rgba(46, 125, 50, 0.1);
    transform: scale(0.98);
  }
}
</style>
