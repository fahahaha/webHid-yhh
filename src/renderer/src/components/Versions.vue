<script setup lang="ts">
import { reactive } from 'vue'
import { getElectronAPI } from '../utils/env'

const electronAPI = getElectronAPI()
const versions = reactive(
  electronAPI?.process.versions || {
    electron: 'N/A (Web)',
    chrome: 'N/A (Web)',
    node: 'N/A (Web)'
  }
)
</script>

<template>
  <ul class="versions">
    <li class="electron-version">Electron v{{ versions.electron }}</li>
    <li class="chrome-version">Chromium v{{ versions.chrome }}</li>
    <li class="node-version">Node v{{ versions.node }}</li>
  </ul>
</template>
