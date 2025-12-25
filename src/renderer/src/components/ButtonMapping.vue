<template>
  <div class="button-mapping-container">
    <h3 class="section-title"><i class="fa fa-keyboard-o icon-primary"></i>{{ t('buttonMapping.title') }}</h3>
    <p class="section-description">{{ t('buttonMapping.description') }}</p>

    <div class="mapping-layout">
      <!-- 鼠标按键示意图 -->
      <div class="mouse-diagram mouse-mode">
        <div class="mouse-body">
          <!-- 按键标记 -->
          <button
            v-for="(_, index) in buttonMappings.slice(0, 5)"
            :key="index"
            @click="selectButton(index)"
            class="mouse-key"
            :class="['key' + index, { active: selectedButton === index, disabled: index === 0 }]"
            :disabled="index === 0"
          >
            <span class="button-label">{{ getButtonLabel(index) }}</span>
          </button>
        </div>
      </div>

      <!-- 按键功能设置 -->
      <div class="button-settings">
        <div class="settings-panel">
          <div class="panel-header">
            <h4 class="panel-title">{{ buttonNames[selectedButton] }}</h4>
            <button @click="resetButton" class="reset-button" :disabled="selectedButton === 0">
              <i class="fa fa-refresh"></i>{{ t('buttonMapping.restoreDefault') }}
            </button>
          </div>

          <div v-if="selectedButton === 0" class="disabled-notice">
            <i class="fa fa-info-circle"></i>
            {{ t('buttonMapping.leftKeyDisabled') }}
          </div>

          <div v-else class="settings-form">
            <!-- 标签页切换 -->
            <div class="tab-buttons">
              <button
                v-for="tab in tabs"
                :key="tab.id"
                @click="activeTab = tab.id"
                class="tab-button"
                :class="{ active: activeTab === tab.id }"
              >
                <i :class="tab.icon"></i>
                {{ tab.name }}
              </button>
            </div>

            <!-- 鼠标功能标签页 -->
            <div v-if="activeTab === 'mouse'" class="tab-content">
              <div class="button-grid">
                <button
                  v-for="btn in mouseButtons"
                  :key="btn.id"
                  @click="applyMapping(btn.code)"
                  class="function-button"
                  :class="{ active: isCurrentMapping(btn.code) }"
                >
                  {{ btn.name }}
                </button>
              </div>
            </div>

            <!-- 多媒体标签页 -->
            <div v-if="activeTab === 'multimedia'" class="tab-content">
              <div
                v-for="category in multimediaCategories"
                :key="category"
                class="category-section"
              >
                <h5 class="category-title">{{ category }}</h5>
                <div class="button-grid">
                  <button
                    v-for="btn in getMultimediaByCategory(category)"
                    :key="btn.id"
                    @click="applyMapping(btn.code)"
                    class="function-button"
                    :class="{ active: isCurrentMapping(btn.code) }"
                  >
                    {{ btn.name }}
                  </button>
                </div>
              </div>
            </div>

            <!-- 键盘按键标签页 -->
            <div v-if="activeTab === 'keyboard'" class="tab-content">
              <div class="keyboard-settings">
                <div class="form-group">
                  <label class="form-label">{{ t('buttonMapping.keyboard.modifiers') }}</label>
                  <div class="modifier-group">
                    <label
                      v-for="modifier in modifierKeys"
                      :key="modifier.id"
                      class="modifier-checkbox"
                    >
                      <input type="checkbox" v-model="selectedModifiers" :value="modifier.value" />
                      <span>{{ modifier.name }}</span>
                    </label>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">{{ t('buttonMapping.keyboard.selectKey') }}</label>
                  <select v-model="selectedKey" class="form-select">
                    <option value="">{{ t('buttonMapping.keyboard.selectKeyPlaceholder') }}</option>
                    <optgroup :label="t('buttonMapping.keyboard.groups.alphabet')">
                      <option v-for="key in alphabetKeys" :key="key" :value="key">
                        {{ key }}
                      </option>
                    </optgroup>
                    <optgroup :label="t('buttonMapping.keyboard.groups.number')">
                      <option v-for="key in numberKeys" :key="key" :value="key">
                        {{ key }}
                      </option>
                    </optgroup>
                    <optgroup :label="t('buttonMapping.keyboard.groups.function')">
                      <option v-for="key in functionKeys" :key="key" :value="key">
                        {{ key }}
                      </option>
                    </optgroup>
                    <optgroup :label="t('buttonMapping.keyboard.groups.special')">
                      <option v-for="key in specialKeys" :key="key" :value="key">
                        {{ key }}
                      </option>
                    </optgroup>
                  </select>
                </div>

                <button @click="applyKeyboardMapping" class="apply-button" :disabled="!selectedKey">
                  <i class="fa fa-check"></i>
                  {{ t('buttonMapping.keyboard.saveKey') }}
                </button>
              </div>
            </div>

            <!-- 宏标签页 -->
            <div v-if="activeTab === 'macro'" class="tab-content">
              <div class="macro-management-container">
                <!-- 左侧：宏列表和管理 -->
                <div class="macro-list-section">
                  <h5 class="section-subtitle">{{ t('buttonMapping.macro.list') }}</h5>
                  <p class="section-hint">{{ t('buttonMapping.macro.listHint') }}</p>

                  <div class="macro-list">
                    <div v-if="macros.length === 0" class="empty-macros">
                      <i class="fa fa-info-circle"></i>
                      {{ t('buttonMapping.macro.empty') }}
                    </div>
                    <button
                      v-else
                      v-for="(macro, index) in macros"
                      :key="index"
                      @click="selectMacroForEdit(index)"
                      class="macro-list-item"
                      :class="{ active: selectedMacroForEdit === index }"
                      :disabled="isRecording"
                    >
                      <span class="macro-item-name">{{ macro.name }}</span>
                      <span class="macro-item-count">{{ t('buttonMapping.macro.eventCount', { count: String(macro.events.length) }) }}</span>
                    </button>
                  </div>

                  <div class="macro-list-actions">
                    <button
                      @click="createNewMacro"
                      class="macro-action-btn"
                      :disabled="macros.length >= MAX_MACRO_COUNT || isRecording"
                    >
                      <i class="fa fa-plus"></i>
                      {{ t('buttonMapping.macro.newMacro') }} ({{ macros.length }}/{{ MAX_MACRO_COUNT }})
                    </button>
                    <button
                      @click="deleteSelectedMacro"
                      class="macro-action-btn delete-macro-btn"
                      :disabled="selectedMacroForEdit === null || isRecording"
                    >
                      <i class="fa fa-trash"></i>
                      {{ t('buttonMapping.macro.deleteMacro') }}
                    </button>
                  </div>
                </div>

                <!-- 右侧：宏编辑和录制 -->
                <div class="macro-edit-section">
                  <!-- 宏录制控制 -->
                  <div class="macro-record-area">
                    <h5 class="section-subtitle">
                      <i class="fa fa-circle-o-notch"></i>
                      {{ t('buttonMapping.macro.record') }}
                    </h5>

                    <button
                      @click="toggleMacroRecord"
                      :disabled="!isConnected || selectedMacroForEdit === null"
                      :class="isRecording ? 'stop-record-btn' : 'start-record-btn'"
                      class="record-control-btn"
                    >
                      <i :class="isRecording ? 'fa fa-stop' : 'fa fa-circle'"></i>
                      {{ isRecording ? t('buttonMapping.macro.stopRecord') : t('buttonMapping.macro.startRecord') }}
                    </button>

                    <div v-if="isRecording" class="recording-status">
                      <i class="fa fa-circle recording-pulse"></i>
                      <span>{{ t('buttonMapping.macro.recording') }}</span>
                    </div>

                    <div v-if="!isConnected" class="macro-notice">
                      <i class="fa fa-info-circle"></i>
                      {{ t('buttonMapping.macro.connectFirst') }}
                    </div>

                    <div v-if="isConnected && selectedMacroForEdit === null" class="macro-notice">
                      <i class="fa fa-info-circle"></i>
                      {{ t('buttonMapping.macro.selectFirst') }}
                    </div>
                  </div>

                  <!-- 宏事件列表 -->
                  <div class="macro-events-area">
                    <div class="events-header">
                      <h5 class="section-subtitle">
                        {{ t('buttonMapping.macro.eventList') }}
                        <span v-if="currentEditingMacro.name" class="macro-name-badge">
                          {{ currentEditingMacro.name }}
                        </span>
                      </h5>
                      <div class="events-actions">
                        <button
                          @click="removeSelectedMacroEvent"
                          class="event-action-btn"
                          :disabled="selectedMacroEventIndex === null || isRecording"
                          :title="t('buttonMapping.macro.deleteSelected')"
                        >
                          <i class="fa fa-trash"></i>
                          {{ t('buttonMapping.macro.deleteSelected') }}
                        </button>
                        <button
                          @click="clearAllMacroEvents"
                          class="event-action-btn"
                          :disabled="currentEditingMacro.events.length === 0 || isRecording"
                          :title="t('buttonMapping.macro.clearAll')"
                        >
                          <i class="fa fa-trash-o"></i>
                          {{ t('buttonMapping.macro.clearAll') }}
                        </button>
                      </div>
                    </div>

                    <div class="events-list">
                      <div v-if="currentEditingMacro.events.length === 0" class="empty-events">
                        {{ t('buttonMapping.macro.emptyEvents') }}
                      </div>
                      <div
                        v-else
                        v-for="(event, index) in currentEditingMacro.events"
                        :key="index"
                        @click="selectMacroEvent(index)"
                        class="event-item"
                        :class="{ selected: selectedMacroEventIndex === index }"
                      >
                        <div class="event-info">
                          <span class="event-number">{{ index + 1 }}</span>
                          <span class="event-text">
                            <strong>{{ event.key }}</strong> -
                            {{ event.type === 'keydown' ? t('buttonMapping.macro.keyDown') : t('buttonMapping.macro.keyUp') }}
                          </span>
                        </div>
                        <div class="event-meta">
                          <span class="event-delay">{{ t('buttonMapping.macro.delay', { ms: String(event.delay) }) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 分隔线 -->
                  <div class="macro-divider"></div>

                  <!-- 将宏绑定到按键 -->
                  <div class="macro-binding-area">
                    <h5 class="section-subtitle">
                      <i class="fa fa-link"></i>
                      {{ t('buttonMapping.macro.binding.title') }}
                    </h5>

                    <div class="form-group">
                      <label class="form-label">{{ t('buttonMapping.macro.binding.selectMacro') }}</label>
                      <select v-model="selectedMacroIndex" class="form-select">
                        <option value="">{{ t('buttonMapping.macro.binding.selectMacroPlaceholder') }}</option>
                        <option
                          v-for="(macro, index) in availableMacros"
                          :key="index"
                          :value="index"
                        >
                          {{ macro.name }} ({{ t('buttonMapping.macro.eventCount', { count: String(macro.events.length) }) }})
                        </option>
                      </select>
                    </div>

                    <div class="form-group">
                      <label class="form-label">{{ t('buttonMapping.macro.binding.loopMode') }}</label>
                      <div class="radio-group">
                        <label class="radio-label">
                          <input type="radio" v-model="macroLoopMode" value="release" />
                          <span>{{ t('buttonMapping.macro.binding.loopRelease') }}</span>
                        </label>
                        <label class="radio-label">
                          <input type="radio" v-model="macroLoopMode" value="anykey" />
                          <span>{{ t('buttonMapping.macro.binding.loopAnykey') }}</span>
                        </label>
                        <label class="radio-label">
                          <input type="radio" v-model="macroLoopMode" value="count" />
                          <span>{{ t('buttonMapping.macro.binding.loopCount') }}</span>
                        </label>
                      </div>
                    </div>

                    <div v-if="macroLoopMode === 'count'" class="form-group">
                      <label class="form-label">{{ t('buttonMapping.macro.binding.loopCountLabel') }}</label>
                      <input
                        type="number"
                        v-model.number="macroLoopCount"
                        class="form-input"
                        min="1"
                        max="65535"
                        :placeholder="t('buttonMapping.macro.binding.loopCountPlaceholder')"
                      />
                    </div>

                    <button
                      @click="applyMacroMapping"
                      class="apply-button"
                      :disabled="selectedMacroIndex === ''"
                    >
                      <i class="fa fa-check"></i>
                      {{ t('buttonMapping.macro.binding.bindToButton', { button: String(selectedButton + 1) }) }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 重置所有按键按钮 -->
    <div class="reset-all-container">
      <button @click="resetAllButtons" class="reset-all-button">
        <i class="fa fa-refresh"></i>
        {{ t('buttonMapping.resetAll') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useWebHID } from '../composables/useWebHID'
import { useI18n } from '../composables/useI18n'
import { useMacroStorage, type MacroEvent, type Macro } from '../composables/useMacroStorage'
import {
  mouseButtons,
  multimediaButtons,
  modifierKeys,
  keyboardScancodes,
  createKeyboardMapping,
  getButtonDisplayName,
  defaultButtonMappings,
  type ButtonMapping
} from '../config/buttonMappings'

const {
  isConnected,
  getButtonMapping,
  setButtonMapping,
  setMacro: setDeviceMacro,
  deleteMacro: deleteDeviceMacro
} = useWebHID()
const {
  macros,
  getMacro,
  addMacro,
  deleteMacro: deleteStoredMacro,
  getNextMacroName,
  encodeMacroEvents,
  getScancodeFromKeyName,
  MAX_MACRO_COUNT
} = useMacroStorage()
const { t, ta } = useI18n()

// 按键映射数据（8个按键，但只显示前5个）
const buttonMappings = ref<number[][]>([...defaultButtonMappings])

// UI按键索引到设备数组索引的映射
// 根据实际测试，按键4和按键5在设备中的位置是对调的
const uiToDeviceIndex = [0, 1, 2, 4, 3] // UI索引 → 设备索引

const buttonNames = computed(() => ta('buttonMapping.buttonNames'))

const selectedButton = ref(0)
const activeTab = ref('mouse')

// 标签页配置
const tabs = computed(() => [
  { id: 'mouse', name: t('buttonMapping.tabs.mouse'), icon: 'fa fa-mouse-pointer' },
  { id: 'multimedia', name: t('buttonMapping.tabs.multimedia'), icon: 'fa fa-music' },
  { id: 'keyboard', name: t('buttonMapping.tabs.keyboard'), icon: 'fa fa-keyboard-o' },
  { id: 'macro', name: t('buttonMapping.tabs.macro'), icon: 'fa fa-code' }
])

// 多媒体分类
const multimediaCategories = computed(() => {
  const categories = new Set<string>()
  multimediaButtons.forEach((btn) => {
    if (btn.category) categories.add(btn.category)
  })
  return Array.from(categories)
})

function getMultimediaByCategory(category: string): ButtonMapping[] {
  return multimediaButtons.filter((btn) => btn.category === category)
}

// 键盘按键选项
const selectedModifiers = ref<number[]>([])
const selectedKey = ref('')

const alphabetKeys = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const numberKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']
const functionKeys = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12']
const specialKeys = [
  'Enter',
  'Escape',
  'Backspace',
  'Tab',
  'Space',
  'Insert',
  'Delete',
  'Home',
  'End',
  'PageUp',
  'PageDown',
  'Up',
  'Down',
  'Left',
  'Right'
]

// 宏相关变量 - 用于绑定到按键
const selectedMacroIndex = ref<string>('')
const macroLoopMode = ref<'release' | 'anykey' | 'count'>('release')
const macroLoopCount = ref(1)

// 宏管理相关变量 - 用于编辑宏
const selectedMacroForEdit = ref<number | null>(null)
const currentEditingMacro = ref<Macro>({
  name: '',
  events: [],
  loopMode: 'once',
  loopCount: 1
})
const isRecording = ref(false)
const lastActionTime = ref(0)
const recordedEvents = ref<MacroEvent[]>([])
const pressedKeys = ref<Map<string, { eventIndex: number; startTime: number }>>(new Map())
const selectedMacroEventIndex = ref<number | null>(null)

// 可用的宏列表 (只显示有事件的宏)
const availableMacros = computed(() => {
  return macros.value.filter((macro) => macro.events.length > 0)
})

/**
 * 选择按键
 */
function selectButton(index: number) {
  if (index === 0) return // 左键不允许选择
  selectedButton.value = index
}

/**
 * 获取按键显示标签
 */
function getButtonLabel(index: number): string {
  const deviceIndex = uiToDeviceIndex[index]
  const mapping = buttonMappings.value[deviceIndex]
  if (!mapping) return `${index + 1}`

  return getButtonDisplayName(mapping)
}

/**
 * 检查是否是当前映射
 */
function isCurrentMapping(code: number[]): boolean {
  const deviceIndex = uiToDeviceIndex[selectedButton.value]
  const current = buttonMappings.value[deviceIndex]
  if (!current) return false
  return code.every((byte, i) => byte === current[i])
}

/**
 * 应用映射
 */
async function applyMapping(code: number[]) {
  if (selectedButton.value === 0) return // 左键不允许修改

  const deviceIndex = uiToDeviceIndex[selectedButton.value]
  console.log(`[按键映射] UI按键${selectedButton.value + 1} (设备索引${deviceIndex}) 设置为:`, code)
  buttonMappings.value[deviceIndex] = [...code]
  console.log('[按键映射] 完整映射数组:', buttonMappings.value)

  // 发送到设备
  await saveToDevice()
}

/**
 * 应用键盘映射
 */
async function applyKeyboardMapping() {
  if (!selectedKey.value || selectedButton.value === 0) return

  const scancode = keyboardScancodes[selectedKey.value]
  if (scancode === undefined) {
    console.error('未知的按键:', selectedKey.value)
    return
  }

  // 计算修饰键组合
  const modifiers = selectedModifiers.value.reduce((acc, val) => acc | val, 0)

  const code = createKeyboardMapping(modifiers, scancode)
  const deviceIndex = uiToDeviceIndex[selectedButton.value]
  buttonMappings.value[deviceIndex] = code

  // 发送到设备
  await saveToDevice()

  // 重置选择
  selectedModifiers.value = []
  selectedKey.value = ''
}

/**
 * 恢复默认
 */
async function resetButton() {
  if (selectedButton.value === 0) return // 左键不允许修改

  const deviceIndex = uiToDeviceIndex[selectedButton.value]
  buttonMappings.value[deviceIndex] = [...defaultButtonMappings[deviceIndex]]

  // 发送到设备
  await saveToDevice()
}

/**
 * 应用宏映射
 */
async function applyMacroMapping() {
  if (selectedButton.value === 0) return // 左键不允许修改
  if (selectedMacroIndex.value === '') return

  const macroIndex = parseInt(selectedMacroIndex.value)

  // 获取宏数据
  const macro = getMacro(macroIndex)
  if (!macro || macro.events.length === 0) {
    alert(t('buttonMapping.macro.eventEmpty'))
    return
  }

  // 1. 先将宏数据发送到设备
  const encodedEvents = encodeMacroEvents(macro.events)
  if (isConnected.value) {
    const result = await setDeviceMacro(macroIndex, encodedEvents)
    if (!result.success) {
      alert(t('buttonMapping.macro.saveError', { message: result.message }))
      return
    }
  }

  // 2. 构建宏映射代码并绑定到按键
  // 格式: [0x70, 宏索引, 循环模式/次数低字节, 循环次数高字节]
  let code: number[]

  if (macroLoopMode.value === 'release') {
    // 循环直到按键松开: [0x70, macroIndex, 0x02, 0x00]
    code = [0x70, macroIndex, 0x02, 0x00]
  } else if (macroLoopMode.value === 'anykey') {
    // 循环直到任意键按下: [0x70, macroIndex, 0x03, 0x00]
    code = [0x70, macroIndex, 0x03, 0x00]
  } else {
    // 循环指定次数: [0x70, macroIndex, 次数低字节, 次数高字节]
    const count = Math.min(65535, Math.max(1, macroLoopCount.value))
    code = [0x70, macroIndex, count & 0xff, (count >> 8) & 0xff]
  }

  const deviceIndex = uiToDeviceIndex[selectedButton.value]
  console.log(
    `[宏映射] UI按键${selectedButton.value + 1} (设备索引${deviceIndex}) 设置为宏${macroIndex + 1}:`,
    code
  )
  buttonMappings.value[deviceIndex] = code

  // 3. 发送按键映射到设备
  await saveToDevice()

  // 重置选择
  selectedMacroIndex.value = ''
  macroLoopMode.value = 'release'
  macroLoopCount.value = 1
}

/**
 * 重置所有按键
 */
async function resetAllButtons() {
  if (!confirm(t('buttonMapping.resetAllConfirm'))) {
    return
  }

  // 重置所有按键映射
  buttonMappings.value = [...defaultButtonMappings]

  // 发送到设备
  await saveToDevice()

  console.log('[按键映射] 已重置所有按键')
  alert(t('buttonMapping.resetAllSuccess'))
}

/**
 * 保存到设备
 */
async function saveToDevice() {
  if (!isConnected.value) {
    console.warn('设备未连接')
    return
  }

  const result = await setButtonMapping(buttonMappings.value)
  if (result.success) {
    console.log('按键映射已保存:', result.message)
  } else {
    console.error('保存失败:', result.message)
  }
}

/**
 * 从设备加载按键映射
 */
async function loadFromDevice() {
  if (!isConnected.value) {
    console.warn('设备未连接，使用默认映射')
    return
  }

  const mappings = await getButtonMapping()
  if (mappings && mappings.length >= 5) {
    // 只使用前5个按键的映射
    buttonMappings.value = mappings
    console.log('已加载按键映射:', mappings)
  } else {
    console.warn('无法加载按键映射，使用默认值')
  }
}

// ==================== 宏管理功能 ====================

/**
 * 选择宏进行编辑
 */
function selectMacroForEdit(index: number) {
  selectedMacroForEdit.value = index
  const macro = getMacro(index)
  if (macro) {
    currentEditingMacro.value = { ...macro }
  }
}

/**
 * 新建宏
 */
function createNewMacro() {
  if (macros.value.length >= MAX_MACRO_COUNT) {
    alert(t('buttonMapping.macro.maxReached', { max: String(MAX_MACRO_COUNT) }))
    return
  }

  // 创建新宏
  const newMacroName = getNextMacroName()
  const newMacroData: Macro = {
    name: newMacroName,
    events: [],
    loopMode: 'once',
    loopCount: 1
  }

  // 添加到列表
  if (addMacro(newMacroData)) {
    // 选中新创建的宏
    selectedMacroForEdit.value = macros.value.length - 1
    currentEditingMacro.value = { ...newMacroData }
    console.log('[宏管理] 已创建新宏:', newMacroName)
  } else {
    alert(t('buttonMapping.macro.saveError', { message: 'Failed to add macro' }))
  }
}

/**
 * 删除选中的宏
 */
async function deleteSelectedMacro() {
  if (selectedMacroForEdit.value === null) {
    alert(t('buttonMapping.macro.selectMacro'))
    return
  }

  if (!confirm(t('buttonMapping.macro.deleteConfirm', { name: currentEditingMacro.value.name }))) {
    return
  }

  // 从设备删除宏
  if (isConnected.value && currentEditingMacro.value.events.length > 0) {
    const result = await deleteDeviceMacro(selectedMacroForEdit.value)
    if (!result.success) {
      alert(t('buttonMapping.macro.saveError', { message: result.message }))
      // 继续删除本地存储
    }
  }

  // 从本地存储删除宏
  if (deleteStoredMacro(selectedMacroForEdit.value)) {
    // 重置选择
    if (macros.value.length > 0) {
      selectedMacroForEdit.value = 0
      currentEditingMacro.value = { ...macros.value[0] }
    } else {
      selectedMacroForEdit.value = null
      currentEditingMacro.value = {
        name: '',
        events: [],
        loopMode: 'once',
        loopCount: 1
      }
    }
    console.log('[宏管理] 宏已删除')
  } else {
    alert(t('buttonMapping.macro.saveError', { message: 'Failed to delete macro' }))
  }
}

/**
 * 切换录制状态
 */
function toggleMacroRecord() {
  if (isRecording.value) {
    // 结束录制
    isRecording.value = false
    console.log('[宏录制] 结束录制，共录制', recordedEvents.value.length, '个事件')
  } else {
    // 开始录制
    isRecording.value = true
    recordedEvents.value = [...currentEditingMacro.value.events] // 从当前事件继续追加
    pressedKeys.value.clear() // 清空按键状态
    selectedMacroEventIndex.value = null // 清空事件选择
    lastActionTime.value = Date.now()
    console.log('[宏录制] 开始录制，当前已有', currentEditingMacro.value.events.length, '个事件')
  }
}

/**
 * 选择宏事件
 */
function selectMacroEvent(index: number) {
  if (isRecording.value) return // 录制时不允许选择
  selectedMacroEventIndex.value = selectedMacroEventIndex.value === index ? null : index
}

/**
 * 删除选中的宏事件
 */
function removeSelectedMacroEvent() {
  if (selectedMacroEventIndex.value === null) return
  currentEditingMacro.value.events.splice(selectedMacroEventIndex.value, 1)
  recordedEvents.value.splice(selectedMacroEventIndex.value, 1)
  selectedMacroEventIndex.value = null
  console.log('[宏管理] 已删除选中事件')
}

/**
 * 清空所有宏事件
 */
function clearAllMacroEvents() {
  if (!confirm(t('buttonMapping.macro.clearAllConfirm'))) return
  currentEditingMacro.value.events = []
  recordedEvents.value = []
  selectedMacroEventIndex.value = null
  console.log('[宏管理] 已清空所有事件')
}

/**
 * 处理键盘按下事件
 */
function handleKeyDown(e: KeyboardEvent) {
  if (!isRecording.value) return

  // 阻止默认行为
  e.preventDefault()

  // 如果按键已经按下（重复触发），忽略
  if (pressedKeys.value.has(e.key)) {
    return
  }

  const now = Date.now()

  // 获取按键扫描码
  const scancode = getScancodeFromKeyName(e.key)

  if (scancode === 0x00) {
    console.warn('[宏录制] 未知按键:', e.key)
    return
  }

  // 按下事件的 delay 初始为 0，会在抬起时更新为持续时间
  const event: MacroEvent = {
    type: 'keydown',
    key: e.key.length === 1 ? e.key.toUpperCase() : e.key,
    scancode,
    delay: 0
  }

  // 记录事件索引和开始时间
  const eventIndex = recordedEvents.value.length
  pressedKeys.value.set(e.key, { eventIndex, startTime: now })

  recordedEvents.value.push(event)
  currentEditingMacro.value.events.push(event) // 实时更新到当前宏事件列表
  console.log('[宏录制] 按键按下:', event)
}

/**
 * 处理键盘抬起事件
 */
function handleKeyUp(e: KeyboardEvent) {
  if (!isRecording.value) return

  // 阻止默认行为
  e.preventDefault()

  // 检查按键是否在按下状态
  const pressedKey = pressedKeys.value.get(e.key)
  if (!pressedKey) {
    console.warn('[宏录制] 按键未按下就抬起:', e.key)
    return
  }

  const now = Date.now()
  const holdDuration = now - pressedKey.startTime // 按键持续时间

  // 获取按键扫描码
  const scancode = getScancodeFromKeyName(e.key)

  if (scancode === 0x00) {
    console.warn('[宏录制] 未知按键:', e.key)
    return
  }

  // 更新按下事件的延迟时间为持续时间
  if (recordedEvents.value[pressedKey.eventIndex]) {
    recordedEvents.value[pressedKey.eventIndex].delay = holdDuration
    if (currentEditingMacro.value.events[pressedKey.eventIndex]) {
      currentEditingMacro.value.events[pressedKey.eventIndex].delay = holdDuration
    }
  }

  // 添加抬起事件，延迟为0（紧接着按下事件）
  const event: MacroEvent = {
    type: 'keyup',
    key: e.key.length === 1 ? e.key.toUpperCase() : e.key,
    scancode,
    delay: 0
  }

  recordedEvents.value.push(event)
  currentEditingMacro.value.events.push(event) // 实时更新到当前宏事件列表

  // 更新最后操作时间
  lastActionTime.value = now

  // 从按下状态中移除
  pressedKeys.value.delete(e.key)

  console.log('[宏录制] 按键抬起:', event, '持续时间:', holdDuration, 'ms')
}

// 组件挂载时加载按键映射并注册键盘事件监听
onMounted(() => {
  loadFromDevice()
  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('keyup', handleKeyUp)
})

// 组件卸载时移除键盘事件监听
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('keyup', handleKeyUp)
})
</script>

<style scoped>
.button-mapping-container {
  background-color: var(--bg-primary);
  border-radius: 0.75rem;
  box-shadow: var(--shadow-sm);
  padding: 1.25rem;
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  color: var(--text-primary);
}

.section-title i {
  margin-right: 0.5rem;
}

.icon-primary {
  color: var(--color-primary);
}

.section-description {
  color: var(--text-tertiary);
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
}

.mapping-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 1024px) {
  .mapping-layout {
    grid-template-columns: 1fr 2fr;
  }
}

.mouse-diagram {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.mouse-body {
  width: 16rem;
  height: 24rem;
  background-image: url('../assets/mouse.png');
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  padding: 1rem;
  position: relative;
}

/* 鼠标按键基础样式 */
.mouse-mode .mouse-key {
  position: absolute;
  min-height: 32px;
  min-width: 80px;
  padding: 0.25rem 0.5rem;
  user-select: none;
  border-radius: 0.25rem;
  border-width: 2px;
  background-color: rgba(22, 93, 255, 0.2);
  text-align: center;
  box-shadow:
    0 1px 3px 0 rgba(0, 0, 0, 0.1),
    0 1px 2px -1px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mouse-mode .mouse-key:hover:not(.disabled) {
  background-color: rgba(22, 93, 255, 0.25);
}

.mouse-mode .mouse-key.active {
  background-color: rgba(22, 93, 255, 0.3);
  border: 2px solid rgba(22, 93, 255, 0.6);
}

.mouse-mode .mouse-key.disabled {
  background-color: rgba(128, 128, 128, 0.2);
  cursor: not-allowed;
  opacity: 0.6;
}

.mouse-mode .mouse-key .button-label {
  font-size: 0.7rem;
  font-weight: 500;
  word-break: break-word;
  line-height: 1.2;
  color: var(--text-primary);
}

/* 连接线基础样式 */
.mouse-mode .mouse-key:before {
  content: '';
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  height: 1px;
  border-bottom-width: 1px;
  border-color: rgb(2 132 199);
  border-bottom-style: solid;
}

/* 连接线末端小圆圈 */
.mouse-mode .mouse-key:after {
  content: '';
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  background-color: rgb(2 132 199);
  border-radius: 50%;
  z-index: 2;
}

/* 按键 1 - 左键 */
.mouse-mode .key0 {
  top: 5px;
  left: -70px;
}

.mouse-mode .key0:before {
  left: 5rem;
  width: 86px;
}

.mouse-mode .key0:after {
  left: calc(5rem + 86px - 4px);
}

/* 按键 2 - 右键 */
.mouse-mode .key1 {
  top: 5px;
  right: -65px;
}

.mouse-mode .key1:before {
  right: 5rem;
  width: 86px;
}

.mouse-mode .key1:after {
  right: calc(5rem + 86px - 4px);
}

/* 按键 3 - 中键 */
.mouse-mode .key2 {
  top: 55px;
  right: -70px;
}

.mouse-mode .key2:before {
  right: 5rem;
  width: 118px;
}

.mouse-mode .key2:after {
  right: calc(5rem + 118px - 4px);
}

/* 按键 4 - 前进 */
.mouse-mode .key3 {
  top: 112px;
  left: -70px;
}

.mouse-mode .key3:before {
  left: 5rem;
  width: 29px;
}

.mouse-mode .key3:after {
  left: calc(5rem + 29px - 4px);
}

/* 按键 5 - 后退 */
.mouse-mode .key4 {
  top: 180px;
  left: -70px;
}

.mouse-mode .key4:before {
  left: 5rem;
  width: 29px;
}

.mouse-mode .key4:after {
  left: calc(5rem + 29px - 4px);
}

.button-settings {
  flex: 1;
}

.settings-panel {
  border: 1px solid var(--border-primary);
  border-radius: 0.75rem;
  padding: 1.25rem;
  background-color: var(--bg-primary);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.panel-title {
  font-weight: 500;
  margin: 0;
  color: var(--text-primary);
}

.reset-button {
  font-size: 0.875rem;
  color: var(--text-tertiary);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s;
}

.reset-button:hover:not(:disabled) {
  color: var(--color-primary);
}

.reset-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.reset-button i {
  margin-right: 0.25rem;
}

.disabled-notice {
  padding: 1rem;
  background-color: var(--bg-tertiary);
  border-radius: 0.5rem;
  color: var(--text-tertiary);
  text-align: center;
}

.disabled-notice i {
  margin-right: 0.5rem;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* 标签页 */
.tab-buttons {
  display: flex;
  gap: 0.5rem;
  border-bottom: 2px solid var(--border-primary);
  margin-bottom: 1rem;
}

.tab-button {
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-tertiary);
  font-size: 0.875rem;
  margin-bottom: -2px;
}

.tab-button:hover {
  color: var(--color-primary);
}

.tab-button.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.tab-button i {
  margin-right: 0.25rem;
}

.tab-content {
  min-height: 200px;
}

/* 按钮网格 */
.button-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.5rem;
}

.function-button {
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  background: var(--bg-primary);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.function-button:hover {
  border-color: var(--color-primary);
  background-color: var(--bg-hover);
}

.function-button.active {
  border-color: var(--color-primary);
  background-color: var(--bg-active);
  color: var(--color-primary);
  font-weight: 500;
}

/* 分类 */
.category-section {
  margin-bottom: 1.5rem;
}

.category-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
}

/* 键盘设置 */
.keyboard-settings {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.form-select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  outline: none;
  transition: all 0.2s;
  cursor: pointer;
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

.form-select:focus {
  border-color: var(--color-primary);
}

.modifier-group {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.modifier-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.modifier-checkbox input[type='checkbox'] {
  accent-color: var(--color-primary);
  cursor: pointer;
  width: 18px;
  height: 18px;
}

.modifier-checkbox span {
  font-size: 0.875rem;
  color: var(--text-primary);
}

.apply-button {
  padding: 0.75rem 1.5rem;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
  font-weight: 500;
}

.apply-button:hover:not(:disabled) {
  background-color: #1557cc;
}

.apply-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.apply-button i {
  margin-right: 0.5rem;
}

/* 宏设置 */
.macro-settings {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--text-primary);
}

.radio-label input[type='radio'] {
  accent-color: var(--color-primary);
  cursor: pointer;
  width: 18px;
  height: 18px;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  outline: none;
  transition: all 0.2s;
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

.form-input:focus {
  border-color: var(--color-primary);
}

/* 重置所有按键按钮 */
.reset-all-container {
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
}

.reset-all-button {
  padding: 0.75rem 2rem;
  background-color: var(--bg-primary);
  color: var(--color-danger);
  border: 2px solid var(--color-danger);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
  font-weight: 500;
}

.reset-all-button:hover {
  background-color: var(--color-danger);
  color: var(--bg-primary);
}

.reset-all-button i {
  margin-right: 0.5rem;
}

/* ==================== 宏管理样式 ==================== */

.macro-management-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  min-height: 400px;
}

@media (min-width: 1024px) {
  .macro-management-container {
    grid-template-columns: 1fr 2fr;
  }
}

/* 宏列表区域 */
.macro-list-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-subtitle {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-hint {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  margin: 0;
}

.macro-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-height: 150px;
  max-height: 300px;
  overflow-y: auto;
  padding: 0.5rem;
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  background-color: var(--bg-tertiary);
}

.empty-macros {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  text-align: center;
  color: var(--text-tertiary);
  font-size: 0.875rem;
  gap: 0.5rem;
}

.empty-macros i {
  font-size: 2rem;
  opacity: 0.5;
}

.macro-list-item {
  width: 100%;
  text-align: left;
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  border: 1px solid var(--border-primary);
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  cursor: pointer;
}

.macro-list-item:hover:not(:disabled) {
  border-color: var(--color-primary);
  background-color: var(--bg-hover);
}

.macro-list-item.active {
  border-color: var(--color-primary);
  background-color: var(--bg-active);
}

.macro-list-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.macro-item-name {
  font-weight: 500;
  font-size: 0.875rem;
  color: var(--text-primary);
}

.macro-item-count {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.macro-list-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.macro-action-btn {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  background: var(--bg-primary);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.macro-action-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.macro-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.delete-macro-btn {
  color: var(--color-danger);
  border-color: rgba(245, 63, 63, 0.3);
}

.delete-macro-btn:hover:not(:disabled) {
  background-color: rgba(245, 63, 63, 0.05);
  border-color: var(--color-danger);
}

/* 宏编辑区域 */
.macro-edit-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.macro-record-area {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.record-control-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
  font-weight: 500;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.start-record-btn {
  background-color: var(--color-primary);
  color: white;
}

.start-record-btn:hover:not(:disabled) {
  background-color: #1557cc;
}

.stop-record-btn {
  background-color: var(--bg-primary);
  color: var(--text-secondary);
  border: 1px solid var(--border-primary);
}

.stop-record-btn:hover:not(:disabled) {
  border-color: var(--color-danger);
  color: var(--color-danger);
}

.record-control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.recording-status {
  padding: 0.75rem;
  background-color: rgba(114, 46, 209, 0.1);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-accent);
}

.recording-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.macro-notice {
  padding: 0.75rem;
  background-color: var(--bg-tertiary);
  border-radius: 0.375rem;
  color: var(--text-tertiary);
  text-align: center;
  font-size: 0.875rem;
}

.macro-notice i {
  margin-right: 0.5rem;
}

/* 宏事件列表 */
.macro-events-area {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.events-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.macro-name-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background-color: var(--bg-active);
  color: var(--color-primary);
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
  margin-left: 0.5rem;
}

.events-actions {
  display: flex;
  gap: 0.5rem;
}

.event-action-btn {
  background: none;
  border: none;
  color: var(--text-tertiary);
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.event-action-btn:hover:not(:disabled) {
  color: var(--color-primary);
}

.event-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.events-list {
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  max-height: 250px;
  overflow-y: auto;
  background-color: var(--bg-primary);
}

.empty-events {
  padding: 2rem 1rem;
  text-align: center;
  color: var(--text-tertiary);
  font-size: 0.875rem;
}

.event-item {
  padding: 0.75rem;
  border-bottom: 1px solid var(--border-primary);
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s;
  cursor: pointer;
}

.event-item:last-child {
  border-bottom: none;
}

.event-item:hover {
  background-color: var(--bg-tertiary);
}

.event-item.selected {
  background-color: var(--bg-active);
  border-left: 3px solid var(--color-primary);
}

.event-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.event-number {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  background-color: var(--bg-tertiary);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  flex-shrink: 0;
}

.event-text {
  font-size: 0.875rem;
  color: var(--text-primary);
}

.event-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.event-delay {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.save-macro-btn {
  padding: 0.75rem 1.5rem;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.save-macro-btn:hover:not(:disabled) {
  background-color: #1557cc;
}

.save-macro-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.macro-divider {
  height: 1px;
  background-color: var(--border-primary);
  margin: 0.5rem 0;
}

/* 宏绑定区域 */
.macro-binding-area {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background-color: var(--bg-tertiary);
  border-radius: 0.5rem;
  border: 1px solid var(--border-primary);
}
</style>
