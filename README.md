# WebHID-yhh 通用游戏鼠标驱动

基于 Electron + Vue 3 + TypeScript 的跨平台游戏鼠标驱动程序，支持通过 WebHID API 与多种品牌游戏鼠标进行通信和配置。

## 技术栈

| 技术             | 版本    |
| ---------------- | ------- |
| Node.js          | 24.x    |
| Electron         | ^38.1.2 |
| Vue              | ^3.5.21 |
| TypeScript       | ^5.9.2  |
| Vite             | ^7.1.6  |
| Tailwind CSS     | ^4.1.17 |
| Electron Vite    | ^4.0.1  |
| Electron Builder | ^25.1.8 |

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发运行

```bash
npm run dev
```

### 构建部署

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

---

## 🔌 如何对接第三方硬件设备协议

### 一、WebHID 协议说明

本项目**仅支持 WebHID 协议**。

**WebHID 协议特点：**

- 使用 HID Input/Output Reports 进行通信
- 支持标准 HID 设备和 Vendor-defined usage page (0xFFxx)
- 通过 `sendReport` 发送命令，监听 `inputreport` 事件接收响应
- 浏览器原生支持，无需特殊固件

**厂商需提供：**

- **WebHID 协议文档**
- **HID 报告描述符**（Report Descriptor）
- **Vendor-defined usage page**（通常为 0xFFxx）
- **命令格式规范**（Report ID、数据格式、响应格式）
- **功能命令列表**（电池、回报率、DPI、背光等）

**WebHID 通信流程：**

```typescript
// 1. 请求设备
const devices = await navigator.hid.requestDevice({ filters: [] })
const device = devices[0]

// 2. 打开设备
await device.open()

// 3. 监听输入报告
device.addEventListener('inputreport', (event) => {
  const { data, reportId } = event
  console.log('收到报告:', reportId, new Uint8Array(data.buffer))
})

// 4. 发送输出报告
await device.sendReport(reportId, data)
```

### 二、协议对接核心文件

主要对接文件位于：

- **`src/renderer/src/protocols/index.ts`** - 协议配置接口定义
- **`src/renderer/src/protocols/razer.ts`** - Razer 协议实现示例
- **`src/renderer/src/protocols/logitech.ts`** - Logitech 协议实现示例
- **`src/renderer/src/protocols/registry.ts`** - 协议注册中心
- **`src/renderer/src/composables/useWebHID.ts`** - WebHID 通信层

### 三、协议配置化架构

本项目采用**协议配置化**架构，每个设备品牌的协议独立配置，易于维护和扩展。

#### 协议配置接口

```typescript
// src/renderer/src/protocols/index.ts
export interface DeviceProtocol {
  name: string // 协议名称
  identify: (device: HIDDevice) => boolean // 设备识别函数

  commands: {
    getDeviceInfo: number[] // 获取设备信息命令
    getBattery: number[] // 获取电池状态命令
    getReportRate: number[] // 获取回报率命令
    getCPI: number[] // 获取 CPI 命令
    getBacklight: number[] // 获取背光模式命令

    setReportRate: (rate: number) => number[] // 设置回报率
    setCPI: (level: number, value: number) => number[] // 设置 CPI
    setBacklightMode: (mode: number) => number[] // 设置背光模式
    setBacklightBrightness: (brightness: number) => number[] // 设置背光亮度
    setBacklightFrequency: (frequency: number) => number[] // 设置背光频率
    setBacklightColor: (r: number, g: number, b: number) => number[] // 设置背光颜色
  }

  parsers: {
    deviceInfo: (response: Uint8Array) => {
      name: string
      model: string
      firmwareVersion: string
    }
    battery: (response: Uint8Array) => number // 解析电池电量
    reportRate: (response: Uint8Array) => number // 解析回报率
    cpi: (response: Uint8Array) => number // 解析 CPI
    backlight: (response: Uint8Array) => number // 解析背光模式
  }
}
```

### 四、对接新设备的完整步骤

#### 步骤 1：获取硬件协议文档

向硬件厂商索取以下信息：

- **USB VID/PID**（用于设备识别）
- **HID 报告描述符**（Report Descriptor）
- **Vendor-defined usage page**（如 0xFF00）
- **Report ID 定义**
- **命令格式规范**（每个功能的命令格式）
- **响应数据格式**（每个功能的响应解析方式）
- **功能命令列表**（电池、回报率、DPI、背光等）

> **重要**：确保厂商提供的是 **WebHID 协议**，包含 HID Interface + Vendor-defined usage page (0xFFxx)。

#### 步骤 2：创建协议配置文件

在 `src/renderer/src/protocols/` 目录下创建新的协议文件，例如 `newdevice.ts`：

