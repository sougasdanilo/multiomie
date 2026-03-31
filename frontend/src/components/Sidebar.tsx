import { NavLink, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Package, 
  ShoppingCart, 
  FileText, 
  Settings,
  X
} from 'lucide-react'
import { useAppStore } from '../stores/appStore'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/empresas', icon: Building2, label: 'Empresas' },
  { path: '/clientes', icon: Users, label: 'Clientes' },
  { path: '/produtos', icon: Package, label: 'Produtos' },
  { path: '/pedidos', icon: ShoppingCart, label: 'Pedidos' },
  { path: '/notas-fiscais', icon: FileText, label: 'NF-es' },
  { path: '/configuracoes', icon: Settings, label: 'Configurações' },
]

export function Sidebar() {
  const { sidebarOpen, toggleSidebar, isMobile } = useAppStore()
  const location = useLocation()

  if (isMobile && !sidebarOpen) return null

  return (
    <>
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-dark-900 border-r border-dark-800
        transform transition-transform duration-300 ease-in-out
        ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}
        flex flex-col
      `}>
        <div className="flex items-center justify-between p-4 border-b border-dark-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <div>
              <h1 className="font-bold text-dark-100">MultiOmie</h1>
              <p className="text-xs text-dark-500">ERP Multi-CNPJ</p>
            </div>
          </div>
          {isMobile && (
            <button onClick={toggleSidebar} className="p-2 hover:bg-dark-800 rounded-lg">
              <X className="w-5 h-5 text-dark-400" />
            </button>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
                           (item.path !== '/' && location.pathname.startsWith(item.path))
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => isMobile && toggleSidebar()}
                className={isActive ? 'nav-item-active' : 'nav-item'}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="p-4 border-t border-dark-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-dark-800 rounded-full flex items-center justify-center">
              <span className="text-dark-300 font-medium">A</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-dark-200 truncate">Administrador</p>
              <p className="text-xs text-dark-500 truncate">admin@multiomie.com</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
