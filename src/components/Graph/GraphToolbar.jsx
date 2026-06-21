import React from 'react';

function GraphToolbar({ onAddNote, onSearchClick, onAutoLinkAll, onResetLayout, viewMode, onViewModeChange, linkDistance, onLinkDistanceChange }) {
  return (
    <div className="graph-toolbar glass-panel">
      <button 
        className="btn btn-ghost" 
        onClick={onAddNote}
        title="Add new note"
        style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        <span>📝</span> + Note
      </button>
      
      <div style={{ width: '1px', height: '24px', background: 'var(--border)', margin: 'auto 4px' }} />
      
      <button 
        className="btn btn-ghost" 
        onClick={onSearchClick}
        title="Semantic Search (AI)"
        style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        <span>🔍</span> Search AI
      </button>

      <div style={{ width: '1px', height: '24px', background: 'var(--border)', margin: 'auto 4px' }} />

      <button 
        className="btn btn-ghost" 
        onClick={onAutoLinkAll}
        title="Trigger AI linking recommendations"
        style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        <span>🤖</span> Auto-Link
      </button>

      <div style={{ width: '1px', height: '24px', background: 'var(--border)', margin: 'auto 4px' }} />

      <button 
        className="btn btn-ghost" 
        onClick={() => onViewModeChange(viewMode === '2d' ? '3d' : '2d')}
        title="Toggle 2D/3D Graph"
        style={{ 
          fontSize: '13px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px',
          color: viewMode === '3d' ? 'var(--accent-teal)' : 'var(--text-secondary)',
          background: viewMode === '3d' ? 'rgba(45, 212, 191, 0.08)' : 'transparent',
          border: viewMode === '3d' ? '1px solid rgba(45, 212, 191, 0.2)' : '1px solid transparent'
        }}
      >
        <span>{viewMode === '2d' ? '📦 3D Mode' : '📄 2D Mode'}</span>
      </button>

      {onLinkDistanceChange && (
        <>
          <div style={{ width: '1px', height: '24px', background: 'var(--border)', margin: 'auto 4px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>📏 Link:</span>
            <input 
              type="range" 
              min="40" 
              max="200" 
              value={linkDistance || 80} 
              onChange={(e) => onLinkDistanceChange(Number(e.target.value))}
              style={{ width: '80px', height: '4px', cursor: 'pointer', accentColor: 'var(--accent-blue)' }}
              title="Adjust connection line length"
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{linkDistance || 80}px</span>
          </div>
        </>
      )}
    </div>
  );
}

export default GraphToolbar;
