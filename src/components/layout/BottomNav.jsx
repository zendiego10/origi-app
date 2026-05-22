import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  LayoutDashboard, ShoppingBag, Calculator, Package,
  CreditCard, TrendingUp, Users, MoreHorizontal, LogOut, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { tap, hover, spring, dur, ease, slideUp, backdropVariants } from '@/lib/motion'

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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/90 backdrop-blur-md border-t border-border">
        <div className="flex items-center justify-around h-16 px-1">
          {NAV_MAIN.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg min-w-0"
            >
              {({ isActive }) => (
                <motion.div
                  className="flex flex-col items-center gap-0.5 relative"
                  whileTap={tap.button}
                  transition={spring.snap}
                >
                  <motion.div
                    animate={{
                      scale: isActive ? 1.15 : 1,
                      y: isActive ? -1 : 0,
                    }}
                    transition={spring.snappy}
                    className={cn(isActive ? 'text-primary' : 'text-muted-foreground')}
                  >
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                  </motion.div>
                  <span className={cn(
                    'text-[10px] font-medium truncate transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}>
                    {label}
                  </span>
                  {/* Dot indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="bottom-nav-dot"
                      className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary"
                      transition={spring.smooth}
                    />
                  )}
                </motion.div>
              )}
            </NavLink>
          ))}

          {/* Botón Más */}
          <motion.button
            onClick={() => setMasAbierto(true)}
            whileTap={tap.button}
            transition={spring.snap}
            className={cn(
              'flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg min-w-0',
              masAbierto ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <motion.div
              animate={{ rotate: masAbierto ? 90 : 0 }}
              transition={spring.snappy}
            >
              <MoreHorizontal size={20} strokeWidth={1.5} />
            </motion.div>
            <span className="text-[10px] font-medium">Más</span>
          </motion.button>
        </div>
      </nav>

      {/* Overlay menú Más */}
      <AnimatePresence>
        {masAbierto && (
          <>
            {/* Backdrop */}
            <motion.div
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="md:hidden fixed inset-0 bg-black/60 z-50"
              onClick={() => setMasAbierto(false)}
            />

            {/* Sheet desde abajo */}
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={spring.smooth}
              className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl border-t border-border"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.1, duration: dur.fast, ease: ease.outExpo }}
                  className="w-10 h-1 rounded-full bg-border"
                />
              </div>

              <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                <p className="font-semibold text-foreground text-sm">Más secciones</p>
                <motion.button
                  onClick={() => setMasAbierto(false)}
                  whileHover={hover.icon}
                  whileTap={tap.icon}
                  transition={spring.snap}
                  className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
                >
                  <X size={18} />
                </motion.button>
              </div>

              <div className="p-4 space-y-2">
                {NAV_MAS.map(({ to, icon: Icon, label }, i) => (
                  <motion.div
                    key={to}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 + i * 0.06, duration: dur.normal, ease: ease.outExpo }}
                  >
                    <NavLink
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
                      {({ isActive }) => (
                        <>
                          <motion.div
                            animate={{ scale: isActive ? 1.1 : 1 }}
                            transition={spring.snappy}
                          >
                            <Icon size={20} />
                          </motion.div>
                          <span className="font-medium text-sm">{label}</span>
                        </>
                      )}
                    </NavLink>
                  </motion.div>
                ))}

                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: dur.normal, ease: ease.outExpo }}
                >
                  <motion.button
                    onClick={handleLogout}
                    whileTap={tap.button}
                    className="flex items-center gap-4 px-4 py-3.5 rounded-xl bg-secondary hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors w-full"
                  >
                    <LogOut size={20} />
                    <span className="font-medium text-sm">Cerrar sesión</span>
                  </motion.button>
                </motion.div>
              </div>

              <div className="h-6" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
