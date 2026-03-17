import { Bell, Search, Menu } from 'lucide-react';

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  return (
    <header className="flex h-20 items-center justify-between bg-transparent px-6 sm:px-8">
      <div className="flex items-center gap-6">
        {onMenuClick && (
          <button 
            onClick={onMenuClick}
            className="lg:hidden text-slate-500 hover:text-primary p-2 -ml-2 transition-colors active:scale-90"
          >
            <Menu className="h-7 w-7" />
          </button>
        )}
        <div className="relative hidden sm:block group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            className="h-11 w-72 md:w-96 rounded-full border border-slate-200 bg-slate-100/50 pl-11 pr-6 text-sm outline-none focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <button className="sm:hidden relative text-slate-500 hover:text-primary p-2 transition-colors active:scale-95">
          <Search className="h-6 w-6" />
        </button>
        <button className="relative text-slate-500 hover:text-primary p-2 bg-slate-100/50 rounded-full transition-all active:scale-95 group">
          <Bell className="h-5 w-5 group-hover:rotate-12 transition-transform" />
          <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-4 ring-white shadow-sm" />
        </button>
        <div className="hidden sm:block h-10 w-10 rounded-full bg-gradient-to-br from-primary to-indigo-600 shadow-md shadow-primary/20 border-2 border-white" />
      </div>
    </header>
  );
}
