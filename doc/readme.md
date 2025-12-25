好的，我直接给出完整的项目分析结果：



------

# WebHID 游戏鼠标驱动程序 - 项目分析文档

## 一、技术栈

| 技术              | 版本    | 用途                       | 学习地址                                                    |
| ----------------- | ------- | -------------------------- | ----------------------------------------------------------- |
| **Electron**      | ^38.1.2 | 桌面应用框架               | https://www.electronjs.org/docs                             |
| **Vue 3**         | ^3.5.21 | 前端框架 (Composition API) | https://cn.vuejs.org/guide/introduction.html                |
| **TypeScript**    | ^5.9.2  | 类型安全                   | https://www.typescriptlang.org/docs/                        |
| **Vite**          | ^7.1.6  | 构建工具                   | https://cn.vitejs.dev/guide/                                |
| **electron-vite** | ^4.0.1  | Electron + Vite 集成       | https://electron-vite.org/                                  |
| **WebHID API**    | -       | HID 设备通信               | https://developer.mozilla.org/en-US/docs/Web/API/WebHID_API |
| **Font Awesome**  | ^7.1.0  | 图标库                     | https://fontawesome.com/docs                                |
| **Nginx**         | alpine  | Web 部署服务器             | https://nginx.org/en/docs/                                  |
| **Docker**        | -       | 容器化部署                 | https://docs.docker.com/                                    |

------

## 二、项目结构



```
webhid-bojuxi/
├── src/
│   ├── main/                          # Electron 主进程
│   │   └── index.ts                   # 窗口创建、WebHID 权限处理
│   ├── preload/                       # 预加载脚本
│   │   ├── index.ts                   # contextBridge API 暴露
│   │   └── index.d.ts                 # 类型声明
│   └── renderer/                      # 渲染进程 (Vue 应用)
│       ├── index.html                 # 入口 HTML
│       └── src/
│           ├── main.ts                # Vue 应用入口
│           ├── App.vue                # 主应用组件
│           ├── assets/                # 静态资源 (CSS、图片)
│           ├── components/            # Vue 组件
│           │   ├── BasicSettings.vue      # 基础设置 (回报率、DPI、滚轮)
│           │   ├── BacklightSettings.vue  # 背光设置
│           │   ├── ButtonMapping.vue      # 按键映射 + 宏管理
│           │   ├── DeviceInfo.vue         # 设备信息显示
│           │   └── Versions.vue           # 版本信息
│           ├── composables/           # Vue Composables
│           │   ├── useWebHID.ts           # WebHID 设备通信核心
│           │   ├── useI18n.ts             # 国际化
│           │   ├── useTheme.ts            # 主题切换
│           │   └── useMacroStorage.ts     # 宏存储管理
│           ├── protocols/             # 设备协议层 ⭐
│           │   ├── index.ts               # 协议接口定义
│           │   ├── registry.ts            # 协议注册中心
│           │   ├── yhh.ts                 # YJX/银火狐鼠标协议
│           │   └── generic.ts             # 通用默认协议
│           ├── config/                # 配置
│           │   └── buttonMappings.ts      # 按键映射配置
│           ├── locales/               # 国际化语言包
│           │   ├── zh-CN.ts
│           │   └── en-US.ts
│           └── types/                 # 类型定义
│               └── webhid.d.ts
├── docker/
│   └── web/                           # Web 版 Docker 部署
│       ├── Dockerfile
│       ├── docker-compose.yml
│       └── nginx.conf
├── electron.vite.config.ts            # Electron Vite 配置
├── vite.web.config.ts                 # Web 版 Vite 配置
├── tsconfig.json                      # TypeScript 根配置
├── tsconfig.node.json                 # 主进程 TS 配置
├── tsconfig.web.json                  # 渲染进程 TS 配置
└── package.json
```

------

## 三、核心组件说明

### 3.1 主进程 ([src/main/index.ts](vscode-webview://1if8l8no1ef4mf0msac3holi7jnne7n28fppc2pjhcu2nj4pi028/src/main/index.ts))

- 创建 Electron 窗口
- **WebHID 权限自动授予**：通过 `select-hid-device` 事件自动选择设备
- 优先选择目标设备 (VID: 0xA8A4, PID: 0x2255)

### 3.2 渲染进程组件

