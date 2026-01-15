<template>
  <div id="globalSider" v-if="loginUserStore.loginUser.id">
    <div class="sider-container">
      <!-- 主菜单区域 -->
      <div class="menu-section">
        <a-tooltip
          v-for="item in fixedMenuItems"
          :key="item.key"
          :title="item.label"
          placement="right"
        >
          <div
            class="menu-item"
            :class="{ active: current.includes(item.key) }"
            @click="doMenuClick(item.key)"
          >
            <component :is="item.icon" />
          </div>
        </a-tooltip>
      </div>

      <!-- 团队空间区域 -->
      <div v-if="teamSpaceList.length > 0" class="team-section">
        <div class="section-divider"></div>
        <div class="section-label">团队</div>
        <a-tooltip
          v-for="spaceUser in teamSpaceList"
          :key="spaceUser.spaceId"
          :title="spaceUser.space?.spaceName"
          placement="right"
        >
          <div
            class="menu-item team-item"
            :class="{ active: current.includes('/space/' + spaceUser.spaceId) }"
            @click="doMenuClick('/space/' + spaceUser.spaceId)"
          >
            <span class="team-avatar">{{
              spaceUser.space?.spaceName?.charAt(0) ?? 'T'
            }}</span>
          </div>
        </a-tooltip>
      </div>

      <!-- 底部用户头像 -->
      <div class="user-section">
        <a-tooltip title="个人中心" placement="right">
          <div class="user-avatar" @click="doMenuClick('/user/profile')">
            <a-avatar
              :src="loginUserStore.loginUser.userAvatar"
              :size="36"
            >
              <template #icon>
                <UserOutlined />
              </template>
            </a-avatar>
          </div>
        </a-tooltip>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watchEffect } from 'vue'
import {
  PictureOutlined,
  TeamOutlined,
  UserOutlined,
  BulbOutlined,
  FolderOutlined,
} from '@ant-design/icons-vue'
import { useRouter } from 'vue-router'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'
import { SPACE_TYPE_ENUM } from '@/constants/space.ts'
import { listMyTeamSpaceUsingPost } from '@/api/spaceUserController.ts'
import { message } from 'ant-design-vue'

const loginUserStore = useLoginUserStore()

// 固定的菜单列表
const fixedMenuItems = [
  {
    key: '/',
    icon: PictureOutlined,
    label: '公共图库',
  },
  {
    key: '/image_generation',
    icon: BulbOutlined,
    label: 'AI创作',
  },
  {
    key: '/my_space',
    label: '我的空间',
    icon: FolderOutlined,
  },
  {
    key: '/add_space?type=' + SPACE_TYPE_ENUM.TEAM,
    label: '创建团队',
    icon: TeamOutlined,
  },
]

const teamSpaceList = ref<API.SpaceUserVO[]>([])

// 加载团队空间列表
const fetchTeamSpaceList = async () => {
  const res = await listMyTeamSpaceUsingPost()
  if (res.data.code === 0 && res.data.data) {
    teamSpaceList.value = res.data.data
  } else {
    message.error('加载我的团队空间失败，' + res.data.message)
  }
}

/**
 * 监听变量，改变时触发数据的重新加载
 */
watchEffect(() => {
  // 登录才加载
  if (loginUserStore.loginUser.id) {
    fetchTeamSpaceList()
  }
})

const router = useRouter()
// 当前要高亮的菜单项
const current = ref<string[]>([])
// 监听路由变化，更新高亮菜单项
router.afterEach((to) => {
  const path = to.path
  // 检查是否是创建空间页面
  if (path === '/add_space') {
    const type = to.query.type
    if (String(type) === '1') {
      // 创建团队空间，高亮"创建团队"菜单项
      current.value = ['/add_space?type=' + SPACE_TYPE_ENUM.TEAM]
    } else {
      // 创建私有空间，高亮"我的空间"菜单项
      current.value = ['/my_space']
    }
  } else if (path.startsWith('/space/')) {
    // 检查是否是空间详情页
    const spaceId = path.replace('/space/', '')
    // 检查是否是团队空间
    const isTeamSpace = teamSpaceList.value.some(
      (item) => String(item.spaceId) === spaceId
    )
    if (isTeamSpace) {
      // 团队空间，高亮对应的团队空间项
      current.value = [path]
    } else {
      // 私有空间，高亮"我的空间"菜单项
      current.value = ['/my_space']
    }
  } else {
    current.value = [path]
  }
})

// 路由跳转事件
const doMenuClick = (key: string) => {
  router.push(key)
}
</script>

<style scoped>
#globalSider {
  position: fixed;
  left: 16px;
  top: 80px;
  height: calc(100vh - 96px);
  z-index: 100;
}

.sider-container {
  width: 64px;
  height: 100%;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 24px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
  display: flex;
  flex-direction: column;
  padding: 12px 0;
}

/* 降级方案 */
@supports not (backdrop-filter: blur(10px)) {
  .sider-container {
    background: rgba(255, 255, 255, 0.95);
  }
}

.menu-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
}

.menu-item {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  cursor: pointer;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  color: #6b7280;
  font-size: 20px;
}

.menu-item:hover {
  background: rgba(5, 150, 105, 0.1);
  color: #059669;
}

.menu-item.active {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
}

.team-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  flex: 1;
  overflow-y: auto;
}

.section-divider {
  width: 32px;
  height: 1px;
  background: #e5e7eb;
  margin: 4px 0;
}

.section-label {
  font-size: 10px;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.team-item {
  background: #f3f4f6;
}

.team-avatar {
  font-size: 14px;
  font-weight: 600;
  color: #059669;
}

.user-section {
  margin-top: auto;
  display: flex;
  justify-content: center;
  padding: 8px 0;
  border-top: 1px solid rgba(229, 231, 235, 0.5);
}

.user-avatar {
  cursor: pointer;
  transition: transform 200ms ease;
}

.user-avatar:hover {
  transform: scale(1.1);
}

/* 隐藏滚动条但保持滚动功能 */
.team-section::-webkit-scrollbar {
  width: 0;
  display: none;
}
</style>
