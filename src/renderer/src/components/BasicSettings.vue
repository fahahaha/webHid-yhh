<template>
  <div class="basic-settings">
    <!-- 回报率设置 -->
    <div class="settings-card" :class="{ disabled: !supportsReportRate }">
      <h3 class="card-title">
        <i class="fa fa-refresh icon-secondary"></i>{{ t('basicSettings.reportRate.title') }}
        <span v-if="!supportsReportRate" class="unsupported-badge"> ({{ t('common.unsupported') }}) </span>
      </h3>
      <p class="card-description">{{ t('basicSettings.reportRate.description') }}</p>

      <div v-if="!supportsReportRate" class="empty-state">
        <i class="fa fa-exclamation-circle"></i>
        <p>{{ t('basicSettings.reportRate.notSupported') }}</p>
      </div>

      <div v-else class="rate-buttons">
        <button
          v-for="rate in reportRates"
          :key="rate"
          @click="handleSetReportRate(rate)"
          class="rate-button"
          :class="{ 'setting-active': selectedReportRate === rate }"
        >
          {{ rate }} Hz
        </button>
      </div>
    </div>

    <!-- DPI设置 -->
    <div class="settings-card" :class="{ disabled: !supportsDPI }">
      <h3 class="card-title">
        <i class="fa fa-tachometer icon-accent"></i>{{ t('basicSettings.dpi.title') }}
        <span v-if="!supportsDPI" class="unsupported-badge"> ({{ t('common.unsupported') }}) </span>
      </h3>
      <p class="card-description">
        {{ t('basicSettings.dpi.description') }}
        <span v-if="supportedDPI.length > 0" class="dpi-count">
          {{ t('basicSettings.dpi.supportedCount', { count: String(supportedDPI.length) }) }}
        </span>
      </p>

      <div v-if="!supportsDPI" class="empty-state">
        <i class="fa fa-exclamation-circle"></i>
        <p>{{ t('basicSettings.dpi.notSupported') }}</p>
      </div>

      <div v-else class="dpi-settings">
        <!-- DPI 档位选择 -->
        <div class="dpi-selector">
          <div class="selector-header">
            <label class="selector-label">{{ t('basicSettings.dpi.level') }}</label>
            <span class="selector-value">{{ selectedDPI }} DPI</span>
          </div>

          <select v-model.number="selectedDPI" @change="handleSetDPI" class="dpi-select">
            <option v-for="option in dpiOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>

        <!-- 当前状态显示 -->
        <div class="current-status">
          <div class="status-row">
            <div class="status-left">
              <i class="fa fa-info-circle icon-primary"></i>
              <span>{{ t('basicSettings.dpi.current') }}</span>
            </div>
            <span class="status-dpi">{{ deviceStatus.dpi }} DPI</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 滚轮方向设置 -->
    <div class="settings-card" :class="{ disabled: !supportedScrollDirection }">
      <h3 class="card-title">
        <i class="fa fa-arrows-v icon-primary"></i>{{ t('basicSettings.scrollDirection.title') }}
        <span v-if="!supportedScrollDirection" class="unsupported-badge"> ({{ t('common.unsupported') }}) </span>
      </h3>
      <p class="card-description">{{ t('basicSettings.scrollDirection.description') }}</p>

      <div v-if="!supportedScrollDirection" class="empty-state">
        <i class="fa fa-exclamation-circle"></i>
        <p>{{ t('basicSettings.scrollDirection.notSupported') }}</p>
      </div>

      <div v-else class="scroll-direction-settings">
        <label class="checkbox-label" :class="{ active: !isReverseScroll }">
          <input
            type="checkbox"
            :checked="!isReverseScroll"
            @change="handleSetNormalScroll"
            class="checkbox-input"
          />
          <span class="checkbox-text">{{ t('basicSettings.scrollDirection.normal') }}</span>
        </label>
        <label class="checkbox-label" :class="{ active: isReverseScroll }">
          <input
            type="checkbox"
            :checked="isReverseScroll"
            @change="handleSetReverseScroll"
            class="checkbox-input"
          />
          <span class="checkbox-text">{{ t('basicSettings.scrollDirection.reverse') }}</span>
        </label>
        <p class="scroll-hint">
          {{ isReverseScroll ? t('basicSettings.scrollDirection.reverseHint') : t('basicSettings.scrollDirection.normalHint') }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useWebHID } from '../composables/useWebHID'
