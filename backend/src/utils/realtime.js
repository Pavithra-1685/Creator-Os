const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const triggerRealtimeNotification = async (userId, title, message, type = 'SYSTEM', actionUrl = null) => {
  try {
    // 1. Store in the database
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        actionUrl,
        isRead: false
      }
    });

    // 2. Emit via WebSocket
    if (global.io) {
      global.io.to(userId).emit('notification_received', notification);
      global.io.to(userId).emit('dashboard_data_updated', { type, data: notification });
    }

    return notification;
  } catch (error) {
    console.error('Error creating realtime notification:', error);
  }
};

module.exports = { triggerRealtimeNotification };
