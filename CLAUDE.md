# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于 Electron + Vue 3 + TypeScript 的通用游戏鼠标驱动程序，支持通过 WebHID API 与游戏鼠标设备进行通信。

## 开发命令

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev          # 启动 Electron 开发模式
npm run dev:web      # 启动 Web 开发模式（仅渲染进程）
```

### 类型检查

```bash
npm run typecheck           # 检查所有 TypeScript 类型
npm run typecheck:node      # 仅检查主进程和预加载脚本
npm run typecheck:web       # 仅检查渲染进程
```

### 代码质量

```bash
npm run lint         # 运行 ESLint 检查
npm run format       # 使用 Prettier 格式化代码
```

### 构建

```bash
npm run build              # 构建所有进程代码
npm run build:unpack       # 构建并解包（不打包成安装程序）
npm run build:win          # 构建 Windows 安装程序
npm run build:mac          # 构建 macOS 安装程序
npm run build:linux        # 构建 Linux 安装程序
```

### Web 版本

```bash
npm run build:web          # 构建 Web 版本
npm run preview:web        # 预览 Web 版本构建结果
```

## 项目架构

### 三层架构

1. **主进程 (Main Process)** - `src/main/index.ts`
   - 负责创建和管理 Electron 窗口
   - 配置 WebHID 权限处理：自动授予 HID 设备访问权限
   - 处理应用生命周期事件

2. **预加载脚本 (Preload)** - `src/preload/index.ts`
   - 使用 `contextBridge` 安全地暴露 Electron API 到渲染进程
   - 当前为基础配置，可扩展自定义 API

3. **渲染进程 (Renderer)** - `src/renderer/`
   - Vue 3 单页应用
   - 使用 Composition API 和 TypeScript
   - 使用 Tailwind CSS 进行样式设计

### 核心模块

#### 设备通信层 (Composables)

**`src/renderer/src/composables/useWebHID.ts`**

- 使用 WebHID API 与 HID 设备通信
- 支持多种设备协议：Razer、Logitech、SteelSeries、通用协议
- 实现命令重试机制（默认 3 次）
- 提供设备连接、状态查询、参数设置等功能

**`src/renderer/src/protocols/`**

- 协议配置化架构，每个设备品牌独立配置文件
- `index.ts`: 协议接口定义
- `registry.ts`: 协议注册中心
- `razer.ts`, `logitech.ts`, `steelseries.ts`: 各品牌协议实现
- `generic.ts`: 通用协议（默认）

**设备协议支持**：

- 自动检测设备品牌（通过产品名称）
- 根据品牌使用不同的命令格式：
  - Razer: 命令前缀 `0x00`
  - Logitech: 命令前缀 `0x10`
  - Generic/SteelSeries: 无特殊前缀

#### 组件结构

- **`App.vue`**: 主应用组件，包含标签页导航和通知系统
- **`BasicSettings.vue`**: 基础设置（回报率、CPI/DPI）
- **`BacklightSettings.vue`**: 背光设置（模式、亮度、颜色、频率）
- **`ButtonMapping.vue`**: 按键映射配置
- **`MacroManagement.vue`**: 宏管理
- **`DeviceInfo.vue`**: 设备信息显示

### 设备通信协议

#### 命令结构

- **Set Report**: 发送命令到设备
  - 使用 USB Control Transfer Out (request 0x09)
  - 格式: `[reportId, ...commandData]`

- **Get Report**: 从设备获取数据
  - 使用 USB Control Transfer In (request 0x01)
  - 返回设备响应数据

#### 主要功能命令

- 设备信息查询: `[0x01, 0x01]`
- 电池状态: `[0x02/0x03, 0x01]` (根据协议)
- 回报率设置: `[0x03/0x04, 0x02, value]`
- CPI 设置: `[0x03/0x05, 0x04, level, value...]`
- 背光控制: `[0x04/0x06, subcommand, ...]`

### 配置文件

- **`electron.vite.config.ts`**: Electron Vite 构建配置
- **`electron-builder.yml`**: Electron Builder 打包配置
- **`tsconfig.json`**: TypeScript 根配置
- **`tsconfig.node.json`**: 主进程和预加载脚本的 TypeScript 配置
- **`tsconfig.web.json`**: 渲染进程的 TypeScript 配置
- **`eslint.config.mjs`**: ESLint 配置
- **`.prettierrc.yaml`**: Prettier 格式化配置

## 重要注意事项

### WebHID 权限处理

主进程中已配置自动授予 HID 设备权限：

```typescript
mainWindow.webContents.session.on('select-hid-device', (event, details, callback) => {
  event.preventDefault()
  if (details.deviceList && details.deviceList.length > 0) {
    callback(details.deviceList[0].deviceId)
  }
})
```

### 设备协议检测

设备协议通过产品名称自动检测，采用协议配置化架构。添加新设备只需在 `src/renderer/src/protocols/` 目录下创建新的协议配置文件并注册即可。

### 命令重试机制

所有设备通信命令都包含重试机制（默认 3 次），每次重试间隔 100ms。修改重试次数需要调整 `commandRetries` 常量。

### 类型定义

- WebHID 类型: `src/renderer/src/types/webhid.d.ts`
- 协议接口: `src/renderer/src/protocols/index.ts`

### 构建注意事项

- 构建前会自动运行类型检查
- Windows 构建需要在 Windows 系统上执行
- macOS 构建需要在 macOS 系统上执行
- 构建产物位于 `dist/` 目录

## 开发工作流

1. 修改代码后运行 `npm run lint` 检查代码质量
2. 使用 `npm run typecheck` 确保类型正确
3. 使用 `npm run dev` 测试功能
4. 提交前运行 `npm run format` 格式化代码
5. 构建前确保所有检查通过
