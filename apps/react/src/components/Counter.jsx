import { useEffect, useRef } from 'react'

export default function Counter({ to = 100, suffix = '%', label }){
  const ref = useRef(null)
  useEffect(() => {
    let start
    const step = (ts) => {
      if (!start) start = ts
      const p = Math.min(1, (ts - start) / 1200)
      const val = Math.floor(to * p)
      if (ref.current) ref.current.textContent = String(val)
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [to])
  return (
    <div className="metric"><span className="num" ref={ref}></span>{suffix}<span className="label">{label}</span></div>
  )
}


