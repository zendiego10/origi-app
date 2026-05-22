import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { pageVariants } from '@/lib/motion'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'

export default function AppLayout() {
  const location = useLocation()

  return (
    <div className="flex min-h-screen bg-background overflow-x-hidden">
      <Sidebar />

      <main className="flex-1 min-w-0 md:ml-64 flex flex-col min-h-screen overflow-x-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="enter"
            exit="exit"
            style={{ willChange: 'opacity, transform' }}
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