```typescript
// src/renderer/src/protocols/newdevice.ts
import { DeviceProtocol } from './index'

export const newDeviceProtocol: DeviceProtocol = {
  name: 'NewDevice',

  // 设备识别：通过设备名称或 VID/PID
  identify: (device: HIDDevice) => {
    const productName = device.productName?.toLowerCase() || ''
    return (
      productName.includes('newdevice') ||
      (device.vendorId === 0x1234 && device.productId === 0x5678)
    )
  },

  // 命令定义
  commands: {
    getDeviceInfo: [0x01, 0x01],
    getBattery: [0x02, 0x01],
    getReportRate: [0x03, 0x01],
    getCPI: [0x03, 0x03],
    getBacklight: [0x04, 0x01],

    setReportRate: (rate: number) => {
      // 根据协议文档转换回报率值
      const rateMap: Record<number, number> = {
        125: 0x08,
        250: 0x04,
        500: 0x02,
        1000: 0x01
      }
      return [0x03, 0x02, rateMap[rate] || 0x01]
    },

    setCPI: (level: number, value: number) => {
      // 根据协议文档组装 CPI 命令
      const levelIndex = level - 1
      const valueHigh = (value >> 8) & 0xff
      const valueLow = value & 0xff
      return [0x03, 0x04, levelIndex, valueHigh, valueLow]
    },

    setBacklightMode: (mode: number) => [0x04, 0x02, mode],

    setBacklightBrightness: (brightness: number) => {
      const brightnessValue = Math.round((brightness / 100) * 255)
      return [0x04, 0x03, brightnessValue]
    },

    setBacklightFrequency: (frequency: number) => [0x04, 0x04, frequency],

    setBacklightColor: (r: number, g: number, b: number) => [0x04, 0x05, r, g, b]
  },

  // 响应解析器
  parsers: {
    deviceInfo: (response: Uint8Array) => {
      // 根据协议文档解析设备信息
      const name = String.fromCharCode(...Array.from(response.slice(0, 8))).replace(/\0/g, '')
      const model = String.fromCharCode(...Array.from(response.slice(8, 12))).replace(/\0/g, '')
      const firmwareVersion = `${response[12]}.${response[13]}.${response[14]}`
      return { name, model, firmwareVersion }
    },

    battery: (response: Uint8Array) => {
      // 根据协议文档解析电池电量（假设在第 0 字节）
      return response[0]
    },

    reportRate: (response: Uint8Array) => {
      // 根据协议文档解析回报率
      const rateMap: Record<number, number> = {
        0x08: 125,
        0x04: 250,
        0x02: 500,
        0x01: 1000
      }
      return rateMap[response[0]] || 1000
    },

    cpi: (response: Uint8Array) => {
      // 根据协议文档解析 CPI（假设为大端序）
      return (response[1] << 8) | response[2]
    },

    backlight: (response: Uint8Array) => {
      // 根据协议文档解析背光模式
      return response[0]
    }
  }
}
```

#### 步骤 3：注册协议

在 `src/renderer/src/protocols/registry.ts` 中注册新协议：

```typescript
// src/renderer/src/protocols/registry.ts
import { DeviceProtocol } from './index'
import { razerProtocol } from './razer'
import { logitechProtocol } from './logitech'
import { newDeviceProtocol } from './newdevice' // 导入新协议

export const protocolRegistry: DeviceProtocol[] = [
  razerProtocol,
  logitechProtocol,
  newDeviceProtocol // 注册新协议
]

export function detectProtocol(device: HIDDevice): DeviceProtocol | undefined {
  return protocolRegistry.find((protocol) => protocol.identify(device))
}
```

#### 步骤 4：测试验证

1. 连接实际硬件设备
2. 打开浏览器开发者工具查看控制台日志
3. 测试每个功能（连接、查询、设置）
4. 验证命令发送和响应接收是否正确

### 五、协议对接示例

假设要对接 "RocketMouse" 品牌鼠标，协议如下：

- 电池查询：`[0x10, 0x01]`，响应第 0 字节为电量
- 回报率设置：`[0x11, 0x02, rate]`
- CPI 设置：`[0x12, 0x03, level, cpi_high, cpi_low]`
- 背光控制：`[0x13, 0x02, mode]`

**实现代码：**

