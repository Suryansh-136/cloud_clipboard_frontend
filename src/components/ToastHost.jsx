import { Toaster } from 'react-hot-toast'

import { useTheme } from '../context/ThemeContext'

const DARK_TOAST = {
  background: 'linear-gradient(150deg, #17213a, #101827)',
  color: '#e2e8f0',
  border: '1px solid rgba(148, 163, 184, 0.16)',
  borderRadius: '1.25rem',
  padding: '12px 16px',
  fontSize: '0.875rem',
  fontWeight: 600,
  boxShadow: '10px 10px 22px #06090f, -10px -10px 22px #1f2c47',
}

const LIGHT_TOAST = {
  background: 'linear-gradient(150deg, #fffefb, #f6efe0)',
  color: '#44403c',
  border: '1px solid rgba(120, 100, 66, 0.25)',
  borderRadius: '1.25rem',
  padding: '12px 16px',
  fontSize: '0.875rem',
  fontWeight: 600,
  boxShadow: '8px 8px 18px #ddd2bc, -8px -8px 18px #ffffff',
}

/** Single, globally styled toast surface for the whole app. */
export function ToastHost() {
  const { theme } = useTheme()
  const clayToast = theme === 'light' ? LIGHT_TOAST : DARK_TOAST

  return (
    <Toaster
      position="top-center"
      gutter={12}
      containerStyle={{ top: 20 }}
      toastOptions={{
        duration: 3600,
        style: clayToast,
        success: {
          iconTheme:
            theme === 'light'
              ? { primary: '#059669', secondary: '#d1fae5' }
              : { primary: '#34d399', secondary: '#04231b' },
        },
        error: {
          duration: 5200,
          iconTheme:
            theme === 'light'
              ? { primary: '#e11d48', secondary: '#ffe4e6' }
              : { primary: '#fb7185', secondary: '#4c0519' },
          style: {
            ...clayToast,
            border:
              theme === 'light'
                ? '1px solid rgba(225, 29, 72, 0.4)'
                : '1px solid rgba(251, 113, 133, 0.35)',
          },
        },
        loading: {
          iconTheme:
            theme === 'light'
              ? { primary: '#4f46e5', secondary: '#e0e7ff' }
              : { primary: '#818cf8', secondary: '#1e1b4b' },
        },
      }}
    />
  )
}

export default ToastHost
