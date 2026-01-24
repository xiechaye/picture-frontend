import axios from "axios";
import {message} from "ant-design-vue";

// 从环境变量获取 API 基础地址
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8123";

// 创建 Axios 实例
const myAxios = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    withCredentials: true,
});

// 全局请求拦截器
myAxios.interceptors.request.use(
  function (config) {
    // 自动转换 ID 字段为 number 类型（后端要求）
    if (config.data) {
      // 转换 spaceId
      if (config.data.spaceId && typeof config.data.spaceId === 'string') {
        config.data.spaceId = Number(config.data.spaceId)
      }
      // 转换 id
      if (config.data.id && typeof config.data.id === 'string') {
        config.data.id = Number(config.data.id)
      }
    }
    // 处理 URL 参数中的 ID
    if (config.params) {
      if (config.params.spaceId && typeof config.params.spaceId === 'string') {
        config.params.spaceId = Number(config.params.spaceId)
      }
      if (config.params.id && typeof config.params.id === 'string') {
        config.params.id = Number(config.params.id)
      }
    }
    return config
  },
  function (error) {
    // Do something with request error
    return Promise.reject(error)
  },
)

// 全局响应拦截器
myAxios.interceptors.response.use(
  function (response) {
    const { data } = response
    // 未登录
    if (data.code === 40100) {
      // 不是获取用户信息的请求，并且用户目前不是已经在用户登录页面，则跳转到登录页面
      if (
        !response.request.responseURL.includes('user/get/login') &&
        !window.location.pathname.includes('/user/login')
      ) {
        message.warning('请先登录')
        window.location.href = `/user/login?redirect=${window.location.href}`
      }
    }
    return response
  },
  function (error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    return Promise.reject(error)
  },
)

export default myAxios;
