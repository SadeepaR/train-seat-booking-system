import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  TrendingUp,
  DollarSign,
  Users,
  PieChart,
  Repeat,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Award,
  Layers,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.getAdminStats();
      setStats(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load department analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 glass-panel rounded-3xl">
        <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-3" />
        <p className="text-slate-300 text-sm font-medium">Aggregating Department Analytics...</p>
      </div>
    );
  }

  if (errorMsg || !stats) {
    return (
      <div className="glass-panel p-8 text-center rounded-3xl text-rose-300 border border-rose-500/30">
        <p className="text-sm font-medium mb-3">{errorMsg || 'Failed to fetch analytics'}</p>
        <button
          onClick={fetchStats}
          className="px-4 py-2 rounded-xl bg-rose-500/20 text-rose-200 border border-rose-500/30 text-xs font-semibold hover:bg-rose-500/30"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  const { summary, classBreakdown, recentReservations, stationOccupancy } = stats;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel rounded-2xl p-6 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Sri Lanka Railways • Department Insights</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">Colombo Fort – Badulla Line Analytics</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time revenue performance, segment occupancy, and seat recycling efficiency.
          </p>
        </div>

        <button
          onClick={fetchStats}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700/80 transition-all self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-start justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Total Line Revenue</span>
            <div className="text-2xl font-extrabold text-white mt-1.5 flex items-baseline gap-1">
              <span className="text-sm text-emerald-400">LKR</span>
              <span>{summary.totalRevenueLKR.toLocaleString()}</span>
            </div>
            <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3 h-3" /> Real-time ticket earnings
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Total Bookings */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-start justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Active Bookings</span>
            <div className="text-2xl font-extrabold text-white mt-1.5">
              {summary.totalBookings}
            </div>
            <p className="text-[11px] text-blue-400 mt-1 flex items-center gap-1 font-medium">
              <Users className="w-3 h-3" /> Segment passenger tickets
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Overall Occupancy Rate */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-start justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Overall Occupancy Rate</span>
            <div className="text-2xl font-extrabold text-white mt-1.5">
              {summary.overallOccupancyRate}%
            </div>
            <p className="text-[11px] text-teal-400 mt-1 flex items-center gap-1 font-medium">
              <PieChart className="w-3 h-3" /> Segment capacity utilization
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
            <PieChart className="w-5 h-5" />
          </div>
        </div>

        {/* Segment Re-Selling Bonus */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-start justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Re-Sold Vacated Seats</span>
            <div className="text-2xl font-extrabold text-amber-300 mt-1.5 flex items-baseline gap-1">
              <span>{summary.segmentReusedSeatsCount}</span>
              <span className="text-xs font-normal text-slate-400">seats recycled</span>
            </div>
            <p className="text-[11px] text-amber-400 mt-1 flex items-center gap-1 font-medium">
              <Repeat className="w-3 h-3" /> +LKR {summary.revenueEfficiencyGainedLKR.toLocaleString()} extra revenue
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Class Occupancy Breakdown */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <Layers className="w-4 h-4 text-purple-400" />
          <span>Occupancy Distribution by Carriage Class</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {classBreakdown.map((item: any) => (
            <div key={item.classType} className="glass-card rounded-xl p-4 border border-slate-800">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-slate-200">{item.className}</span>
                <span className="font-bold text-blue-400">{item.occupancyPercentage}%</span>
              </div>
              
              {/* Progress bar */}
              <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-teal-400 transition-all duration-500"
                  style={{ width: `${item.occupancyPercentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Carriage Capacity: {item.totalSeats} Seats</span>
                <span>{item.bookedSegmentsCount} Leg Units</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Station Passenger Flow & Recent Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Station Boarding Flow */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3 lg:col-span-1">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Station Passenger Activity</span>
          </h3>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {stationOccupancy.map((st: any) => (
              <div
                key={st.sequence}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 text-xs border border-slate-800/60"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold flex items-center justify-center">
                    {st.sequence}
                  </span>
                  <span className="font-semibold text-slate-200">{st.stationName}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="text-emerald-400 font-medium">+{st.boardingCount} on</span>
                  <span className="text-rose-400 font-medium">-{st.alightingCount} off</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Reservations Table */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3 lg:col-span-2">
          <h3 className="text-sm font-bold text-white flex items-center justify-between">
            <span>Recent Confirmed Tickets</span>
            <span className="text-xs text-slate-400 font-normal">Last 10 reservations</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Seat</th>
                  <th className="py-2.5 px-3">Passenger</th>
                  <th className="py-2.5 px-3">Journey Route</th>
                  <th className="py-2.5 px-3 text-right">Fare (LKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentReservations.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-500">
                      No active bookings in the system yet.
                    </td>
                  </tr>
                ) : (
                  recentReservations.map((res: any) => (
                    <tr key={res.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-emerald-400">
                        {res.seatNumber}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-white">{res.passengerName}</div>
                        <div className="text-[10px] text-slate-400">{res.passengerEmail}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-emerald-300">{res.originStationName}</span>
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                          <span className="text-rose-300">{res.destinationStationName}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-white">
                        LKR {res.fareAmount.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
