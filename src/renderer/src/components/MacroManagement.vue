<template>
  <div class="macro-management">
    <!-- 宏列表 -->
    <div class="macro-list-card card-hover">
      <h3 class="card-title"><i class="fa fa-list-ol icon-primary"></i>宏列表</h3>
      <p class="card-description">管理您的宏,最多可保存10组宏</p>

      <div class="macro-buttons">
        <div v-if="macros.length === 0" class="empty-macros">
          <i class="fa fa-info-circle"></i>
          暂无宏,点击"新建宏"开始创建
        </div>
        <button
          v-else
          v-for="(macro, index) in macros"
          :key="index"
          @click="selectMacro(index)"
          class="macro-button"
          :class="{ 'setting-active': selectedMacroIndex === index }"
          :disabled="isRecording"
        >
          <span class="macro-name">{{ macro.name }}</span>
          <span class="macro-count">{{ macro.events.length }}个事件</span>
        </button>
      </div>

      <div class="macro-actions">
        <button
          @click="newMacro"
          class="btn-secondary action-btn"
          :disabled="macros.length >= MAX_MACRO_COUNT || isRecording"
        >
          <i class="fa fa-plus"></i>新建宏 ({{ macros.length }}/{{ MAX_MACRO_COUNT }})
        </button>
        <button
          @click="deleteMacro"
          class="btn-secondary action-btn delete-btn"
          :disabled="selectedMacroIndex === null || isRecording"
        >
          <i class="fa fa-trash"></i>删除选中宏
        </button>
      </div>
    </div>

    <!-- 宏录制和设置 -->
    <div class="macro-settings">
      <!-- 录制控制 -->
      <div class="record-card card-hover">
        <h3 class="card-title"><i class="fa fa-circle-o-notch icon-accent"></i>宏录制</h3>

        <div class="record-controls">
          <button
            @click="toggleRecord"
            :disabled="!isConnected || selectedMacroIndex === null"
            :class="isRecording ? 'btn-secondary' : 'btn-primary'"
          >
            <i :class="isRecording ? 'fa fa-stop' : 'fa fa-circle'"></i
            >{{ isRecording ? '结束录制' : '开始录制' }}
          </button>
        </div>

        <div v-if="isRecording" class="recording-indicator">
          <i class="fa fa-circle recording-icon"></i>
          <span>正在录制... 请执行您的操作,完成后点击"结束录制"</span>
        </div>

        <div v-if="!isConnected" class="disabled-notice">
          <i class="fa fa-info-circle"></i>
          请先连接设备
        </div>

        <div v-if="isConnected && selectedMacroIndex === null" class="disabled-notice">
          <i class="fa fa-info-circle"></i>
          请先选择一个宏
        </div>
      </div>

      <!-- 宏设置 -->
      <div class="settings-card card-hover">
        <div class="settings-header">
          <h3 class="card-title"><i class="fa fa-cog icon-primary"></i>宏设置</h3>
          <button
            @click="saveMacro"
            class="btn-primary"
            :disabled="!isConnected || currentMacro.events.length === 0 || isRecording"
          >
            <i class="fa fa-save"></i>保存宏
          </button>
        </div>

        <div class="settings-form">
          <div class="form-group">
            <label class="form-label">宏名称</label>
            <div class="macro-name-display">
              {{ currentMacro.name || '未选择宏' }}
            </div>
          </div>

          <div class="form-group">
            <div class="form-label-with-actions">
              <label class="form-label">宏事件列表</label>
              <div class="event-actions">
                <button
                  @click="removeSelectedEvent"
                  class="btn-text"
                  :disabled="selectedEventIndex === null || isRecording"
                  title="删除选中事件"
                >
                  <i class="fa fa-trash"></i>删除选中
                </button>
                <button
                  @click="clearAllEvents"
                  class="btn-text"
                  :disabled="currentMacro.events.length === 0 || isRecording"
                  title="清空所有事件"
                >
                  <i class="fa fa-trash-o"></i>清空全部
                </button>
              </div>
            </div>
            <div class="actions-list">
              <div v-if="currentMacro.events.length === 0" class="empty-actions">
                录制宏事件后将显示在这里
              </div>
              <div
                v-else
                v-for="(event, index) in currentMacro.events"
                :key="index"
                @click="selectEvent(index)"
                class="action-item"
                :class="{ 'event-selected': selectedEventIndex === index }"
              >
                <div class="action-info">
                  <span class="action-number">{{ index + 1 }}</span>
                  <span class="action-text">
                    <strong>{{ event.key }}</strong> -
                    {{ event.type === 'keydown' ? '按下' : '抬起' }}
                  </span>
                </div>
                <div class="action-meta">
                  <span class="action-delay">延迟 {{ event.delay }}ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useWebHID } from '../composables/useWebHID'
import { useMacroStorage, type MacroEvent, type Macro } from '../composables/useMacroStorage'

