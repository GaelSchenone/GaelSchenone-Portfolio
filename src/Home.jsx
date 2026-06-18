import { useState, useCallback, useRef } from 'react'
import CoolTextHover from './components/CoolTextHover'
import DotGridBackground from './components/DotGridBackground'
import PixelExplosion from './components/PixelExplosion'
import './Home.css'

const TEXT = 'Gael Schenone'

function Home() {
  const explosionRef = useRef(null)
  const [hiddenChars, setHiddenChars] = useState(new Set())
  const [waveIndices, setWaveIndices] = useState(new Set())
  const waveTimersRef = useRef([])

  const clearWave = () => {
    waveTimersRef.current.forEach(clearTimeout)
    waveTimersRef.current = []
    setWaveIndices(new Set())
  }

  const handleCharClick = useCallback((index, data) => {
    setHiddenChars((prev) => new Set([...prev, index]))
    explosionRef.current?.addExplosion(data)

    // Trigger wave: ripple through remaining chars to the right
    clearWave()
    const timers = []
    for (let j = 1; j < TEXT.length - index; j++) {
      const onTimer = setTimeout(() => {
        setWaveIndices((prev) => new Set([...prev, index + j]))
      }, j * 70)
      timers.push(onTimer)
      const offTimer = setTimeout(() => {
        setWaveIndices((prev) => {
          const next = new Set(prev)
          next.delete(index + j)
          return next
        })
      }, j * 70 + 250)
      timers.push(offTimer)
    }
    waveTimersRef.current = timers
  }, [])

  const handleRestore = useCallback(() => {
    setHiddenChars(new Set())
  }, [])

  return (
    <>
      <DotGridBackground />

      <header className="hero">
        <PixelExplosion ref={explosionRef} onRestore={handleRestore} />
        <h1 className="hero-title">
          <CoolTextHover
            text={TEXT}
            fontSize="clamp(2.5rem, 15vw, 200px)"
            onCharClick={handleCharClick}
            hiddenChars={hiddenChars}
            waveIndices={waveIndices}
          />
        </h1>
      </header>

      <div className='projects'></div>
    </>
  )
}

export default Home
