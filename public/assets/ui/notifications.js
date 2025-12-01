// =============== 通知系统 ===============
// 负责显示各类通知消息（成功、错误、信息）

/**
 * 显示通知消息
 * @param {string} message - 通知内容
 * @param {string} type - 通知类型：'info', 'success', 'error'
 */
function showNotification(message, type = 'info') {
  const container = document.getElementById('notificationContainer');
  if (!container) return;

  const notification = document.createElement('div');
  const bgColor = type === 'error' ? '#fee' : type === 'success' ? '#efe' : '#eef';
  const borderColor = type === 'error' ? '#f99' : type === 'success' ? '#9f9' : '#99f';
  const textColor = type === 'error' ? '#c00' : type === 'success' ? '#060' : '#00c';

  notification.style.cssText = `
    background: ${bgColor};
    border: 2px solid ${borderColor};
    color: ${textColor};
    padding: 12px 16px;
    border-radius: 6px;
    margin-bottom: 10px;
    font-weight: 500;
    animation: slideIn 0.3s ease-out;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;

  notification.innerHTML = `
    <span>${message}</span>
    <button style="background:none;border:none;color:${textColor};cursor:pointer;font-size:18px;padding:0;margin-left:12px;">×</button>
  `;

  notification.querySelector('button').onclick = () => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  };

  container.appendChild(notification);

  // 自动消失（5秒后）
  setTimeout(() => {
    if (notification.parentElement) {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }
  }, 5000);
}

// 添加动画样式
if (!document.getElementById('notificationStyles')) {
  const style = document.createElement('style');
  style.id = 'notificationStyles';
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(400px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(400px); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}
