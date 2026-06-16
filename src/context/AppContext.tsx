import { createContext, useContext, ReactNode } from 'react'
import { useAppStore, AppStore } from '@/store/useAppStore'

const AppContext = createContext<AppStore | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const store = useAppStore()
  return (
    <AppContext.Provider value={store}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}
