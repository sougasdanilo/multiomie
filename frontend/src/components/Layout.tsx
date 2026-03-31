import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { Header } from './Header'
import { useAppStore } from '../stores/appStore'

export function Layout() {
  const { isMobile, setIsMobile, setSidebarOpen } = useAppStore()

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (mobile) {
        setSidebarOpen(false)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [setIsMobile, setSidebarOpen])

  return (
    <div className="min-h-screen bg-dark-950 flex">
      {!isMobile && <Sidebar />}
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        
        <main className="flex-1 overflow-y-auto scrollbar-hide pb-20 lg:pb-0">
          <Outlet />
        </main>
        
        {isMobile && <BottomNav />}
      </div>
    </div>
  )
}
