import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'

const PIXEL_SIZE = 10
const DAMPING = 0.94
const WALL_BOUNCE = 0.3
const MOUSE_RADIUS = 25
const MOUSE_FORCE = 6
const CLICK_FORCE = 14
const Y_OFFSET = 17
const RESTORE_DELAY = 5000
const GRAVITY = 0.08

function sampleCharParticles(data, offsetX = 0, offsetY = 0) {
  const { char, rect, fontFamily, fontSize, fontWeight, color, scaleX } = data
  const s = PIXEL_SIZE

  const off = document.createElement('canvas')
  off.width = Math.ceil(rect.width)
  off.height = Math.ceil(rect.height)
  const ctx = off.getContext('2d')

  ctx.font = `${fontWeight} ${fontSize} ${fontFamily}`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillStyle = color

  const fontSizePx = parseFloat(fontSize)
  const lineHeightPx = rect.height
  const leading = (lineHeightPx - fontSizePx) / 2

  if (scaleX && scaleX !== 1) {
    ctx.save()
    ctx.scale(scaleX, 1)
    ctx.fillText(char, 0, leading)
    ctx.restore()
  } else {
    ctx.fillText(char, 0, leading)
  }

  const imgData = ctx.getImageData(0, 0, off.width, off.height)
  const dataArr = imgData.data
  const imgW = imgData.width
  const imgH = imgData.height

  const cols = Math.ceil(imgW / s)
  const rows = Math.ceil(imgH / s)
  const particles = []

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const sx = Math.min(Math.floor((c + 0.5) * s), imgW - 1)
      const sy = Math.min(Math.floor((r + 0.5) * s), imgH - 1)
      const idx = (sy * imgW + sx) * 4
      const alpha = dataArr[idx + 3]

      if (alpha > 40) {
        particles.push({
          x: rect.left + sx - offsetX,
          y: rect.top + sy + Y_OFFSET - offsetY,
          vx: 0,
          vy: 0,
          rotation: 0,
          angularV: 0,
          size: s,
          a: 1,
          color,
        })
      }
    }
  }

  return particles
}

