import { User } from '../types';
import { api } from '../lib/api';
import { LogOut, User as UserIcon, ShieldAlert, BookOpen, UtensilsCrossed } from 'lucide-react';

interface NavbarProps {
  user: User;
  isAdminView: boolean;
  onToggleAdminView: () => void;
  onLogout: () => void;
}

export default function Navbar({ user, isAdminView, onToggleAdminView, onLogout }: NavbarProps) {
  const handleLogout = () => {
    api.logout();
    onLogout();
  };

  return (
    <header className="bg-slate-950/80 border-b border-slate-900 sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo / Brand */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-teal-400 to-blue-500 rounded-lg text-slate-950 shadow-md shadow-teal-500/10">
              <UtensilsCrossed className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-display font-bold text-white leading-tight">
                La Table de L'Artiste
              </h1>
              <span className="text-[10px] text-teal-400 font-mono tracking-widest uppercase">
                {isAdminView ? 'Administrative Mode' : 'Guest Reservations'}
              </span>
            </div>
          </div>

          {/* Actions / User context */}
          <div className="flex items-center gap-4">
            {/* Admin Switcher */}
            {user.role === 'admin' && (
              <button
                onClick={onToggleAdminView}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  isAdminView
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 font-mono'
                    : 'bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-500/20 font-mono'
                }`}
              >
                {isAdminView ? (
                  <>
                    <BookOpen className="h-3.5 w-3.5" />
                    Guest View
                  </>
                ) : (
                  <>
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Admin View
                  </>
                )}
              </button>
            )}

            {/* Profile badge */}
            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg">
              <div className="p-1 bg-slate-800 rounded-full text-teal-400">
                <UserIcon className="h-3.5 w-3.5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-slate-200 leading-none">{user.name}</p>
                <p className="text-[10px] text-slate-500 leading-none mt-1 font-mono">{user.email}</p>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-all border border-transparent hover:border-rose-900/50 cursor-pointer"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
