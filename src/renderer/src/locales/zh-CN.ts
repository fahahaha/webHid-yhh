export default {
  common: {
    connect: '连接设备',
    connected: '已连接设备',
    disconnected: '未连接设备',
    save: '保存',
    reset: '重置',
    cancel: '取消',
    confirm: '确定',
    delete: '删除',
    edit: '编辑',
    apply: '应用',
    unsupported: '不支持'
  },
  header: {
    title: '通用游戏鼠标驱动',
    subtitle: '支持多种游戏鼠标',
    connectionMode: {
      label: '连接模式',
      usb: 'USB',
      wireless: '2.4G'
    }
  },
  footer: {
    version: '通用游戏鼠标驱动程序 v1.0.1',
    copyright: '© 2026 博巨矽科技有限公司 版权所有'
  },
  tabs: {
    basic: '基础设置',
    backlight: '背光设置',
    buttons: '改键设置',
    device: '设备信息'
  },
  deviceStatus: {
    battery: '电池状态',
    reportRate: '当前回报率',
    dpi: '当前DPI',
    backlight: '背光模式'
  },
  basicSettings: {
    reportRate: {
      title: '回报率设置',
      description: '调整鼠标的回报率,更高的回报率提供更流畅的光标移动',
      notSupported: '当前设备不支持回报率设置功能'
    },
    dpi: {
      title: 'DPI 设置',
      description: '调整鼠标的灵敏度,DPI 值越高,光标移动速度越快',
      level: 'DPI 档位',
      current: '当前 DPI',
      levelOption: '档位 {level} - {value} DPI',
      supportedCount: '(支持 {count} 档)',
      notSupported: '当前设备不支持 DPI 设置功能'
    },
    scrollDirection: {
      title: '滚轮方向设置',
      description: '设置鼠标滚轮的滚动方向',
      normal: '正向',
      reverse: '反向',
      normalHint: '滚轮向下滚动时页面向下移动',
      reverseHint: '滚轮向下滚动时页面向上移动',
      notSupported: '当前设备不支持滚轮方向设置功能'
    }
  },
  backlightSettings: {
    mode: {
      title: '背光模式',
      description: '选择鼠标的LED背光效果模式',
      off: '常灭',
      on: '常亮',
      breathing: '呼吸',
      apm: 'APM模式',
      spectrum: '全光谱',
      notSupported: '当前设备不支持背光功能'
    },
    color: {
      title: '背光颜色与亮度',
      description: '自定义鼠标背光的颜色和亮度',
      colorLabel: '背光颜色',
      colorPlaceholder: '十六进制颜色值',
      brightness: '亮度',
      frequency: '呼吸频率',
      frequencyLabels: ['极慢', '慢', '中等', '快', '极快'],
      notSupported: '当前设备不支持背光颜色和亮度设置'
    }
  },
  buttonMapping: {
    title: '鼠标按键自定义',
    description: '自定义鼠标各按键的功能,可设置为鼠标功能、多媒体键或键盘组合键',
    buttonNames: ['左键(按键 1)', '右键(按键 2)', '中键(按键 3)', '前进(按键 4)', '后退(按键 5)'],
    leftKeyDisabled: '左键不允许修改',
    restoreDefault: '恢复默认',
    resetAll: '重置所有按键',
    resetAllConfirm: '确定要重置所有按键为默认设置吗?',
    resetAllSuccess: '所有按键已重置为默认设置',
    tabs: {
      mouse: '鼠标功能',
      multimedia: '多媒体',
      keyboard: '键盘按键',
      macro: '宏'
    },
    keyboard: {
      modifiers: '修饰键（可多选）',
      selectKey: '选择按键',
      selectKeyPlaceholder: '-- 请选择按键 --',
      saveKey: '保存按键',
      groups: {
        alphabet: '字母键',
        number: '数字键',
        function: '功能键',
        special: '特殊键'
      }
    },
    macro: {
      list: '宏列表',
      listHint: '管理您的宏，最多可保存10组宏',
      empty: '暂无宏，点击"新建宏"开始创建',
      newMacro: '新建宏',
      deleteMacro: '删除选中宏',
      deleteConfirm: '确定要删除{name}吗？此操作不可撤销。',
      maxReached: '最多只能创建 {max} 个宏',
      record: '宏录制',
      startRecord: '开始录制',
      stopRecord: '结束录制',
      recording: '正在录制... 请执行您的操作，完成后点击"结束录制"',
      connectFirst: '请先连接设备',
      selectFirst: '请先选择或创建一个宏',
      eventList: '宏事件列表',
      emptyEvents: '录制宏事件后将显示在这里',
      deleteSelected: '删除选中',
      clearAll: '清空全部',
      clearAllConfirm: '确定要清空所有事件吗？',
      saveToDevice: '保存宏到设备',
      saveSuccess: '{name} 已保存',
      saveError: '保存到设备失败: {message}',
      eventEmpty: '宏事件不能为空',
      nameEmpty: '宏名称不能为空',
      selectMacro: '请先选择一个宏',
      keyDown: '按下',
      keyUp: '抬起',
      delay: '延迟 {ms}ms',
      eventCount: '{count}个事件',
      binding: {
        title: '将宏绑定到当前按键',
        selectMacro: '选择要绑定的宏',
        selectMacroPlaceholder: '-- 请选择宏 --',
        loopMode: '循环模式',
        loopRelease: '循环直到按键松开',
        loopAnykey: '循环直到任意键按下',
        loopCount: '循环指定次数',
        loopCountLabel: '循环次数 (1-65535)',
        loopCountPlaceholder: '输入循环次数',
        bindToButton: '绑定到按键 {button}'
      }
    }
  },
  deviceInfo: {
    title: '设备信息',
    name: '设备名称',
    model: '设备型号',
    firmwareVersion: '固件版本',
    connectionType: '连接方式',
    vidPid: 'VID/PID',
    protocol: '设备协议',
    status: '设备状态',
    statusConnected: '已连接',
    statusDisconnected: '未连接',
    battery: {
      title: '电池与维护',
      level: '电池电量',
      notCharging: '未充电',
      notConnected: '未连接设备',
      checkUpdate: '检查固件更新',
      checkingUpdate: '正在检查固件更新...\n\n当前固件已是最新版本,无需更新',
      restoreDefaults: '恢复出厂设置',
      restoreConfirm: '确定要恢复出厂设置吗?这将清除所有自定义设置并恢复默认值。',
      restoring: '正在恢复出厂设置...',
      restoreSuccess: '已成功恢复出厂设置'
    }
  },
  notification: {
    connectSuccess: '连接成功',
    connectFailed: '连接失败'
  }
}
