import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, ShoppingBag, Calculator, Package,
  CreditCard, TrendingUp, Users, MoreHorizontal, LogOut, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

const NAV_MAIN = [
  { to: '/', icon: LayoutDashboard, label: 'Inicio' },
  { to: '/calculadora', icon: Calculator, label: 'Calcular' },
  { to: '/pedidos', icon: ShoppingBag, label: 'Pedidos' },
  { to: '/inventario', icon: Package, label: 'Stock' },
  { to: '/pagos', icon: CreditCard, label: 'Pagos' },
]

const NAV_MAS = [
  { to: '/finanzas', icon: TrendingUp, label: 'Finanzas' },
  { to: '/clientes', icon: Users, label: 'Clientes' },
]

export default function BottomNav() {
  const [masAbierto, setMasAbierto] = useState(false)
  const { logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    setMasAbierto(false)
    await logout()
    navigate('/login')
  }

  return (
    <>
      {/* Bottom nav bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border">
        <div className="flex items-center justify-around h-16 px-1">
          {NAV_MAIN.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors min-w-0',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                  <span className="text-[10px] font-medium truncate">{label}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* Botón Más */}
          <button
            onClick={() => setMasAbierto(true)}
            className={cn(
              'flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors',
              masAbierto ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <MoreHorizontal size={20} strokeWidth={1.5} />
            <span className="text-[10px] font-medium">Más</span>
          </button>
        </div>
      </nav>

      {/* Overlay menú Más */}
      <AnimatePresence>
        {masAbierto && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/60 z-50"
              onClick={() => setMasAbierto(false)}
            />

            {/* Sheet desde abajo */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl border-t border-border pb-safe"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>

              <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                <p className="font-semibold text-foreground text-sm">Más secciones</p>
                <button
                  onClick={() => setMasAbierto(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 space-y-2">
                {NAV_MAS.map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setMasAbierto(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-4 px-4 py-3.5 rounded-xl transition-colors w-full',
                        isActive
                          ? 'bg-primary/15 text-primary'
                          : 'bg-secondary text-foreground hover:bg-border'
                      )
                    }
                  >
                    <Icon size={20} />
                    <span className="font-medium text-sm">{label}</span>
                  </NavLink>
                ))}

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-4 px-4 py-3.5 rounded-xl bg-secondary hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors w-full"
                >
                  <LogOut size={20} />
                  <span className="font-medium text-sm">Cerrar sesión</span>
                </button>
              </div>

              {/* Padding seguro para home indicator de iPhone */}
              <div className="h-6" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
