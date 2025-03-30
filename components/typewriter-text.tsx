"use client"

import { useState, useEffect, useRef } from "react"

interface TypewriterTextProps {
  text: string
  speed?: number
  onComplete?: () => void
  showCursor?: boolean
  pauseAt?: number[]
  pauseDuration?: number
}

export default function TypewriterText({
  text,
  speed = 100,
  onComplete,
  showCursor = true,
  pauseAt = [],
  pauseDuration = 400,
}: TypewriterTextProps) {
  const [displayText, setDisplayText] = useState("")
  const [cursorVisible, setCursorVisible] = useState(true)
  const indexRef = useRef(0)
  const isPausedRef = useRef(false)
  const completedRef = useRef(false)

  // Reset when text changes
  useEffect(() => {
    indexRef.current = 0
    completedRef.current = false
    setDisplayText("")
    return () => {
      // Cleanup
    }
  }, [text])

  // Handle cursor blinking
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setCursorVisible((prev) => !prev)
    }, 500)

    return () => clearInterval(cursorInterval)
  }, [])

  // Handle typing effect
  useEffect(() => {
    if (completedRef.current) return

    const typeNextChar = () => {
      if (indexRef.current < text.length) {
        setDisplayText(text.substring(0, indexRef.current + 1))
        indexRef.current += 1

        // Check if we need to pause at this position
        if (pauseAt.includes(indexRef.current)) {
          isPausedRef.current = true
          setTimeout(() => {
            isPausedRef.current = false
            scheduleNextChar()
          }, pauseDuration)
        } else {
          scheduleNextChar()
        }
      } else {
        // Typing complete
        completedRef.current = true
        if (onComplete) {
          onComplete()
        }
      }
    }

    const scheduleNextChar = () => {
      if (indexRef.current < text.length && !isPausedRef.current) {
        setTimeout(typeNextChar, speed)
      }
    }

    // Start typing
    if (!isPausedRef.current && !completedRef.current) {
      scheduleNextChar()
    }
  }, [text, speed, pauseAt, pauseDuration, onComplete])

  return (
    <div className="inline-block text-xl md:text-2xl">
      {displayText}
      {showCursor && cursorVisible && <span className="animate-blink">|</span>}
    </div>
  )
}

