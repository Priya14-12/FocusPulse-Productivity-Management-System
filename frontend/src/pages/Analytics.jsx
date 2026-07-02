// Analytics.jsx - Deep Productivity Analysis & Historical Trends
import React, { useEffect, useState } from 'react';
import api from '../services/api';
import ChartCard from '../components/ChartCard';
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, Calendar, RefreshCw, BarChart2, PieChart as PieIcon, Award
} from 'lucide-react';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [todayActivities, setTodayActivities] = useState([]);
  const [todayReport, setTodayReport] = useState(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const fetchData = async () => {
    setLoading(true);
    try {
      // Recalculate today's report
      const todayRes = await api.post('/reports/generate', { date: todayStr });
      setTodayReport(todayRes.data);

      // Fetch last 30 days reports
      const reportsRes = await api.get('/reports');
      setReports(reportsRes.data);

      // Fetch today's granular activities
      const todayStart = `${todayStr}T00:00:00.000Z`;
      const todayEnd = `${todayStr}T23:59:59.999Z`;
      const actRes = await api.get(`/activities?startDate=${todayStart}&endDate=${todayEnd}`);
      setTodayActivities(actRes.data);
    } catch (err) {
      console.error('Error fetching analytics details:', err);
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

  // 1. Weekly active hours trend
  const getWeeklyTrendData = () => {
    const last7 = reports.slice(0, 7).reverse();
    return last7.map(r => ({
      date: r.date.substring(5), // MM-DD
      hours: Number((r.totalTime / 3600).toFixed(1))
    }));
  };

  // 2. Monthly active hours trend
  const getMonthlyTrendData = () => {
    const last30 = reports.slice(0, 30).reverse();
    return last30.map(r => ({
      date: r.date.substring(8), // DD
      hours: Number((r.totalTime / 3600).toFixed(1))
    }));
  };

  // 3. Productive vs Distracting comparison (last 7 days)
  const getProdVsDistData = () => {
    const last7 = reports.slice(0, 7).reverse();
    return last7.map(r => ({
      date: r.date.substring(5),
      Productive: Number((r.productiveTime / 60).toFixed(1)),
      Distracting: Number((r.distractingTime / 60).toFixed(1))
    }));
  };

  // 4. Category distribution today
  const getCategoryPieData = () => {
    if (!todayReport) return [];
    return [
      { name: 'Productive', value: Number((todayReport.productiveTime / 60).toFixed(1)) || 0, color: 'var(--color-productive)' },
      { name: 'Neutral', value: Number((todayReport.neutralTime / 60).toFixed(1)) || 0, color: 'var(--color-neutral)' },
      { name: 'Distracting', value: Number((todayReport.distractingTime / 60).toFixed(1)) || 0, color: 'var(--color-distracting)' }
    ].filter(item => item.value > 0);
  };

  // 5. Top websites usage today
  const getTopWebsitesData = () => {
    const domainMap = {};
    todayActivities.forEach(act => {
      domainMap[act.domain] = (domainMap[act.domain] || 0) + act.duration;
    });

    return Object.entries(domainMap)
      .map(([domain, secs]) => ({
        domain,
        minutes: Number((secs / 60).toFixed(1))
      }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 5);
  };

  // Calculate aggregates
  const getAggregates = () => {
    if (reports.length === 0) return { avgScore: 0, avgTotal: 0, totalFocus: 0, totalBlocked: 0 };
    const totalScore = reports.reduce((acc, r) => acc + r.productivityScore, 0);
    const totalTime = reports.reduce((acc, r) => acc + r.totalTime, 0);
    const totalFocus = reports.reduce((acc, r) => acc + (r.focusSessionsCount || 0), 0);
    const totalBlocked = reports.reduce((acc, r) => acc + (r.blockedAttemptsCount || 0), 0);

    return {
      avgScore: Math.round(totalScore / reports.length),
      avgTotal: formatTime(Math.round(totalTime / reports.length)),
      totalFocus,
      totalBlocked
    };
  };

  const weeklyData = getWeeklyTrendData();
  const monthlyData = getMonthlyTrendData();
  const prodVsDistData = getProdVsDistData();
  const pieData = getCategoryPieData();
  const topWebsitesData = getTopWebsitesData();
  const stats = getAggregates();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* Title block */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>Productivity Analytics</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Deep analysis and historical trends of your browsing patterns
          </p>
        </div>
        <button onClick={fetchData} className="btn btn-secondary" style={{ padding: '8px 16px' }} disabled={loading}>
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh Data
        </button>
      </div>

      {/* Aggregate Cards */}
      <div className="stats-grid">
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: 'var(--color-brand-glow)', color: 'var(--color-brand)', padding: '12px', borderRadius: '12px' }}>
            <Award size={24} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Avg. Productivity Score</span>
            <h2 style={{ fontSize: '22px', fontWeight: 800 }}>{stats.avgScore}%</h2>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: 'rgba(99, 102, 241, 0.08)', color: 'var(--text-primary)', padding: '12px', borderRadius: '12px' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Avg. Daily Browsing</span>
            <h2 style={{ fontSize: '22px', fontWeight: 800 }}>{stats.avgTotal}</h2>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', color: 'var(--color-productive)', padding: '12px', borderRadius: '12px' }}>
            <BarChart2 size={24} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Focus Sessions</span>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-productive)' }}>{stats.totalFocus}</h2>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', color: 'var(--color-distracting)', padding: '12px', borderRadius: '12px' }}>
            <PieIcon size={24} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Blocked Hits</span>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-distracting)' }}>{stats.totalBlocked}</h2>
          </div>
        </div>
      </div>

      {/* Grid of charts */}
      <div className="charts-grid">
        {/* Weekly Trend */}
        <ChartCard title="Weekly Active Hours" subtitle="Active browsing hours (last 7 days)" loading={loading}>
          {weeklyData.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
              No historical data available.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} stroke="var(--card-border)" />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} stroke="var(--card-border)" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--card-border)', color: 'var(--text-primary)' }} />
                <Bar dataKey="hours" name="Active Hours" fill="var(--color-brand)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Productive vs Distracting */}
        <ChartCard title="Productive vs Distracting" subtitle="Daily comparison in minutes (last 7 days)" loading={loading}>
          {prodVsDistData.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
              No historical data available.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={prodVsDistData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} stroke="var(--card-border)" />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} stroke="var(--card-border)" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--card-border)', color: 'var(--text-primary)' }} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Productive" fill="var(--color-productive)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Distracting" fill="var(--color-distracting)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Monthly active hours */}
        <ChartCard title="Monthly Usage Trend" subtitle="Active browsing hours over the last 30 days" loading={loading}>
          {monthlyData.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
              No historical data available.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fill: 'var(--text-secondary)', fontSize: 9 }} stroke="var(--card-border)" />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 9 }} stroke="var(--card-border)" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--card-border)', color: 'var(--text-primary)' }} />
                <Area type="monotone" dataKey="hours" name="Hours" stroke="var(--color-brand)" fill="rgba(99, 102, 241, 0.05)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Category distribution today */}
        <ChartCard title="Category Share" subtitle="Today's browsing categories share (in minutes)" loading={loading}>
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
                  innerRadius={60}
                  outerRadius={90}
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

        {/* Top Websites Usage today */}
        <ChartCard title="Top 5 Websites Today" subtitle="Today's top 5 domains by browsing minutes" loading={loading} style={{ gridColumn: 'span 2' }}>
          {topWebsitesData.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
              No browsing details available.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topWebsitesData}
                layout="vertical"
                margin={{ top: 10, right: 10, left: 30, bottom: 0 }}
              >
                <XAxis type="number" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} stroke="var(--card-border)" />
                <YAxis dataKey="domain" type="category" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} stroke="var(--card-border)" />
                <Tooltip formatter={(value) => `${value}m`} />
                <Bar dataKey="minutes" name="Minutes" fill="var(--color-brand)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
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

export default Analytics;