```typescript
// src/renderer/src/protocols/rocketmouse.ts
import { DeviceProtocol } from './index'

export const rocketMouseProtocol: DeviceProtocol = {
  name: 'RocketMouse',

  identify: (device: HIDDevice) => {
    return device.productName?.toLowerCase().includes('rocketmouse') || false
  },

  commands: {
    getDeviceInfo: [0x01, 0x01],
    getBattery: [0x10, 0x01],
    getReportRate: [0x11, 0x01],
    getCPI: [0x12, 0x01],
    getBacklight: [0x13, 0x01],

    setReportRate: (rate: number) => {
      const rateMap: Record<number, number> = {
        125: 0x01,
        250: 0x02,
        500: 0x04,
        1000: 0x08
      }
      return [0x11, 0x02, rateMap[rate] || 0x08]
    },

    setCPI: (level: number, value: number) => {
      const levelIndex = level - 1
      const valueHigh = (value >> 8) & 0xff
      const valueLow = value & 0xff
      return [0x12, 0x03, levelIndex, valueHigh, valueLow]
    },

    setBacklightMode: (mode: number) => [0x13, 0x02, mode],
    setBacklightBrightness: (brightness: number) => [
      0x13,
      0x03,
      Math.round((brightness / 100) * 255)
    ],
    setBacklightFrequency: (frequency: number) => [0x13, 0x04, frequency],
    setBacklightColor: (r: number, g: number, b: number) => [0x13, 0x05, r, g, b]
  },

  parsers: {
    deviceInfo: (response: Uint8Array) => ({
      name: String.fromCharCode(...Array.from(response.slice(0, 8))).replace(/\0/g, ''),
      model: String.fromCharCode(...Array.from(response.slice(8, 12))).replace(/\0/g, ''),
      firmwareVersion: `${response[12]}.${response[13]}.${response[14]}`
    }),
    battery: (response: Uint8Array) => response[0],
    reportRate: (response: Uint8Array) => {
      const rateMap: Record<number, number> = { 0x01: 125, 0x02: 250, 0x04: 500, 0x08: 1000 }
      return rateMap[response[0]] || 1000
    },
    cpi: (response: Uint8Array) => (response[1] << 8) | response[2],
    backlight: (response: Uint8Array) => response[0]
  }
}
```

然后在 `registry.ts` 中注册：

```typescript
import { rocketMouseProtocol } from './rocketmouse'

export const protocolRegistry: DeviceProtocol[] = [
  razerProtocol,
  logitechProtocol,
  rocketMouseProtocol // 添加 RocketMouse 协议
]
```

---

## 🔧 协议配置化架构优势

### 1. 代码清晰，易于维护

- 每个设备协议独立文件
- 命令和解析逻辑集中管理
- 避免 if-else 嵌套

### 2. 添加新设备简单

- 只需创建新的协议配置文件
- 在注册中心注册即可
- 无需修改业务逻辑代码

### 3. 便于测试和文档化

- 每个协议可以独立测试
- 协议配置即文档
- 易于生成协议对照表

### 4. 支持协议继承和复用

- 可以创建基础协议类
- 相似协议可以继承复用
- 减少重复代码

### 项目结构

```
src/renderer/src/
├── protocols/
│   ├── index.ts          # 协议接口定义
│   ├── registry.ts       # 协议注册中心
│   ├── razer.ts          # Razer 协议
│   ├── logitech.ts       # Logitech 协议
│   ├── steelseries.ts    # SteelSeries 协议
│   └── generic.ts        # 通用协议（默认）
├── composables/
│   └── useWebHID.ts      # WebHID 通信层
└── components/
    ├── BasicSettings.vue
    ├── BacklightSettings.vue
    └── ...
```

---

## 📝 开发建议

1. **获取完整协议文档**：与硬件厂商充分沟通，获取详细的 WebHID 通信协议文档
2. **使用日志调试**：开发时打开浏览器控制台，查看所有命令和响应的十六进制日志
3. **逐步测试**：先实现设备连接和信息查询，再逐步添加其他功能
4. **错误处理**：注意处理设备断开、命令失败等异常情况
5. **协议版本**：某些设备可能有多个固件版本，协议可能不同，需要做版本检测
6. **HID 报告描述符**：确保设备使用 Vendor-defined usage page (0xFFxx)，否则可能被浏览器拦截

---

## ⚠️ WebHID 协议要求

### 设备固件要求

设备必须满足以下条件才能被 WebHID 访问：

1. **HID Interface**：设备必须有 HID 接口（Interface Class = 3）
2. **Vendor-defined usage page**：使用 0xFFxx 范围的 usage page
3. **Report Descriptor**：正确配置 HID 报告描述符

### 常见问题

**Q: 设备连接后无法通信？**

- 检查设备是否使用 Vendor-defined usage page (0xFFxx)
- 查看浏览器控制台是否有权限错误
- 确认 Report ID 是否正确

**Q: 如何查看设备的 HID 报告描述符？**

- Windows: 使用 USB Device Tree Viewer
- macOS: 使用 USB Prober
- Linux: 使用 `lsusb -v`

**Q: 浏览器提示设备被保护？**

- 标准 HID 设备（鼠标、键盘）的某些功能可能被浏览器保护
- 确保使用 Vendor-defined usage page (0xFFxx)

### 厂商注意事项

如果您的设备固件需要支持 WebHID：

1. 配置 HID 报告描述符，使用 Vendor-defined usage page (0xFFxx)
2. 提供详细的 WebHID 协议文档
3. 提供 Report ID 和数据格式说明
4. 提供测试设备和技术支持

---

## 许可证

MIT License

## 联系方式

博巨矽科技有限公司
