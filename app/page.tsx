"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Lightbulb } from "lucide-react"
import { motion } from "framer-motion"

export default function Home() {
  const [text, setText] = useState("")
  const [cursorVisible, setCursorVisible] = useState(true)
  const [section, setSection] = useState(0)
  const [step, setStep] = useState(1)
  const [playbackRate, setPlaybackRate] = useState(1) 
  const [showLink, setShowLink] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [showImage, setShowImage] = useState(false)
  const [factIndex, setFactIndex] = useState(0)
  const [randomFact, setRandomFact] = useState("")
  const [showRandomFact, setShowRandomFact] = useState(false)
  const typingRef = useRef(null)
  const typingIndexRef = useRef(0)
  const audioRef = useRef(null)
  const soundTimeoutRef = useRef(null)
  const timeoutsRef = useRef([])
  const bgAudioRef = useRef<HTMLAudioElement | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [volume, setVolume] = useState(0.5)

  const startPresentation = () => {
    setSection(1)
    setStep(1)
  
    const audio = bgAudioRef.current
    if (audio) {
      audio.volume = volume
      audio.play().catch((e) => {
        console.warn("Audio play error after user interaction", e)
      })
    }
  }

  const randomFacts = [
    "I once barbell squatted 475 pounds. That's like lifting two full-grown pandas. Not sure why you'd ever need to, but still—pandas beware.",
    "I lived in Korea for six months and can hold my own in Korean. I've ordered food, made friends, and confused taxi drivers—all in a second language.", 
    "My mom and I can’t seem to cross paths in the kitchen on a Sunday without falling into a thoughtful chat about life, growth, and everything in between.",
    "I used to be a competitive goalkeeper—and honestly, I still am. There's something about commanding the chaos that probably bleeds into how I see the world.",
    "I have a brother who's three years older—and three years faster to every milestone growing up. Watching him chase big things made me want to sprint too.",
    "I completed a triathlon, but couldn't swim 25 metres without gasping when I started. My cardio said no. My ego said go.",
    "I'm obsessed with philosophy and the mind—especially where they overlap. Why we think what we think is the biggest mystery I never get tired of poking at.",
    "Curiosity might've killed the cat, but it made me a product manager. I ask a lot of questions. Sometimes even good ones.",
  ]

  type ScriptStep = {
    text: string;
    speed: number;
    delay: number;
    showImage: boolean;
    imagePath: string;
    imageAlt: string;
    nextStep?: number;
    nextSection?: number;
    link?: string;
    isButton?: boolean;
    showCTA?: boolean;
    title?: string;
    audioPath?: string;
    audioStart?: number; // in seconds
    audioEnd?: number;   // in seconds
  };
  
  // Cursor blinking effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible((prev) => !prev)
    }, 500)

    return () => clearInterval(interval)
  }, [])

  // 🔁 Handle audio playback when section or step changes
  useEffect(() => {
    if (section === 0) return // 🔒 prevent any audio before user starts
  
    const script = getScriptForSection(section, step)
    const audio = bgAudioRef.current
    if (!script || !audio || script.audioStart == null || script.audioEnd == null) return
  
    audio.currentTime = script.audioStart
    audio.volume = volume
  
    const stopAudio = () => {
      if (audio.currentTime >= script.audioEnd) {
        audio.pause()
        audio.removeEventListener("timeupdate", stopAudio)
      }
    }
  
    audio.addEventListener("timeupdate", stopAudio)
  
    if (!isPaused) {
      audio.play().catch((e) => console.warn("Audio play error", e))
    }
  
    return () => {
      audio.pause()
      audio.removeEventListener("timeupdate", stopAudio)
    }
  }, [section, step])

// 🔊 Update volume when slider changes
useEffect(() => {
  const audio = bgAudioRef.current
  if (audio) {
      audio.playbackRate = playbackRate
    audio.volume = volume
  }
}, [volume])
  
//   useEffect(() => {
//   if (script.audioPath && audioRef.current) {
//     const audio = audioRef.current

//     audio.src = script.audioPath
//     audio.currentTime = script.audioStart ?? 0
//     audio.volume = 0.6

//     const onTimeUpdate = () => {
//       if (script.audioEnd && audio.currentTime >= script.audioEnd) {
//         audio.pause()
//         audio.removeEventListener("timeupdate", onTimeUpdate)
//       }
//     }

//     audio.addEventListener("timeupdate", onTimeUpdate)
//     audio.play().catch((e) => console.warn("Audio play error", e))

