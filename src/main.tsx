import { createRoot } from 'react-dom/client'
import 'reactflow/dist/style.css'
import 'katex/dist/katex.min.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <App />
)
