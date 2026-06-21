import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import CanvasListPage from './pages/CanvasListPage';
import CanvasPage from './pages/CanvasPage';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/canvases" element={<CanvasListPage />} />
        <Route path="/canvas/:id" element={<CanvasPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
