import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Table, Reservation, TIME_SLOTS } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Users, Calendar, Clock, Edit3, Trash2, Plus, 
  ToggleLeft, ToggleRight, CheckCircle2, AlertTriangle, 
  X, RefreshCw, Layers, Sparkles, Filter 
} from 'lucide-react';

export default function AdminDashboard() {
  const [tables, setTables] = useState<Table[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  
  // Filtering & Stats
  const [filterDate, setFilterDate] = useState<string>('');
  
  // Loading & Error states
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit Reservation Modal State
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [editTableId, setEditTableId] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTimeSlot, setEditTimeSlot] = useState('');
  const [editGuests, setEditGuests] = useState<number>(2);
  const [editStatus, setEditStatus] = useState<'confirmed' | 'cancelled'>('confirmed');

  // Add Table Form State
  const [showAddTable, setShowAddTable] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState<string>('');
  const [newTableCapacity, setNewTableCapacity] = useState<string>('4');
  const [newTableDesc, setNewTableDesc] = useState<string>('');

  // Edit Table Mode State
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [editTableNumber, setEditTableNumber] = useState<number>(0);
  const [editTableCapacity, setEditTableCapacity] = useState<number>(0);
  const [editTableDesc, setEditTableDesc] = useState<string>('');
  const [editTableAvailable, setEditTableAvailable] = useState<boolean>(true);

  useEffect(() => {
    fetchData();
  }, [filterDate]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [allTables, allReservations] = await Promise.all([
        api.getTables(),
        api.getReservations(filterDate || undefined)
      ]);
      setTables(allTables);
      setReservations(allReservations);
    } catch (err: any) {
      setError(err.message || 'Failed to sync administrator dataset.');
    } finally {
      setLoading(false);
    }
  };

  // --- Reservation Actions ---
  
  const openEditModal = (res: Reservation) => {
    setEditingReservation(res);
    setEditTableId(res.tableId);
    setEditDate(res.date);
    setEditTimeSlot(res.timeSlot);
    setEditGuests(res.guestsCount);
    setEditStatus(res.status);
    setError(null);
  };

  const closeEditModal = () => {
    setEditingReservation(null);
  };

  const handleUpdateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReservation) return;
    setActionLoading(true);
    setError(null);
    try {
      await api.updateReservation(editingReservation.id, {
        tableId: editTableId,
        date: editDate,
        timeSlot: editTimeSlot,
        guestsCount: editGuests,
        status: editStatus
      });
      setSuccess('Reservation updated and verified successfully.');
      closeEditModal();
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to update reservation.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteReservation = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this reservation record? This cannot be undone.')) return;
    setActionLoading(true);
    setError(null);
    try {
      await api.deleteReservation(id);
      setSuccess('Reservation record successfully deleted.');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete reservation.');
    } finally {
      setActionLoading(false);
    }
  };

  // --- Table Actions ---

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    try {
      await api.createTable({
        number: parseInt(newTableNumber),
        capacity: parseInt(newTableCapacity),
        description: newTableDesc
      });
      setSuccess('New restaurant table successfully configured.');
      setNewTableNumber('');
      setNewTableDesc('');
      setShowAddTable(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to add table.');
    } finally {
      setActionLoading(false);
    }
  };

  const startEditTable = (table: Table) => {
    setEditingTableId(table.id);
    setEditTableNumber(table.number);
    setEditTableCapacity(table.capacity);
    setEditTableDesc(table.description);
    setEditTableAvailable(table.isAvailable);
  };

  const handleSaveTable = async (id: string) => {
    setActionLoading(true);
    setError(null);
    try {
      await api.updateTable(id, {
        number: editTableNumber,
        capacity: editTableCapacity,
        description: editTableDesc,
        isAvailable: editTableAvailable
      });
      setSuccess('Table layout updated.');
      setEditingTableId(null);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to save table details.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTable = async (id: string) => {
    if (!confirm('Are you sure you want to delete this table?')) return;
    setActionLoading(true);
    setError(null);
    try {
      await api.deleteTable(id);
      setSuccess('Table successfully removed from list.');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete table.');
    } finally {
      setActionLoading(false);
    }
  };

  // Stats Counters
  const activeCount = reservations.filter(r => r.status === 'confirmed').length;
  const cancelledCount = reservations.filter(r => r.status === 'cancelled').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Admin Panel Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 mb-8 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Shield className="h-48 w-48 text-teal-400" />
        </div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-teal-400 to-blue-600 rounded-xl text-slate-950 shadow-lg shadow-teal-500/20">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="bg-teal-500/10 text-teal-300 border border-teal-500/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-widest font-mono">
                Admin Console
              </span>
              <h2 className="text-2xl font-display font-extrabold tracking-tight mt-1">
                La Table Layout & Reservation Oversight
              </h2>
              <p className="text-slate-400 text-sm mt-0.5 font-sans">
                Manage seating, clear conflicts, reassign tables, and review analytics.
              </p>
            </div>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-semibold text-slate-300 transition-colors disabled:opacity-50 cursor-pointer self-start md:self-center"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-teal-400' : 'text-slate-400'}`} />
            Sync Dashboard
          </button>
        </div>
      </div>

      {/* Analytics Summary Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800/85 rounded-3xl p-5 shadow-lg">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Total Bookings</p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-3xl font-display font-extrabold text-white">{reservations.length}</p>
            <span className="text-[11px] font-semibold text-slate-500 font-sans">in view</span>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800/85 rounded-3xl p-5 shadow-lg">
          <p className="text-[10px] font-bold text-teal-400 uppercase tracking-widest font-mono">Confirmed Slots</p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-3xl font-display font-extrabold text-teal-300">{activeCount}</p>
            <span className="text-[11px] font-semibold text-slate-500 font-sans">active</span>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800/85 rounded-3xl p-5 shadow-lg">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Cancelled Bookings</p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-3xl font-display font-extrabold text-slate-500">{cancelledCount}</p>
            <span className="text-[11px] font-semibold text-slate-500 font-sans">released</span>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800/85 rounded-3xl p-5 shadow-lg">
          <p className="text-[10px] font-bold text-teal-400 uppercase tracking-widest font-mono">Managed Tables</p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-3xl font-display font-extrabold text-white">{tables.length}</p>
            <span className="text-[11px] font-semibold text-slate-500 font-sans">configured</span>
          </div>
        </div>
      </div>

      {/* Global Alerts feedback */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 mb-6 bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm font-semibold rounded-2xl flex items-center justify-between"
          >
            <span className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-teal-400" /> {success}</span>
            <button onClick={() => setSuccess(null)} className="p-1 cursor-pointer hover:text-white"><X className="h-4 w-4" /></button>
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-semibold rounded-2xl flex items-center justify-between"
          >
            <span className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-rose-400" /> {error}</span>
            <button onClick={() => setError(null)} className="p-1 cursor-pointer hover:text-white"><X className="h-4 w-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Reservations Oversight List */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
              <h3 className="text-lg font-display font-bold text-slate-100 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-teal-400" /> Reservations Registry
              </h3>

              {/* Date Filters */}
              <div className="flex items-center gap-2">
                <div className="relative flex items-center gap-1.5 border border-slate-800 rounded-xl px-3 py-1.5 bg-slate-950">
                  <Filter className="h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="text-xs bg-transparent border-none focus:outline-none focus:ring-0 text-slate-300 [color-scheme:dark]"
                  />
                  {filterDate && (
                    <button
                      onClick={() => setFilterDate('')}
                      className="text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer"
                      title="Clear Filter"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-500">
                <RefreshCw className="h-8 w-8 animate-spin mb-2 text-teal-400" />
                <p className="text-xs font-semibold">Syncing reservations...</p>
              </div>
            ) : reservations.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
                <Calendar className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-300">No Reservations Found</p>
                <p className="text-xs text-slate-500 mt-1">
                  {filterDate ? `There are no reservations booked for ${filterDate}.` : 'No reservations found in the restaurant registry.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 font-bold text-[10px] uppercase tracking-wider font-mono">
                      <th className="py-3 px-2">Table</th>
                      <th className="py-3 px-2">Dine Slot</th>
                      <th className="py-3 px-2">Guest / Party</th>
                      <th className="py-3 px-2">Status</th>
                      <th className="py-3 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {reservations.map(res => (
                      <tr key={res.id} className="hover:bg-slate-950/30 transition-colors">
                        <td className="py-4 px-2 font-display">
                          <span className="font-extrabold text-slate-100">T#{res.tableNumber}</span>
                          <span className="block text-[10px] text-slate-500 font-mono mt-0.5 uppercase tracking-wider">
                            ID: {res.id.slice(0, 8)}...
                          </span>
                        </td>
                        <td className="py-4 px-2">
                          <p className="font-semibold text-slate-300 text-xs">{res.date}</p>
                          <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <Clock className="h-3 w-3 text-slate-500" /> {res.timeSlot}
                          </p>
                        </td>
                        <td className="py-4 px-2">
                          <p className="font-semibold text-slate-200 text-xs">{res.userName}</p>
                          <p className="text-[10px] text-slate-500 font-mono leading-none mt-0.5">{res.userEmail}</p>
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-300 bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded-lg mt-1.5 font-mono uppercase tracking-wider">
                            <Users className="h-3 w-3 text-slate-500" /> {res.guestsCount} guests
                          </span>
                        </td>
                        <td className="py-4 px-2">
                          <span
                            className={`inline-block px-2 py-0.5 text-[9px] font-bold rounded-lg border uppercase tracking-widest font-mono ${
                              res.status === 'confirmed'
                                ? 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                                : 'bg-slate-800 text-slate-500 border-slate-700'
                            }`}
                          >
                            {res.status}
                          </span>
                        </td>
                        <td className="py-4 px-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditModal(res)}
                              className="p-1.5 hover:bg-slate-800 hover:text-teal-400 border border-transparent rounded-lg text-slate-400 transition-colors cursor-pointer"
                              title="Edit / Reassign"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteReservation(res.id)}
                              className="p-1.5 hover:bg-slate-800 hover:text-rose-400 border border-transparent rounded-lg text-slate-400 transition-colors cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Floor layout & Table Management */}
        <div className="lg:col-span-4 space-y-6">
          {/* Floor Layout Config */}
          <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-5">
              <h3 className="text-lg font-display font-bold text-slate-100 flex items-center gap-2">
                <Layers className="h-5 w-5 text-teal-400" /> Floor layout
              </h3>
              <button
                onClick={() => setShowAddTable(!showAddTable)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-400 hover:bg-teal-300 text-slate-950 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                {showAddTable ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                Add Table
              </button>
            </div>

            {/* Expandable Add Table Form */}
            <AnimatePresence>
              {showAddTable && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleAddTable}
                  className="bg-slate-950 border border-slate-800 p-4 rounded-2xl mb-5 space-y-4 overflow-hidden"
                >
                  <h4 className="text-[10px] font-bold text-teal-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-teal-400" /> New Table Parameters
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-1">
                        Table Number
                      </label>
                      <input
                        type="number"
                        required
                        value={newTableNumber}
                        onChange={(e) => setNewTableNumber(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-800 rounded-xl text-xs bg-slate-900 text-white focus:border-teal-500/50 focus:ring-0"
                        placeholder="e.g. 7"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-1">
                        Capacity
                      </label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={newTableCapacity}
                        onChange={(e) => setNewTableCapacity(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-800 rounded-xl text-xs bg-slate-900 text-white focus:border-teal-500/50 focus:ring-0"
                        placeholder="e.g. 4"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-1">
                      Description / Seating Notes
                    </label>
                    <input
                      type="text"
                      value={newTableDesc}
                      onChange={(e) => setNewTableDesc(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-800 rounded-xl text-xs bg-slate-900 text-white focus:border-teal-500/50 focus:ring-0"
                      placeholder="e.g. Center Booth, Patio view"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full py-2 bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-300 hover:to-blue-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    Configure Table layout
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* List of tables */}
            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
              {tables.map(table => {
                const isEditing = editingTableId === table.id;

                return (
                  <div
                    key={table.id}
                    className={`p-4 border rounded-2xl transition-all ${
                      table.isAvailable
                        ? 'bg-slate-950/40 border-slate-800 hover:border-slate-700/80'
                        : 'bg-slate-950/10 border-slate-900/60'
                    }`}
                  >
                    {isEditing ? (
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-teal-400 font-mono tracking-wider">Edit Table #{table.number}</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Number</label>
                            <input
                              type="number"
                              value={editTableNumber}
                              onChange={(e) => setEditTableNumber(parseInt(e.target.value) || 0)}
                              className="w-full p-1.5 border border-slate-800 bg-slate-900 text-white rounded-lg text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Capacity</label>
                            <input
                              type="number"
                              value={editTableCapacity}
                              onChange={(e) => setEditTableCapacity(parseInt(e.target.value) || 0)}
                              className="w-full p-1.5 border border-slate-800 bg-slate-900 text-white rounded-lg text-xs"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Description</label>
                          <input
                            type="text"
                            value={editTableDesc}
                            onChange={(e) => setEditTableDesc(e.target.value)}
                            className="w-full p-1.5 border border-slate-800 bg-slate-900 text-white rounded-lg text-xs"
                          />
                        </div>
                        <div className="flex items-center justify-between py-1 border-t border-b border-slate-800/60 my-2">
                          <span className="text-xs font-semibold text-slate-400">Active layout</span>
                          <button
                            type="button"
                            onClick={() => setEditTableAvailable(!editTableAvailable)}
                            className="p-1 cursor-pointer"
                          >
                            {editTableAvailable ? (
                              <ToggleRight className="h-6 w-6 text-teal-400" />
                            ) : (
                              <ToggleLeft className="h-6 w-6 text-slate-600" />
                            )}
                          </button>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setEditingTableId(null)}
                            className="px-2.5 py-1 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:bg-slate-800 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveTable(table.id)}
                            className="px-2.5 py-1 bg-teal-400 hover:bg-teal-300 text-slate-950 rounded-lg text-xs font-bold shadow cursor-pointer"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-extrabold text-slate-100 text-sm">
                                Table #{table.number}
                              </h4>
                              {!table.isAvailable && (
                                <span className="bg-slate-800/80 text-slate-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-slate-700 uppercase tracking-wider font-mono">
                                  OFF SERVICE
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-1 leading-snug">
                              {table.description}
                            </p>
                          </div>
                          <span className="text-xs font-mono font-bold bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800 shadow-sm text-teal-400">
                            Cap: {table.capacity}
                          </span>
                        </div>

                        <div className="mt-4 pt-2.5 border-t border-slate-800/60 flex items-center justify-between">
                          <button
                            onClick={() => startEditTable(table)}
                            className="text-xs font-bold text-slate-400 hover:text-teal-400 transition-colors cursor-pointer font-sans"
                          >
                            Modify Table
                          </button>
                          <button
                            onClick={() => handleDeleteTable(table.id)}
                            className="text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer font-sans"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Reassignment / Reservation Edit Modal */}
      <AnimatePresence>
        {editingReservation && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 text-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-800 p-6 relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-5 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-lg font-display font-bold text-slate-100">
                    Edit Reservation #{editingReservation.id.slice(0, 8)}...
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-sans">
                    Updating details for guest: <span className="font-semibold text-teal-400">{editingReservation.userName}</span>
                  </p>
                </div>
                <button
                  onClick={closeEditModal}
                  className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateReservation} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-800 rounded-xl text-xs bg-slate-950 text-white [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">
                      Time Slot
                    </label>
                    <select
                      value={editTimeSlot}
                      onChange={(e) => setEditTimeSlot(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-800 rounded-xl text-xs bg-slate-950 text-white [color-scheme:dark]"
                    >
                      {TIME_SLOTS.map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">
                      Reassign Table
                    </label>
                    <select
                      value={editTableId}
                      onChange={(e) => setEditTableId(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-800 rounded-xl text-xs bg-slate-950 text-white [color-scheme:dark]"
                    >
                      {tables.map(t => (
                        <option key={t.id} value={t.id}>
                          Table #{t.number} (Cap: {t.capacity}) {!t.isAvailable ? '[OFF SERVICE]' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">
                      Party size (guests)
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={editGuests}
                      onChange={(e) => setEditGuests(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-2.5 py-1.5 border border-slate-800 rounded-xl text-xs bg-slate-950 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">
                    Booking Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as 'confirmed' | 'cancelled')}
                    className="w-full px-2.5 py-1.5 border border-slate-800 rounded-xl text-xs bg-slate-950 text-white [color-scheme:dark]"
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="flex gap-3 justify-end pt-3 border-t border-slate-800 mt-6">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="px-4 py-2 border border-slate-800 hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-400 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 bg-teal-400 hover:bg-teal-300 text-slate-950 rounded-xl text-xs font-bold shadow transition-colors cursor-pointer"
                  >
                    {actionLoading ? 'Updating...' : 'Commit Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
