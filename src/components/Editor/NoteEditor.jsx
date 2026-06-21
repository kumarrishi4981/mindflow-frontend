import React, { useState, useEffect } from 'react';
import MDEditor from '@uiw/react-md-editor';
import api from '../../api';

const COLORS = [
  '#4f8ff7', // Accent Blue
  '#2dd4bf', // Teal
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#f43f5e', // Rose
  '#10b981', // Green
  '#f97316', // Orange
  '#ec4899'  // Pink
];

function NoteEditor({ note, notes = [], edges = [], isOpen, onClose, onSaveComplete, onDeleteComplete, canvasId }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [color, setColor] = useState('#4f8ff7');
  const [pinned, setPinned] = useState(false);
  
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Selected target for manual linking
  const [manualLinkTarget, setManualLinkTarget] = useState('');

  // 1. Existing Connections involving this note
  const activeEdges = note ? edges.filter(e => {
    const srcId = typeof e.source === 'object' ? e.source._id : e.source;
    const tgtId = typeof e.target === 'object' ? e.target._id : e.target;
    return srcId === note._id || tgtId === note._id;
  }) : [];

  const connectedNotes = activeEdges.map(edge => {
    const srcId = typeof edge.source === 'object' ? edge.source._id : edge.source;
    const tgtId = typeof edge.target === 'object' ? edge.target._id : edge.target;
    const targetId = srcId === note._id ? tgtId : srcId;
    const targetNote = notes.find(n => n._id === targetId);
    return {
      edgeId: edge._id,
      noteId: targetId,
      title: targetNote?.title || 'Untitled Note',
      type: edge.type, // 'manual' or 'ai'
      similarity: edge.similarity
    };
  });

  // 2. Nodes available for manual linking
  const connectedNoteIds = new Set(connectedNotes.map(cn => cn.noteId));
  const availableNotes = note ? notes.filter(n => n._id !== note._id && !connectedNoteIds.has(n._id)) : [];

  // Sync state with active note prop
  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      setTags(note.tags || []);
      setColor(note.color || '#4f8ff7');
      setPinned(note.pinned || false);
      setAiSuggestions([]); // Reset suggestions for new note
      setManualLinkTarget(''); // Reset selection
      fetchAiSuggestions(note);
    }
  }, [note]);

  const fetchAiSuggestions = async (currentNote = note) => {
    if (!currentNote?._id) return;
    
    // Check if empty/untitled note
    const isDefaultUntitled = !currentNote.title || currentNote.title.trim() === 'Untitled Note';
    const isContentEmpty = !currentNote.content || !currentNote.content.trim();
    if (isDefaultUntitled && isContentEmpty) {
      setAiSuggestions([]);
      return;
    }

    try {
      setAiLoading(true);
      const suggestions = await api.suggestLinks(currentNote._id, canvasId);
      setAiSuggestions(suggestions);
    } catch (e) {
      console.error('Failed to fetch link suggestions:', e);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !note?._id) return;

    try {
      setSaving(true);
      const updated = await api.updateNote(note._id, {
        title: title.trim(),
        content,
        tags,
        color,
        pinned
      });
      onSaveComplete(updated);
      // Refresh AI suggestions after saving text changes since embeddings update in background
      setTimeout(() => fetchAiSuggestions(updated), 1200);
    } catch (err) {
      console.error('Failed to update note:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!note?._id) return;
    if (!window.confirm('Delete this note card? All its manual/AI connection lines will be destroyed.')) return;

    try {
      await api.deleteNote(note._id);
      onDeleteComplete(note._id);
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      if (!tags.includes(newTag.trim())) {
        setTags([...tags, newTag.trim()]);
      }
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleAcceptSuggestion = async (suggestedNoteId, similarity) => {
    try {
      await api.createEdge({
        source: note._id,
        target: suggestedNoteId,
        canvasId,
        type: 'ai',
        similarity
      });
      // Remove accepted suggestion from list
      setAiSuggestions(aiSuggestions.filter(s => s.note._id !== suggestedNoteId));
      onSaveComplete(); // Triggers parent graph redraw
    } catch (err) {
      console.error('Failed to accept AI link:', err);
    }
  };

  const handleDismissSuggestion = (suggestedNoteId) => {
    setAiSuggestions(aiSuggestions.filter(s => s.note._id !== suggestedNoteId));
  };

  return (
    <div className={`note-editor glass-panel ${isOpen ? 'open' : ''}`}>
      <div className="editor-header">
        <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Note Editor</h3>
        <button className="btn btn-ghost" style={{ padding: '6px' }} onClick={onClose}>
          ✕ Close
        </button>
      </div>

      <div className="editor-body">
        {/* Title Input */}
        <div>
          <input
            className="note-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Document Title"
          />
        </div>

        {/* Markdown Editor */}
        <div data-color-mode="dark">
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>
            Markdown Content
          </label>
          <MDEditor
            value={content}
            onChange={setContent}
            preview="edit"
            height={260}
          />
        </div>

        {/* Color Palette Node Customizer */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>
            Graph Node Color
          </label>
          <div className="color-picker">
            {COLORS.map(c => (
              <div
                key={c}
                className={`color-dot ${color === c ? 'active' : ''}`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>

        {/* Pin Anchor Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input 
            type="checkbox" 
            id="pinned" 
            checked={pinned} 
            onChange={(e) => setPinned(e.target.checked)}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          <label htmlFor="pinned" style={{ fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
            📌 Fix Node Anchor Position on Graph
          </label>
        </div>

        {/* Tags */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>
            Tags
          </label>
          <div className="tag-input-container">
            {tags.map(t => (
              <span key={t} className="tag tag-blue" style={{ fontSize: '10px' }}>
                {t}
                <span 
                  style={{ marginLeft: '4px', cursor: 'pointer', fontWeight: '700' }} 
                  onClick={() => handleRemoveTag(t)}
                >
                  ×
                </span>
              </span>
            ))}
            <input
              className="tag-input"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="+ Add tag..."
            />
          </div>
        </div>

        {/* Custom manual link/unlink handlers */}
        {note?._id && (() => {
          const handleUnlink = async (edgeId) => {
            try {
              await api.deleteEdge(edgeId);
              onSaveComplete();
            } catch (err) {
              console.error('Failed to unlink edge:', err);
            }
          };

          const handleCreateManualLink = async (e) => {
            e.preventDefault();
            if (!manualLinkTarget) return;
            try {
              await api.createEdge({
                source: note._id,
                target: manualLinkTarget,
                canvasId,
                type: 'manual'
              });
              setManualLinkTarget('');
              onSaveComplete();
            } catch (err) {
              console.error('Failed to link notes:', err);
              alert(err.message || 'Failed to create connection');
            }
          };

          return (
            <div className="connections-section">
              <h4 className="connections-title">
                <span>🔗</span> Connections ({connectedNotes.length})
              </h4>
              
              {connectedNotes.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  No connections yet. Link to another note below!
                </div>
              ) : (
                <div className="connections-list">
                  {connectedNotes.map(conn => (
                    <div key={conn.edgeId} className="connection-item">
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontWeight: '500' }}>{conn.title}</span>
                        <span className={`connection-badge connection-badge-${conn.type}`}>
                          {conn.type === 'ai' ? `${Math.round(conn.similarity * 100)}% AI` : 'Manual'}
                        </span>
                      </div>
                      <button 
                        className="btn btn-ghost" 
                        style={{ padding: '2px 6px', fontSize: '11px', height: 'auto', color: 'var(--accent-rose)' }}
                        onClick={() => handleUnlink(conn.edgeId)}
                      >
                        Unlink
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {availableNotes.length > 0 && (
                <form onSubmit={handleCreateManualLink} className="connection-add">
                  <select
                    className="connection-select"
                    value={manualLinkTarget}
                    onChange={(e) => setManualLinkTarget(e.target.value)}
                    required
                  >
                    <option value="">-- Link to note --</option>
                    {availableNotes.map(avail => (
                      <option key={avail._id} value={avail._id}>
                        {avail.title || 'Untitled Note'}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                    Link
                  </button>
                </form>
              )}
            </div>
          );
        })()}

        {/* AI Recommendations Panel */}
        {note?._id && (
          <div className="ai-section">
            <h4 className="ai-section-title">
              <span>🤖</span> Gemini Link Suggestions
            </h4>
            
            {((!title.trim() || title.trim() === 'Untitled Note') && (!content || !content.trim())) ? (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Write some notes and save to get AI-powered connection suggestions.
              </div>
            ) : aiLoading ? (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Analyzing semantic connections...</div>
            ) : aiSuggestions.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                No semantic connections discovered yet. Try adding more detail to your note context!
              </div>
            ) : (
              <div className="ai-suggestions-list">
                {Array.isArray(aiSuggestions) && aiSuggestions.map((item) => {
                  const suggestedNote = item?.note || (item && item._id ? item : null);
                  const similarity = item?.similarity !== undefined ? item.similarity : 0;
                  if (!suggestedNote || !suggestedNote._id) return null;

                  return (
                    <div key={suggestedNote._id} className="suggestion-card">
                      <span className="suggestion-title">{suggestedNote.title || 'Untitled Note'}</span>
                      
                      <div className="suggestion-bar-container">
                        <div className="suggestion-bar">
                          <div 
                            className="suggestion-fill" 
                            style={{ width: `${Math.round(similarity * 100)}%` }}
                          />
                        </div>
                        <span>{Math.round(similarity * 100)}% Match</span>
                      </div>

                      <div className="suggestion-actions">
                        <button 
                          className="btn btn-ghost" 
                          style={{ padding: '4px 8px', fontSize: '11px', height: 'auto' }}
                          onClick={() => handleDismissSuggestion(suggestedNote._id)}
                        >
                          Dismiss
                        </button>
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '4px 8px', fontSize: '11px', height: 'auto', background: 'var(--accent-teal)' }}
                          onClick={() => handleAcceptSuggestion(suggestedNote._id, similarity)}
                        >
                          Accept Connection
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="editor-footer">
        <button 
          className="btn btn-primary" 
          onClick={handleSave} 
          disabled={saving}
          style={{ flex: 1 }}
        >
          {saving ? 'Saving...' : '💾 Save Changes'}
        </button>
        <button 
          className="btn btn-danger" 
          onClick={handleDelete}
          style={{ padding: '10px 14px' }}
          title="Delete Note"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

export default NoteEditor;