//     return () => {
//       audio.removeEventListener("timeupdate", onTimeUpdate)
//       audio.pause()
//     }
//   }
// }, [section, step])
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Skip to next section/step with right arrow
      if (e.key === "ArrowRight") {
        e.preventDefault()
        if (!isTyping) {
          progressToNext()
        } else {
          // If typing, complete current text immediately
          completeCurrentText()
        }
      }

      // Go back with left arrow or backspace
      if (e.key === "ArrowLeft" || e.key === "Backspace") {
        e.preventDefault()
        goToPrevious()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isTyping, section, step])

  // Clear all timeouts
  const clearAllTimeouts = () => {
    if (typingRef.current) {
      clearTimeout(typingRef.current)
    }

    if (soundTimeoutRef.current) {
      clearTimeout(soundTimeoutRef.current)
    }

    // Clear any other timeouts
    timeoutsRef.current.forEach((timeout) => clearTimeout(timeout))
    timeoutsRef.current = []
  }

  // Complete current text immediately
  const completeCurrentText = () => {
    clearAllTimeouts()
    const script = getScriptForSection(section, step)
    if (script) {
      typingIndexRef.current = script.text.length // ✅ prevents retrigger on resume
      setText(script.text)
      setIsTyping(false)
  
      if (script.link) setShowLink(true)
      if (script.showImage) setShowImage(true)
    }
  }

  // Navigate to specific section
  const goToSection = (sectionNumber) => {
    setSection(sectionNumber)
    setStep(1)
  }

  // Progress to next section/step
  const progressToNext = () => {
    const script = getScriptForSection(section, step)

    if (script) {
      if (script.nextSection) {
        setSection(script.nextSection)
        setStep(1)
      } else if (script.nextStep) {
        setStep(script.nextStep)
      } else if (section === 5 && step === 2) {
        // Do nothing, we're at the end
      } else if (section === 6) {
        if (step < 5) {
          // Updated to include all steps in section 6
          setStep(step + 1)
        } else {
          setSection(7)
          setStep(1)
        }
      } else {
        // Default progression
        if (step < getMaxStepsForSection(section)) {
          setStep(step + 1)
        } else {
          setSection(section + 1)
          setStep(1)
        }
      }
    }
  }

  // Get max steps for a section
  const getMaxStepsForSection = (section) => {
    if (section === 1) return 8
    if (section === 2) return 14
    if (section === 3) return 5
    if (section === 4) return 4
    if (section === 5) return 2
    return 10 // Default
  }

  // Go to previous section/step
  const goToPrevious = () => {
    if (section === 1 && step === 1) {
      return // Already at the beginning
    }

    if (step > 1) {
      setStep(step - 1)
    } else {
      // Go to previous section, last step
      const prevSection = section - 1
      setSection(prevSection)
      setStep(getMaxStepsForSection(prevSection))
    }
  }

  // Play typing sound
  const playTypingSound = () => {
    if (audioRef.current) {
      // Clone and play to allow overlapping sounds
      const sound = audioRef.current.cloneNode()
      sound.volume = 0.2 // Keep it subtle
      sound.play().catch((e) => console.log("Audio play error:", e))
    }
  }

  // Show next fact
  const showNextFactHandler = () => {
    // Don't hide existing fact, just fade to the next one
    setRandomFact(randomFacts[factIndex])
    setFactIndex((prevIndex) => (prevIndex + 1) % randomFacts.length)
    setShowRandomFact(true)
  }
  
  // Script progression
  useEffect(() => {
    console.log(`Current section: ${section}, step: ${step}`)

    // Clear any existing operations
    clearAllTimeouts()

    // Reset states
    setText("")
    setShowLink(false)
    setShowImage(false)
    setShowRandomFact(false)

    // Initial cursor-only state
    if (section === 1 && step === 1) {
      // Move to next step after delay
      const timer = setTimeout(() => {
        setStep(2)
      }, 200)

      timeoutsRef.current.push(timer)
      return () => clearTimeout(timer)
    }

    // Handle all other sections and steps
    const script = getScriptForSection(section, step)
    if (script) {
      setIsTyping(true)

      typingIndexRef.current = 0
      const typeText = () => {
        if (isPaused) {
          typingRef.current = setTimeout(typeText, 200)
          timeoutsRef.current.push(typingRef.current)
          return
        }

        if (typingIndexRef.current < script.text.length) {
          setText(script.text.substring(0, typingIndexRef.current + 1))
          playTypingSound()
          typingIndexRef.current++
          
          // Use a faster typing speed (40% of original for work section, 50% for others)
          const typingSpeed = Math.max(15, script.speed * (section === 2 ? 0.4 : 0.5))
          typingRef.current = setTimeout(typeText, typingSpeed)
          timeoutsRef.current.push(typingRef.current)
        } else {
          setIsTyping(false)

          // Show link if needed
          if (script.link) {
            setShowLink(true)
          }

          // Show image if needed
          if (script.showImage) {
            setShowImage(true)
          }

          // Move to next section/step after delay
          const timer = setTimeout(() => {
            if (script.nextSection) {
              setSection(script.nextSection)
              setStep(1)
            } else if (script.nextStep) {
              setStep(script.nextStep)
            }
          }, script.delay)

          timeoutsRef.current.push(timer)
          return () => clearTimeout(timer)
        }
      }

      // Start typing
      typeText()
    }

    return () => {
      clearAllTimeouts()
    }
  }, [section, step])

  // Format text with bold keywords and inline icons
  const formatTextWithBold = (text) => {
    if (!text) return ""

    // Keywords to bold
    const keywords = [
      "Product Manager",
      "Autonomics",
      "LLM-powered",
      "autonomous finance assistant",
      "Founding Product Manager",
      "ElectrifiedGrid",
      "Scale AI",
      "strategic forecasting",
      "product board",
      "data architecture",
      "classification",
      "forecasting",
      "risk scoring",
      "optimization",
      "Product",
      "finance",
      "roadmap",
      "agentic AI",
    ]

    let formattedText = text

    // Replace keywords with bold versions, but only when they are whole words
    keywords.forEach((keyword) => {
      const regex = new RegExp(`\\b(${keyword})\\b`, "gi")
      formattedText = formattedText.replace(regex, "<strong>$1</strong>")
    })

    // Add inline icons
    if (text.includes("writing")) {
      formattedText = formattedText.replace(/writing/g, 'writing <span class="inline-icon">✍️</span>')
    }

    if (text.includes("finance")) {
      formattedText = formattedText.replace(/finance/g, 'finance <span class="inline-icon">💰</span>')
    }

    if (text.includes("AI")) {
      formattedText = formattedText.replace(/\bAI\b/g, 'AI <span class="inline-icon">🤖</span>')
    }

    if (text.includes("roadmap")) {
      formattedText = formattedText.replace(/roadmap/g, 'roadmap <span class="inline-icon">🗺️</span>')
    }

    if (text.includes("product")) {
      formattedText = formattedText.replace(/product/gi, '<span class="inline-icon">📦</span> product')
    }

    if (text.includes("team")) {
      formattedText = formattedText.replace(/team/g, 'team <span class="inline-icon">👥</span>')
    }

    if (text.includes("philosophy")) {
      formattedText = formattedText.replace(/philosophy/g, 'philosophy <span class="inline-icon">🧠</span>')
    }

    if (text.includes("science")) {
      formattedText = formattedText.replace(/science/g, 'science <span class="inline-icon">🔬</span>')
    }

    return formattedText
  }

  // Get script content for current section and step
  const getScriptForSection = (section: number, step: number): ScriptStep | null => {
    // SECTION 1: Intro
    if (section === 1) {
      if (step === 1) {
        return {
          text: "",
          speed: 60,
          delay: 50,
          nextStep: 2,
          showImage: false,
          imagePath: "/Slide 1.png",
          imageAlt: "Welcome",
          audioPath: "/audio.wav",
        }
      } else if (step === 2) {
        return {
          text: "Hey. You're early. Or I'm late. Either way—welcome.",
          speed: 140,
          delay: 2000,
          nextStep: 3,
          showImage: true,
          imagePath: "/Slide 1.png",
          imageAlt: "Welcome",
          audioPath: "/audio.wav",
          audioStart: 0,
          audioEnd: 5,
        }
      } else if (step === 3) {
        return {
          text: "You might be looking for Tom Brady...",
          speed: 60,
          delay: 2000,
          nextStep: 4,
          showImage: true,
          imagePath: "/Slide 2.png",
          imageAlt: "Tom Brady",
          audioStart: 6,
          audioEnd: 8.5,
        }
      } else if (step === 4) {
        return {
          text: "Or Wayne Brady? The Brady Bunch?",
          speed: 90,
          delay: 2000,
          nextStep: 5,
          showImage: true,
          imagePath: "/Slide 3.png",
          imageAlt: "Wayne Brady",
          audioStart: 8.5,
          audioEnd: 12,
        }
      } else if (step === 5) {
        return {
          text: "Wrong Brady? I get it... Common mix-up.",
          speed: 75,
          delay: 3000,
          nextStep: 6,
          showImage: false,
          imagePath: "/Slide 4.png",
          imageAlt: "Brady Bunch",
          audioStart: 12,
          audioEnd: 14.5,
        }
      } else if (step === 6) {
        return {
          text: "Although... if you're still reading, you just might be here for this Brady.",
          speed: 90,
          delay: 3000,
          nextStep: 7,
          showImage: true,
          imagePath: "/Slide 4.png",
          imageAlt: "Anthony Brady",
          audioStart: 15,
          audioEnd: 20,
        }
      } else if (step === 7) {
        return {
          text: "This Brady builds things. Specifically—products.",
          speed: 100,
          delay: 1500,
          nextStep: 8,
          showImage: true,
          imagePath: "/slide 5.png",
          imageAlt: "Product Building",
          audioStart: 20.5,
          audioEnd: 24,
        }
      } else if (step === 8) {
        return {
          text: "Let me show you what I've been working on.",
          speed: 60,
          delay: 3000,
          nextSection: 2,
          showImage: true,
          imagePath: "/slide 6.png",
          imageAlt: "Portfolio",
          audioStart: 24,
          audioEnd: 26,
        }
      }
    }

    // SECTION 2: Work Experience
    else if (section === 2) {
      if (step === 1) {
        return {
          text: "",
          speed: 0,
          delay: 10,
          nextStep: 2,
          showImage: true,
          imagePath: "",
          imageAlt: "Autonomics Logo",
        }
      } else if (step === 2) {
        return {
          text: "What began as an effort to automate labor-intensive microservices—like accelerating SKU reviews or benchmarking performance through generative AI—has evolved into something far more ambitious.",
          speed: 100,
          delay: 4000,
          nextStep: 3,
          showImage: true,
          imagePath: "/slide 7.png",
          imageAlt: "Automation Concept",
          audioStart: 27.5,
          audioEnd: 39,
        }
      } else if (step === 3) {
        return {
          text: "We're building an autonomous finance assistant. Today, it's LLM-powered ingestion and reconciliation. Tomorrow, it's proactive, always-on financial workflow management—with minimal human intervention.",
          speed: 150,
          delay: 2000,
          nextStep: 4,
          showImage: true,
          imagePath: "/slide 8.png",
          imageAlt: "Finance Assistant",
          audioStart: 196,
          audioEnd: 210,
        }
      } else if (step === 4) {
        return {
          text: "I'm the only PM and Founding Product Manager on a 9-person team, reporting directly to the Equity Partner sponsor and Director of Product. That means wearing a lot of hats and making fast, focused calls.",
          speed: 150,
          delay: 1000,
          nextStep: 5,
          showImage: true,
          imagePath: "/slide 9.png",
          imageAlt: "Product Manager Role",
          audioStart: 40,
          audioEnd: 51.5,
        }
      } else if (step === 5) {
        return {
          text: "Sometimes, that means circumventing the ideal in favor of the practical—using Replit prototypes to get something tangible in front of users fast.",
          speed: 130,
          delay: 2000,
          nextStep: 6,
          showImage: true,
          imagePath: "/slide 31.png",
          imageAlt: "Replit Prototype",
          audioStart: 52,
          audioEnd: 62,
        }
      } else if (step === 6) {
        return {
          text: "We're still early—interviewing CFOs, founders, bookkeepers, and finance professionals to deeply understand where the real friction lies.",
          speed: 120,
          delay: 3000,
          nextStep: 7,
          showImage: true,
          imagePath: "/slide 10.png",
          imageAlt: "User Interviews",
          audioStart: 63,
          audioEnd: 71,
        }
      } else if (step === 7) {
        return {
          text: "Our roadmap is starting to take shape, and we're watching closely where agentic AI is going—trying to stay in the ring long enough to ship something that truly changes how finance works.",
          speed: 120,
          delay: 3000,
          nextStep: 8,
          showImage: true,
          imagePath: "/slide 11.png",
          imageAlt: "Product Roadmap",
          audioStart: 71,
          audioEnd: 81,
        }
      } else if (step === 8) {
        return {
          text: "Before Autonomics, I joined the ElectrifiedGrid team—my first product experience, and a much larger, cross-functional environment.",
          speed: 100,
          delay: 3000,
          nextStep: 9,
          showImage: false,
          imagePath: "/slide 13.png",
          imageAlt: "ElectrifiedGrid Logo",
          audioStart: 81.5,
          audioEnd: 89,
        }
      } else if (step === 9) {
        return {
          text: "ElectrifiedGrid is a strategic load forecasting tool that empowers utilites and government to energy transition with confidence.",
          speed: 130,
          delay: 2000,
          nextStep: 10,
          showImage: true,
          imagePath: "/slide 13.png",
          imageAlt: "Strategic Forecasting",
          audioStart: 89,
          audioEnd: 97,
        }
      } else if (step === 10) {
        return {
          text: "I helped run our early product board sessions—watching senior PMs in action, interviewing internal SMEs, shaping our impact-effort matrix, and co-leading prioritization sessions that got us to our first roadmap.",
          speed: 140,
          delay: 2000,
          nextStep: 11,
          showImage: true,
          imagePath: "/slide 14.png",
          imageAlt: "Product Board",
          audioStart: 97.5,
          audioEnd: 110,
        }
      } else if (step === 11) {
        return {
          text: "This experience gave me a strong foundation I lean on now, especially in a role with far less built-in guidance.",
          speed: 125,
          delay: 2000,
          nextStep: 12,
          showImage: true,
          imagePath: "/slide 15.png",
          imageAlt: "Foundation",
          audioStart: 110,
          audioEnd: 117,
        }
      } else if (step === 12) {
        return {
          text: "One of my most rewarding projects was leading a Scale AI grant application with a utility partner—a deep dive into how AI could transform distribution-level planning.",
          speed: 130,
          delay: 3000,
          nextStep: 13,
          showImage: true,
          imagePath: "/slide 16.png",
          imageAlt: "Scale AI Logo",
          audioStart: 117,
          audioEnd: 127,
        }
      } else if (step === 13) {
        return {
          text: "I built detailed data architecture diagrams to show how telemetry, DERs, and environmental signals could feed into intelligent grid decisions.",
          speed: 120,
          delay: 3000,
          nextStep: 14,
          showImage: true,
          imagePath: "/slide 17.png",
          imageAlt: "Data Architecture",
          audioStart: 127,
          audioEnd: 136,
        }
      } else if (step === 14) {
        return {
          text: "We matched specific models to components—classification, forecasting, risk scoring, and optimization—to illustrate feasibility and impact.",
          speed: 145,
          delay: 3000,
          nextSection: 3,
          showImage: true,
          imagePath: "/slide 18.png",
          imageAlt: "AI Models",
          audioStart: 137,
          audioEnd: 146.5,
        }
      }
    }

    // SECTION 3: Early Career
    else if (section === 3) {
      if (step === 1) {
        return {
          text: "",
          speed: 0,
          delay: 10,
          nextStep: 2,
          showImage: true,
          imagePath: "/early-career.jpg",
          imageAlt: "Early Career",
          
        }
      } else if (step === 2) {
        return {
          text: "Earlier in my career, I worked across a diverse set of industries: a communications agency, post-secondary institutions, a research hospital, my own company, and a startup in Korea.",
          speed: 110,
          delay: 2000,
          nextStep: 3,
          showImage: true,
          imagePath: "/slide 19.png",
          imageAlt: "Probit Global",
          audioStart: 147,
          audioEnd: 157,
        }
      } else if (step === 3) {
        return {
          text: "Throughout it all, I developed a passion for writing. It's something I still maintain (and you'll see some of that soon).",
          speed: 100,
          delay: 2000,
          nextStep: 4,
          showImage: true,
          imagePath: "/slide 20.png",
          imageAlt: "Humber College",
          audioStart: 157,
          audioEnd: 164,
        }
      } else if (step === 4) {
        return {
          text: "Eventually, I realized I didn't just want to observe and communicate change—I wanted to be a part of creating it.",
          speed: 120,
          delay: 2000,
          nextStep: 5,
          showImage: true,
          imagePath: "/slide 21.png",
          imageAlt: "Unity Health",
          audioStart: 164.5,
          audioEnd: 171,
        }
      } else if (step === 5) {
        return {
          text: "So I pivoted—from PR and communications into consulting, and then into product management (although this took some effort).",
          speed: 110,
          delay: 2000,
          nextSection: 4,
          showImage: true,
          imagePath: "/slide 22.png",
          imageAlt: "Career Pivot",
          audioStart: 172,
          audioEnd: 179,
        }
      }
    }

    // SECTION 4: CREATIVE TRANSITION
    else if (section === 4) {
      if (step === 1) {
        return {
          text: "If you're curious about what lives beneath the suit...",
          speed: 65,
          delay: 1000,
          nextStep: 2,
          showImage: true,
          imagePath: "/slide 24.png",
          imageAlt: "Writing Sample",
          audioStart: 182,
          audioEnd: 184.5,
        }
      } else if (step === 2) {
        return {
          text: "Think philosophy meets science.",
          speed: 150,
          delay: 1000,
          nextStep: 3,
          showImage: true,
          imagePath: "/slide 29.png",
          imageAlt: "Philosophy meets Science",
          audioStart: 184.5,
          audioEnd: 187,
        }
      } else if (step === 3) {
        return {
          text: "Take a peek beneath Brady.",
          speed: 65,
          delay: 5000,
          nextSection: 5,
          link: "https://beneathbrady.substack.com",
          isButton: true,
          showImage: true,
          imagePath: "/slide 25.png",
          imageAlt: "Substack",
          audioStart: 187,
          audioEnd: 189,
        }
      }
    }

    // SECTION 5: CTA
    else if (section === 5) {
      if (step === 1) {
        return {
          text: "Still here? Let's chat.",
          speed: 130,
          delay: 2000,
          nextStep: 2,
          showImage: false,
          imagePath: "/slide 26.png",
          imageAlt: "Let's Chat",
          audioStart: 189,
          audioEnd: 191,
        }
      } else if (step === 2) {
        return {
          text: "No pressure. Just good conversation and better ideas.",
          speed: 100,
          delay: 2000,
          showCTA: true,
          showImage: true,
          imagePath: "/slide 27.png",
          imageAlt: "Conversation",
          audioStart: 191,
          audioEnd: 196,
        }
      }
    }

    return null
  }

  // Get current script
  const currentScript = getScriptForSection(section, step)

  const renderStartScreen = () => {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white text-center animate-fade-in z-50">
        <div>
          <h1 className="text-4xl font-bold mb-4">Welcome to My Interactive Story</h1>
          <button
            onClick={startPresentation}
            className="bg-black text-white px-6 py-3 rounded-xl text-xl hover:bg-gray-800 transition-all"
          >
            Begin
          </button>
        </div>
      </div>
    )
  }

  // Render content based on current section and step
  const renderContent = () => {
    // For section 1 step 1, just show blinking cursor
    if (section === 0) {
      return renderStartScreen()
    }
    
    if (section === 1 && step === 1) {
      return <div className="text-2xl cursor-element animate-fade-in-scale">{cursorVisible ? "|" : " "}</div>
    }

    // For all other sections
    const script = getScriptForSection(section, step)

    // Career Journey sections (6.1, 6.2, 6.3, 6.4, 6.5)
    if (section === 6) {
      return (
        <div className="max-w-[880px] mx-auto">
          {script.title && (
            <h2 className="text-3xl font-bold mb-6 font-sans text-accent-blue">{script.title}</h2>
          )}

          <div className={`grid grid-cols-1 ${script.showImage ? "md:grid-cols-2" : ""} gap-8`}>
            <div className="space-y-4">
              {script.text.split("\n\n").map((paragraph, index) => (
                <p key={index} className="text-lg leading-relaxed text-hover-grow">
                  {paragraph}
                </p>
              ))}
            </div>

            {script.showImage && (
              <div className="mb-8 animate-fade-in">
                <div className="w-full max-w-[400px] max-h-[400px] mx-auto rounded-2xl overflow-hidden shadow-lg relative aspect-video sm:aspect-square">
                    <Image
                      src={script.imagePath || "/placeholder.svg"}
                      alt={script.imageAlt || "Image"}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 400px"
                    />
                  </div>
                </div>
              )}
          </div>
        </div>
      )
    }

    // Final CTA section
    if (script && script.showCTA) {
      return (
        <div className="flex flex-col items-center justify-center max-w-[880px] mx-auto no-jitter">
          {script.showImage && (
            <div className="mb-8 animate-fade-in">
              <div className="image-container">
                <Image
                  src={script.imagePath || "/placeholder.svg"}
                  alt={script.imageAlt || "Image"}
                  width={256}
                  height={256}
                  className="rounded-x1"
                />
              </div>
            </div>
          )}

          <div className="text-xl md:text-2xl mb-12 typewriter-text">
            {text}
            <span className="cursor-element">{cursorVisible ? "|" : ""}</span>
          </div>

          {!isTyping && (
            <>
              <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4 opacity-0 animate-fade-in">
                <Link
                  href="mailto:anthony.brady.f@gmail.com"
                  className="inline-flex items-center justify-center rounded-md bg-[#0057E7] text-white px-6 py-3 text-lg font-medium transition-all hover:bg-[#0046b8] transform hover:scale-105"
                >
                  Say Hello 👋
                </Link>

                <Link
                  href="https://www.linkedin.com/in/anthonyfbrady/"
                  target="_blank"
                  className="inline-flex items-center justify-center rounded-md border border-[#0057E7] bg-white text-[#0057E7] px-6 py-3 text-lg font-medium transition-all hover:bg-[#f0f7ff] transform hover:scale-105"
                >
                  LinkedIn 💼
                </Link>

                <Link
                  href="https://beneathbrady.substack.com"
                  target="_blank"
                  className="inline-flex items-center justify-center rounded-md border border-[#0057E7] bg-white text-[#0057E7] px-6 py-3 text-lg font-medium transition-all hover:bg-[#f0f7ff] transform hover:scale-105"
                >
                  Blog 📓
                </Link>

                <button
                  onClick={showNextFactHandler}
                  className="inline-flex items-center justify-center rounded-md border border-[#0057E7] bg-white text-[#0057E7] px-6 py-3 text-lg font-medium transition-all hover:bg-[#f0f7ff] transform hover:scale-105"
                >
                  Tell Me Something Unexpected 🎲
                </button>
              </div>

              {showRandomFact && (
                <div className="mt-8 p-4 bg-[#f0f7ff] border border-[#0057E7]/20 rounded-lg max-w-2xl animate-fade-in">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 flex items-center justify-center mt-1">
                      <Lightbulb className="h-5 w-5 text-[#0057E7]" />
                    </div>
                    <p className="text-lg ml-3">{randomFact}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )
    }

    // Regular text with optional link and image
    if (script) {
      return (
        <div className="flex flex-col items-center justify-center max-w-[880px] mx-auto animate-slide-in">
          {script.showImage && (
            <div className="mb-8 animate-fade-in">
              <div className="image-container">
                <Image
                  src={script.imagePath || "/placeholder.svg"}
                  alt={script.imageAlt || "Image"}
                  width={256}
                  height={256}
                  className="rounded-x1"
                />
              </div>
            </div>
          )}

          <div className="text-xl md:text-2xl typewriter-text mb-6 relative mt-4">
            <div dangerouslySetInnerHTML={{ __html: formatTextWithBold(text) }} className="inline" />
            <span className="cursor-element absolute" style={{ marginLeft: "2px" }}>
              {cursorVisible ? "|" : ""}
            </span>
          </div>

          {showLink && script.link && (
            <div className="mt-4 opacity-0 animate-fade-in">
              {script.isButton ? (
                <Link
                  href={script.link}
                  target="_blank"
                  className="inline-flex items-center justify-center rounded-md bg-[#0057E7] text-white px-8 py-3 text-lg font-medium transition-all hover:bg-[#0046b8] hover:scale-105 transform"
                >
                  Beneath Brady
                </Link>
              ) : (
                <Link
                  href={script.link}
                  target="_blank"
                  className="text-[#0057E7] hover:underline hover:scale-105 inline-block transform transition-all"
                >
                  {script.link}
                </Link>
              )}
            </div>
          )}
        </div>
      )
    }

    return null
  }

  // Navigation arrows
  const renderNavArrows = () => {
    if (section === 5 && step === 2 && !isTyping) return null
  
    return (
      <div className="fixed bottom-6 inset-x-0 z-50 flex justify-between px-8 md:px-32">
        <button
          onClick={goToPrevious}
          disabled={section === 1 && step === 1}
          className="p-4 rounded-full bg-white/90 text-[#0057E7] hover:bg-white transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 shadow-lg border border-[#0057E7]/20"
          aria-label="Previous"
        >
          <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8" />
        </button>
  
        <button
          onClick={isTyping ? completeCurrentText : progressToNext}
          disabled={section === 5 && step === 2 && !isTyping}
          className="p-4 rounded-full bg-white/90 text-[#0057E7] hover:bg-white transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 shadow-lg border border-[#0057E7]/20"
          aria-label="Next"
        >
          <ChevronRight className="h-6 w-6 sm:h-8 sm:w-8" />
        </button>
      </div>
    )
  }

  const renderProgressIndicator = () => {
    const totalSections = 5
    const sectionNames = ["Intro", "Work", "Career", "Writing", "Connect"]
  
    
    return (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40 w-full px-2 sm:px-4">
        <div className="flex overflow-x-auto gap-2 sm:gap-4 bg-white px-3 py-1.5 sm:px-6 sm:py-2 rounded-full justify-center whitespace-nowrap shadow-md border border-[#0057E7]/20">
          {sectionNames.map((name, idx) => {
            const isCompleted = idx + 1 < section
            const isCurrent = idx + 1 === section
  
            return (
              <button
                key={name}
                onClick={() => goToSection(idx + 1)}
                className={`
                  px-3 py-1 text-xs sm:text-sm rounded-full font-medium transition-all duration-200
                  ${
                    isCurrent
                      ? "bg-[#0057E7] text-white"
                      : isCompleted
                      ? "bg-[#cce0ff] text-[#0057E7]"
                      : "bg-white text-gray-500 border border-[#e0e0e0] hover:text-[#0057E7]"
                  }
                `}
              >
                {name}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // Click anywhere to progress
  const handleScreenClick = (e) => {
    const tag = e.target.tagName.toLowerCase()
  
    if (
      tag === "button" ||
      tag === "a" ||
      tag === "input" || // ← this line is the fix
      e.target.closest("button") ||
      e.target.closest("a") ||
      e.target.closest("input") // ← also catch nested sliders
    ) {
      return
    }
  
    if (isTyping) {
      completeCurrentText()
    } else {
      progressToNext()
    }
  }

  const renderVolumeAndSpeedControls = () => (
    <>
      <span className="text-[#0057E7] text-sm">🔈</span>
  
      <div className="border-l border-dotted border-[#0057E7]/50 h-6 mx-2" />
  
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={volume}
        onChange={(e) => {
          const newVolume = parseFloat(e.target.value)
          setVolume(newVolume)
          if (bgAudioRef.current) bgAudioRef.current.volume = newVolume
        }}
        className="w-24 sm:w-32 h-1 bg-transparent appearance-none cursor-pointer accent-[#0057E7]
          [&::-webkit-slider-thumb]:w-4 
          [&::-webkit-slider-thumb]:h-4 
          [&::-webkit-slider-thumb]:bg-[#0057E7] 
          [&::-webkit-slider-thumb]:rounded-full 
          [&::-webkit-slider-thumb]:shadow-sm 
          [&::-webkit-slider-thumb]:-mt-1"
      />
  
      <div className="border-l border-dotted border-[#0057E7]/50 h-6 mx-2" />
  
      <span className="text-[#0057E7] text-sm">🔊</span>
  
      <div className="flex flex-col items-center space-y-1 ml-4">
        <label htmlFor="speed" className="text-[#0057E7] text-[10px] leading-tight">
          Speed
        </label>
        <select
          id="speed"
          className="text-[#0057E7] bg-white border border-[#0057E7]/20 rounded-md text-[10px] px-1 py-0.5"
          value={playbackRate}
          onChange={(e) => {
            const newRate = parseFloat(e.target.value)
            setPlaybackRate(newRate)
            if (bgAudioRef.current) bgAudioRef.current.playbackRate = newRate
          }}
        >
          <option value={0.75}>0.75x</option>
          <option value={1}>1x</option>
          <option value={1.25}>1.25x</option>
          <option value={1.5}>1.5x</option>
        </select>
      </div>
    </>
  )
  return (
    <main className="min-h-screen bg-white text-black font-mono" onClick={handleScreenClick}>

  {section !== 0 && renderProgressIndicator()}

  <div className="flex flex-col items-center justify-center min-h-[100vh] p-4 py-20">
    {renderContent()}

    {section !== 0 && (
      <div className="hidden md:flex fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 items-center px-4 py-2 rounded-full bg-white/90 shadow-md border border-[#0057E7]/20 backdrop-blur-md space-x-4">
        {renderVolumeAndSpeedControls()}
      </div>
    )}

    {/* Mobile (under arrows) */}
    {section !== 0 && (
      <div className="md:hidden fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 px-4">
        <div className="flex items-center justify-center space-x-4 bg-white/90 rounded-full px-4 py-2 shadow-md border border-[#0057E7]/20 backdrop-blur-md">
          {renderVolumeAndSpeedControls()}
        </div>
      </div>
    )}
  </div>

  {/* ✅ Only render arrows after "Start" */}
  {section !== 0 && renderNavArrows()}

  <audio ref={bgAudioRef} preload="auto">
    <source src="/audio.wav" type="audio/wav" />
  </audio>
</main>
  )
}

