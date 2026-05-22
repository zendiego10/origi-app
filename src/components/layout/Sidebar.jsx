import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { tap, hover, spring, dur, ease } from '@/lib/motion'
import {
  LayoutDashboard, Calculator, ShoppingBag,
  Package, CreditCard, TrendingUp, LogOut, Users,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/calculadora', icon: Calculator, label: 'Calculadora' },
  { to: '/pedidos', icon: ShoppingBag, label: 'Pedidos' },
  { to: '/inventario', icon: Package, label: 'Inventario' },
  { to: '/pagos', icon: CreditCard, label: 'Pagos' },
  { to: '/finanzas', icon: TrendingUp, label: 'Finanzas' },
  { to: '/clientes', icon: Users, label: 'Clientes' },
]

export default function Sidebar() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-card border-r border-border fixed left-0 top-0 z-40">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: dur.normal, ease: ease.outExpo }}
        className="flex items-center gap-3 px-6 py-5 border-b border-border"
      >
        <motion.div
          whileHover={{ scale: 1.08, rotate: -3 }}
          whileTap={{ scale: 0.94 }}
          transition={spring.snappy}
          className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center cursor-default"
        >
          <span className="text-white font-bold text-sm">O</span>
        </motion.div>
        <div>
          <p className="font-bold text-foreground leading-none">Origi</p>
          <p className="text-xs text-muted-foreground">Importaciones</p>
        </div>
      </motion.div>

      {/* Navegación */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ to, icon: Icon, label }, i) => (
          <motion.div
            key={to}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: dur.normal, ease: ease.outExpo, delay: 0.04 + i * 0.04 }}
          >
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors relative group',
                  isActive
                    ? 'text-white'
                    : 'text-muted-foreground hover:text-foreground'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {/* Fondo activo con layout animation */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-bg"
                      className="absolute inset-0 bg-primary rounded-xl"
                      transition={spring.smooth}
                    />
                  )}

                  {/* Hover background */}
                  {!isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-xl bg-secondary opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  )}

                  <motion.div
                    className="relative z-10"
                    whileHover={!isActive ? { scale: 1.1, rotate: -4 } : {}}
                    transition={spring.snap}
                  >
                    <Icon size={17} />
                  </motion.div>
                  <span className="relative z-10">{label}</span>
                </>
              )}
            </NavLink>
          </motion.div>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-border">
        <motion.button
          onClick={handleLogout}
          whileHover={{ x: 2, color: '#f87171' }}
          whileTap={tap.button}
          transition={spring.gentle}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-muted-foreground transition-colors"
        >
          <motion.div whileTap={{ rotate: 15 }} transition={spring.snap}>
            <LogOut size={17} />
          </motion.div>
          <span>Cerrar sesión</span>
        </motion.button>
      </div>
    </aside>
  )
}
