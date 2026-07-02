// Dashboard.jsx - Productivity Dashboard & Goals Progress
import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useSettings } from '../context/SettingsContext';
import ChartCard from '../components/ChartCard';
import { 
  AreaChart, Area, PieChart, Pie, Cell, 
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Clock, CheckCircle, ShieldAlert, Award, Calendar, RefreshCw,
  ExternalLink, CheckSquare, Zap, Activity
} from 'lucide-react';

const Dashboard = () => {
  const { settings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [todayReport, setTodayReport] = useState(null);
  const [reports, setReports] = useState([]);
  const [todayActivities, setTodayActivities] = useState([]);

  const todayStr = new Date().toISOString().split('T')[0];

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Recalculate today's report
      const reportRes = await api.post('/reports/generate', { date: todayStr });
      setTodayReport(reportRes.data);

      // 2. Fetch reports history
      const reportsRes = await api.get('/reports');
      setReports(reportsRes.data);

      // 3. Fetch today's activities for log and hourly trend
      const todayStart = `${todayStr}T00:00:00.000Z`;
      const todayEnd = `${todayStr}T23:59:59.999Z`;
      const actRes = await api.get(`/activities?startDate=${todayStart}&endDate=${todayEnd}`);
      setTodayActivities(actRes.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Time format helper (seconds -> h, m)
  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '0m';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  // Progress calculations
  const goals = {
    productiveTarget: settings?.dailyGoalProductive || 14400, // 4 hours default
    distractingLimit: settings?.dailyGoalDistracting || 3600, // 1 hour default
    focusTarget: settings?.dailyGoalFocusSessions || 3
  };

  const prodProgress = todayReport?.productiveTime 
    ? Math.min(100, Math.round((todayReport.productiveTime / goals.productiveTarget) * 100))
    : 0;

  const distProgress = todayReport?.distractingTime 
    ? Math.min(100, Math.round((todayReport.distractingTime / goals.distractingLimit) * 100))
    : 0;

  const focusProgress = todayReport?.focusSessionsCount
    ? Math.min(100, Math.round((todayReport.focusSessionsCount / goals.focusTarget) * 100))
    : 0;

  // Chart 1: Hourly usage trend today
  const getHourlyTrendData = () => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hourName: `${String(i).padStart(2, '0')}:00`,
      minutes: 0
    }));

    todayActivities.forEach(act => {
      const date = new Date(act.startTime);
      const hour = date.getHours();
      hours[hour].minutes += Math.round(act.duration / 60);
    });

    return hours;
  };

  // Chart 2: Category distribution today
  const getCategoryPieData = () => {
    if (!todayReport) return [];
    return [
      { name: 'Productive', value: Number((todayReport.productiveTime / 60).toFixed(1)) || 0, color: 'var(--color-productive)' },
      { name: 'Neutral', value: Number((todayReport.neutralTime / 60).toFixed(1)) || 0, color: 'var(--color-neutral)' },
      { name: 'Distracting', value: Number((todayReport.distractingTime / 60).toFixed(1)) || 0, color: 'var(--color-distracting)' }
    ].filter(item => item.value > 0);
  };

  // Top sites list logic
  const getTopWebsitesList = () => {
    const domainMap = {};
    const domainCategory = {};
    
    todayActivities.forEach(act => {
      domainMap[act.domain] = (domainMap[act.domain] || 0) + act.duration;
      domainCategory[act.domain] = act.category;
    });

    return Object.entries(domainMap)
      .map(([domain, duration]) => ({
        domain,
        duration,
        category: domainCategory[domain] || 'neutral'
      }))
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);
  };

  const hourlyData = getHourlyTrendData();
  const pieData = getCategoryPieData();
  const topWebsites = getTopWebsitesList();
  
  // Format recent activity list (last 10 items)
  const recentActivities = [...todayActivities]
    .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
    .slice(0, 8);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* Welcome & Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>Productivity Dashboard</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Welcome back! Here is your time breakdown and goals status for today.</p>
        </div>
        <button onClick={fetchData} className="btn btn-secondary" style={{ padding: '8px 16px' }} disabled={loading}>
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: 'var(--color-brand-glow)', color: 'var(--color-brand)', padding: '12px', borderRadius: '12px' }}>
            <Award size={24} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Productivity Score</span>
            <h2 style={{ fontSize: '22px', fontWeight: 800 }}>{todayReport?.productivityScore || 0}%</h2>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: 'rgba(99, 102, 241, 0.08)', color: 'var(--text-primary)', padding: '12px', borderRadius: '12px' }}>
            <Clock size={24} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Time Today</span>
            <h2 style={{ fontSize: '22px', fontWeight: 800 }}>{formatTime(todayReport?.totalTime)}</h2>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', color: 'var(--color-productive)', padding: '12px', borderRadius: '12px' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Productive Time</span>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-productive)' }}>{formatTime(todayReport?.productiveTime)}</h2>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', color: 'var(--color-distracting)', padding: '12px', borderRadius: '12px' }}>
            <ShieldAlert size={24} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Distracting Time</span>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-distracting)' }}>{formatTime(todayReport?.distractingTime)}</h2>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', padding: '12px', borderRadius: '12px' }}>
            <Calendar size={24} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Focus & Blocked Hits</span>
            <h2 style={{ fontSize: '22px', fontWeight: 800 }}>{todayReport?.focusSessionsCount || 0} / {todayReport?.blockedAttemptsCount || 0}</h2>
          </div>
        </div>
      </div>

      {/* Goal Progress Section */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckSquare size={18} style={{ color: 'var(--color-brand)' }} />
          Today's Goal Progress
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          {/* Productive Target */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ fontWeight: 600 }}>Daily Productive Target</span>
              <span style={{ color: 'var(--text-secondary)' }}>
                {formatTime(todayReport?.productiveTime)} / {formatTime(goals.productiveTarget)} ({prodProgress}%)
              </span>
            </div>
            <div style={{ width: '100%', height: '10px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{ width: `${prodProgress}%`, height: '100%', backgroundColor: 'var(--color-productive)', borderRadius: '5px', transition: 'width 0.4s' }}></div>
            </div>
          </div>

          {/* Distracting Limit */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ fontWeight: 600 }}>Daily Distracting Limit</span>
              <span style={{ color: 'var(--text-secondary)' }}>
                {formatTime(todayReport?.distractingTime)} / {formatTime(goals.distractingLimit)} ({distProgress}%)
              </span>
            </div>
            <div style={{ width: '100%', height: '10px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{ 
                width: `${distProgress}%`, 
                height: '100%', 
                backgroundColor: distProgress > 90 ? 'var(--color-distracting)' : distProgress > 50 ? 'var(--color-neutral)' : 'var(--color-productive)', 
                borderRadius: '5px', 
                transition: 'width 0.4s' 
              }}></div>
            </div>
          </div>

          {/* Focus Sessions Target */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ fontWeight: 600 }}>Daily Focus Sessions Goal</span>
              <span style={{ color: 'var(--text-secondary)' }}>
                {todayReport?.focusSessionsCount || 0} / {goals.focusTarget} sessions ({focusProgress}%)
              </span>
            </div>
            <div style={{ width: '100%', height: '10px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{ width: `${focusProgress}%`, height: '100%', backgroundColor: 'var(--color-brand)', borderRadius: '5px', transition: 'width 0.4s' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Row of Charts (Category distribution & Hourly trend) */}
      <div className="charts-grid" style={{ marginBottom: '0' }}>
        <ChartCard title="Daily Hourly Trend" subtitle="Active browsing minutes per hour today" loading={loading}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-brand)" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="var(--color-brand)" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="hourName" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} stroke="var(--card-border)" />
              <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} stroke="var(--card-border)" />
              <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--card-border)', color: 'var(--text-primary)' }} />
              <Area type="monotone" dataKey="minutes" name="Minutes" stroke="var(--color-brand)" fillOpacity={1} fill="url(#colorMinutes)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Today's Category Share" subtitle="Browsing share by activity type" loading={loading}>
          {pieData.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
              No browsing data recorded today yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}m`} />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Row of Details: Top Websites and Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: '24px', marginBottom: '10px' }}>
        {/* Top Websites List Table */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={16} style={{ color: 'var(--color-neutral)' }} />
            Top Websites Today
          </h3>
          <div style={{ flex: 1, overflowX: 'auto' }}>
            {topWebsites.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '30px 0', fontSize: '13px' }}>
                No website data tracked yet today.
              </p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--card-border)', color: 'var(--text-secondary)', height: '32px' }}>
                    <th style={{ paddingBottom: '8px' }}>Domain</th>
                    <th style={{ paddingBottom: '8px' }}>Category</th>
                    <th style={{ paddingBottom: '8px', textAlign: 'right' }}>Time Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {topWebsites.map((site, index) => (
                    <tr key={index} style={{ borderBottom: index === topWebsites.length - 1 ? 'none' : '1px solid var(--card-border)', height: '44px' }}>
                      <td style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', height: '44px' }}>
                        <span style={{ color: 'var(--text-tertiary)' }}>#{index + 1}</span>
                        {site.domain}
                      </td>
                      <td>
                        <span style={{
                          backgroundColor: site.category === 'productive' ? 'rgba(16, 185, 129, 0.1)' : site.category === 'distracting' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          color: site.category === 'productive' ? 'var(--color-productive)' : site.category === 'distracting' ? 'var(--color-distracting)' : 'var(--color-neutral)',
                          padding: '3px 8px',
                          borderRadius: '10px',
                          fontSize: '11px',
                          textTransform: 'capitalize',
                          fontWeight: 500
                        }}>
                          {site.category}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatTime(site.duration)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Activity Logs */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} style={{ color: 'var(--color-brand)' }} />
            Recent Browsing Activity
          </h3>
          <div style={{ flex: 1, overflowX: 'auto' }}>
            {recentActivities.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '30px 0', fontSize: '13px' }}>
                Waiting for browsing activities to sync...
              </p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--card-border)', color: 'var(--text-secondary)', height: '32px' }}>
                    <th style={{ paddingBottom: '8px' }}>Time</th>
                    <th style={{ paddingBottom: '8px' }}>Website</th>
                    <th style={{ paddingBottom: '8px' }}>Category</th>
                    <th style={{ paddingBottom: '8px', textAlign: 'right' }}>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivities.map((act, index) => {
                    const timeStr = new Date(act.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    return (
                      <tr key={index} style={{ borderBottom: index === recentActivities.length - 1 ? 'none' : '1px solid var(--card-border)', height: '40px' }}>
                        <td style={{ color: 'var(--text-secondary)' }}>{timeStr}</td>
                        <td style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>{act.domain}</td>
                        <td>
                          <span style={{
                            color: act.category === 'productive' ? 'var(--color-productive)' : act.category === 'distracting' ? 'var(--color-distracting)' : 'var(--color-neutral)',
                            fontWeight: 500
                          }}>
                            ● <span style={{ fontSize: '12px', textTransform: 'capitalize', color: 'var(--text-primary)' }}>{act.category}</span>
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatTime(act.duration)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
