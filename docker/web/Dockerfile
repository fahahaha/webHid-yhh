# 多阶段构建 Dockerfile
# 阶段 1: 构建应用
FROM node:20-alpine AS builder

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建 Web 应用
RUN npm run build:web

# 阶段 2: 生产环境
FROM nginx:alpine

# 复制自定义 nginx 配置
COPY docker/web/nginx.conf /etc/nginx/conf.d/default.conf

# 从构建阶段复制打包好的文件
COPY --from=builder /app/dist-web /usr/share/nginx/html

# 暴露端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
