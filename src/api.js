const API_URL = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' 
    ? `${window.location.protocol}//${window.location.hostname}:3001` 
    : 'http://localhost:3001');

// Safe fetch helper — returns parsed JSON or throws with context
async function safeFetch(url, options = {}) {
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

const api = {
  // Canvas CRUD
  getCanvases: () => safeFetch(`${API_URL}/api/canvases`),
  getCanvas: (id) => safeFetch(`${API_URL}/api/canvases/${id}`),
  createCanvas: (data) => safeFetch(`${API_URL}/api/canvases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  updateCanvas: (id, data) => safeFetch(`${API_URL}/api/canvases/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  deleteCanvas: (id) => safeFetch(`${API_URL}/api/canvases/${id}`, {
    method: 'DELETE',
  }),

  // Note CRUD
  getNotes: (canvasId) => safeFetch(`${API_URL}/api/notes?canvasId=${canvasId}`),
  getNote: (id) => safeFetch(`${API_URL}/api/notes/${id}`),
  createNote: (data) => safeFetch(`${API_URL}/api/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  updateNote: (id, data) => safeFetch(`${API_URL}/api/notes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  deleteNote: (id) => safeFetch(`${API_URL}/api/notes/${id}`, {
    method: 'DELETE',
  }),

  // Edge CRUD
  getEdges: (canvasId) => safeFetch(`${API_URL}/api/edges?canvasId=${canvasId}`),
  createEdge: (data) => safeFetch(`${API_URL}/api/edges`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  deleteEdge: (id) => safeFetch(`${API_URL}/api/edges/${id}`, {
    method: 'DELETE',
  }),

  // AI & Embeddings
  suggestLinks: (noteId, canvasId) => safeFetch(`${API_URL}/api/ai/suggest-links/${noteId}?canvasId=${canvasId}`, {
    method: 'POST',
  }),
  semanticSearch: (query, canvasId) => safeFetch(`${API_URL}/api/ai/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, canvasId }),
  }),
  embedNote: (noteId) => safeFetch(`${API_URL}/api/ai/embed-note/${noteId}`, {
    method: 'POST',
  }),
};

export default api;
