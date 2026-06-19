export default function DotGridBackground() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.25) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }}
    />
  )
}
