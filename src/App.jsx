import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';

// Pages - lazy load to optimize bundles containing heavy Three.js / Graph components
const LandingPage = lazy(() => import('./pages/LandingPage'));
const CanvasListPage = lazy(() => import('./pages/CanvasListPage'));
const CanvasPage = lazy(() => import('./pages/CanvasPage'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#05020c',
          color: '#a39fc9',
          fontFamily: 'Inter, sans-serif'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(134, 59, 255, 0.2)',
            borderTopColor: '#863bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
          <p style={{ marginTop: '16px', fontSize: '14px', letterSpacing: '0.05em' }}>Loading MindFlow...</p>
        </div>
      }>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/canvases" element={<CanvasListPage />} />
          <Route path="/canvas/:id" element={<CanvasPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
