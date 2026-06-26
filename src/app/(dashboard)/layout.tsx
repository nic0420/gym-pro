import Link from 'next/link';
import { Home, Users, Calendar, Settings, Dumbbell } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <Dumbbell className="h-8 w-8 text-blue-500" />
          <span className="text-2xl font-black text-white tracking-tight">GYM<span className="text-blue-500">PRO</span></span>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-900 hover:text-white transition-colors">
            <Home className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>
          <Link href="/members" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-900 hover:text-white transition-colors">
            <Users className="h-5 w-5" />
            <span>Socios</span>
          </Link>
          <Link href="/classes" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-900 hover:text-white transition-colors">
            <Calendar className="h-5 w-5" />
            <span>Clases</span>
          </Link>
        </nav>
        
        <div className="p-4 border-t border-slate-900">
          <button className="flex items-center gap-3 px-3 py-2 w-full rounded-lg hover:bg-slate-900 hover:text-white transition-colors">
            <Settings className="h-5 w-5" />
            <span>Configuración</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
