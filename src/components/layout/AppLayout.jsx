import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { PAGE_TRANSITION } from '@/utils/animations'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'

export default function AppLayout() {
  const location = useLocation()

  return (
    <div className="flex min-h-screen bg-background overflow-x-hidden">
      <Sidebar />

      <main className="flex-1 min-w-0 md:ml-64 flex flex-col min-h-screen overflow-x-hidden">
        {/*
          mode="wait" — la salida termina antes de que entre la nueva página.
          Esto evita que las tarjetas de ambas páginas se superpongan.
          El exit es rápido (140ms) para que la espera se sienta mínima.
        */}
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={PAGE_TRANSITION}
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
