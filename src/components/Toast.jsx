import { useState, useEffect, createContext, useContext, useCallback } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, duration)
    }
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error:   (msg, dur) => addToast(msg, 'error', dur),
    info:    (msg, dur) => addToast(msg, 'info', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
  }

  const typeStyles = {
    success: { bg: '#22c55e', icon: 'bi-check-circle-fill' },
    error:   { bg: '#ef4444', icon: 'bi-x-circle-fill' },
    info:    { bg: '#3b82f6', icon: 'bi-info-circle-fill' },
    warning: { bg: '#f59e0b', icon: 'bi-exclamation-triangle-fill' },
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '340px',
        pointerEvents: 'none',
      }}>
        {toasts.map(t => {
          const style = typeStyles[t.type] || typeStyles.info
          return (
            <div
              key={t.id}
              style={{
                background: style.bg,
                color: '#fff',
                padding: '12px 16px',
                borderRadius: '10px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '14px',
                fontWeight: 500,
                pointerEvents: 'all',
                animation: 'slideIn 0.25s ease',
              }}
            >
              <i className={`bi ${style.icon}`} style={{ fontSize: '16px', flexShrink: 0 }}></i>
              <span style={{ flex: 1 }}>{t.message}</span>
              <button
                onClick={() => removeToast(t.id)}
                style={{
                  background: 'none', border: 'none', color: '#fff',
                  cursor: 'pointer', padding: 0, fontSize: '16px', lineHeight: 1, opacity: 0.8
                }}
              >×</button>
            </div>
          )
        })}
      </div>
      <style>{`@keyframes slideIn { from { transform: translateX(60px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
