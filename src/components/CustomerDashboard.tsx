import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Table, Reservation, TIME_SLOTS } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Users, Clock, ClipboardList, CheckCircle2, XCircle, AlertCircle, RefreshCw, Compass } from 'lucide-react';

interface CustomerDashboardProps {
  userId: string;
}

export default function CustomerDashboard({ userId }: CustomerDashboardProps) {
  const [tables, setTables] = useState<Table[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  
  // Form states
  const [date, setDate] = useState<string>(() => {
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [timeSlot, setTimeSlot] = useState<string>(TIME_SLOTS[0]);
  const [guestsCount, setGuestsCount] = useState<number>(2);
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  
  // Status states
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [allTables, myReservations] = await Promise.all([
        api.getTables(),
        api.getReservations()
      ]);
      setTables(allTables);
      setReservations(myReservations);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  // Live availability analysis
  const getTableStatus = (table: Table) => {
    if (!table.isAvailable) {
      return { 
        status: 'out-of-service', 
        label: 'Out of Service', 
        color: 'bg-slate-900/40 text-slate-500 border-slate-800/80' 
      };
    }
    
    // Check capacity
    if (table.capacity < guestsCount) {
      return { 
        status: 'too-small', 
        label: `Too Small (Max ${table.capacity})`, 
        color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' 
      };
    }

    // Check overlap
    const isBooked = reservations.some(
      r => r.tableId === table.id && 
           r.date === date && 
           r.timeSlot === timeSlot && 
           r.status === 'confirmed'
    );

    if (isBooked) {
      return { 
        status: 'occupied', 
        label: 'Reserved Slot', 
        color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
      };
    }

    return { 
      status: 'available', 
      label: `Available (Seats up to ${table.capacity})`, 
      color: 'bg-teal-500/5 text-teal-300 border-teal-500/20 hover:border-teal-400 hover:bg-teal-500/10 cursor-pointer' 
    };
  };

  // Reset table selection when inputs change
  useEffect(() => {
    setSelectedTableId('');
  }, [date, timeSlot, guestsCount]);

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedTableId) {
      setError('Please select an available table that fits your party.');
      return;
    }

    const table = tables.find(t => t.id === selectedTableId);
    if (!table) {
      setError('Selected table does not exist.');
      return;
    }

    const tableStatus = getTableStatus(table);
    if (tableStatus.status !== 'available') {
      setError(`Cannot book this table: ${tableStatus.label}`);
      return;
    }

    setSubmitLoading(true);
    try {
      await api.createReservation({
        tableId: selectedTableId,
        date,
        timeSlot,
        guestsCount
      });
      setSuccess('Your table has been successfully reserved!');
      setSelectedTableId('');
      fetchData(); // Reload reservations list
    } catch (err: any) {
      setError(err.message || 'Failed to complete reservation.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCancelReservation = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this reservation?')) return;
    setError(null);
    setSuccess(null);
    try {
      await api.cancelReservation(id);
      setSuccess('Reservation successfully cancelled.');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel reservation.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Welcome / Refresh Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-teal-400 font-mono text-xs tracking-widest uppercase mb-1">
            Live Booking Console
          </p>
          <h2 className="text-3xl font-display font-extrabold text-white tracking-tight flex items-center gap-2">
            <Compass className="h-6 w-6 text-teal-400" /> Reserve a Table
          </h2>
          <p className="text-slate-400 text-sm font-sans mt-1">
            Configure your dining parameters, check live table availability, and lock in your reservation.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="self-start sm:self-center flex items-center gap-1.5 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-teal-400' : 'text-slate-400'}`} />
          Refresh Status
        </button>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Reservation Planner Section */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <Calendar className="w-24 h-24 text-teal-400" />
            </div>
            <h3 className="text-lg font-display font-bold text-white border-b border-slate-800 pb-3 mb-5 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-teal-400" /> Dine Parameters
            </h3>

            <form onSubmit={handleCreateReservation} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Date Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm font-sans"
                  />
                </div>

                {/* Time Slot Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono mb-1.5">
                    Time Slot
                  </label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm font-sans"
                  >
                    {TIME_SLOTS.map(slot => (
                      <option key={slot} value={slot} className="bg-slate-900 text-slate-100">{slot}</option>
                    ))}
                  </select>
                </div>

                {/* Guest Count Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono mb-1.5">
                    Guests
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={20}
                    value={guestsCount}
                    onChange={(e) => setGuestsCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm font-sans"
                  />
                </div>
              </div>

              {/* Dynamic Interactive Table Selection Board */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono mb-3">
                  Select an Available Table
                </label>
                
                {loading ? (
                  <div className="h-40 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500">
                    <RefreshCw className="h-6 w-6 animate-spin mb-2 text-teal-400" />
                    <p className="text-xs font-semibold font-mono uppercase tracking-wider">Checking live floor layout...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {tables.map(table => {
                      const details = getTableStatus(table);
                      const isSelected = selectedTableId === table.id;
                      const isAvailable = details.status === 'available';

                      return (
                        <div
                          key={table.id}
                          onClick={() => isAvailable && setSelectedTableId(table.id)}
                          className={`p-4 border rounded-2xl transition-all relative overflow-hidden ${details.color} ${
                            isSelected 
                              ? 'ring-2 ring-teal-400 border-teal-400 bg-teal-950/40 shadow-lg shadow-teal-500/10' 
                              : ''
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-0 right-0 bg-teal-400 text-slate-950 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-bl-lg font-mono">
                              SELECTED
                            </div>
                          )}
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-slate-100 text-sm">
                                Table #{table.number}
                              </h4>
                              <p className="text-xs text-slate-400 mt-1 leading-snug">
                                {table.description}
                              </p>
                            </div>
                            <span className="text-xs font-mono font-bold bg-slate-950/60 px-2 py-0.5 rounded-lg border border-slate-800 text-slate-300 flex items-center gap-1 shrink-0">
                              <Users className="h-3 w-3 text-teal-400" /> Cap: {table.capacity}
                            </span>
                          </div>
                          
                          <div className="mt-3.5 pt-2 border-t border-slate-800/40 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider font-mono">
                            {details.status === 'available' && <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" />}
                            {details.status === 'too-small' && <AlertCircle className="h-3.5 w-3.5 text-orange-400" />}
                            {details.status === 'occupied' && <XCircle className="h-3.5 w-3.5 text-rose-400" />}
                            {details.status === 'out-of-service' && <XCircle className="h-3.5 w-3.5 text-slate-600" />}
                            <span>{details.label}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Notifications / Actions */}
              <div className="space-y-4">
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-2.5"
                    >
                      <XCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                      <p className="text-xs font-medium text-rose-300 font-sans leading-relaxed">{error}</p>
                    </motion.div>
                  )}

                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="p-3.5 bg-teal-500/10 border border-teal-500/20 rounded-2xl flex items-start gap-2.5"
                    >
                      <CheckCircle2 className="h-5 w-5 text-teal-400 shrink-0 mt-0.5" />
                      <p className="text-xs font-medium text-teal-300 font-sans leading-relaxed">{success}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={submitLoading || !selectedTableId}
                  className="w-full py-3.5 bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold rounded-2xl text-sm shadow-xl shadow-teal-500/10 active:scale-[0.99] transition-all disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed cursor-pointer"
                >
                  {submitLoading ? 'Registering Booking...' : 'Secure Reservation'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* My Reservations Side Panel */}
        <div className="lg:col-span-5">
          <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 h-full flex flex-col relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <ClipboardList className="w-24 h-24 text-teal-400" />
            </div>
            <h3 className="text-lg font-display font-bold text-white border-b border-slate-800 pb-3 mb-5 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-teal-400" /> My Dining History
            </h3>

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-12">
                <RefreshCw className="h-6 w-6 animate-spin mb-2 text-teal-400" />
                <p className="text-xs font-semibold font-mono uppercase tracking-wider">Loading history...</p>
              </div>
            ) : reservations.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
                <ClipboardList className="h-8 w-8 text-slate-700 mb-3" />
                <p className="text-sm font-semibold text-slate-300">No Reservations Yet</p>
                <p className="text-xs text-slate-500 mt-1.5 max-w-[240px] leading-normal font-sans">
                  Choose a date, a slot, and select a table on the left to start booking.
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-4 max-h-[500px] pr-1">
                {reservations.map(res => (
                  <div
                    key={res.id}
                    className={`p-4 border rounded-2xl transition-all ${
                      res.status === 'cancelled'
                        ? 'bg-slate-950/30 border-slate-900 text-slate-500'
                        : 'bg-slate-950/60 border-slate-800 hover:border-teal-500/30'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="font-mono text-[10px] text-teal-500/80 block mb-1 uppercase tracking-widest">
                          ID: {res.id.slice(0, 8)}...
                        </span>
                        <h4 className="font-bold text-slate-100 text-sm">
                          Table #{res.tableNumber}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-slate-500" /> {res.date}
                        </p>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-slate-500" /> {res.timeSlot}
                        </p>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-sans">
                          <Users className="h-3 w-3 text-slate-500" /> Party Size: {res.guestsCount}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2.5">
                        <span
                          className={`px-2 py-0.5 text-[9px] font-bold rounded-lg border uppercase tracking-widest font-mono ${
                            res.status === 'confirmed'
                              ? 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                              : 'bg-slate-800 text-slate-500 border-slate-700'
                          }`}
                        >
                          {res.status}
                        </span>

                        {res.status === 'confirmed' && (
                          <button
                            onClick={() => handleCancelReservation(res.id)}
                            className="text-[11px] font-bold text-rose-400 hover:text-rose-300 cursor-pointer p-1 rounded hover:bg-rose-500/10 transition-all font-sans"
                          >
                            Cancel Table
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
