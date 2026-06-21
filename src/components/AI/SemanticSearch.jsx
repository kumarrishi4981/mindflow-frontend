import React, { useState } from 'react';
import api from '../../api';

function SemanticSearch({ canvasId, onClose, onSelectResult }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      setLoading(true);
      const data = await api.semanticSearch(query.trim(), canvasId);
      setResults(data);
    } catch (err) {
      console.error('Semantic search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content glass-panel search-modal" 
        onClick={(e) => e.stopPropagation()}
        style={{ width: '90%', maxWidth: '600px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px' }}>
            🔍 Semantic AI Search
          </h2>
          <button className="btn btn-ghost" style={{ padding: '4px' }} onClick={onClose}>
            ✕
          </button>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px', lineHeight: '1.4' }}>
          Search your thoughts by **meaning and concepts** rather than exact keywords. Powered by Gemini API semantic embeddings.
        </p>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input
            className="input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a concept, question, or thought (e.g. 'machine learning applications')"
            autoFocus
            required
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', margin: '40px 0', color: 'var(--text-muted)', fontSize: '14px' }}>
            Vector embedding calculation in progress...
          </div>
        ) : results.length === 0 ? (
          <div style={{ textAlign: 'center', margin: '40px 0', color: 'var(--text-muted)', fontSize: '14px' }}>
            {query.trim() ? 'No matching note records found. Try another query context!' : 'Results will appear here.'}
          </div>
        ) : (
          <div className="search-results">
            {Array.isArray(results) && results.map((item) => {
              const note = item?.note || (item && item._id ? item : null);
              const similarity = item?.similarity !== undefined ? item.similarity : 0;
              if (!note || !note._id) return null;

              return (
                <div 
                  key={note._id} 
                  className="search-item"
                  onClick={() => onSelectResult(note)}
                >
                  <div className="search-item-header">
                    <span className="search-item-title">{note.title || 'Untitled Note'}</span>
                    <span className="search-item-score">
                      {Math.round(similarity * 100)}% Match
                    </span>
                  </div>
                  
                  <p className="search-item-snippet">
                    {note.content 
                      ? (note.content.substring(0, 110) + (note.content.length > 110 ? '...' : ''))
                      : 'Empty document content. Click to open and add text nodes.'
                    }
                  </p>

                  {Array.isArray(note.tags) && note.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                      {note.tags.map(t => (
                        <span key={t} className="tag tag-blue" style={{ fontSize: '9px', padding: '2px 8px' }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default SemanticSearch;
