import { useState, useEffect } from 'react'

export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  )

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint)
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [breakpoint])

  return isMobile
}
