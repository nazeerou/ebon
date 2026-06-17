<!-- components/common/MainLayout.vue -->
<template>
  <div class="layout">
    <Sidebar v-if="authStore.isAuthenticated" />
    <div class="main-content" :class="{ 'with-sidebar': authStore.isAuthenticated }">
      <Navbar v-if="authStore.isAuthenticated" />
      <div class="content">
        <router-view />
      </div>
      <Footer v-if="authStore.isAuthenticated" />
    </div>
  </div>
</template>

<script setup>
import Sidebar from './Sidebar.vue'
import Navbar from './Navbar.vue'
import Footer from './Footer.vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}
.with-sidebar {
  margin-left: 250px;
}
.content {
  flex: 1;
  padding: 20px;
}
</style>