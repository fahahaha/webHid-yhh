<template>
  <div class="device-info-container">
    <!-- 设备信息 -->
    <div class="info-card card-hover">
      <h3 class="card-title"><i class="fa fa-info-circle icon-primary"></i>{{ t('deviceInfo.title') }}</h3>

      <div class="info-list">
        <div class="info-item">
          <span class="info-label">{{ t('deviceInfo.name') }}</span>
          <span class="info-value">{{ deviceInfo.name }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">{{ t('deviceInfo.model') }}</span>
          <span class="info-value">{{ deviceInfo.model }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">{{ t('deviceInfo.firmwareVersion') }}</span>
          <span class="info-value">{{ deviceInfo.firmwareVersion }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">{{ t('deviceInfo.connectionType') }}</span>
          <span class="info-value">{{ deviceInfo.connectionType }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">{{ t('deviceInfo.vidPid') }}</span>
          <span class="info-value">{{ deviceInfo.vidPid }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">{{ t('deviceInfo.protocol') }}</span>
          <span class="info-value">{{ deviceInfo.protocol }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">{{ t('deviceInfo.status') }}</span>
          <span
            class="info-value"
            :class="deviceInfo.status === '已连接' ? 'status-connected' : 'status-disconnected'"
          >
            {{ deviceInfo.status === '已连接' ? t('deviceInfo.statusConnected') : t('deviceInfo.statusDisconnected') }}
          </span>
        </div>
      </div>
    </div>

    <!-- 电池和维护 -->
    <div class="battery-card card-hover">
      <h3 class="card-title">
        <i class="fa fa-battery-three-quarters icon-warning"></i>{{ t('deviceInfo.battery.title') }}
      </h3>

      <div class="battery-section">
        <!-- 电池信息 -->
        <div class="battery-info">
          <div class="battery-header">
            <span class="battery-label">{{ t('deviceInfo.battery.level') }}</span>
            <span class="battery-percent">{{ batteryPercent }}</span>
          </div>
          <div class="battery-bar">
            <div
              class="battery-fill"
              :class="batteryColorClass"
              :style="{ width: batteryPercent }"
            ></div>
          </div>
          <div class="battery-markers">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
          <div class="battery-status">
            <i class="fa fa-info-circle"></i>
            <span>{{ chargeStatus }}</span>
          </div>
        </div>

        <!-- 设备维护 -->
        <div class="maintenance-actions">
          <button @click="checkUpdate" class="btn-primary action-btn">
            <i class="fa fa-download"></i>{{ t('deviceInfo.battery.checkUpdate') }}
          </button>
          <button @click="restoreDefaults" class="btn-secondary action-btn">
            <i class="fa fa-refresh"></i>{{ t('deviceInfo.battery.restoreDefaults') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useWebHID } from '../composables/useWebHID'
import { useI18n } from '../composables/useI18n'

const { deviceInfo, deviceStatus } = useWebHID()
const { t } = useI18n()

const batteryPercent = computed(() => deviceStatus.value.battery)

const batteryColorClass = computed(() => {
  const percent = parseInt(batteryPercent.value)
  if (percent < 30) return 'battery-low'
  if (percent < 50) return 'battery-medium'
  return 'battery-high'
})

const chargeStatus = computed(() => {
  if (!deviceInfo.value || deviceInfo.value.status !== '已连接') {
    return t('deviceInfo.battery.notConnected')
  }
  return t('deviceInfo.battery.notCharging')
})

function checkUpdate() {
  alert(t('deviceInfo.battery.checkingUpdate'))
}

function restoreDefaults() {
  if (confirm(t('deviceInfo.battery.restoreConfirm'))) {
    alert(t('deviceInfo.battery.restoring'))
    setTimeout(() => {
      alert(t('deviceInfo.battery.restoreSuccess'))
    }, 2000)
  }
}
</script>

<style scoped>
.device-info-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .device-info-container {
    grid-template-columns: repeat(2, 1fr);
  }
}

.info-card,
.battery-card {
  background-color: var(--bg-primary);
  border-radius: 0.75rem;
  box-shadow: var(--shadow-sm);
  padding: 1.25rem;
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

.icon-primary {
  color: var(--color-primary);
}

.icon-warning {
  color: var(--color-warning);
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-secondary);
}

.info-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.info-label {
  color: var(--text-secondary);
}

.info-value {
  font-weight: 500;
  color: var(--text-primary);
}

.status-connected {
  color: var(--color-success);
}

.status-disconnected {
  color: var(--color-danger);
}

.battery-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.battery-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.battery-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.battery-label {
  color: var(--text-secondary);
}

.battery-percent {
  font-weight: 500;
  color: var(--text-primary);
}

.battery-bar {
  height: 0.75rem;
  background-color: var(--bg-tertiary);
  border-radius: 9999px;
  overflow: hidden;
}

.battery-fill {
  height: 100%;
  border-radius: 9999px;
  transition: all 0.3s;
}

.battery-low {
  background-color: var(--color-danger);
}

.battery-medium {
  background-color: var(--color-warning);
}

.battery-high {
  background-color: var(--color-success);
}

.battery-markers {
  display: flex;
  justify-content: space-between;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.battery-status {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--text-secondary);
}

.battery-status i {
  color: var(--text-tertiary);
}

.maintenance-actions {
  padding-top: 0.5rem;
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
</style>
