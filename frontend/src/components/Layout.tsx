import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Building2 } from 'lucide-react'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold">
            <Building2 className="w-6 h-6" />
            네이버 부동산 크롤러
          </Link>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