const PixelExplosion = forwardRef(({ onRestore }, ref) => {
  const canvasRef = useRef(null)
  const particlesRef = useRef([])
  const mouseRef = useRef({ x: -9999, y: -9999 })
  const clickImpulseRef = useRef(null)
  const animIdRef = useRef(null)
  const hasParticlesRef = useRef(false)
  const restoreTimerRef = useRef(null)
  const lastActivityRef = useRef(0)
  const onRestoreRef = useRef(onRestore)

  useEffect(() => {
    onRestoreRef.current = onRestore
  })

  const startRestoreTimer = () => {
    if (restoreTimerRef.current) clearTimeout(restoreTimerRef.current)
    restoreTimerRef.current = setTimeout(() => {
      onRestoreRef.current?.()
      restoreTimerRef.current = null
    }, RESTORE_DELAY)
  }

  useImperativeHandle(ref, () => ({
    addExplosion(data) {
      if (restoreTimerRef.current) {
        clearTimeout(restoreTimerRef.current)
        restoreTimerRef.current = null
      }
      const hero = canvasRef.current?.parentElement
      const heroRect = hero?.getBoundingClientRect() ?? { left: 0, top: 0 }
      const newParticles = sampleCharParticles(data, heroRect.left, heroRect.top)
      if (newParticles.length === 0) return
      particlesRef.current.push(...newParticles)
      hasParticlesRef.current = true
    },
    clear() {
      particlesRef.current = []
      hasParticlesRef.current = false
      startRestoreTimer()
    },
  }))

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let W, H

    function getContainerOffset() {
      const r = canvas.parentElement.getBoundingClientRect()
      return { left: r.left, top: r.top }
    }

    function resize() {
      const p = canvas.parentElement
      W = p.clientWidth
      H = p.clientHeight
      canvas.width = W
      canvas.height = H
    }
    resize()
    window.addEventListener('resize', resize)

    const onMouse = (e) => {
      const off = getContainerOffset()
      mouseRef.current = { x: e.clientX - off.left, y: e.clientY - off.top }
    }
    const onTouch = (e) => {
      const t = e.touches[0]
      if (t) {
        const off = getContainerOffset()
        mouseRef.current = { x: t.clientX - off.left, y: t.clientY - off.top }
      }
    }

    const onClick = (e) => {
      if (!hasParticlesRef.current) return
      if (e.target.closest('[data-cooltext]')) return
      const off = getContainerOffset()
      clickImpulseRef.current = { x: e.clientX - off.left, y: e.clientY - off.top }
    }

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        particlesRef.current = []
        hasParticlesRef.current = false
        startRestoreTimer()
      }
    }

    window.addEventListener('mousemove', onMouse)
    window.addEventListener('touchmove', onTouch, { passive: true })
    window.addEventListener('touchstart', onTouch, { passive: true })
    window.addEventListener('click', onClick)
    window.addEventListener('keydown', onKeyDown)

    function loop() {
      ctx.clearRect(0, 0, W, H)

      const mx = mouseRef.current.x
      const my = mouseRef.current.y
      const impulse = clickImpulseRef.current
      clickImpulseRef.current = null
      const particles = particlesRef.current

      if (particles.length === 0) {
        animIdRef.current = requestAnimationFrame(loop)
        return
      }

      for (const p of particles) {
        const dx = p.x - mx
        const dy = p.y - my
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < MOUSE_RADIUS && dist > 0.5) {
          const force = MOUSE_FORCE * (1 - dist / MOUSE_RADIUS)
          p.vx += (dx / dist) * force
          p.vy += (dy / dist) * force
          p.angularV += (Math.random() - 0.5) * 0.08
          lastActivityRef.current = performance.now()
        }

        if (impulse) {
          const cdx = p.x - impulse.x
          const cdy = p.y - impulse.y
          const cdist = Math.sqrt(cdx * cdx + cdy * cdy)
          if (cdist < MOUSE_RADIUS && cdist > 0.5) {
            const force = CLICK_FORCE * (1 - cdist / MOUSE_RADIUS)
            p.vx += (cdx / cdist) * force
            p.vy += (cdy / cdist) * force
            p.angularV += (Math.random() - 0.5) * 0.25
            lastActivityRef.current = performance.now()
          }
        }

        // Soft gravity
        p.vy += GRAVITY

        p.vx *= DAMPING
        p.vy *= DAMPING
        p.angularV *= 0.96

        p.x += p.vx
        p.y += p.vy
        p.rotation += p.angularV

        let bounced = false
        if (p.x < 0) { p.x = 0; p.vx *= -WALL_BOUNCE; bounced = true }
        if (p.x > W) { p.x = W; p.vx *= -WALL_BOUNCE; bounced = true }
        if (p.y < 0) { p.y = 0; p.vy *= -WALL_BOUNCE; bounced = true }
        if (p.y > H) { p.y = H; p.vy *= -WALL_BOUNCE; bounced = true }
        if (bounced) p.angularV += (Math.random() - 0.5) * 0.2

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        const hs = p.size / 2
        // shadow
        ctx.fillStyle = `rgba${p.color.slice(3, -1)}, 0.35)`
        ctx.fillRect(-hs + 1.5, -hs + 1.5, p.size, p.size)
        // main cube
        ctx.fillStyle = p.color
        ctx.fillRect(-hs, -hs, p.size, p.size)
        ctx.restore()
      }

      // Auto-restore if idle for RESTORE_DELAY
      if (!restoreTimerRef.current &&
          performance.now() - lastActivityRef.current > RESTORE_DELAY) {
        restoreTimerRef.current = setTimeout(() => {
          onRestoreRef.current?.()
          particlesRef.current = []
          hasParticlesRef.current = false
          restoreTimerRef.current = null
        }, 500)
      }

      ctx.beginPath()
      ctx.arc(mx, my, MOUSE_RADIUS, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)'
      ctx.lineWidth = 1
      ctx.stroke()

      animIdRef.current = requestAnimationFrame(loop)
    }

    animIdRef.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(animIdRef.current)
      if (restoreTimerRef.current) clearTimeout(restoreTimerRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('touchmove', onTouch)
      window.removeEventListener('touchstart', onTouch)
      window.removeEventListener('click', onClick)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 100,
        pointerEvents: 'none',
        touchAction: 'none',
      }}
    />
  )
})

export default PixelExplosion
