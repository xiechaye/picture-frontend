# 使用轻量级的nginx镜像作为基础镜像
FROM nginx:alpine
WORKDIR /app

# 复制构建后的文件到nginx服务目录
COPY dist /usr/share/nginx/html

# 复制自定义的nginx配置文件（如果需要）
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露80端口
EXPOSE 80

# 运行nginx前台进程
CMD ["nginx", "-g", "daemon off;"]


