<template>
  <div id="globalHeader">
    <a-row :wrap="false">
      <a-col flex="200px">
        <router-link to="/">
          <div class="title-bar">
            <img class="logo" src="../assets/logo.svg" alt="logo" />
            <div class="title">茶叶云图库</div>
          </div>
        </router-link>
      </a-col>
      <a-col flex="auto">
        <a-menu
          v-model:selectedKeys="current"
          mode="horizontal"
          :items="headerItems"
          @click="doMenuClick"
        />
      </a-col>
      <!-- 用户信息展示栏 -->
      <a-col flex="0 0 auto">
        <div class="user-login-status">
          <div v-if="loginUserStore.loginUser.id">
            <a-dropdown>
              <a-space>
                <a-avatar :src="loginUserStore.loginUser.userAvatar" />
                {{ loginUserStore.loginUser.userName ?? '无名' }}
              </a-space>
              <template #overlay>
                <a-menu>
                  <a-menu-item>
                    <router-link to="/user/profile">
                      <UserOutlined />
                      我的信息
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
                    退出登录
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
} from '@ant-design/icons-vue'
import type { MenuProps } from 'ant-design-vue'
import { message } from 'ant-design-vue'
import { useRouter, useRoute } from 'vue-router'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'
import { userLogoutUsingPost } from '@/api/userController.ts'
import { SPACE_TYPE_ENUM } from '@/constants/space.ts'
import { listMyTeamSpaceUsingPost } from '@/api/spaceUserController.ts'

const loginUserStore = useLoginUserStore()
const router = useRouter()
const route = useRoute()

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

// 路由跳转事件
const doMenuClick = ({ key }: { key: string }) => {
  // 如果 key 包含查询参数，直接使用字符串形式保留参数
  if (key.includes('?')) {
    router.push(key)
  } else {
    router.push({ path: key })
  }
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
#globalHeader .title-bar {
  display: flex;
  align-items: center;
}

.title {
  color: black;
  font-size: 18px;
  margin-left: 16px;
}

.logo {
  height: 48px;
}

.user-login-status {
  white-space: nowrap;
  display: flex;
  justify-content: flex-end;
}
</style>
