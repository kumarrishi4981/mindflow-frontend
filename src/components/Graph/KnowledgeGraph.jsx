import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';

const KnowledgeGraph = forwardRef(({ graphData, onNodeClick, onBackgroundClick, selectedNodeId, viewMode, linkDistance = 80 }, ref) => {
  const graphRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [lastViewMode, setLastViewMode] = useState(viewMode);
  const [currentGraphData, setCurrentGraphData] = useState(() => {
    if (!graphData) return { nodes: [], links: [] };
    return {
      nodes: graphData.nodes.map(node => {
        const { x, y, z, vx, vy, vz, index, ...rest } = node;
        return { ...rest };
      }),
      links: graphData.links.map(link => {
        const { source, target, index, ...rest } = link;
        return {
          ...rest,
          source: typeof source === 'object' ? source.id : source,
          target: typeof target === 'object' ? target.id : target
        };
      })
    };
  });

  // Handle viewMode change synchronously during render to avoid passing stale/mutated data to the new viewMode component
  if (viewMode !== lastViewMode) {
    setLastViewMode(viewMode);
    
    // Clean/strip coordinate properties when viewMode changes to prevent D3 crashes and off-screen rendering
    const cleanNodes = graphData.nodes.map(node => {
      const { x, y, z, vx, vy, vz, index, ...rest } = node;
      return {
        ...rest,
        x: node.pinned ? node.x : undefined,
        y: node.pinned ? node.y : undefined
      };
    });

    const cleanLinks = graphData.links.map(link => {
      const { source, target, index, ...rest } = link;
      return {
        ...rest,
        source: typeof source === 'object' ? source.id : source,
        target: typeof target === 'object' ? target.id : target
      };
    });

    setCurrentGraphData({ nodes: cleanNodes, links: cleanLinks });
  }

  // Sync graphData changes and preserve existing simulated coordinates
  useEffect(() => {
    setCurrentGraphData(prevData => {
      const coordMap = new Map();
      if (prevData && prevData.nodes) {
        prevData.nodes.forEach(n => {
          if (typeof n.x === 'number') {
            coordMap.set(n.id, { x: n.x, y: n.y, z: n.z, vx: n.vx, vy: n.vy, vz: n.vz });
          }
        });
      }
      
      const newNodes = graphData.nodes.map(node => {
        const coords = coordMap.get(node.id);
        if (coords) {
          return { ...node, ...coords };
        }
        const { x, y, z, vx, vy, vz, index, ...rest } = node;
        return {
          ...rest,
          x: node.pinned ? node.x : undefined,
          y: node.pinned ? node.y : undefined
        };
      });

      const newLinks = graphData.links.map(link => {
        const { source, target, index, ...rest } = link;
        return {
          ...rest,
          source: typeof source === 'object' ? source.id : source,
          target: typeof target === 'object' ? target.id : target
        };
      });

      return { nodes: newNodes, links: newLinks };
    });
  }, [graphData]);

  useImperativeHandle(ref, () => ({
    getVisualCenter() {
      if (currentGraphData && currentGraphData.nodes && currentGraphData.nodes.length > 0) {
        const simulatedNodes = currentGraphData.nodes.filter(n => typeof n.x === 'number' && typeof n.y === 'number');
        if (simulatedNodes.length > 0) {
          const sumX = simulatedNodes.reduce((sum, n) => sum + n.x, 0);
          const sumY = simulatedNodes.reduce((sum, n) => sum + n.y, 0);
          return { x: sumX / simulatedNodes.length, y: sumY / simulatedNodes.length };
        }
      }
      return { x: 0, y: 0 };
    }
  }));

  // Dynamically resize graph when parent container dimensions change
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    handleResize(); // Initial measurement

    return () => observer.disconnect();
  }, []);

  // Track if it's the first mount of the current view mode component
  const isFirstMountRef = useRef(true);

  // Reset first mount ref when viewMode changes
  useEffect(() => {
    isFirstMountRef.current = true;
  }, [viewMode]);

  // Configure physics forces when data is loaded, viewMode changes, or linkDistance changes
  useEffect(() => {
    if (graphRef.current) {
      const linkForce = graphRef.current.d3Force('link');
      if (linkForce) {
        linkForce.distance(link => {
          return link.type === 'ai' ? linkDistance * 1.4 - (link.similarity * (linkDistance * 0.8)) : linkDistance;
        });
      }
      const chargeForce = graphRef.current.d3Force('charge');
      if (chargeForce) {
        chargeForce.strength(viewMode === '3d' ? -linkDistance * 4.5 : -linkDistance * 2.5);
      }
    }
  }, [currentGraphData, viewMode, linkDistance]);

  // Reheat simulation only when linkDistance changes AFTER the initial mount
  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }
    
    // Defer reheating to ensure the child component's debounced digest has finished initializing the layout
    const timer = setTimeout(() => {
      if (graphRef.current && typeof graphRef.current.d3ReheatSimulation === 'function') {
        try {
          graphRef.current.d3ReheatSimulation();
        } catch (e) {
          console.warn('Failed to reheat simulation:', e);
        }
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [linkDistance]);

  // Center/fit graph view
  const handleZoomToFit = () => {
    if (graphRef.current) {
      const padding = viewMode === '3d' ? 15 : 40;
      graphRef.current.zoomToFit(600, padding);
    }
  };

  // 50-80 words Tooltip Generator with custom HTML
  const getNodeLabel = (node) => {
    const title = node.title || 'Untitled Note';
    const content = node.content || '';
    
    // Strip simple markdown tags
    let cleanText = content
      .replace(/#+\s+/g, '') // headers
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // links
      .replace(/[*_`~]/g, '') // bold, italics, code, strikethrough
      .replace(/\n+/g, ' ') // newlines
      .trim();

    const words = cleanText.split(/\s+/).filter(Boolean);
    
    let description = '';
    let hasMore = false;
    
    if (words.length > 80) {
      description = words.slice(0, 70).join(' ') + '...';
      hasMore = true;
    } else if (words.length > 0) {
      description = cleanText;
    } else {
      description = 'No content yet.';
    }

    return `
      <div class="graph-tooltip-card">
        <div class="tooltip-header" style="border-left: 3px solid ${node.color || '#4f8ff7'};">
          <span class="tooltip-title">${title}</span>
        </div>
        <div class="tooltip-body">${description}${hasMore ? ' <span style="color: var(--accent-blue); font-weight: 600;">[Read More]</span>' : ''}</div>
        ${hasMore ? '<div class="tooltip-footer">💡 Click node to read more</div>' : ''}
      </div>
    `;
  };

  // Custom 3D Node Mesh Generator
  const createNode3DObject = (node) => {
    const isSelected = selectedNodeId === node.id;
    const radius = isSelected ? 18 : 12;
    
    // Create sphere mesh
    const geometry = new THREE.SphereGeometry(radius, 24, 24);
    const colorVal = node.color || '#4f8ff7';
    const material = new THREE.MeshPhongMaterial({
      color: colorVal,
      emissive: colorVal,
      emissiveIntensity: isSelected ? 0.8 : 0.3,
      shininess: 100,
      transparent: true,
      opacity: 0.95
    });
    const sphere = new THREE.Mesh(geometry, material);
    
    if (isSelected) {
      const haloGeo = new THREE.SphereGeometry(radius + 4, 16, 16);
      const haloMat = new THREE.MeshBasicMaterial({
        color: colorVal,
        wireframe: true,
        transparent: true,
        opacity: 0.15
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      sphere.add(halo);
    }
    
    // Create canvas texture for the text label sprite
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, 256, 64);
    
    // Text styling
    ctx.font = '24px Inter, sans-serif';
    ctx.fillStyle = isSelected ? '#ffffff' : '#a0a5c0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const title = node.title || '';
    const label = title.length > 16 ? title.substring(0, 14) + '..' : title;
    ctx.fillText(label, 128, 32);
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    
    // Scale sprite to look clean and readable
    sprite.scale.set(70, 17.5, 1);
    sprite.position.set(0, radius + 14, 0);
    
    const group = new THREE.Group();
    group.add(sphere);
    group.add(sprite);
    
    return group;
  };

  return (
    <div ref={containerRef} className="graph-container" style={{ width: '100%', height: '100%', position: 'relative' }}>
      {viewMode === '3d' ? (
        <ForceGraph3D
          ref={graphRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={currentGraphData}
          nodeLabel={getNodeLabel}
          onNodeClick={onNodeClick}
          onBackgroundClick={onBackgroundClick}
          cooldownTicks={100}
          nodeThreeObject={createNode3DObject}
          
          // CUSTOM LINK STYLING FOR 3D
          linkColor={(link) => {
            if (link.type === 'ai') return 'rgba(45, 212, 191, 0.4)'; // Teal glow for AI links
            return 'rgba(79, 143, 247, 0.3)'; // Blue edge for manual links
          }}
          linkWidth={(link) => {
            if (link.type === 'ai') return link.similarity * 3; // Thicker AI connection
            return 1.5;
          }}
          linkDirectionalParticles={1}
          linkDirectionalParticleSpeed={(link) => {
            return link.type === 'ai' ? link.similarity * 0.015 : 0.005;
          }}
          linkDirectionalParticleWidth={(link) => {
            return link.type === 'ai' ? 1.5 + (link.similarity * 2.5) : 2;
          }}
          linkDirectionalParticleColor={(link) => {
            return link.type === 'ai' ? '#2dd4bf' : '#4f8ff7';
          }}
        />
      ) : (
        <ForceGraph2D
          ref={graphRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={currentGraphData}
          nodeLabel={getNodeLabel}
          onNodeClick={onNodeClick}
          onBackgroundClick={onBackgroundClick}
          cooldownTicks={100}
          
          // CUSTOM NODE CANVAS RENDERER FOR 2D
          nodeCanvasObject={(node, ctx, globalScale) => {
            const isSelected = selectedNodeId === node.id;
            const radius = isSelected ? 9 : 7;
            
            // Draw Selection Halo
            if (isSelected) {
              ctx.shadowBlur = 18;
              ctx.shadowColor = node.color || '#4f8ff7';
              ctx.beginPath();
              ctx.arc(node.x, node.y, radius + 4, 0, 2 * Math.PI, false);
              ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
              ctx.strokeStyle = node.color || '#4f8ff7';
              ctx.lineWidth = 1.5;
              ctx.fill();
              ctx.stroke();
              ctx.shadowBlur = 0; // reset
            } else {
              // Subtle standard glow for hover/styled dots
              ctx.shadowBlur = 6;
              ctx.shadowColor = node.color || '#4f8ff7';
            }

            // Main Node Circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = node.color || '#4f8ff7';
            ctx.fill();
            ctx.shadowBlur = 0; // reset shadow

            // Node Text Label
            const title = node.title || '';
            const label = title.length > 14 ? title.substring(0, 12) + '..' : title;
            const fontSize = 11 / globalScale;
            ctx.font = `${fontSize}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = isSelected ? '#ffffff' : '#8b8fa3';
            
            // Background for labels at extreme zoom levels
            if (globalScale > 1.2) {
              ctx.fillText(label, node.x, node.y + radius + 4);
            }
          }}

          // CUSTOM LINK STYLING FOR 2D
          linkColor={(link) => {
            if (link.type === 'ai') return 'rgba(45, 212, 191, 0.35)'; // Teal glow for AI links
            return 'rgba(79, 143, 247, 0.25)'; // Blue edge for manual links
          }}
          linkWidth={(link) => {
            if (link.type === 'ai') return link.similarity * 3; // Thicker AI connection based on relevance
            return 1.5;
          }}
          linkDirectionalParticles={1}
          linkDirectionalParticleSpeed={(link) => {
            return link.type === 'ai' ? link.similarity * 0.015 : 0.005;
          }}
          linkDirectionalParticleWidth={(link) => {
            return link.type === 'ai' ? 1.5 + (link.similarity * 2.5) : 2;
          }}
          linkDirectionalParticleColor={(link) => {
            return link.type === 'ai' ? '#2dd4bf' : '#4f8ff7';
          }}
        />
      )}
      
      {/* Dynamic Fit Canvas Button */}
      <button 
        onClick={handleZoomToFit}
        className="btn glass-panel btn-ghost"
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          zIndex: 10,
          padding: '8px 14px',
          fontSize: '12px',
          border: '1px solid var(--border)'
        }}
      >
        ↺ Fit Canvas
      </button>
    </div>
  );
});

export default KnowledgeGraph;
