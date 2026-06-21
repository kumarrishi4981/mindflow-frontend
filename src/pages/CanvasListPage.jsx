import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

// Example demo boards shown when backend/DB is unavailable or empty
const EXAMPLE_BOARDS = [
  {
    _id: 'demo-ai-research',
    name: '🔬 AI Research Notes',
    description: 'An example board showcasing how to organize machine learning papers, transformer architectures, and training techniques into a connected knowledge graph.',
    updatedAt: new Date().toISOString(),
    isDemo: true,
    noteCount: 8,
  },
  {
    _id: 'demo-study-guide',
    name: '📚 Study Guide — Data Structures',
    description: 'Organize CS concepts like arrays, trees, graphs, and sorting algorithms. AI automatically links related topics like "Binary Search Tree" ↔ "AVL Rotations".',
    updatedAt: new Date().toISOString(),
    isDemo: true,
    noteCount: 12,
  },
  {
    _id: 'demo-project-planning',
    name: '🚀 Product Roadmap',
    description: 'Use Mindflow to map product features, user stories, and technical specs. Semantic search finds related items across sprints instantly.',
    updatedAt: new Date().toISOString(),
    isDemo: true,
    noteCount: 6,
  },
];

function CanvasListPage() {
  const [canvases, setCanvases] = useState([]);
  const [noteCounts, setNoteCounts] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCanvases();
  }, []);

  const fetchCanvases = async () => {
    try {
      setLoading(true);
      setApiError(false);
      const data = await api.getCanvases();
      
      // Verify the response is actually an array (not an error object)
      if (!Array.isArray(data)) {
        throw new Error('Invalid response from API');
      }
      
      setCanvases(data);

      // Fetch note counts for each canvas in parallel
      const counts = {};
      await Promise.all(data.map(async (c) => {
        try {
          const notes = await api.getNotes(c._id);
          counts[c._id] = Array.isArray(notes) ? notes.length : 0;
        } catch (e) {
          counts[c._id] = 0;
        }
      }));
      setNoteCounts(counts);
    } catch (err) {
      console.error('Failed to load canvases:', err);
      setApiError(true);
      setCanvases([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCanvas = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const newCanvas = await api.createCanvas({
        name: name.trim(),
        description: description.trim(),
        author: 'User'
      });
      
      if (newCanvas && newCanvas._id) {
        setShowModal(false);
        setName('');
        setDescription('');
        navigate(`/canvas/${newCanvas._id}`);
      } else {
        alert('Failed to create canvas. Please make sure MongoDB is running.\n\nRun: mongod  in a terminal to start MongoDB locally.');
      }
    } catch (err) {
      console.error('Failed to create canvas:', err);
      alert('Failed to create canvas. Please make sure MongoDB is running.\n\nRun: mongod  in a terminal to start MongoDB locally.');
    }
  };

  const handleDeleteCanvas = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this canvas and all its notes?')) return;

    try {
      await api.deleteCanvas(id);
      fetchCanvases();
    } catch (err) {
      console.error('Failed to delete canvas:', err);
    }
  };

  const handleDemoClick = (demoId) => {
    alert(
      '📋 This is an example board to show you how Mindflow works.\n\n' +
      'To create your own real canvas:\n' +
      '1. Start MongoDB locally (run: mongod)\n' +
      '2. Click "+ Create Canvas" in the top right\n' +
      '3. Name your canvas and start adding notes!\n\n' +
      'Each note you create gets an AI embedding from Gemini,\n' +
      'and similar notes are automatically linked together.'
    );
  };

  // Determine which boards to show
  const displayBoards = canvases.length > 0 ? canvases : (apiError || loading === false ? EXAMPLE_BOARDS : []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Header navbar */}
      <nav className="navbar">
        <div className="nav-brand" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
          <span>🧠</span> Mindflow
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Create Canvas
        </button>
      </nav>

      <div className="canvases-container">
        <div className="canvases-header">
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-1px', marginBottom: '8px' }}>
              Your Knowledge Canvas
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
              Select a visual memory graph workspace or initialize a new board.
            </p>
          </div>
        </div>

        {/* Connection status banner */}
        {apiError && (
          <div style={{
            padding: '14px 20px',
            marginBottom: '24px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(245, 158, 11, 0.06)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            color: 'var(--accent-amber)',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <span style={{ fontSize: '18px' }}>⚠️</span>
            <div>
              <strong>Database Offline</strong> — MongoDB is not connected. Showing example boards below.
              To use Mindflow fully, start MongoDB locally or connect to MongoDB Atlas.
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', margin: '100px 0', color: 'var(--text-secondary)' }}>
            Loading boards...
          </div>
        ) : (
          <>
            {/* Section label for demo boards */}
            {canvases.length === 0 && displayBoards.length > 0 && (
              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Example Boards — How Mindflow Works
                </span>
              </div>
            )}

            <div className="canvas-grid">
              {displayBoards.map((canvas) => (
                <div
                  key={canvas._id}
                  className="canvas-card glass-panel"
                  onClick={() => canvas.isDemo ? handleDemoClick(canvas._id) : navigate(`/canvas/${canvas._id}`)}
                >
                  {canvas.isDemo && (
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '12px',
                      fontSize: '10px',
                      fontWeight: '700',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--accent-amber)',
                      background: 'rgba(245, 158, 11, 0.08)',
                      border: '1px solid rgba(245, 158, 11, 0.2)',
                      padding: '2px 8px',
                      borderRadius: '100px',
                      textTransform: 'uppercase',
                    }}>
                      Example
                    </div>
                  )}

                  <div className="canvas-title">
                    <span>{canvas.name}</span>
                    {!canvas.isDemo && (
                      <button
                        className="btn btn-ghost"
                        style={{ padding: '4px', height: 'auto', minWidth: 'auto', borderRadius: '4px' }}
                        onClick={(e) => handleDeleteCanvas(e, canvas._id)}
                        title="Delete canvas"
                      >
                        🗑️
                      </button>
                    )}
                  </div>

                  <p className="canvas-desc">
                    {canvas.description || 'No description provided.'}
                  </p>

                  <div className="canvas-meta">
                    <span>📝 {canvas.isDemo ? canvas.noteCount : (noteCounts[canvas._id] || 0)} nodes</span>
                    <span>{new Date(canvas.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Creation Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <form
            className="modal-content glass-panel"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreateCanvas}
          >
            <h2 className="modal-title">Initialize Canvas</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Canvas Name
                </label>
                <input
                  className="input"
                  placeholder="e.g. Master's Thesis, Brain Ecosystem..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Description
                </label>
                <textarea
                  className="textarea"
                  placeholder="Outline the core concepts, research files, or thoughts to organize..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Initialize Canvas
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default CanvasListPage;
