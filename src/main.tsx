import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { StoreProvider, rootStoreInstance } from './stores'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider value={rootStoreInstance}>
      <App />
    </StoreProvider>
  </StrictMode>,
)
