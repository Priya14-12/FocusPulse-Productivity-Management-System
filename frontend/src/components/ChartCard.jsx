// ChartCard.jsx - Reusable Card for Charts
import React from 'react';

const ChartCard = ({ title, subtitle, children, loading }) => {
  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '380px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
          {title}
        </h3>
        {subtitle && (
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {subtitle}
          </p>
        )}
      </div>
      <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', minHeight: 0 }}>
        {loading ? (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(var(--bg-secondary), 0.5)'
          }}>
            <div style={{
              width: '30px',
              height: '30px',
              border: '2px solid var(--card-border)',
              borderTop: '2px solid var(--color-brand)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default ChartCard;
