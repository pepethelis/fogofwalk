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

  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    dragging.current = true
    origin.current = { x: touch.clientX - pos.x, y: touch.clientY - pos.y }
  }

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!dragging.current) return
      setPos({ x: e.clientX - origin.current.x, y: e.clientY - origin.current.y })
    }
    const up = () => {
      dragging.current = false
    }
    const touchMove = (e: TouchEvent) => {
      if (!dragging.current) return
      const touch = e.touches[0]
      setPos({ x: touch.clientX - origin.current.x, y: touch.clientY - origin.current.y })
    }
    const touchEnd = () => {
      dragging.current = false
    }

    window.addEventListener("mousemove", move)
    window.addEventListener("mouseup", up)
    window.addEventListener("touchmove", touchMove, { passive: true })
    window.addEventListener("touchend", touchEnd)
    return () => {
      window.removeEventListener("mousemove", move)
      window.removeEventListener("mouseup", up)
      window.removeEventListener("touchmove", touchMove)
      window.removeEventListener("touchend", touchEnd)
    }
  }, [])

  return {
    style: { left: pos.x, top: pos.y } as React.CSSProperties,
    onMouseDown,
    onTouchStart,
  }
}
