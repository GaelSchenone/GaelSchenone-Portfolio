import { useState, useCallback, useRef } from 'react'
import CoolTextHover from './components/CoolTextHover'
import DotGridBackground from './components/DotGridBackground'
import PixelExplosion from './components/PixelExplosion'
import './Home.css'

const TEXT = 'Gael Schenone'

function Home() {
  const explosionRef = useRef(null)
  const [hiddenChars, setHiddenChars] = useState(new Set())

  const handleCharClick = useCallback((index, data) => {
    setHiddenChars((prev) => new Set([...prev, index]))
    explosionRef.current?.addExplosion(data)
  }, [])

  const handleRestore = useCallback(() => {
    setHiddenChars(new Set())
  }, [])

  return (
    <>
      <header className="hero">
        <DotGridBackground />
        <PixelExplosion ref={explosionRef} onRestore={handleRestore} />
        <h1 className="hero-title">
          <CoolTextHover
            text={TEXT}
            fontSize="clamp(2.5rem, 15vw, 200px)"
            onCharClick={handleCharClick}
            hiddenChars={hiddenChars}
          />
        </h1>
      </header>

      <div className='projects'></div>
    </>
  )
}

export default Home
