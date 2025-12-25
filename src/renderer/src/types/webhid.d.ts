// WebHID API 类型定义
interface HIDDevice {
  opened: boolean
  vendorId: number
  productId: number
  productName: string
  collections: HIDCollectionInfo[]
  open(): Promise<void>
  close(): Promise<void>
  sendReport(reportId: number, data: BufferSource): Promise<void>
  sendFeatureReport(reportId: number, data: BufferSource): Promise<void>
  receiveFeatureReport(reportId: number): Promise<DataView>
  addEventListener(type: 'inputreport', listener: (event: HIDInputReportEvent) => void): void
  removeEventListener(type: 'inputreport', listener: (event: HIDInputReportEvent) => void): void
}

interface HIDCollectionInfo {
  usagePage: number
  usage: number
  type: number
  children: HIDCollectionInfo[]
  inputReports: HIDReportInfo[]
  outputReports: HIDReportInfo[]
  featureReports: HIDReportInfo[]
}

interface HIDReportInfo {
  reportId: number
  items: HIDReportItem[]
}

interface HIDReportItem {
  isAbsolute: boolean
  isArray: boolean
  isBufferedBytes: boolean
  isConstant: boolean
  isLinear: boolean
  isRange: boolean
  isVolatile: boolean
  hasNull: boolean
  hasPreferredState: boolean
  wrap: boolean
  usages: number[]
  usageMinimum: number
  usageMaximum: number
  reportSize: number
  reportCount: number
  unitExponent: number
  unitSystem: number
  unitFactorLengthExponent: number
  unitFactorMassExponent: number
  unitFactorTimeExponent: number
  unitFactorTemperatureExponent: number
  unitFactorCurrentExponent: number
  unitFactorLuminousIntensityExponent: number
  logicalMinimum: number
  logicalMaximum: number
  physicalMinimum: number
  physicalMaximum: number
  strings: string[]
}

interface HIDInputReportEvent extends Event {
  device: HIDDevice
  reportId: number
  data: DataView
}

interface HIDConnectionEvent extends Event {
  device: HIDDevice
}

interface HIDDeviceFilter {
  vendorId?: number
  productId?: number
  usagePage?: number
  usage?: number
}

interface HIDDeviceRequestOptions {
  filters: HIDDeviceFilter[]
}

interface HID extends EventTarget {
  getDevices(): Promise<HIDDevice[]>
  requestDevice(options: HIDDeviceRequestOptions): Promise<HIDDevice[]>
  addEventListener(
    type: 'connect' | 'disconnect',
    listener: (event: HIDConnectionEvent) => void
  ): void
  removeEventListener(
    type: 'connect' | 'disconnect',
    listener: (event: HIDConnectionEvent) => void
  ): void
}

interface Navigator {
  hid: HID
}

// USB 类型定义（用于 controlTransfer）
type USBRequestType = 'standard' | 'class' | 'vendor'
type USBRecipient = 'device' | 'interface' | 'endpoint' | 'other'

interface USBControlTransferParameters {
  requestType: USBRequestType
  recipient: USBRecipient
  request: number
  value: number
  index: number
}

interface USBInTransferResult {
  data: DataView
  status: 'ok' | 'stall' | 'babble'
}

interface USBOutTransferResult {
  bytesWritten: number
  status: 'ok' | 'stall'
}

// 扩展 HIDDevice 以支持 USB 控制传输
interface HIDDevice {
  controlTransferIn(
    setup: USBControlTransferParameters,
    length: number
  ): Promise<USBInTransferResult>
  controlTransferOut(
    setup: USBControlTransferParameters,
    data?: BufferSource
  ): Promise<USBOutTransferResult>
}
