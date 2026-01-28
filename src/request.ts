import axios from "axios";
import {message} from "ant-design-vue";

// 从环境变量获取 API 基础地址
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8123";

// 创建 Axios 实例
const myAxios = axios.create({
    baseURL: BASE_URL,
    timeout: 120000,  // 2 分钟超时，适配大文件上传
    withCredentials: true,
});

// 全局请求拦截器
myAxios.interceptors.request.use(
  function (config) {
    // 不转换 ID 字段，直接传递 string 类型（避免大数值精度丢失）
    // 后端需要支持 string 类型的 ID
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
