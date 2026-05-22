import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function TopBar({ title, backTo, actions }) {
  const navigate = useNavigate()

  return (
    <header className="flex items-center justify-between h-14 px-4 border-b border-border bg-background sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {backTo && (
          <button
            onClick={() => navigate(backTo)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <h1 className="text-base font-semibold text-foreground">{title}</h1>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  )
}