import { useI18n } from '../composables/useI18n'

const { setReportRate, setDPI, setScrollDirection, getCurrentProtocol, isConnected, deviceStatus, connectionMode } =
  useWebHID()
const { t } = useI18n()

// 获取设备特性
const deviceFeatures = computed(() => {
  const protocol = getCurrentProtocol()
  return protocol?.features || null
})

// 支持的回报率列表(根据设备特性和连接模式动态调整)
// USB 模式只支持 1000Hz，2.4G 模式支持全部回报率
const reportRates = computed(() => {
  const allRates = deviceFeatures.value?.supportedReportRates || [125, 250, 500, 1000]
  // USB 模式只支持 1000Hz
  if (connectionMode.value === 'usb') {
    return [1000]
  }
  // 2.4G 模式支持全部回报率
  return allRates
})

// 支持的 DPI 档位列表
const supportedDPI = computed(() => {
  return deviceFeatures.value?.supportedDPI || []
})

// DPI 选项列表(用于下拉选择)
const dpiOptions = computed(() => {
  return supportedDPI.value.map((dpi, index) => ({
    label: t('basicSettings.dpi.levelOption', { level: String(index + 1), value: String(dpi) }),
    value: dpi,
    level: index + 1
  }))
})

// 是否支持回报率设置
const supportsReportRate = computed(() => {
  return isConnected.value && reportRates.value.length > 0
})

// 是否支持 DPI 设置
const supportsDPI = computed(() => {
  return isConnected.value && supportedDPI.value.length > 0
})

// 是否支持滚轮方向设置
const supportedScrollDirection = computed(() => {
  return isConnected.value && deviceFeatures.value?.hasScrollDirection !== false
})

const selectedReportRate = ref(1000)
const selectedDPI = ref(2000)
const isReverseScroll = ref(false)

// 监听设备状态变化,回显当前回报率
watch(
  () => deviceStatus.value.reportRate,
  (newRate) => {
    if (newRate && newRate !== '--') {
      // 从 "1000 Hz" 格式中提取数字
      const rateValue = parseInt(newRate)
      if (!isNaN(rateValue)) {
        selectedReportRate.value = rateValue
      }
    }
  },
  { immediate: true }
)

// 监听设备连接状态,初始化回报率选中值
watch(isConnected, (connected) => {
  if (connected && deviceStatus.value.reportRate !== '--') {
    const rateValue = parseInt(deviceStatus.value.reportRate)
    if (!isNaN(rateValue)) {
      selectedReportRate.value = rateValue
    }
  }
})




// 监听设备状态变化,回显当前 DPI
watch(
  () => deviceStatus.value.dpi,
  (newDPI) => {
    if (newDPI && newDPI !== '--') {
      selectedDPI.value = parseInt(newDPI)
    }
  },
  { immediate: true }
)

// 监听设备连接状态,初始化选中值
watch(isConnected, (connected) => {
  if (connected && deviceStatus.value.dpi !== '--') {
    selectedDPI.value = parseInt(deviceStatus.value.dpi)
  }
})

// 监听设备状态变化,回显当前 滚轮方向
watch(
  () => deviceStatus.value.scrollDirection,
  (newScroll) => {
    isReverseScroll.value = Number(newScroll) == 0 ? false : true
  },
  { immediate: true }
)

// 监听设备连接状态,初始化选中值,回显当前 滚轮方向
watch(isConnected, (connected) => {
  if (connected) {
    isReverseScroll.value = Number(deviceStatus.value.scrollDirection) == 0 ? false : true
  }
})

