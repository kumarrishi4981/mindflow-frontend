import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function LandingPage() {
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const points = [];
    const maxPoints = 55;
    const connectionDist = 120;

    for (let i = 0; i < maxPoints; i++) {
      points.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 2.5 + 1.5,
        color: i % 3 === 0 ? '#4f8ff7' : i % 3 === 1 ? '#2dd4bf' : '#8b5cf6'
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      points.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const dx = points[i].x - points[j].x;
          const dy = points[i].y - points[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectionDist) {
            const alpha = (1 - dist / connectionDist) * 0.18;
            ctx.beginPath();
            ctx.moveTo(points[i].x, points[i].y);
            ctx.lineTo(points[j].x, points[j].y);
            ctx.strokeStyle = `rgba(79, 143, 247, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const features = [
    {
      id: 'ai-links',
      icon: '🧠',
      title: 'AI Link Predictions',
      desc: 'Gemini AI models automatically compute semantic vector embeddings for your notes, pointing out implicit relationships between your ideas.',
      detail: 'When you create or edit a note, Mindflow sends the text to Google\'s Gemini text-embedding-004 model, which returns a 768-dimensional vector. The backend then computes cosine similarity between all note vectors in your canvas — notes scoring above 30% similarity are surfaced as AI-suggested connections you can accept with one click.',
      cta: 'Try It — Create a Canvas',
    },
    {
      id: 'graph',
      icon: '🕸️',
      title: 'Force-Directed Graph',
      desc: 'See your database as an interactive fluid ecosystem. Drag nodes, adjust physics parameters, and watch structures emerge naturally.',
      detail: 'Your notes become glowing nodes on an infinite 2D canvas powered by d3-force physics. Drag any node to reposition it, scroll to zoom, and click empty space to pan. Edges between related notes are drawn with opacity proportional to their AI similarity score — stronger connections appear brighter. Pin nodes to lock their position.',
      cta: 'Try It — Open Workspace',
    },
    {
      id: 'search',
      icon: '🔍',
      title: 'Semantic Graph Search',
      desc: 'Search by meaning rather than simple query string matching. Retrieve relevant contexts instantly across complex files.',
      detail: 'Type any natural language query (e.g. "machine learning optimization") and Mindflow generates an embedding for your search phrase, then ranks every note in your canvas by cosine similarity. Results show exact match percentages and content previews — click any result to jump directly to that node on the graph.',
      cta: 'Try It — Launch Search',
    },
    {
      id: 'markdown',
      icon: '📝',
      title: 'Rich Markdown Canvas',
      desc: 'Author complex notes with complete formatting, inline lists, tables, and tag systems fully synchronized in real time.',
      detail: 'Every note opens in a slide-out editor with a full Markdown toolbar — bold, italic, headings, code blocks, lists, and tables. Add color-coded tags to categorize notes, pick from 8 node colors to visually organize your graph, and pin important notes to fix their position on the canvas.',
      cta: 'Try It — Start Writing',
    },
  ];

  return (
    <div className="landing-container">
      <canvas ref={canvasRef} className="neural-canvas" />

      <div className="landing-content">
        <div className="brand-badge">
          <span>🧠</span> Mindflow AI v1.0
        </div>

        <h1 className="landing-title">
          Your thoughts,<br />beautifully connected.
        </h1>

        <p className="landing-subtitle">
          An interactive, infinite spatial memory canvas that transforms text documents and thoughts into a dynamic visual knowledge graph with AI-predicted connections.
        </p>

        <div className="landing-ctas">
          <Link to="/canvases" className="btn btn-primary">
            Launch Workspace ➔
          </Link>
          <a href="#features" className="btn btn-secondary">
            Explore Features
          </a>
        </div>

        <div id="features" className="features-grid">
          {features.map(f => (
            <div
              key={f.id}
              className={`feature-card glass-panel ${activeFeature === f.id ? 'feature-card-active' : ''}`}
              onClick={() => setActiveFeature(activeFeature === f.id ? null : f.id)}
              style={{ cursor: 'pointer' }}
            >
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>

              {activeFeature === f.id && (
                <div style={{ marginTop: '16px', animation: 'slideInUp 0.3s ease' }}>
                  <p style={{ color: 'var(--text-primary)', fontSize: '13px', lineHeight: '1.6', marginBottom: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                    {f.detail}
                  </p>
                  <button
                    className="btn btn-primary"
                    style={{ fontSize: '13px', padding: '8px 16px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/canvases');
                    }}
                  >
                    {f.cta}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
