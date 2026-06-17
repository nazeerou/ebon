// stores/notification.js
import { defineStore } from 'pinia'
import api from '@/services/api'

// const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'

const API_URL = import.meta.env.VITE_API_URL || 'https://web.bas.co.tz/api/v1'

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [],
    unreadCount: 0,
  }),

  actions: {
    async fetchNotifications() {
      try {
        const response = await api.get(`${API_URL}/notifications`)
        this.notifications = response.data
        this.updateUnreadCount()
      } catch (error) {
        console.error('Error fetching notifications:', error)
      }
    },

    async markAsRead(id) {
      try {
        await api.patch(`${API_URL}/notifications/${id}/read`)
        const notification = this.notifications.find((n) => n.id === id)
        if (notification) {
          notification.read = true
        }
        this.updateUnreadCount()
      } catch (error) {
        console.error('Error marking notification as read:', error)
      }
    },

    async markAllAsRead() {
      try {
        await api.patch(`${API_URL}/notifications/read-all`)
        this.notifications.forEach((n) => (n.read = true))
        this.unreadCount = 0
      } catch (error) {
        console.error('Error marking all notifications as read:', error)
      }
    },

    updateUnreadCount() {
      this.unreadCount = this.notifications.filter((n) => !n.read).length
    },

    addNotification(notification) {
      this.notifications.unshift(notification)
      this.updateUnreadCount()
    },
  },
})