const { isConnected, setMacro: setDeviceMacro, deleteMacro: deleteDeviceMacro } = useWebHID()
const {
  macros,
  getMacro,
  addMacro,
  updateMacro,
  deleteMacro: deleteStoredMacro,
  getNextMacroName,
  encodeMacroEvents,
  getScancodeFromKeyName,
  MAX_MACRO_COUNT
} = useMacroStorage()

const selectedMacroIndex = ref<number | null>(null)
const currentMacro = ref<Macro>({
  name: '',
  events: [],
  loopMode: 'once',
  loopCount: 1
})
const isRecording = ref(false)
const lastActionTime = ref(0)
const recordedEvents = ref<MacroEvent[]>([])
const pressedKeys = ref<Map<string, { eventIndex: number; startTime: number }>>(new Map())
const selectedEventIndex = ref<number | null>(null)

/**
 * 选择宏
 */
function selectMacro(index: number) {
  selectedMacroIndex.value = index
  const macro = getMacro(index)
  if (macro) {
    currentMacro.value = { ...macro }
  }
}

/**
 * 新建宏
 */
function newMacro() {
  if (macros.value.length >= MAX_MACRO_COUNT) {
    alert(`最多只能创建 ${MAX_MACRO_COUNT} 个宏`)
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
    selectedMacroIndex.value = macros.value.length - 1
    currentMacro.value = { ...newMacroData }
    console.log('[宏管理] 已创建新宏:', newMacroName)
  } else {
    alert('创建宏失败')
  }
}

/**
 * 删除宏
 */
async function deleteMacro() {
  if (selectedMacroIndex.value === null) {
    alert('请先选择一个宏')
    return
  }

  if (!confirm(`确定要删除${currentMacro.value.name}吗?此操作不可撤销。`)) {
    return
  }

  // 从设备删除宏
  if (isConnected.value && currentMacro.value.events.length > 0) {
    const result = await deleteDeviceMacro(selectedMacroIndex.value)
    if (!result.success) {
      alert(`从设备删除失败: ${result.message}`)
      // 继续删除本地存储
    }
  }

  // 从本地存储删除宏
  if (deleteStoredMacro(selectedMacroIndex.value)) {
    // 重置选择
    if (macros.value.length > 0) {
      selectedMacroIndex.value = 0
      currentMacro.value = { ...macros.value[0] }
    } else {
      selectedMacroIndex.value = null
      currentMacro.value = {
        name: '',
        events: [],
        loopMode: 'once',
        loopCount: 1
      }
    }
    console.log('[宏管理] 宏已删除')
  } else {
    alert('删除宏失败')
  }
}

/**
 * 切换录制状态
 */
function toggleRecord() {
  if (isRecording.value) {
    // 结束录制
    isRecording.value = false
    console.log('[宏录制] 结束录制,共录制', recordedEvents.value.length, '个事件')
  } else {
    // 开始录制
    isRecording.value = true
    recordedEvents.value = [...currentMacro.value.events] // 从当前事件继续追加
    pressedKeys.value.clear() // 清空按键状态
    selectedEventIndex.value = null // 清空事件选择
    lastActionTime.value = Date.now()
    console.log('[宏录制] 开始录制，当前已有', currentMacro.value.events.length, '个事件')
  }
}

/**
 * 选择事件
 */
function selectEvent(index: number) {
  if (isRecording.value) return // 录制时不允许选择
  selectedEventIndex.value = selectedEventIndex.value === index ? null : index
}

/**
 * 删除选中的事件
 */
function removeSelectedEvent() {
  if (selectedEventIndex.value === null) return
  currentMacro.value.events.splice(selectedEventIndex.value, 1)
  recordedEvents.value.splice(selectedEventIndex.value, 1)
  selectedEventIndex.value = null
  console.log('[宏管理] 已删除选中事件')
}

/**
 * 清空所有事件
 */
function clearAllEvents() {
  if (!confirm('确定要清空所有事件吗？')) return
  currentMacro.value.events = []
  recordedEvents.value = []
  selectedEventIndex.value = null
  console.log('[宏管理] 已清空所有事件')
}

/**
 * 保存宏
 */
async function saveMacro() {
  if (currentMacro.value.events.length === 0) {
    alert('宏事件不能为空')
    return
  }

  if (!currentMacro.value.name.trim()) {
    alert('宏名称不能为空')
    return
  }

  if (selectedMacroIndex.value === null) {
    alert('请先选择一个宏')
    return
  }

  // 编码宏事件为设备协议格式
  const encodedEvents = encodeMacroEvents(currentMacro.value.events)

  // 发送到设备
  if (isConnected.value) {
    const result = await setDeviceMacro(selectedMacroIndex.value, encodedEvents)
    if (!result.success) {
      alert(`保存到设备失败: ${result.message}`)
      return
    }
  }

  // 保存到本地存储
  if (updateMacro(selectedMacroIndex.value, currentMacro.value)) {
    alert(`${currentMacro.value.name} 已保存`)
  } else {
    alert('保存到本地存储失败')
  }
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
  currentMacro.value.events.push(event) // 实时更新到当前宏事件列表
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
    if (currentMacro.value.events[pressedKey.eventIndex]) {
      currentMacro.value.events[pressedKey.eventIndex].delay = holdDuration
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
  currentMacro.value.events.push(event) // 实时更新到当前宏事件列表

  // 更新最后操作时间
  lastActionTime.value = now

  // 从按下状态中移除
  pressedKeys.value.delete(e.key)

  console.log('[宏录制] 按键抬起:', event, '持续时间:', holdDuration, 'ms')
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('keyup', handleKeyUp)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('keyup', handleKeyUp)
})
</script>

