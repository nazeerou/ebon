<template>
  <div class="not-found-container">
    <div class="not-found-card">
      <div class="icon-wrapper">
        <i class="fas fa-exclamation-triangle"></i>
      </div>
      <h1 class="error-code">404</h1>
      <h2 class="title">Ukurasa Haupatikani</h2>
      <p class="message"></p>
      <div class="action-buttons">
        <router-link to="/dashboard" class="btn-primary">
          <i class="fas fa-home"></i>
          Rudi Dashboard
        </router-link>
        <button @click="goBack" class="btn-secondary">
          <i class="fas fa-arrow-left"></i>
          Rudi Nyuma
        </button>
      </div>
      <div class="suggestions">
        <p>Ukurasa uliopo:</p>
        <div class="available-routes">
          <router-link to="/dashboard" class="suggestion-link">
            <i class="fas fa-chart-pie"></i>
            Dashboard
          </router-link>
          <router-link to="/customers" class="suggestion-link">
            <i class="fas fa-users"></i>
            Wateja
          </router-link>
          <router-link to="/loans" class="suggestion-link">
            <i class="fas fa-hand-holding-usd"></i>
            Mikopo
          </router-link>
          <router-link to="/payments" class="suggestion-link">
            <i class="fas fa-money-bill-wave"></i>
            Malipo
          </router-link>
          <router-link to="/reports" class="suggestion-link">
            <i class="fas fa-chart-bar"></i>
            Ripoti
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.not-found-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.not-found-card {
  background: white;
  border-radius: 20px;
  padding: 50px 40px;
  max-width: 500px;
  width: 100%;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  animation: slideUp 0.5s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.icon-wrapper {
  margin-bottom: 20px;
}

.icon-wrapper i {
  font-size: 80px;
  color: #f39c12;
}

.error-code {
  font-size: 80px;
  font-weight: 800;
  color: #e74c3c;
  margin: 0;
  line-height: 1;
}

.title {
  font-size: 28px;
  color: #333;
  margin: 20px 0 15px;
  font-weight: 600;
}

.message {
  color: #666;
  font-size: 16px;
  margin-bottom: 30px;
  line-height: 1.5;
}

.action-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-bottom: 30px;
}

.btn-primary,
.btn-secondary {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.btn-secondary {
  background: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.suggestions {
  border-top: 1px solid #eef2f6;
  padding-top: 20px;
}

.suggestions p {
  color: #999;
  font-size: 14px;
  margin-bottom: 15px;
}

.available-routes {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.suggestion-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  background: #f8fafc;
  color: #667eea;
  text-decoration: none;
  border-radius: 20px;
  font-size: 13px;
  transition: all 0.3s;
}

.suggestion-link:hover {
  background: #667eea;
  color: white;
  transform: translateY(-2px);
}

.suggestion-link i {
  font-size: 12px;
}

@media (max-width: 768px) {
  .not-found-card {
    padding: 30px 20px;
  }

  .error-code {
    font-size: 60px;
  }

  .title {
    font-size: 24px;
  }

  .action-buttons {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary {
    justify-content: center;
  }
}
</style>
