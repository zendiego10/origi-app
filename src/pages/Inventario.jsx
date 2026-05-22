import TopBar from '@/components/layout/TopBar'
import { Construction } from 'lucide-react'

export default function PAGENAME() {
  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="PAGETITLE" />
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <Construction size={48} className="text-muted-foreground opacity-30 mb-4" />
        <p className="text-foreground font-medium">Próximamente</p>
        <p className="text-muted-foreground text-sm mt-1">Esta sección se construye en la Fase 2</p>
      </div>
    </div>
  )
}
