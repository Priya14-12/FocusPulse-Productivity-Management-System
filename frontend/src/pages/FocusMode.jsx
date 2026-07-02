// FocusMode.jsx - Pomodoro Focus Session Timer
import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Play, Pause, Square, Award, Bell, Volume2 } from 'lucide-react';

const FocusMode = () => {
  const [durationPreset, setDurationPreset] = useState(25); // Minutes
  const [timeLeft, setTimeLeft] = useState(25 * 60); // Seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionsToday, setSessionsToday] = useState([]);
  const [totalSecondsFocusedToday, setTotalSecondsFocusedToday] = useState(0);

  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const durationRef = useRef(25 * 60);

  // Request notification permissions on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    loadFocusHistory();
  }, []);

  const loadFocusHistory = async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const todayStart = `${todayStr}T00:00:00.000Z`;
      const todayEnd = `${todayStr}T23:59:59.999Z`;

      const response = await api.get(`/focus-sessions?startDate=${todayStart}&endDate=${todayEnd}`);
      setSessionsToday(response.data);
      const totalSecs = response.data
        .filter(s => s.completed)
        .reduce((sum, s) => sum + s.duration, 0);
      setTotalSecondsFocusedToday(totalSecs);
    } catch (err) {
      console.error('Failed to load focus logs:', err);
    }
  };

  // Sync preset changes with timer state
  const selectPreset = (mins) => {
    if (isRunning) return;
    setDurationPreset(mins);
    setTimeLeft(mins * 60);
    durationRef.current = mins * 60;
  };

  // Play audio alert
  const playAlertSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.8); // play for 0.8 seconds
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  };

  // Show browser notification
  const triggerNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Focus Session Completed!', {
        body: `Excellent! You completed your ${durationPreset} minutes focus session. Get back to work or take a break!`,
        icon: '/vite.svg'
      });
    }
  };

  // Core Timer Logic
  const startTimer = () => {
    if (isRunning && !isPaused) return;

    if (!isPaused) {
      startTimeRef.current = new Date();
    }
    
    setIsRunning(true);
    setIsPaused(false);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          completeFocusSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const pauseTimer = () => {
    if (!isRunning) return;
    clearInterval(timerRef.current);
    setIsPaused(true);
  };

  const stopTimer = () => {
    clearInterval(timerRef.current);
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(durationPreset * 60);
  };

  // Save session details to MongoDB
  const completeFocusSession = async () => {
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(durationPreset * 60);
    playAlertSound();
    triggerNotification();

    try {
      await api.post('/focus-sessions', {
        startTime: startTimeRef.current,
        endTime: new Date(),
        duration: durationRef.current,
        completed: true
      });
      
      // Refresh statistics
      loadFocusHistory();
    } catch (err) {
      console.error('Failed to save focus session:', err);
    }
  };

  // Formatting seconds -> MM:SS
  const formatTimerDigits = () => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Calculate circular SVG progress percentage
  const calculateStrokeProgress = () => {
    const total = durationPreset * 60;
    const progress = (total - timeLeft) / total;
    return progress * 283; // 283 is approximate circumference (2 * pi * r)
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1.2fr 0.8fr',
      gap: '30px'
    }}>
      {/* Timer panel */}
      <div className="glass-panel" style={{
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Preset Selectors */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '40px' }}>
          {[25, 50, 60].map((mins) => (
            <button
              key={mins}
              onClick={() => selectPreset(mins)}
              style={{
                padding: '8px 24px',
                borderRadius: '20px',
                border: '1px solid var(--card-border)',
                backgroundColor: durationPreset === mins ? 'var(--color-brand)' : 'var(--bg-tertiary)',
                color: durationPreset === mins ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: '14px',
                transition: 'all var(--transition-fast)'
              }}
              disabled={isRunning && !isPaused}
            >
              {mins} Min
            </button>
          ))}
        </div>

        {/* Circular SVG Timer visual */}
        <div style={{ position: 'relative', width: '220px', height: '220px', marginBottom: '40px' }}>
          <svg width="220" height="220" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
            {/* Background Circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="transparent"
              stroke="var(--card-border)"
              strokeWidth="4"
            />
            {/* Progress Stroke */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="transparent"
              stroke="var(--color-brand)"
              strokeWidth="4"
              strokeDasharray="282.7"
              strokeDashoffset={282.7 - calculateStrokeProgress()}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.3s ease-out' }}
            />
          </svg>
          {/* Inner timer label */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <h1 style={{ fontSize: '42px', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1 }}>
              {formatTimerDigits()}
            </h1>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isRunning ? (isPaused ? 'Paused' : 'Focusing') : 'Idle'}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '16px' }}>
          {/* Play/Pause */}
          {!isRunning || isPaused ? (
            <button onClick={startTimer} className="btn btn-primary" style={{ padding: '12px 30px', borderRadius: '30px' }}>
              <Play size={16} />
              Start Focus
            </button>
          ) : (
            <button onClick={pauseTimer} className="btn btn-secondary" style={{ padding: '12px 30px', borderRadius: '30px' }}>
              <Pause size={16} />
              Pause
            </button>
          )}

          {/* Stop */}
          <button
            onClick={stopTimer}
            className="btn btn-secondary"
            style={{ padding: '12px 24px', borderRadius: '30px' }}
            disabled={!isRunning}
          >
            <Square size={14} />
            Reset
          </button>
        </div>
      </div>

      {/* Focus log statistics right sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Today's aggregated session progress card */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} style={{ color: 'var(--color-neutral)' }} />
            Today's Progress
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Completed Blocks</span>
              <h2 style={{ fontSize: '28px', fontWeight: 800 }}>{sessionsToday.length} Sessions</h2>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Focus Duration</span>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-brand)' }}>
                {Math.round(totalSecondsFocusedToday / 60)} minutes
              </h2>
            </div>
          </div>
        </div>

        {/* History log list */}
        <div className="glass-panel" style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
            Focus Session History
          </h3>
          {sessionsToday.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No focus sessions completed today yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {sessionsToday.map((session) => (
                <div key={session._id} style={{
                  padding: '10px 12px',
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: 'var(--border-radius-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>
                      {Math.round(session.duration / 60)} Min Session
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--color-productive)',
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    padding: '2px 8px',
                    borderRadius: '10px'
                  }}>
                    Completed
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FocusMode;
