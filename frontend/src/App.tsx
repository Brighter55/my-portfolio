import { Header } from '@/components/site/header'
import { Hero } from '@/components/site/hero'
import { Projects } from '@/components/site/projects'
import { Contact } from '@/components/site/contact'
import { Footer } from '@/components/site/footer'

function App() {
  return (
    <div id="top" className="flex min-h-dvh flex-col bg-canvas text-ink">
      <Header />
      <main className="flex-1">
        <Hero />
        <Projects />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}

export default App
