import React, { useState } from 'react';
import { api } from '../lib/api';
import { User } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, UserPlus, Shield, Sparkles, Loader2, KeyRound } from 'lucide-react';

interface LoginModalProps {
  onSuccess: (user: User) => void;
}

export default function LoginModal({ onSuccess }: LoginModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const data = await api.login(email, password);
        onSuccess(data.user);
      } else {
        const data = await api.register(email, password, name);
        onSuccess(data.user);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillCredentials = (role: 'customer' | 'admin') => {
    if (role === 'customer') {
      setEmail('customer@gmail.com');
      setPassword('customer123');
    } else {
      setEmail('admin@restaurant.com');
      setPassword('admin123');
    }
    setIsLogin(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-2">
        <div className="flex justify-center items-center gap-2 mb-2">
          <div className="bg-gradient-to-br from-teal-400 to-blue-600 text-white p-3 rounded-2xl shadow-lg shadow-teal-500/20">
            <Sparkles className="h-6 w-6" />
          </div>
        </div>
        <p className="text-center text-teal-400 font-mono text-xs tracking-widest uppercase mb-1">
          Academic Assignment / CS402
        </p>
        <h2 className="text-center text-3xl font-display font-extrabold text-white tracking-tight">
          La Table de L'Artiste
        </h2>
        <p className="mt-1 text-center text-sm text-slate-400 font-sans">
          Restaurant Reservation Management System
        </p>
      </div>

      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 border border-slate-800 py-8 px-6 shadow-2xl rounded-3xl sm:px-10 relative overflow-hidden"
        >
          {/* Quick seeded login helpers in Bento design */}
          <div className="mb-6 p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
            <h4 className="text-xs font-semibold text-teal-400 flex items-center gap-1.5 uppercase tracking-widest font-mono mb-3">
              <KeyRound className="h-3.5 w-3.5" /> Seeding Credentials (For Grading)
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleFillCredentials('customer')}
                className="flex flex-col items-start p-2.5 text-left bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-teal-500/30 rounded-xl transition-all text-xs cursor-pointer"
              >
                <span className="font-semibold text-slate-200 flex items-center gap-1">
                  Customer Role
                </span>
                <span className="text-slate-400 font-mono text-[10px] mt-1 break-all">customer@gmail.com</span>
                <span className="text-[10px] text-teal-500 font-mono mt-0.5">pass: customer123</span>
              </button>
              <button
                type="button"
                onClick={() => handleFillCredentials('admin')}
                className="flex flex-col items-start p-2.5 text-left bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-rose-500/30 rounded-xl transition-all text-xs cursor-pointer"
              >
                <span className="font-semibold text-rose-300 flex items-center gap-1">
                  <Shield className="h-3 w-3 text-rose-400" /> Admin Role
                </span>
                <span className="text-slate-400 font-mono text-[10px] mt-1 break-all">admin@restaurant.com</span>
                <span className="text-[10px] text-rose-400 font-mono mt-0.5">pass: admin123</span>
              </button>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none block w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl shadow-inner placeholder-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm font-sans"
                  placeholder="Enter your full name"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl shadow-inner placeholder-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm font-sans"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl shadow-inner placeholder-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm font-sans"
                placeholder="••••••••"
              />
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-rose-500/10 border-l-4 border-rose-500 p-3 rounded-r-lg"
                >
                  <p className="text-xs font-medium text-rose-400 font-sans">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed cursor-pointer font-sans"
              >
                {loading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : isLogin ? (
                  <span className="flex items-center gap-1.5">
                    <LogIn className="h-4 w-4" /> Sign In
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <UserPlus className="h-4 w-4" /> Register Account
                  </span>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-5">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-xs font-semibold text-teal-400 hover:text-teal-300 transition-colors cursor-pointer font-mono uppercase tracking-wider"
            >
              {isLogin ? "Need an account? Sign up" : 'Have an account? Sign in'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
