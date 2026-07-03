import { useState, useEffect } from 'react';
import { User } from './types';
import { api } from './lib/api';
import Navbar from './components/Navbar';
import LoginModal from './components/LoginModal';
import CustomerDashboard from './components/CustomerDashboard';
import AdminDashboard from './components/AdminDashboard';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdminView, setIsAdminView] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const data = await api.getMe();
      if (data.user) {
        setUser(data.user);
        setIsAdminView(data.user.role === 'admin');
      }
    } catch (e) {
      // Token expired or invalid, clear token
      api.logout();
      setUser(null);
    } finally {
      loading && setLoading(false);
    }
  };

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    setIsAdminView(loggedInUser.role === 'admin');
  };

  const handleLogoutSuccess = () => {
    setUser(null);
    setIsAdminView(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-teal-400 mb-2" />
        <p className="text-sm font-semibold text-slate-400 font-mono tracking-widest uppercase">Initializing dining services...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <AnimatePresence mode="wait">
        <LoginModal onSuccess={handleLoginSuccess} />
      </AnimatePresence>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        user={user}
        isAdminView={isAdminView}
        onToggleAdminView={() => setIsAdminView(!isAdminView)}
        onLogout={handleLogoutSuccess}
      />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={isAdminView ? 'admin' : 'customer'}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
          >
            {isAdminView ? (
              <AdminDashboard />
            ) : (
              <CustomerDashboard userId={user.id} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