| 组件                  | 文件                                                         | 功能                                 |
| --------------------- | ------------------------------------------------------------ | ------------------------------------ |
| **App.vue**           | [src/renderer/src/App.vue](vscode-webview://1if8l8no1ef4mf0msac3holi7jnne7n28fppc2pjhcu2nj4pi028/src/renderer/src/App.vue) | 主布局、导航、设备状态概览、通知系统 |
| **BasicSettings**     | [src/renderer/src/components/BasicSettings.vue](vscode-webview://1if8l8no1ef4mf0msac3holi7jnne7n28fppc2pjhcu2nj4pi028/src/renderer/src/components/BasicSettings.vue) | 回报率、DPI 档位、滚轮方向设置       |
| **BacklightSettings** | [src/renderer/src/components/BacklightSettings.vue](vscode-webview://1if8l8no1ef4mf0msac3holi7jnne7n28fppc2pjhcu2nj4pi028/src/renderer/src/components/BacklightSettings.vue) | 背光模式、亮度、颜色、频率           |
| **ButtonMapping**     | [src/renderer/src/components/ButtonMapping.vue](vscode-webview://1if8l8no1ef4mf0msac3holi7jnne7n28fppc2pjhcu2nj4pi028/src/renderer/src/components/ButtonMapping.vue) | 8 键映射、键盘快捷键、宏录制与绑定   |
| **DeviceInfo**        | [src/renderer/src/components/DeviceInfo.vue](vscode-webview://1if8l8no1ef4mf0msac3holi7jnne7n28fppc2pjhcu2nj4pi028/src/renderer/src/components/DeviceInfo.vue) | 设备名称、固件版本、VID/PID          |

### 3.3 Composables

| Composable          | 功能                                          |
| ------------------- | --------------------------------------------- |
| **useWebHID**       | 核心通信层：设备连接、命令发送/接收、状态管理 |
| **useI18n**         | 中英文国际化，支持嵌套 key 和参数替换         |
| **useTheme**        | 深色/浅色主题切换，localStorage 持久化        |
| **useMacroStorage** | 宏录制、存储、编码                            |

------

## 四、协议层架构 (protocols/) ⭐

这是支持多设备的**核心设计**。



### 4.1 协议接口 ([src/renderer/src/protocols/index.ts](vscode-webview://1if8l8no1ef4mf0msac3holi7jnne7n28fppc2pjhcu2nj4pi028/src/renderer/src/protocols/index.ts))



```typescript
interface DeviceProtocol {
  name: string                           // 协议名称
  identify: (device: HIDDevice) => boolean  // 设备识别函数
  commands: {                            // 命令定义
    getDeviceInfo: number[]
    getBattery: number[]
    getDPI: number[]
    setDPI: (level, value, scrollDirection?) => number[]
    setButtonMapping?: (mappings) => number[]
    // ... 更多命令
  }
  parsers: {                             // 响应解析器
    deviceInfo: (response) => { name, model, firmwareVersion }
    battery: (response) => number
    dpi: (response) => { value, level }
    // ... 更多解析器
  }
  features?: {                           // 设备特性配置
    supportedDPI?: number[]
    supportedReportRates?: number[]
    buttonCount?: number
    hasRGB?: boolean
    hasMacro?: boolean
    // ...
  }
}
```

### 4.2 协议注册 ([src/renderer/src/protocols/registry.ts](vscode-webview://1if8l8no1ef4mf0msac3holi7jnne7n28fppc2pjhcu2nj4pi028/src/renderer/src/protocols/registry.ts))



```typescript
export const protocolRegistry: DeviceProtocol[] = [
  yhhProtocol,      // YJX/银火狐鼠标 (优先匹配)
  genericProtocol   // 通用协议 (兜底)
]

export function detectProtocol(device: HIDDevice): DeviceProtocol {
  return protocolRegistry.find(p => p.identify(device)) || genericProtocol
}
```

### 4.3 YHH 协议示例 ([src/renderer/src/protocols/yhh.ts](vscode-webview://1if8l8no1ef4mf0msac3holi7jnne7n28fppc2pjhcu2nj4pi028/src/renderer/src/protocols/yhh.ts))

- **设备识别**：通过 `productName` 包含 "usb mouse"、"yjx"、"yhh"
- **协议特征**：发送包头 `0x55`，接收包头 `0xAA`
- **支持功能**：6 档 DPI (1000-12800)、8 键映射、滚轮方向、宏功能

------

## 五、运行与部署

### 5.1 开发环境



```bash
# 1. 安装依赖
npm install

# 2. 类型检查
npm run typecheck

# 3. 启动开发模式
npm run dev          # Electron 桌面应用
npm run dev:web      # Web 版 (localhost:5173)
```

### 5.2 构建



```bash
# Web 版构建 (输出到 dist-web/)
npm run build:web

# Windows 桌面版构建
npm run build:win
```

### 5.3 Web 版 Docker 部署

**首次部署：**





```bash
# 1. 构建 Web 版
npm run build:web

# 2. 进入 docker 目录
cd docker/web

# 3. 构建并启动容器
docker-compose up -d --build

# 访问 http://localhost:8080
```

**更新部署：**





```bash
# 1. 拉取最新代码
git pull

# 2. 重新构建 Web 版
npm run build:web

# 3. 重新构建并重启容器
cd docker/web
docker-compose up -d --build

# 或者如果只更新了前端代码，可以直接复制文件
docker cp ../../dist-web/. webhid-bojuxi-web:/usr/share/nginx/html/
```

**Docker 配置说明：**



- 端口映射：`8080:80`
- 容器名：`webhid-bojuxi-web`
- Nginx 配置：Gzip 压缩、SPA 路由支持、静态资源缓存

------

1. 