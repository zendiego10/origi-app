import { Outlet } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'

// Fade simple y rápido — sin movimiento Y para evitar el efecto "pegado"
// mode="sync" hace que entrada y salida ocurran a la vez, sin espera
const pageVariants = {
  initial: { opacity: 0 },
  enter: { opacity: 1, transition: { duration: 0.12, ease: 'easeOut' } },
  exit:  { opacity: 0, transition: { duration: 0.08 } },
}

export default function AppLayout() {
  const location = useLocation()

  return (
    <div className="flex min-h-screen bg-background overflow-x-hidden">
      <Sidebar />

      {/* min-w-0 es crítico: evita que flex-1 crezca más allá del viewport */}
      <main className="flex-1 min-w-0 md:ml-64 flex flex-col min-h-screen overflow-x-hidden">
        <AnimatePresence mode="sync">
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="enter"
            exit="exit"
            className="flex-1 flex flex-col pb-16 md:pb-0 w-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav />
    </div>
  )
}
