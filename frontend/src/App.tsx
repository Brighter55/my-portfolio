import { useEffect } from 'react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import { routePaths } from '@/data/content'
import { HomePage } from '@/pages/home'
import NotificationDemoPage from '@/pages/notification-demo'

/**
 * After a route change, jump to the hashed section (used by the demo
 * masthead's "/#projects" back link) or reset to the top.
 *
 * Plain "#about" anchor clicks on the home route never change the router
 * location, so they keep their native jump behavior — no handling needed.
 */
function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1))
      if (target) {
        target.scrollIntoView()
        return
      }
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

function App() {
  return (
    <BrowserRouter>
      <ScrollManager />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path={routePaths.notificationDemo}
          element={<NotificationDemoPage />}
        />
        {/* Unknown URLs quietly land on the home page (a 404 page can come later). */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
