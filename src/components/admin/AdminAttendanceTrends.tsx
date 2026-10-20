import React, { useState, useEffect, useCallback } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  BarChart2,
  Activity,
  Layers,
} from 'lucide-react';
import { safeFetchJson, getStoredAuthToken } from '../../utils/api';

export interface AttendanceTrendDataPoint {
  session_id: string;
  title: string;
  date: string;
  activity_type: string;
  present: number;
  late: number;
  excused: number;
  absent: number;
  total_recorded: number;
  rate: number;
  total_active_members: number;
}

export interface VoiceBreakdownItem {
  section: string;
  member_count: number;
  present: number;
  late: number;
  excused: number;
  absent: number;
  rate: number;
}

export interface AttendanceTrendsResponse {
  days: number;
  cutoffDate: string;
  total_sessions: number;
  total_members: number;
  average_rate: number;
  totals: {
    present: number;
    late: number;
    excused: number;
    recorded: number;
  };
  trends: AttendanceTrendDataPoint[];
  voice_breakdown: VoiceBreakdownItem[];
}

interface AdminAttendanceTrendsProps {
  onNavigateToMark?: (sessionId?: string) => void;
}

export const AdminAttendanceTrends: React.FC<AdminAttendanceTrendsProps> = ({ onNavigateToMark }) => {
  const [data, setData] = useState<AttendanceTrendsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [daysWindow, setDaysWindow] = useState<number>(30);
  const [chartView, setChartView] = useState<'rate' | 'counts' | 'sections'>('rate');

  const fetchTrends = useCallback(async (days = daysWindow) => {
    try {
      setIsLoading(true);
      setErrorMessage('');
      const token = getStoredAuthToken();
      const res = await safeFetchJson<AttendanceTrendsResponse>(`/api/attendance/trends?days=${days}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok && res.data) {
        setData(res.data);
      } else {
        throw new Error(res.errorMessage || 'Failed to load attendance trends');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Habaye ikosa mu gushaka imigendekere y\'ubwitabire');
    } finally {
      setIsLoading(false);
    }
  }, [daysWindow]);

  useEffect(() => {
    fetchTrends(daysWindow);
  }, [fetchTrends, daysWindow]);

  // Formatter for dates in charts
  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[1]}/${parts[2]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Header and Controls */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-900 text-amber-400 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 font-serif">
                Imiterere n'Imigendekere y'Ubwitabire (Attendance Trends)
              </h3>
              <p className="text-xs text-slate-500">
                Imibare n'ibishushanyo by'ubwitabire mu minsi {daysWindow} iheruka bishingiye kuri database
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Days window selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
            {[14, 30, 60].map(days => (
              <button
                key={days}
                onClick={() => setDaysWindow(days)}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  daysWindow === days
                    ? 'bg-blue-950 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Iminsi {days}
              </button>
            ))}
          </div>

          {/* Chart view selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setChartView('rate')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                chartView === 'rate'
                  ? 'bg-white text-blue-950 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Attendance Rate Percentage Trend"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Ijanisha (%)</span>
            </button>
            <button
              onClick={() => setChartView('counts')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                chartView === 'counts'
                  ? 'bg-white text-blue-950 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Attendance Headcounts"
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Umubare</span>
            </button>
            <button
              onClick={() => setChartView('sections')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                chartView === 'sections'
                  ? 'bg-white text-blue-950 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Voice Sections Breakdown"
            >
              <BarChart2 className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Amajwi</span>
            </button>
          </div>

          <button
            onClick={() => fetchTrends(daysWindow)}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            title="Refresh Trends"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Ijanisha Rusange</span>
              <Activity className="w-4 h-4 text-emerald-500" />
            </div>
            <p className={`text-2xl font-black font-mono ${
              data.average_rate >= 80 ? 'text-emerald-600' : 'text-amber-600'
            }`}>
              {data.average_rate}%
            </p>
            <p className="text-[10px] text-slate-500">Muri ibi bihe by'iminsi {daysWindow}</p>
          </div>

          <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Amalisiti Yafashwe</span>
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-blue-950 font-mono">
              {data.total_sessions}
            </p>
            <p className="text-[10px] text-slate-500">Imyitozo n'amateraniro</p>
          </div>

          <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Abaririmbyi Bose</span>
              <Users className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-slate-900 font-mono">
              {data.total_members}
            </p>
            <p className="text-[10px] text-slate-500">Bari ku rutonde rukora</p>
          </div>

          <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Abitabiriye (Present)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-700 font-mono">
              {data.totals.present}
            </p>
            <p className="text-[10px] text-slate-500">Inshuro zo kwitabira</p>
          </div>
        </div>
      )}

      {/* Main Chart Area */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        {isLoading ? (
          <div className="h-72 flex flex-col items-center justify-center text-xs text-slate-500 space-y-2">
            <div className="w-8 h-8 border-3 border-blue-900 border-t-amber-400 rounded-full animate-spin" />
            <p className="font-semibold">Gushushanya imiterere y'ubwitabire...</p>
          </div>
        ) : errorMessage ? (
          <div className="h-72 flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-700 font-semibold">{errorMessage}</p>
            <button
              onClick={() => fetchTrends(daysWindow)}
              className="px-3.5 py-1.5 bg-blue-950 text-white rounded-xl text-xs font-bold hover:bg-blue-900"
            >
              Ongera ugerageze
            </button>
          </div>
        ) : !data || data.trends.length === 0 ? (
          <div className="h-72 flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                Nta makuru y'ubwitabire arandikwa mu minsi {daysWindow} iheruka
              </p>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Koresha ahandikwa ubwitabire (Attendance) kugira ngo wandike abaje mu myitozo, amateraniro cyangwa ibitaramo.
              </p>
            </div>
            {onNavigateToMark && (
              <button
                onClick={() => onNavigateToMark()}
                className="px-4 py-2 bg-blue-950 text-white rounded-xl text-xs font-bold hover:bg-blue-900 cursor-pointer shadow-xs"
              >
                Fata Urutonde rw'Ubwitabire
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">
                  {chartView === 'rate' && 'Ijanisha ry\'Ubwitabire ku Minsi y\'Imyitozo (Attendance Rate %)'}
                  {chartView === 'counts' && 'Umubare w\'Abitabiriye n\'Abasibye (Present, Late, Absent Counts)'}
                  {chartView === 'sections' && 'Ubwitabire ku Majwi (Voice Sections Participation)'}
                </h4>
                <p className="text-[11px] text-slate-500">
                  {chartView === 'rate' && 'Umurongo ugaragaza impinduka z\'ijanisha ry\'ubwitabire hashingiwe ku baririmbyi bose'}
                  {chartView === 'counts' && 'Abari bahari (Present), abatinze (Late), n\'abasibye (Absent)'}
                  {chartView === 'sections' && 'Ijanisha n\'umubare w\'abitabiriye mu majwi yose (Soprano, Alto, Tenor, Bass)'}
                </p>
              </div>
            </div>

            {/* CHART 1: ATTENDANCE RATE OVER TIME */}
            {chartView === 'rate' && (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.trends} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDateLabel}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      unit="%"
                    />
                    <Tooltip
                      formatter={(val: any) => [`${val}%`, 'Ijanisha (Rate)']}
                      labelFormatter={(label: any, payload: any) => {
                        const item = payload?.[0]?.payload;
                        return item ? `${item.title} (${item.date})` : label;
                      }}
                    />
                    <Legend />
                    <ReferenceLine y={80} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Intego (80%)', fill: '#059669', fontSize: 10 }} />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      name="Ubwitabire (%)"
                      stroke="#1e3a8a"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#1e3a8a', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6, fill: '#d97706' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* CHART 2: HEADCOUNTS (PRESENT, LATE, ABSENT) */}
            {chartView === 'counts' && (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.trends} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#059669" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="lateGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d97706" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#d97706" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="absentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#dc2626" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#dc2626" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDateLabel}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <Tooltip
                      labelFormatter={(label: any, payload: any) => {
                        const item = payload?.[0]?.payload;
                        return item ? `${item.title} (${item.date})` : label;
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="present"
                      name="Abaje (Present)"
                      stroke="#059669"
                      fillOpacity={1}
                      fill="url(#presentGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="late"
                      name="Abatinze (Late)"
                      stroke="#d97706"
                      fillOpacity={1}
                      fill="url(#lateGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="absent"
                      name="Abasibye (Absent)"
                      stroke="#dc2626"
                      fillOpacity={1}
                      fill="url(#absentGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* CHART 3: VOICE SECTIONS BREAKDOWN */}
            {chartView === 'sections' && (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.voice_breakdown} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="section" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis
                      domain={[0, 100]}
                      unit="%"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                    />
                    <Tooltip
                      formatter={(val: any, name: any) => [`${val}%`, name]}
                    />
                    <Legend />
                    <Bar
                      dataKey="rate"
                      name="Ijanisha ry'Ubwitabire (%)"
                      fill="#1e3a8a"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
