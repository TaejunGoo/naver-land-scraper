import { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Building2, ChevronLeft } from 'lucide-react'
import { useHeaderStore } from '../lib/store'
import { Button } from './ui/button'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { title, actions, showBackButton } = useHeaderStore()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950">
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md dark:bg-slate-900/80">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate(-1)} 
                className="-ml-2 h-9 w-9 rounded-full hover:bg-slate-100"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            )}
            <Link to="/" className="flex items-center gap-2.5 transition-colors hover:opacity-80">
              <div className="bg-primary p-1.5 rounded-lg shadow-sm">
                <Building2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold tracking-tight sr-only sm:not-sr-only">랜드브리핑</span>
            </Link>

            {title && (
              <>
                <div className="h-4 w-px bg-slate-200" />
                <div className="flex flex-col">
                  {typeof title === 'string' ? (
                    <span className="font-semibold text-slate-900 line-clamp-1">{title}</span>
                  ) : (
                    title
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {actions}
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
