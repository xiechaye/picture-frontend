<template>
  <div id="globalHeader">
    <div class="header-inner">
      <router-link to="/" class="brand-link" aria-label="返回首页">
        <div class="title-bar">
          <img class="logo" src="../assets/logo.svg" alt="茶叶云图库 logo" />
          <div class="title">茶叶云图库</div>
        </div>
      </router-link>

      <div class="desktop-menu">
        <a-menu
          v-model:selectedKeys="current"
          mode="horizontal"
          :items="headerItems"
          @click="doMenuClick"
          aria-label="主导航菜单"
        />
      </div>

      <div class="right-actions">
        <a-button
          class="mobile-menu-trigger"
          type="text"
          aria-label="打开导航菜单"
          @click="mobileMenuOpen = true"
        >
          <MenuOutlined />
        </a-button>

        <div class="user-login-status">
          <div v-if="loginUserStore.loginUser.id">
            <a-dropdown placement="bottomRight">
              <a-space>
                <a-avatar :src="loginUserStore.loginUser.userAvatar" />
                <span class="user-name">{{ loginUserStore.loginUser.userName ?? '无名' }}</span>
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
      </div>
    </div>

    <a-drawer
      v-model:open="mobileMenuOpen"
      title="导航菜单"
      placement="right"
      :width="260"
      class="mobile-nav-drawer"
    >
      <a-menu
        v-model:selectedKeys="current"
        mode="inline"
        :items="headerItems"
        @click="doMobileMenuClick"
        aria-label="移动端导航菜单"
      />
    </a-drawer>
  </div>
</template>

<script lang="ts" setup>
import { computed, h, ref, watch, watchEffect } from 'vue'
import {
  AppstoreOutlined,
  BulbOutlined,
  FolderOutlined,
  HomeOutlined,
  InboxOutlined,
  LogoutOutlined,
  MenuOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import type { MenuProps } from 'ant-design-vue'
import { useRoute, useRouter } from 'vue-router'
import { listMyTeamSpaceUsingPost } from '@/api/spaceUserController.ts'
import { userLogoutUsingPost } from '@/api/userController.ts'
import { SPACE_TYPE_ENUM } from '@/constants/space.ts'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'

const loginUserStore = useLoginUserStore()
const router = useRouter()
const route = useRoute()
const mobileMenuOpen = ref(false)

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
    console.error('加载团队空间列表失败', e)
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
  },
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
      key: '/my_space',
      icon: () => h(FolderOutlined),
      label: '我的空间',
      title: '我的空间',
    },
  ]

  // 添加团队空间下拉菜单（分类显示）
  if (teamSpaceList.value.length > 0) {
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

    if (teamChildren.length > 0) {
      items.push({
        key: 'team',
        icon: () => h(TeamOutlined),
        label: '团队空间',
        title: '团队空间',
        children: teamChildren,
      })
    }
  }

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

// 当前要高亮的菜单项
const current = ref<string[]>([])

// 更新菜单高亮状态
const updateCurrentHighlight = (path: string) => {
  if (path.startsWith('/space/')) {
    const spaceId = path.replace('/space/', '')
    const isTeamSpace = teamSpaceList.value.some((item) => String(item.spaceId) === spaceId)
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
  mobileMenuOpen.value = false
})

// 路由跳转事件
const doMenuClick = ({ key }: { key: string }) => {
  if (key.includes('?')) {
    router.push(key)
  } else {
    router.push({ path: key })
  }
}

const doMobileMenuClick = ({ key }: { key: string }) => {
  doMenuClick({ key })
  mobileMenuOpen.value = false
}

// 用户注销
const doLogout = async () => {
  const res = await userLogoutUsingPost()
  if (res.data.code === 0) {
    loginUserStore.setLoginUser({
      userName: '未登录',
    })
    message.success('退出登录成功')
    await router.push('/user/login')
  } else {
    message.error('退出登录失败，' + res.data.message)
  }
}
</script>

<style scoped>
#globalHeader {
  width: 100%;
}

.header-inner {
  min-height: var(--layout-header-height);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.brand-link {
  color: inherit;
  flex-shrink: 0;
}

.title-bar {
  display: flex;
  align-items: center;
  min-width: 0;
}

.title {
  color: var(--color-text-primary);
  font-size: 18px;
  font-weight: 600;
  margin-left: var(--spacing-md);
  white-space: nowrap;
}

.logo {
  height: 44px;
}

.desktop-menu {
  flex: 1;
  min-width: 0;
}

.right-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-left: auto;
}

.mobile-menu-trigger {
  display: none;
  color: var(--color-text-primary);
}

.user-login-status {
  white-space: nowrap;
  display: flex;
  justify-content: flex-end;
  min-width: 0;
}

.user-name {
  display: inline-block;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-nav-drawer :deep(.ant-drawer-body) {
  padding: var(--spacing-sm);
}

@media (max-width: 900px) {
  .desktop-menu {
    display: none;
  }

  .mobile-menu-trigger {
    display: inline-flex;
  }

  .title {
    font-size: 16px;
    margin-left: var(--spacing-sm);
  }

  .logo {
    height: 38px;
  }
}

@media (max-width: 576px) {
  .title {
    display: none;
  }

  .user-name {
    max-width: 72px;
  }
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
  color: var(--color-text-primary);
}

.ant-dropdown-menu-item a:hover {
  color: var(--color-primary);
}
</style>
