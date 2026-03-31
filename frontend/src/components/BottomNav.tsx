import { NavLink, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Package, 
  ShoppingCart, 
  FileText
} from 'lucide-react'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Início' },
  { path: '/pedidos', icon: ShoppingCart, label: 'Pedidos' },
  { path: '/clientes', icon: Users, label: 'Clientes' },
  { path: '/produtos', icon: Package, label: 'Produtos' },
  { path: '/empresas', icon: Building2, label: 'Empresas' },
  { path: '/notas-fiscais', icon: FileText, label: 'NF-es' },
]

export function BottomNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-dark-900 border-t border-dark-800 z-40 safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
                           (item.path !== '/' && location.pathname.startsWith(item.path))
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`
                flex flex-col items-center gap-1 px-3 py-2 rounded-xl min-w-[64px]
                transition-all duration-200
                ${isActive 
                  ? 'text-primary-400' 
                  : 'text-dark-500 hover:text-dark-300'
                }
              `}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