<style scoped>
.macro-management {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 1024px) {
  .macro-management {
    grid-template-columns: 1fr 2fr;
  }
}

.macro-list-card,
.record-card,
.settings-card {
  background-color: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  padding: 1.25rem;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
}

.card-title i {
  margin-right: 0.5rem;
}

.icon-primary {
  color: var(--color-primary);
}

.icon-accent {
  color: var(--color-accent);
}

.card-description {
  color: var(--color-gray-medium);
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.macro-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
  min-height: 100px;
}

.empty-macros {
  padding: 2rem 1rem;
  text-align: center;
  color: var(--color-gray-medium);
  font-size: 0.875rem;
  background-color: #f9fafb;
  border-radius: 0.375rem;
  border: 1px dashed var(--color-gray-light);
}

.empty-macros i {
  display: block;
  font-size: 2rem;
  margin-bottom: 0.5rem;
  opacity: 0.5;
}

.macro-button {
  width: 100%;
  text-align: left;
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  border: 1px solid var(--color-gray-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s;
  background-color: white;
  cursor: pointer;
}

.macro-button:hover {
  border-color: var(--color-primary);
}

.macro-button.setting-active {
  border-color: var(--color-primary);
  background-color: rgba(22, 93, 255, 0.05);
}

.macro-name {
  font-weight: 500;
}

.macro-count {
  font-size: 0.75rem;
  color: var(--color-gray-medium);
}

.macro-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.action-btn {
  width: 100%;
}

.action-btn i {
  margin-right: 0.25rem;
}

.delete-btn {
  color: var(--color-danger);
  border-color: rgba(245, 63, 63, 0.3);
}

.delete-btn:hover:not(:disabled) {
  background-color: rgba(245, 63, 63, 0.05);
}

.macro-settings {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.record-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.record-controls button i {
  margin-right: 0.25rem;
}

.recording-indicator {
  padding: 0.75rem;
  background-color: rgba(114, 46, 209, 0.1);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.recording-icon {
  color: var(--color-accent);
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

.disabled-notice {
  padding: 1rem;
  background-color: #f3f4f6;
  border-radius: 0.5rem;
  color: var(--color-gray-medium);
  text-align: center;
}

.disabled-notice i {
  margin-right: 0.5rem;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.settings-header .card-title {
  margin-bottom: 0;
}

.settings-header button i {
  margin-right: 0.25rem;
}

.settings-form {
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
  color: var(--color-gray-dark);
  font-weight: 500;
}

.form-label-with-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.event-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-text {
  background: none;
  border: none;
  color: var(--color-gray-medium);
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.btn-text:hover:not(:disabled) {
  color: var(--color-primary);
}

.btn-text:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-control {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-gray-light);
  border-radius: 0.5rem;
  outline: none;
  transition: all 0.2s;
}

.input-control:focus {
  border-color: var(--color-primary);
}

.input-control:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
}

.macro-name-display {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-gray-light);
  border-radius: 0.5rem;
  background-color: #f9fafb;
  color: var(--color-gray-dark);
  font-weight: 500;
}

.actions-list {
  border: 1px solid var(--color-gray-light);
  border-radius: 0.375rem;
  max-height: 20rem;
  overflow-y: auto;
}

.empty-actions {
  padding: 1rem;
  text-align: center;
  color: var(--color-gray-medium);
  font-size: 0.875rem;
}

.action-item {
  padding: 0.75rem;
  border-bottom: 1px solid var(--color-gray-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s;
  cursor: pointer;
}

.action-item:last-child {
  border-bottom: none;
}

.action-item:hover {
  background-color: rgb(249, 250, 251);
}

.action-item.event-selected {
  background-color: rgba(22, 93, 255, 0.1);
  border-left: 3px solid var(--color-primary);
}

.action-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.action-number {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 9999px;
  background-color: rgb(229, 231, 235);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  flex-shrink: 0;
}

.action-text {
  font-size: 0.875rem;
}

.action-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.action-delay {
  font-size: 0.75rem;
  color: var(--color-gray-medium);
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
  font-weight: 500;
  border: none;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #1557cc;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: white;
  color: var(--color-gray-dark);
  border: 1px solid var(--color-gray-light);
}

.btn-secondary:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
