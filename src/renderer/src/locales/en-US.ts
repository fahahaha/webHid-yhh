export default {
  common: {
    connect: 'Connect Device',
    connected: 'Device Connected',
    disconnected: 'Device Disconnected',
    save: 'Save',
    reset: 'Reset',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    edit: 'Edit',
    apply: 'Apply',
    unsupported: 'Not Supported'
  },
  header: {
    title: 'Universal Gaming Mouse Driver',
    subtitle: 'Support Multiple Gaming Mice',
    connectionMode: {
      label: 'Mode',
      usb: 'USB',
      wireless: '2.4G'
    }
  },
  footer: {
    version: 'Universal Gaming Mouse Driver v1.0.1',
    copyright: '© 2026 Bojuxi Technology Co., Ltd. All Rights Reserved'
  },
  tabs: {
    basic: 'Basic Settings',
    backlight: 'Backlight',
    buttons: 'Button Mapping',
    device: 'Device Info'
  },
  deviceStatus: {
    battery: 'Battery',
    reportRate: 'Report Rate',
    dpi: 'Current DPI',
    backlight: 'Backlight Mode'
  },
  basicSettings: {
    reportRate: {
      title: 'Report Rate',
      description: 'Adjust mouse report rate, higher rate provides smoother cursor movement',
      notSupported: 'Current device does not support report rate settings'
    },
    dpi: {
      title: 'DPI Settings',
      description: 'Adjust mouse sensitivity, higher DPI means faster cursor movement',
      level: 'DPI Level',
      current: 'Current DPI',
      levelOption: 'Level {level} - {value} DPI',
      supportedCount: '({count} levels supported)',
      notSupported: 'Current device does not support DPI settings'
    },
    scrollDirection: {
      title: 'Scroll Direction',
      description: 'Set mouse wheel scroll direction',
      normal: 'Normal',
      reverse: 'Reverse',
      normalHint: 'Scroll down to move page down',
      reverseHint: 'Scroll down to move page up',
      notSupported: 'Current device does not support scroll direction settings'
    }
  },
  backlightSettings: {
    mode: {
      title: 'Backlight Mode',
      description: 'Select mouse LED backlight effect mode',
      off: 'Off',
      on: 'Always On',
      breathing: 'Breathing',
      apm: 'APM Mode',
      spectrum: 'Full Spectrum',
      notSupported: 'Current device does not support backlight'
    },
    color: {
      title: 'Backlight Color & Brightness',
      description: 'Customize mouse backlight color and brightness',
      colorLabel: 'Backlight Color',
      colorPlaceholder: 'Hex color value',
      brightness: 'Brightness',
      frequency: 'Breathing Frequency',
      frequencyLabels: ['Very Slow', 'Slow', 'Medium', 'Fast', 'Very Fast'],
      notSupported: 'Current device does not support backlight color and brightness settings'
    }
  },
  buttonMapping: {
    title: 'Mouse Button Customization',
    description: 'Customize mouse button functions, can be set to mouse functions, multimedia keys or keyboard combinations',
    buttonNames: ['Left Button (Button 1)', 'Right Button (Button 2)', 'Middle Button (Button 3)', 'Forward (Button 4)', 'Back (Button 5)'],
    leftKeyDisabled: 'Left button cannot be modified',
    restoreDefault: 'Restore Default',
    resetAll: 'Reset All Buttons',
    resetAllConfirm: 'Are you sure you want to reset all buttons to default settings?',
    resetAllSuccess: 'All buttons have been reset to default settings',
    tabs: {
      mouse: 'Mouse Functions',
      multimedia: 'Multimedia',
      keyboard: 'Keyboard Keys',
      macro: 'Macro'
    },
    keyboard: {
      modifiers: 'Modifiers (Multiple Selection)',
      selectKey: 'Select Key',
      selectKeyPlaceholder: '-- Select a key --',
      saveKey: 'Save Key',
      groups: {
        alphabet: 'Alphabet Keys',
        number: 'Number Keys',
        function: 'Function Keys',
        special: 'Special Keys'
      }
    },
    macro: {
      list: 'Macro List',
      listHint: 'Manage your macros, up to 10 macros can be saved',
      empty: 'No macros yet, click "New Macro" to start creating',
      newMacro: 'New Macro',
      deleteMacro: 'Delete Selected Macro',
      deleteConfirm: 'Are you sure you want to delete {name}? This action cannot be undone.',
      maxReached: 'Maximum of {max} macros can be created',
      record: 'Macro Recording',
      startRecord: 'Start Recording',
      stopRecord: 'Stop Recording',
      recording: 'Recording... Please perform your actions, then click "Stop Recording"',
      connectFirst: 'Please connect device first',
      selectFirst: 'Please select or create a macro first',
      eventList: 'Macro Event List',
      emptyEvents: 'Recorded macro events will be displayed here',
      deleteSelected: 'Delete Selected',
      clearAll: 'Clear All',
      clearAllConfirm: 'Are you sure you want to clear all events?',
      saveToDevice: 'Save Macro to Device',
      saveSuccess: '{name} saved',
      saveError: 'Failed to save to device: {message}',
      eventEmpty: 'Macro events cannot be empty',
      nameEmpty: 'Macro name cannot be empty',
      selectMacro: 'Please select a macro first',
      keyDown: 'Down',
      keyUp: 'Up',
      delay: 'Delay {ms}ms',
      eventCount: '{count} events',
      binding: {
        title: 'Bind Macro to Current Button',
        selectMacro: 'Select macro to bind',
        selectMacroPlaceholder: '-- Select a macro --',
        loopMode: 'Loop Mode',
        loopRelease: 'Loop until button release',
        loopAnykey: 'Loop until any key press',
        loopCount: 'Loop specified times',
        loopCountLabel: 'Loop Count (1-65535)',
        loopCountPlaceholder: 'Enter loop count',
        bindToButton: 'Bind to Button {button}'
      }
    }
  },
  deviceInfo: {
    title: 'Device Information',
    name: 'Device Name',
    model: 'Device Model',
    firmwareVersion: 'Firmware Version',
    connectionType: 'Connection Type',
    vidPid: 'VID/PID',
    protocol: 'Device Protocol',
    status: 'Device Status',
    statusConnected: 'Connected',
    statusDisconnected: 'Disconnected',
    battery: {
      title: 'Battery & Maintenance',
      level: 'Battery Level',
      notCharging: 'Not Charging',
      notConnected: 'Device Not Connected',
      checkUpdate: 'Check Firmware Update',
      checkingUpdate: 'Checking for firmware updates...\n\nCurrent firmware is up to date, no update needed',
      restoreDefaults: 'Restore Factory Settings',
      restoreConfirm: 'Are you sure you want to restore factory settings? This will clear all custom settings and restore default values.',
      restoring: 'Restoring factory settings...',
      restoreSuccess: 'Factory settings restored successfully'
    }
  },
  notification: {
    connectSuccess: 'Connection Successful',
    connectFailed: 'Connection Failed'
  }
}
