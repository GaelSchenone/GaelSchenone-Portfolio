import { useEffect, useRef, useState } from "react";

const SCALE = 1.5;
const HOVER_WEIGHT = 800;
const BASE_WEIGHT = 500;

const CoolTextHover = ({
  text = "Gael Schenone",
  fontSize = "clamp(2rem, 10vw, 100px)",
  color = "inherit",
  onCharClick,
  hiddenChars = new Set(),
  waveIndices = new Set(),
}) => {
  const chars = [...text];
  const refs = useRef([]);
  const widthsRef = useRef({ base: [], hover: [] });
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [, forceRender] = useState(0);

  useEffect(() => {
    document.fonts.ready.then(() => {
      const base = [];
      const hover = [];

      refs.current.forEach((el) => {
        if (!el) return;
        const prevTransform = el.style.transform;
        const prevWeight = el.style.fontWeight;

        el.style.transform = "none";

        el.style.fontWeight = String(BASE_WEIGHT);
        base.push(el.getBoundingClientRect().width);

        el.style.fontWeight = String(HOVER_WEIGHT);
        hover.push(el.getBoundingClientRect().width);

        el.style.fontWeight = prevWeight;
        el.style.transform = prevTransform;
      });

      widthsRef.current = { base, hover };
      forceRender((n) => n + 1);
    });
  }, [text]);

  const getPushAmount = (i) => {
    const base = widthsRef.current.base[i] ?? 0;
    const hover = widthsRef.current.hover[i] ?? base;
    return Math.max(Math.ceil(hover * SCALE - base), 0);
  };

  const pushAmount = hoveredIndex !== null ? getPushAmount(hoveredIndex) : 0;

  // Touch: use the first char under the touch point
  const onTouchStart = (e) => {
    const t = e.changedTouches[0]
    if (!t) return
    // Find which span is under the touch
    for (let i = 0; i < refs.current.length; i++) {
      const el = refs.current[i]
      if (!el || hiddenChars.has(i)) continue
      const r = el.getBoundingClientRect()
      if (t.clientX >= r.left && t.clientX <= r.right &&
          t.clientY >= r.top && t.clientY <= r.bottom) {
        setHoveredIndex(i)
        return
      }
    }
  }

  const onTouchEnd = () => {
    setHoveredIndex(null)
  }

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Rethink+Sans:ital,wght@0,400..800;1,400..800&display=swap');`}</style>
      <h1
        data-cooltext
        onMouseLeave={() => setHoveredIndex(null)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{
          fontFamily: '"Rethink Sans", sans-serif',
          fontSize,
          fontWeight: BASE_WEIGHT,
          margin: 0,
          padding: 0,
          display: "flex",
          color,
          lineHeight: 1.2,
        }}
      >
        {chars.map((char, i) => {
          const isActive = i === hoveredIndex;
          const isWave = waveIndices.has(i);
          const isHidden = hiddenChars.has(i);
          const parts = [];

          if (hoveredIndex !== null && i > hoveredIndex) {
            parts.push(`translateX(${pushAmount}px)`);
          }
          if (isActive || isWave) {
            parts.push(`scaleX(${SCALE})`);
          }

          return (
            <span
              key={i}
              ref={(el) => (refs.current[i] = el)}
              onMouseEnter={() => setHoveredIndex(i)}
              onClick={() => {
                const el = refs.current[i]
                if (!el || char === ' ') return
                const style = getComputedStyle(el)
                const r = el.getBoundingClientRect()
                onCharClick?.(i, {
                  char,
                  rect: { left: r.left, top: r.top, width: r.width, height: r.height },
                  fontFamily: style.fontFamily,
                  fontSize: style.fontSize,
                  fontWeight: style.fontWeight,
                  color: style.color,
                  scaleX: isActive ? SCALE : 1,
                })
              }}
              style={{
                display: "inline-block",
                transformOrigin: "left center",
                fontWeight: (isActive || isWave) ? HOVER_WEIGHT : BASE_WEIGHT,
                transform: parts.length ? parts.join(" ") : "none",
                transition: "transform 220ms ease, font-weight 220ms ease, opacity 400ms ease",
                cursor: "pointer",
                userSelect: "none",
                visibility: isHidden ? "hidden" : "visible",
                pointerEvents: isHidden ? "none" : "auto",
                opacity: isHidden ? 0 : 1,
              }}
            >
              {char === " " ? "‎ ‎" : char}
            </span>
          );
        })}
      </h1>
    </>
  );
};

export default CoolTextHover;
