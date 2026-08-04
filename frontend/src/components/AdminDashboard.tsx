import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { RefreshCw, ArrowRight } from 'lucide-react';

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
      <div className="flex flex-col items-center justify-center py-20 glass-panel rounded-2xl">
        <div className="w-8 h-8 border-3 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-3" />
        <p className="text-[#a0a7ba] text-xs font-medium">Loading Analytics...</p>
      </div>
    );
  }

  if (errorMsg || !stats) {
    return (
      <div className="glass-panel p-8 text-center rounded-2xl text-rose-400 border border-[#552323]">
        <p className="text-sm font-medium mb-3">{errorMsg || 'Failed to fetch analytics'}</p>
        <button
          onClick={fetchStats}
          className="px-4 py-2 rounded-xl bg-[#3b1c1c] text-rose-400 border border-[#552323] text-xs font-semibold hover:bg-[#552323]"
        >
          Retry
        </button>
      </div>
    );
  }

  const { summary, classBreakdown, recentReservations } = stats;

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Dashboard Top Row (Title + Refresh) */}
      <div className="flex items-center justify-between pb-1">
        <h2 className="text-lg font-bold text-[#f0f2f7]">Department Analytics</h2>

        <button
          onClick={fetchStats}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#313445] hover:bg-[#373a4d] text-[#e8eaef] text-xs font-medium border border-[#3f4359] transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Revenue */}
        <div className="glass-panel p-4 rounded-xl">
          <span className="text-xs text-[#a0a7ba] font-medium">Total Line Revenue</span>
          <div className="text-xl font-extrabold text-[#f0f2f7] mt-1">
            <span className="text-xs text-emerald-400 font-semibold mr-1">LKR</span>
            {summary.totalRevenueLKR.toLocaleString()}
          </div>
        </div>

        {/* Total Bookings */}
        <div className="glass-panel p-4 rounded-xl">
          <span className="text-xs text-[#a0a7ba] font-medium">Active Bookings</span>
          <div className="text-xl font-extrabold text-[#f0f2f7] mt-1">
            {summary.totalBookings}
          </div>
        </div>

        {/* Overall Occupancy Rate */}
        <div className="glass-panel p-4 rounded-xl">
          <span className="text-xs text-[#a0a7ba] font-medium">Overall Occupancy</span>
          <div className="text-xl font-extrabold text-[#f0f2f7] mt-1">
            {summary.overallOccupancyRate}%
          </div>
        </div>

        {/* Segment Re-Selling Bonus */}
        <div className="glass-panel p-4 rounded-xl">
          <span className="text-xs text-[#a0a7ba] font-medium">Re-Sold Seats</span>
          <div className="text-xl font-extrabold text-amber-400 mt-1">
            {summary.segmentReusedSeatsCount} <span className="text-xs font-normal text-[#a0a7ba]">recycled</span>
          </div>
        </div>
      </div>

      {/* Class Occupancy Breakdown */}
      <div className="glass-panel rounded-2xl p-4 space-y-3">
        <h3 className="text-xs font-bold text-[#a0a7ba] uppercase tracking-wider">
          Class Occupancy
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {classBreakdown.map((item: any) => (
            <div key={item.classType} className="bg-[#272936] rounded-xl p-3 border border-[#373a4d]">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-[#e8eaef]">{item.className}</span>
                <span className="font-bold text-indigo-400">{item.occupancyPercentage}%</span>
              </div>
              
              <div className="h-1.5 w-full bg-[#373a4d] rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all duration-500 rounded-full"
                  style={{ width: `${item.occupancyPercentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Reservations Table */}
      <div className="glass-panel rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#a0a7ba] uppercase tracking-wider">
            Recent Confirmed Tickets
          </h3>
          <span className="text-[11px] text-[#a0a7ba]">Last 10 reservations</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#e8eaef]">
            <thead className="text-[#a0a7ba] font-semibold border-b border-[#3f4359]">
              <tr>
                <th className="pb-2 px-2">Seat</th>
                <th className="pb-2 px-2">Passenger</th>
                <th className="pb-2 px-2">Journey Route</th>
                <th className="pb-2 px-2 text-right">Fare</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#373a4d]">
              {recentReservations.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-[#a0a7ba]">
                    No active bookings in the system yet.
                  </td>
                </tr>
              ) : (
                recentReservations.map((res: any) => (
                  <tr key={res.id} className="hover:bg-[#373a4d]/50 transition-colors">
                    <td className="py-2 px-2 font-bold text-indigo-400">
                      {res.seatNumber}
                    </td>
                    <td className="py-2 px-2">
                      <div className="font-semibold text-[#f0f2f7]">{res.passengerName}</div>
                      <div className="text-[10px] text-[#a0a7ba]">{res.passengerEmail}</div>
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-400">{res.originStationName}</span>
                        <ArrowRight className="w-3 h-3 text-[#a0a7ba]" />
                        <span className="text-rose-400">{res.destinationStationName}</span>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-right font-bold text-[#f0f2f7]">
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
  );
};
