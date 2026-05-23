import { useEffect, useRef, useState } from "react"

export function useDraggable(initial: { x: number; y: number }) {
  const [pos, setPos] = useState(initial)
  const dragging = useRef(false)
  const origin = useRef({ x: 0, y: 0 })

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true
    origin.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
    e.preventDefault()
  }

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!dragging.current) return
      setPos({ x: e.clientX - origin.current.x, y: e.clientY - origin.current.y })
    }
    const up = () => {
      dragging.current = false
    }
    window.addEventListener("mousemove", move)
    window.addEventListener("mouseup", up)
    return () => {
      window.removeEventListener("mousemove", move)
      window.removeEventListener("mouseup", up)
    }
  }, [])

  return {
    style: { left: pos.x, top: pos.y } as React.CSSProperties,
    onMouseDown,
  }
}
