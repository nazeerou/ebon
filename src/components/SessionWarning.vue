<template>
  <div v-if="auth.warningVisible" class="session-warning">
    <div class="warning-box">
      <h3>Session Expiring Soon</h3>

      <p>You will be logged out in 5 minutes due to inactivity.</p>

      <button @click="stayLoggedIn">Continue Session</button>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const stayLoggedIn = () => {
  auth.trackActivity()
}
</script>

<style>
.session-warning {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
}

.warning-box {
  background: white;
  padding: 30px;
  border-radius: 10px;
  text-align: center;
}
</style>
