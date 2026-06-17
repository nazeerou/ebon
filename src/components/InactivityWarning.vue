<!-- components/InactivityWarning.vue -->
<template>
  <div v-if="showWarning" class="inactivity-warning">
    <div class="warning-content">
      <i class="fas fa-clock"></i>
      <h3>Unaendelea kutokuwa active</h3>
      <p>Utaondolewa kwenye mfumo baada ya {{ remainingSeconds }} sekunde</p>
      <button @click="stayActive" class="btn-primary">Endelea kuwa active</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  warningTime: {
    type: Number,
    default: 60, // Warning 60 seconds before logout
  },
})

const emit = defineEmits(['stay-active'])

const authStore = useAuthStore()
const showWarning = ref(false)
const remainingSeconds = ref(props.warningTime)
let countdownInterval = null
let warningTimer = null

const startWarningTimer = () => {
  // Show warning 1 minute before inactivity logout
  warningTimer = setTimeout(
    () => {
      showWarning.value = true
      startCountdown()
    },
    30 * 60 * 1000 - props.warningTime * 1000,
  ) // 29 minutes
}

const startCountdown = () => {
  countdownInterval = setInterval(() => {
    remainingSeconds.value--
    if (remainingSeconds.value <= 0) {
      clearInterval(countdownInterval)
    }
  }, 1000)
}

const stayActive = () => {
  showWarning.value = false
  clearInterval(countdownInterval)
  clearTimeout(warningTimer)
  authStore.trackActivity()
  emit('stay-active')
}

onMounted(() => {
  startWarningTimer()
})

onUnmounted(() => {
  clearInterval(countdownInterval)
  clearTimeout(warningTimer)
})
</script>

<style scoped>
.inactivity-warning {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.warning-content {
  background: white;
  padding: 30px;
  border-radius: 10px;
  text-align: center;
  max-width: 400px;
  animation: slideUp 0.3s ease;
}

.warning-content i {
  font-size: 3rem;
  color: #f39c12;
  margin-bottom: 15px;
}

.warning-content h3 {
  color: #333;
  margin-bottom: 10px;
}

.warning-content p {
  color: #666;
  margin-bottom: 20px;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
