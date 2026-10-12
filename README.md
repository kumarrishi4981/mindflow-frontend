# 🧠 MindFlow — AI-Powered Visual Knowledge Graph & Spatial Canvas

> Your thoughts, beautifully connected. An interactive, infinite spatial memory canvas that transforms text documents and markdown notes into dynamic 2D and 3D visual knowledge graphs with AI-predicted connections.

[![Live Demo](https://img.shields.io/badge/Demo-Live_Deployment-success?style=for-the-badge&logo=vercel&logoColor=white)](https://mindflow-frontend-bay.vercel.app/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL_3D-black?style=for-the-badge&logo=threedotjs&logoColor=white)](https://threejs.org/)
[![Force Graph](https://img.shields.io/badge/Force_Graph-2D_%2F_3D-blueviolet?style=for-the-badge)](https://github.com/vasturiano/react-force-graph)
[![Backend API](https://img.shields.io/badge/Backend-mindflow--backend-blue?style=for-the-badge&logo=render)](https://mindflow-backend-tply.onrender.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

---

### 🌐 Live Deployments
- **Knowledge Canvas (Frontend)**: [https://mindflow-frontend-bay.vercel.app/](https://mindflow-frontend-bay.vercel.app/)
- **AI Embedding & Graph API (Backend)**: [https://mindflow-backend-tply.onrender.com/](https://mindflow-backend-tply.onrender.com/)

---

![MindFlow Landing Preview](mindflow_preview.png)

---

## 📌 Overview

Traditional note-taking tools trap knowledge in rigid, hierarchical folders where related ideas easily become lost. **MindFlow** reimagines knowledge organization around **spatial memory** and **associative thinking**.

As you author thoughts, research snippets, and documents, MindFlow visualizes them as interconnected nodes in a force-directed universe. Using vector embeddings powered by Google Gemini, the platform identifies hidden semantic relationships between your notes, predicting and suggesting links across concepts.

---

## ✨ Key Features

- **🌌 2D & 3D Force-Directed Knowledge Graph**:
  - Seamlessly toggle between a spatial 2D interactive canvas and an immersive **Three.js WebGL 3D galaxy view**.
  - Physics-based force simulation automatically clusters related thoughts and pulls linked concepts closer.
- **🤖 AI Semantic Connection Prediction**:
  - Leverages Google Gemini embeddings to compute cosine similarity between all thoughts in your canvas.
  - Recommends non-obvious links and associations to foster serendipitous discoveries.
- **📝 In-Canvas Markdown Editor**:
  - Clean, distraction-free markdown editing powered by `@uiw/react-md-editor`.
  - Supports headings, code blocks, lists, and instant live preview.
- **♾️ Infinite Spatial Memory Canvas**:
  - Pan, zoom, drag nodes, and position thoughts freely across an unbound workspace.
- **🔍 Quick Search & Tag Filtering**:
  - Instantly isolate clusters, highlight paths between thoughts, and locate notes by keywords.

---

## 🛠️ Architecture & Tech Stack

```text
┌─────────────────────────────────┐               HTTP REST               ┌─────────────────────────────────┐
│     MindFlow React 19 Client    │ <===================================> │      MindFlow Node / Express    │
│  (Three.js, Force-Graph, MD)    │       (Graph Nodes, Edges, AI)        │     (Mongoose, Gemini Vector)   │
└─────────────────────────────────┘                                       └─────────────────────────────────┘
```

| Layer | Technology |
| :--- | :--- |
| **Framework** | React 19, Vite |
| **Graph Visualization** | `react-force-graph-2d`, `react-force-graph-3d`, Three.js |
| **Markdown Editing** | `@uiw/react-md-editor` |
| **Routing** | React Router DOM v7 |
| **Hosting** | Vercel (Edge CDN) |
| **Companion Backend** | [MindFlow Backend (Node.js / Express)](https://github.com/kumarrishi4981/mindflow-backend) |

---

## 📂 Project Structure

```text
mindflow-frontend/
├── src/
│   ├── components/              # KnowledgeGraph, Graph3D, NoteModal, Toolbar, SearchBar
│   ├── pages/                   # Landing page, Workspace / Canvas view
│   ├── services/                # Backend API connectors (notes, edges, canvas, AI)
│   ├── App.jsx                  # Main application routing
│   └── index.css                # Dark cosmic theme styling & canvas shaders
├── public/                      # Static brand assets & icons
├── vercel.json                  # Single-page application route rewrites
├── package.json
└── README.md                    # Documentation
```

---

## 🚀 Local Development Setup

### Prerequisites
- **Node.js** (v18+) and **npm**
- Running instance of [MindFlow Backend](https://github.com/kumarrishi4981/mindflow-backend)

---

### 1. Clone the Repository
```bash
git clone https://github.com/kumarrishi4981/mindflow-frontend.git
cd mindflow-frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
VITE_API_URL=http://localhost:5000
```

### 4. Start Development Server
```bash
npm run dev
```
* Open your browser at `http://localhost:5173`.

---

## ☁️ Deployment (Vercel)

1. Connect your repository on **[Vercel](https://vercel.com/)**.
2. Add your backend URL to **Environment Variables**:
   - `VITE_API_URL` = `https://mindflow-backend-tply.onrender.com`
3. Click **Deploy**.

---

## 🤝 Contributing
Contributions, 3D shader enhancements, and feature suggestions are welcome!
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/SpatialAudioNodes`)
3. Commit your Changes (`git commit -m 'feat: Add audio player node support'`)
4. Push to the Branch (`git push origin feature/SpatialAudioNodes`)
5. Open a Pull Request

---

## 📄 License
This project is open-source under the **MIT License**.

---

## 👤 Author
- **Rishi Kumar**
- GitHub: [@kumarrishi4981](https://github.com/kumarrishi4981)
- Live App: [MindFlow on Vercel](https://mindflow-frontend-bay.vercel.app/)
