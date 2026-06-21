import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import KnowledgeGraph from '../components/Graph/KnowledgeGraph';
import GraphToolbar from '../components/Graph/GraphToolbar';
import NoteEditor from '../components/Editor/NoteEditor';
import SemanticSearch from '../components/AI/SemanticSearch';

function CanvasPage() {
  const { id: canvasId } = useParams();
  const navigate = useNavigate();

  const [canvasDetails, setCanvasDetails] = useState(null);
  const [notes, setNotes] = useState([]);
  const [edges, setEdges] = useState([]);

  const [selectedNote, setSelectedNote] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('mindflow-view-mode') || '2d';
  });

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('mindflow-view-mode', mode);
  };

  const [linkDistance, setLinkDistance] = useState(() => {
    return Number(localStorage.getItem('mindflow-link-distance')) || 80;
  });

  const handleLinkDistanceChange = (dist) => {
    setLinkDistance(dist);
    localStorage.setItem('mindflow-link-distance', dist);
  };

  const graphComponentRef = useRef(null);


  useEffect(() => {
    fetchCanvasData();
  }, [canvasId]);

  const fetchCanvasData = async () => {
    try {
      setLoading(true);
      setError(null);

      const canvas = await api.getCanvas(canvasId);
      if (!canvas || canvas.error) {
        setError('Could not load this canvas. The database may be offline.');
        setCanvasDetails({ name: 'Workspace' });
        setNotes([]);
        setEdges([]);
        return;
      }
      setCanvasDetails(canvas);

      // Load all notes & edges
      let loadedNotes = [];
      let loadedEdges = [];
      try {
        loadedNotes = await api.getNotes(canvasId);
        if (!Array.isArray(loadedNotes)) loadedNotes = [];
      } catch (e) { /* ignore */ }
      try {
        loadedEdges = await api.getEdges(canvasId);
        if (!Array.isArray(loadedEdges)) loadedEdges = [];
      } catch (e) { /* ignore */ }

      setNotes(loadedNotes);
      setEdges(loadedEdges);
    } catch (err) {
      console.error('Failed to load canvas data:', err);
      setError('Failed to connect to the backend. Make sure the API server is running on port 3001.');
      setCanvasDetails({ name: 'Workspace' });
    } finally {
      setLoading(false);
    }
  };

  // Format data for react-force-graph-2d
  const graphData = {
    nodes: notes.map(n => ({
      id: n._id,
      title: n.title,
      content: n.content,
      tags: n.tags,
      color: n.color,
      pinned: n.pinned,
      x: n.position?.x || undefined,
      y: n.position?.y || undefined,
      fx: n.pinned ? n.position?.x : undefined,
      fy: n.pinned ? n.position?.y : undefined
    })),
    links: edges.map(e => ({
      id: e._id,
      source: typeof e.source === 'object' ? e.source._id : e.source,
      target: typeof e.target === 'object' ? e.target._id : e.target,
      similarity: e.similarity || 0,
      type: e.type || 'manual'
    }))
  };

  const handleNodeClick = (node) => {
    const fullNote = notes.find(n => n._id === node.id);
    if (fullNote) {
      setSelectedNote(fullNote);
      setEditorOpen(true);
    }
  };

  const handleBackgroundClick = () => {
    setEditorOpen(false);
    setSelectedNote(null);
  };

  const handleAddNote = async () => {
    try {
      // Calculate position of new node relative to visual center of graph simulation
      let spawnX = 0;
      let spawnY = 0;
      
      if (graphComponentRef.current) {
        const center = graphComponentRef.current.getVisualCenter();
        spawnX = center.x + (Math.random() - 0.5) * 40;
        spawnY = center.y + (Math.random() - 0.5) * 40;
      } else if (notes.length > 0) {
        let sumX = 0;
        let sumY = 0;
        let count = 0;
        notes.forEach(n => {
          if (n.position && typeof n.position.x === 'number' && typeof n.position.y === 'number') {
            sumX += n.position.x;
            sumY += n.position.y;
            count++;
          }
        });
        if (count > 0) {
          spawnX = sumX / count + (Math.random() - 0.5) * 60;
          spawnY = sumY / count + (Math.random() - 0.5) * 60;
        } else {
          spawnX = (Math.random() - 0.5) * 100;
          spawnY = (Math.random() - 0.5) * 100;
        }
      } else {
        spawnX = (Math.random() - 0.5) * 50;
        spawnY = (Math.random() - 0.5) * 50;
      }

      const newNote = await api.createNote({
        title: 'Untitled Note',
        content: '',
        tags: [],
        color: '#4f8ff7',
        canvasId,
        position: { x: spawnX, y: spawnY }
      });
      if (newNote && newNote._id) {
        setNotes([...notes, newNote]);
        setSelectedNote(newNote);
        setEditorOpen(true);
      } else {
        alert('Failed to create note. Make sure MongoDB is running.');
      }
    } catch (err) {
      console.error('Failed to create note:', err);
      alert('Failed to create note. Make sure MongoDB is running.');
    }
  };

  const handleSaveComplete = async (updatedNote) => {
    try {
      const loadedNotes = await api.getNotes(canvasId);
      const loadedEdges = await api.getEdges(canvasId);
      if (Array.isArray(loadedNotes)) setNotes(loadedNotes);
      if (Array.isArray(loadedEdges)) setEdges(loadedEdges);

      if (updatedNote && updatedNote._id) {
        setSelectedNote(updatedNote);
      } else if (selectedNote) {
        const stillSelected = (loadedNotes || []).find(n => n._id === selectedNote._id);
        if (stillSelected) setSelectedNote(stillSelected);
      }
    } catch (err) {
      console.error('Failed to sync graph elements:', err);
    }
  };

  const handleDeleteComplete = (deletedNoteId) => {
    setNotes(notes.filter(n => n._id !== deletedNoteId));
    setEdges(edges.filter(e => {
      const src = typeof e.source === 'object' ? e.source._id : e.source;
      const tgt = typeof e.target === 'object' ? e.target._id : e.target;
      return src !== deletedNoteId && tgt !== deletedNoteId;
    }));
    setEditorOpen(false);
    setSelectedNote(null);
  };

  const handleSelectSearchResult = (note) => {
    setSearchOpen(false);
    setSelectedNote(note);
    setEditorOpen(true);
  };

  const handleAutoLinkAll = async () => {
    if (notes.length < 2) {
      alert('Need at least 2 notes to discover connections!');
      return;
    }

    let linksGeneratedCount = 0;
    try {
      await Promise.all(notes.map(async (n) => {
        try {
          const suggestions = await api.suggestLinks(n._id, canvasId);
          if (!Array.isArray(suggestions)) return;
          await Promise.all(suggestions.map(async ({ note: targetNote, similarity }) => {
            if (similarity >= 0.45) {
              try {
                await api.createEdge({
                  source: n._id,
                  target: targetNote._id,
                  canvasId,
                  type: 'ai',
                  similarity
                });
                linksGeneratedCount++;
              } catch (e) { /* duplicate edge, ignore */ }
            }
          }));
        } catch (e) { /* ignore individual failures */ }
      }));

      const loadedEdges = await api.getEdges(canvasId);
      if (Array.isArray(loadedEdges)) setEdges(loadedEdges);
      alert(`AI scan complete! Discovered and connected ${linksGeneratedCount} semantic clusters.`);
    } catch (err) {
      console.error('Failed to trigger semantic auto linking:', err);
    }
  };

  // Empty state component
  const EmptyState = () => (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
      zIndex: 5,
      maxWidth: '480px',
      padding: '40px',
    }}>
      <div style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.8 }}>🕸️</div>
      <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-primary)' }}>
        Your Canvas is Empty
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', marginBottom: '28px' }}>
        Start building your knowledge graph! Add your first note using the button below.
        As you add more notes, Gemini AI will automatically discover semantic connections between your ideas.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
        <button className="btn btn-primary" onClick={handleAddNote} style={{ fontSize: '15px', padding: '12px 28px' }}>
          📝 Create Your First Note
        </button>

        <div style={{
          marginTop: '20px',
          padding: '20px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          textAlign: 'left',
          width: '100%',
        }}>
          <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-teal)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            💡 Quick Start Guide
          </p>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
            <div>1️⃣ Click <strong style={{ color: 'var(--text-primary)' }}>📝 + Note</strong> to add a thought</div>
            <div>2️⃣ Write content in the <strong style={{ color: 'var(--text-primary)' }}>Markdown Editor</strong></div>
            <div>3️⃣ Click <strong style={{ color: 'var(--text-primary)' }}>💾 Save</strong> — AI generates embeddings</div>
            <div>4️⃣ Add 2+ notes, then click <strong style={{ color: 'var(--text-primary)' }}>🤖 Auto-Link</strong></div>
            <div>5️⃣ Watch AI discover <strong style={{ color: 'var(--accent-teal)' }}>semantic connections!</strong></div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ height: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Workspace top navigation bar */}
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="back-btn btn-ghost" onClick={() => navigate('/canvases')} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
            ← Boards
          </button>
          <div style={{ width: '1px', height: '20px', background: 'var(--border)' }} />
          <h2 style={{ fontSize: '16px', fontWeight: '800' }}>
            🧠 {canvasDetails ? canvasDetails.name : 'Workspace'}
          </h2>
        </div>

        <div style={{ color: 'var(--text-secondary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            display: 'inline-block',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: error ? 'var(--accent-amber)' : 'var(--accent-teal)',
            boxShadow: error ? '0 0 10px rgba(245,158,11,0.4)' : 'var(--glow-teal)',
          }} />
          <span>{error ? 'Offline Mode' : 'Gemini AI Connected'}</span>
        </div>
      </nav>

      {/* Error banner */}
      {error && (
        <div style={{
          padding: '10px 24px',
          background: 'rgba(245, 158, 11, 0.06)',
          borderBottom: '1px solid rgba(245, 158, 11, 0.15)',
          color: 'var(--accent-amber)',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Main split-pane workspace */}
      <div className="canvas-layout">
        <div className="graph-area">
          <GraphToolbar
            onAddNote={handleAddNote}
            onSearchClick={() => setSearchOpen(true)}
            onAutoLinkAll={handleAutoLinkAll}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            linkDistance={linkDistance}
            onLinkDistanceChange={handleLinkDistanceChange}
          />

          {loading ? (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--text-secondary)', zIndex: 5 }}>
              Loading workspace...
            </div>
          ) : notes.length === 0 ? (
            <EmptyState />
          ) : (
            <KnowledgeGraph
              ref={graphComponentRef}
              graphData={graphData}
              onNodeClick={handleNodeClick}
              onBackgroundClick={handleBackgroundClick}
              selectedNodeId={selectedNote?._id}
              viewMode={viewMode}
              linkDistance={linkDistance}
            />
          )}

          <div className="graph-stats glass-panel">
            <span>📝 {notes.length} thoughts</span>
            <span>🕸️ {edges.length} connections</span>
          </div>
        </div>

        {/* Note editor drawer */}
        <NoteEditor
          note={selectedNote}
          notes={notes}
          edges={edges}
          isOpen={editorOpen}
          onClose={handleBackgroundClick}
          onSaveComplete={handleSaveComplete}
          onDeleteComplete={handleDeleteComplete}
          canvasId={canvasId}
        />
      </div>

      {/* Semantic Search Popup Modal */}
      {searchOpen && (
        <SemanticSearch
          canvasId={canvasId}
          onClose={() => setSearchOpen(false)}
          onSelectResult={handleSelectSearchResult}
        />
      )}
    </div>
  );
}

export default CanvasPage;