async function handleSetReportRate(rate: number) {
  if (!supportsReportRate.value) {
    console.warn('当前设备不支持回报率设置')
    return
  }

  selectedReportRate.value = rate
  const result = await setReportRate(rate)
  if (!result.success) {
    console.error('设置回报率失败:', result.message)
  }
}

async function handleSetDPI() {
  if (!supportsDPI.value) {
    console.warn('当前设备不支持 DPI 设置')
    return
  }

  // 找到对应的档位
  const dpiIndex = supportedDPI.value.indexOf(selectedDPI.value)
  if (dpiIndex === -1) {
    console.error('无效的 DPI 值')
    return
  }

  const level = dpiIndex + 1
  const result = await setDPI(level, selectedDPI.value)
  if (!result.success) {
    console.error('设置 DPI 失败:', result.message)
  }
}

async function handleSetNormalScroll() {
  if (!supportedScrollDirection.value) {
    console.warn('当前设备不支持滚轮方向设置')
    return
  }

  isReverseScroll.value = false
  const result = await setScrollDirection(0)
  if (!result.success) {
    console.error('设置滚轮方向失败:', result.message)
  } else {
    console.log(result.message)
  }
}

async function handleSetReverseScroll() {
  if (!supportedScrollDirection.value) {
    console.warn('当前设备不支持滚轮方向设置')
    return
  }

  isReverseScroll.value = true
  const result = await setScrollDirection(1)
  if (!result.success) {
    console.error('设置滚轮方向失败:', result.message)
  } else {
    console.log(result.message)
  }
}
</script>

<style scoped>
.basic-settings {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .basic-settings {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .basic-settings {
    grid-template-columns: repeat(2, 1fr);
  }
}

.settings-card {
  background-color: var(--bg-primary);
  border-radius: 0.75rem;
  box-shadow: var(--shadow-sm);
  padding: 1.25rem;
}

.settings-card.disabled {
  opacity: 0.6;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  color: var(--text-primary);
}

.card-title i {
  margin-right: 0.5rem;
}

.icon-secondary {
  color: var(--color-secondary);
}

.icon-accent {
  color: var(--color-accent);
}

.icon-primary {
  color: var(--color-primary);
}

.unsupported-badge {
  margin-left: 0.5rem;
  font-size: 0.75rem;
  color: #f53f3f;
  font-weight: normal;
}

.card-description {
  color: var(--text-tertiary);
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.dpi-count {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.empty-state {
  text-align: center;
  padding: 1rem 0;
  color: var(--text-tertiary);
}

.empty-state i {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.empty-state p {
  font-size: 0.875rem;
  margin: 0;
}

.rate-buttons {
  display: flex;
  align-items: center;
  justify-content: start;
  gap: 0.5rem;
}

.rate-button {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  border: 1px solid var(--border-primary);
  transition: all 0.2s;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  cursor: pointer;
}

.rate-button:hover {
  border-color: var(--color-primary);
}

.dpi-settings {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.dpi-selector {
  flex: 1;
}

.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.selector-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.selector-value {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-accent);
}

.dpi-select {
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

.dpi-select:focus {
  border-color: var(--color-primary);
}

.dpi-select:hover {
  border-color: var(--color-primary);
}

.current-status {
  background-color: var(--bg-tertiary);
  border-radius: 0.5rem;
  padding: 1rem;
}

.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.status-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-left span {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.status-dpi {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-primary);
}

/* 滚轮方向设置 */
.scroll-direction-settings {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: 2px solid var(--border-primary);
  transition: all 0.2s;
  background-color: var(--bg-primary);
}

.checkbox-label:hover {
  border-color: var(--color-primary);
  background-color: var(--bg-tertiary);
}

.checkbox-label.active {
  border-color: var(--color-primary);
  background-color: var(--bg-hover);
}

.checkbox-input {
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
  accent-color: var(--color-primary);
}

.checkbox-text {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-primary);
}

.checkbox-label.active .checkbox-text {
  color: var(--color-primary);
  font-weight: 600;
}

.scroll-hint {
  font-size: 0.875rem;
  color: var(--text-tertiary);
  margin: 0;
  padding-left: 0.5rem;
}
</style>
