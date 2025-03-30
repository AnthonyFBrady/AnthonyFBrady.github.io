"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Lightbulb } from "lucide-react"

export default function Home() {
  const [text, setText] = useState("")
  const [cursorVisible, setCursorVisible] = useState(true)
  const [section, setSection] = useState(1)
  const [step, setStep] = useState(1)
  const [showLink, setShowLink] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [showImage, setShowImage] = useState(false)
  const [factIndex, setFactIndex] = useState(0)
  const [randomFact, setRandomFact] = useState("")
  const [showRandomFact, setShowRandomFact] = useState(false)
  const typingRef = useRef(null)
  const audioRef = useRef(null)
  const soundTimeoutRef = useRef(null)
  const timeoutsRef = useRef([])

  const randomFacts = [
    "I once barbell squatted 475 pounds. That's like lifting two full-grown pandas. Not sure why you'd ever need to, but still—pandas beware.",
    "I lived in Korea for six months and can hold my own in Korean. I've ordered food, made friends, and confused taxi drivers—all in a second language.",
    "I used to be a competitive goalkeeper—and honestly, I still am. There's something about commanding the chaos that probably bleeds into how I see the world.",
    "I have a brother who's three years older—and three years faster to every milestone growing up. Watching him chase big things made me want to sprint too.",
    "I completed a triathlon, but couldn't swim 25 metres without gasping when I started. My cardio said no. My ego said go.",
    "I'm obsessed with philosophy and the mind—especially where they overlap. Why we think what we think is the biggest mystery I never get tired of poking at.",
    "Curiosity might've killed the cat, but it made me a product manager. I ask a lot of questions. Sometimes even good ones.",
  ]

  // Cursor blinking effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible((prev) => !prev)
    }, 500)

    return () => clearInterval(interval)
  }, [])

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
      setText(script.text)
      setIsTyping(false)

      if (script.link) {
        setShowLink(true)
      }

      if (script.showImage) {
        setShowImage(true)
      }
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
      }, 750)

      timeoutsRef.current.push(timer)
      return () => clearTimeout(timer)
    }

    // Handle all other sections and steps
    const script = getScriptForSection(section, step)
    if (script) {
      setIsTyping(true)

      let i = 0
      const typeText = () => {
        if (i < script.text.length) {
          setText(script.text.substring(0, i + 1))

          // Play typing sound
          playTypingSound()

          i++
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

    if (text.includes("prototype")) {
      formattedText = formattedText.replace(/prototype/g, 'prototype <span class="inline-icon">🧪</span>')
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
  const getScriptForSection = (section, step) => {
    // SECTION 1: Intro
    if (section === 1) {
      if (step === 2) {
        return {
          text: "Hey. You're early. Or I'm late. Either way—welcome.",
          speed: 80,
          delay: 2000,
          nextStep: 3,
          showImage: true,
          imagePath: "/welcome-image.png",
          imageAlt: "Welcome",
        }
      } else if (step === 3) {
        return {
          text: "You might be looking for Tom Brady...",
          speed: 90,
          delay: 2000,
          nextStep: 4,
          showImage: true,
          imagePath: "/tom-brady.jpg",
          imageAlt: "Tom Brady",
        }
      } else if (step === 4) {
        return {
          text: "Or Wayne Brady? The Brady Bunch?",
          speed: 90,
          delay: 2000,
          nextStep: 5,
          showImage: true,
          imagePath: "/wayne-brady.jpg",
          imageAlt: "Wayne Brady",
        }
      } else if (step === 5) {
        return {
          text: "Wrong Brady? I get it... Common mix-up.",
          speed: 60,
          delay: 3000,
          nextStep: 6,
          showImage: true,
          imagePath: "/brady-bunch.jpg",
          imageAlt: "Brady Bunch",
        }
      } else if (step === 6) {
        return {
          text: "Although... if you're still reading, you just might be here for this Brady.",
          speed: 60,
          delay: 3000,
          nextStep: 7,
          showImage: true,
          imagePath: "/anthony-brady.jpg",
          imageAlt: "Anthony Brady",
        }
      } else if (step === 7) {
        return {
          text: "This Brady builds things. Specifically—products.",
          speed: 60,
          delay: 3000,
          nextStep: 8,
          showImage: true,
          imagePath: "/product-building.jpg",
          imageAlt: "Product Building",
        }
      } else if (step === 8) {
        return {
          text: "Let me show you what I've been working on",
          speed: 60,
          delay: 3000,
          nextSection: 2,
          showImage: true,
          imagePath: "/portfolio.jpg",
          imageAlt: "Portfolio",
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
          imagePath: "/autonomics-logo.png",
          imageAlt: "Autonomics Logo",
        }
      } else if (step === 2) {
        return {
          text: "What began as an effort to automate labor-intensive microservices—like accelerating SKU reviews or benchmarking performance through generative AI—has evolved into something far more ambitious.",
          speed: 80,
          delay: 2000,
          nextStep: 3,
          showImage: true,
          imagePath: "/automation-concept.jpg",
          imageAlt: "Automation Concept",
        }
      } else if (step === 3) {
        return {
          text: "We're building an autonomous finance assistant. Today, it's LLM-powered ingestion and reconciliation. Tomorrow, it's proactive, always-on financial workflow management—with minimal human intervention.",
          speed: 80,
          delay: 2000,
          nextStep: 4,
          showImage: true,
          imagePath: "/finance-assistant.jpg",
          imageAlt: "Finance Assistant",
        }
      } else if (step === 4) {
        return {
          text: "I'm the only PM and Founding Product Manager on a 9-person team, reporting directly to the Equity Partner sponsor and Director of Product. That means wearing a lot of hats and making fast, focused calls.",
          speed: 90,
          delay: 2000,
          nextStep: 5,
          showImage: true,
          imagePath: "/product-manager.jpg",
          imageAlt: "Product Manager Role",
        }
      } else if (step === 5) {
        return {
          text: "Sometimes, that means circumventing the ideal in favor of the practical—using Replit prototypes to get something tangible in front of users fast.",
          speed: 90,
          delay: 2000,
          nextStep: 6,
          showImage: true,
          imagePath: "/replit-prototype.png",
          imageAlt: "Replit Prototype",
        }
      } else if (step === 6) {
        return {
          text: "We're still early—interviewing CFOs, founders, bookkeepers, and finance professionals to deeply understand where the real friction lies.",
          speed: 60,
          delay: 3000,
          nextStep: 7,
          showImage: true,
          imagePath: "/user-interviews.jpg",
          imageAlt: "User Interviews",
        }
      } else if (step === 7) {
        return {
          text: "Our roadmap is starting to take shape, and we're watching closely where agentic AI is going—trying to stay in the ring long enough to ship something that truly changes how finance works.",
          speed: 60,
          delay: 3000,
          nextStep: 8,
          showImage: true,
          imagePath: "/product-roadmap.jpg",
          imageAlt: "Product Roadmap",
        }
      } else if (step === 8) {
        return {
          text: "Before Autonomics, I joined the ElectrifiedGrid team—my first product experience, and a much larger, cross-functional environment.",
          speed: 60,
          delay: 3000,
          nextStep: 9,
          showImage: true,
          imagePath: "/electrifiedgrid-logo.png",
          imageAlt: "ElectrifiedGrid Logo",
        }
      } else if (step === 9) {
        return {
          text: "ElectrifiedGrid is a strategic forecasting tool that helps utilities and governments plan for sustainability, decarbonization, and the energy transition.",
          speed: 80,
          delay: 2000,
          nextStep: 10,
          showImage: true,
          imagePath: "/strategic-forecasting.jpg",
          imageAlt: "Strategic Forecasting",
        }
      } else if (step === 10) {
        return {
          text: "I helped run our early product board sessions—watching senior PMs in action, interviewing internal SMEs, shaping our impact-effort matrix, and co-leading prioritization sessions that got us to our first roadmap.",
          speed: 90,
          delay: 2000,
          nextStep: 11,
          showImage: true,
          imagePath: "/product-board.jpg",
          imageAlt: "Product Board",
        }
      } else if (step === 11) {
        return {
          text: "The experience gave me a strong foundation I lean on now, especially in a role with far less built-in guidance.",
          speed: 90,
          delay: 2000,
          nextStep: 12,
          showImage: true,
          imagePath: "/foundation.jpg",
          imageAlt: "Foundation",
        }
      } else if (step === 12) {
        return {
          text: "One of my most rewarding projects was leading a Scale AI grant application with a utility partner—a deep dive into how AI could transform distribution-level planning.",
          speed: 60,
          delay: 3000,
          nextStep: 13,
          showImage: true,
          imagePath: "/scale-ai-logo.png",
          imageAlt: "Scale AI Logo",
        }
      } else if (step === 13) {
        return {
          text: "I built detailed data architecture diagrams to show how telemetry, DERs, and environmental signals could feed into intelligent grid decisions.",
          speed: 60,
          delay: 3000,
          nextStep: 14,
          showImage: true,
          imagePath: "/data-architecture.jpg",
          imageAlt: "Data Architecture",
        }
      } else if (step === 14) {
        return {
          text: "We matched specific models to components—classification, forecasting, risk scoring, and optimization—to illustrate feasibility and impact.",
          speed: 60,
          delay: 3000,
          nextSection: 3,
          showImage: true,
          imagePath: "/ai-models.jpg",
          imageAlt: "AI Models",
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
          speed: 80,
          delay: 2000,
          nextStep: 3,
          showImage: true,
          imagePath: "/probitglobal-logo.png",
          imageAlt: "Probit Global",
        }
      } else if (step === 3) {
        return {
          text: "Throughout it all, I developed a passion for writing. It's something I still maintain (and you'll see some of that soon).",
          speed: 80,
          delay: 2000,
          nextStep: 4,
          showImage: true,
          imagePath: "/humber-college-logo.png",
          imageAlt: "Humber College",
        }
      } else if (step === 4) {
        return {
          text: "Eventually, I realized I didn't just want to observe and communicate change—I wanted to be a part of creating it.",
          speed: 90,
          delay: 2000,
          nextStep: 5,
          showImage: true,
          imagePath: "/unity-health-logo.png",
          imageAlt: "Unity Health",
        }
      } else if (step === 5) {
        return {
          text: "So I pivoted—from PR and communications into consulting, and then into product management (although this took some effort).",
          speed: 90,
          delay: 2000,
          nextSection: 4,
          showImage: true,
          imagePath: "/career-pivot.jpg",
          imageAlt: "Career Pivot",
        }
      }
    }

    // SECTION 4: CREATIVE TRANSITION
    else if (section === 4) {
      if (step === 1) {
        return {
          text: "Outside of work, I also write.",
          speed: 65,
          delay: 2000,
          nextStep: 2,
          showImage: true,
          imagePath: "/beneath-brady.png",
          imageAlt: "Beneath Brady",
        }
      } else if (step === 2) {
        return {
          text: "If you're curious about what lives beneath the suit...",
          speed: 65,
          delay: 2500,
          nextStep: 3,
          showImage: true,
          imagePath: "/writing-sample.jpg",
          imageAlt: "Writing Sample",
        }
      } else if (step === 3) {
        return {
          text: "Think philosophy meets science.",
          speed: 65,
          delay: 2500,
          nextStep: 4,
          showImage: true,
          imagePath: "/philosophy-science.jpg",
          imageAlt: "Philosophy meets Science",
        }
      } else if (step === 4) {
        return {
          text: "Take a peek beneath Brady.",
          speed: 65,
          delay: 3000,
          nextSection: 5,
          link: "https://beneathbrady.substack.com",
          isButton: true,
          showImage: true,
          imagePath: "/substack.jpg",
          imageAlt: "Substack",
        }
      }
    }

    // SECTION 5: CTA
    else if (section === 5) {
      if (step === 1) {
        return {
          text: "Still here? Let's chat.",
          speed: 65,
          delay: 2000,
          nextStep: 2,
          showImage: true,
          imagePath: "/lets-chat.jpg",
          imageAlt: "Let's Chat",
        }
      } else if (step === 2) {
        return {
          text: "No pressure. Just good conversation and better ideas.",
          speed: 65,
          delay: 2000,
          showCTA: true,
          showImage: true,
          imagePath: "/conversation.jpg",
          imageAlt: "Conversation",
        }
      }
    }

    return null
  }

  // Get current script
  const currentScript = getScriptForSection(section, step)

  // Render content based on current section and step
  const renderContent = () => {
    // For section 1 step 1, just show blinking cursor
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
              <div className="flex items-center justify-center mt-8 md:mt-0">
                <div
                  className={`image-container w-full max-w-md aspect-[3/2] bg-gray-100 ${
                    showImage ? "opacity-100 animate-fade-in" : "opacity-0"
                  }`}
                >
                  <Image
                    src={script.imagePath || "/placeholder.svg"}
                    alt={script.imageAlt || "Image"}
                    width={600}
                    height={400}
                    className="object-cover w-full h-full grayscale hover:grayscale-0 transition-all duration-500"
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
            <div className="mb-8 opacity-0 animate-fade-in">
              <div className="image-container w-64 h-64 overflow-hidden">
                <Image
                  src={script.imagePath || "/placeholder.svg"}
                  alt={script.imageAlt || "Image"}
                  width={256}
                  height={256}
                  className="object-cover w-full h-full grayscale hover:grayscale-0 transition-all duration-500"
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
            <div className="mb-8 opacity-0 animate-fade-in">
              <div className="image-container w-64 h-64 overflow-hidden">
                <Image
                  src={script.imagePath || "/placeholder.svg"}
                  alt={script.imageAlt || "Image"}
                  width={256}
                  height={256}
                  className="object-cover w-full h-full grayscale hover:grayscale-0 transition-all duration-500"
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
    if (section === 5 && step === 2 && !isTyping) {
      return null // Don't show on final screen
    }

    return (
      <>
        <button
          onClick={goToPrevious}
          disabled={section === 1 && step === 1}
          className="fixed left-8 top-1/2 transform -translate-y-1/2 p-4 rounded-full bg-white/90 text-[#0057E7] hover:bg-white transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 shadow-lg border border-[#0057E7]/20"
          aria-label="Previous"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>

        <button
          onClick={isTyping ? completeCurrentText : progressToNext}
          disabled={section === 5 && step === 2 && !isTyping}
          className="fixed right-8 top-1/2 transform -translate-y-1/2 p-4 rounded-full bg-white/90 text-[#0057E7] hover:bg-white transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 shadow-lg border border-[#0057E7]/20"
          aria-label="Next"
        >
          <ChevronRight className="h-8 w-8" />
        </button>
      </>
    )
  }

  const renderProgressIndicator = () => {
    const totalSections = 5
    const sectionNames = ["Intro", "Work", "Career", "Writing", "Connect"]

    return (
      <div className="fixed top-4 left-0 right-0 flex justify-center z-10">
        <div
          className="bg-white/80 backdrop-blur-sm px-6 py-4 rounded-lg shadow-md"
          style={{ width: "880px", maxWidth: "90vw" }}
        >
          {/* Timeline container with proper spacing for labels */}
          <div className="relative w-full" style={{ paddingBottom: "30px" }}>
            {/* Main timeline line */}
            <div className="relative h-0.5 bg-[#e6f0ff] rounded-full w-full">
              {/* Completed line */}
              <div
                className="absolute top-0 left-0 h-0.5 bg-[#0057E7] rounded-full transition-all duration-300"
                style={{ width: `${((section - 1) * 100) / (totalSections - 1)}%` }}
              />

              {/* Dotted line for remaining sections */}
              <div
                className="absolute top-0 h-0.5 rounded-full transition-all duration-300"
                style={{
                  left: `${((section - 1) * 100) / (totalSections - 1)}%`,
                  width: `${100 - ((section - 1) * 100) / (totalSections - 1)}%`,
                  backgroundImage: "linear-gradient(to right, #99c2ff 50%, transparent 50%)",
                  backgroundSize: "10px 1px",
                  backgroundRepeat: "repeat-x",
                  backgroundPosition: "0 center",
                }}
              />

              {/* Section markers with proper alignment */}
              {Array.from({ length: totalSections }).map((_, idx) => (
                <div
                  key={idx}
                  className="absolute top-0 cursor-pointer group"
                  style={{
                    left: `${(idx * 100) / (totalSections - 1)}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  onClick={() => goToSection(idx + 1)}
                >
                  {/* Circle marker */}
                  <div
                    className={`w-4 h-4 rounded-full border-2 transition-all duration-300 
                      ${
                        idx + 1 === section
                          ? "border-[#0057E7] bg-[#0057E7]"
                          : idx + 1 < section
                            ? "border-[#0057E7] bg-[#0057E7]"
                            : "border-[#99c2ff] bg-white group-hover:border-[#0057E7] group-hover:bg-[#0057E7]"
                      }`}
                  />

                  {/* Dotted circle outline for upcoming sections */}
                  {idx + 1 > section && (
                    <div className="w-4 h-4 rounded-full absolute top-0 left-0 border-2 border-dashed border-[#99c2ff] group-hover:border-[#0057E7]" />
                  )}

                  {/* Section label - positioned below dot */}
                  <div
                    className={`absolute text-sm transition-all duration-300 whitespace-nowrap
                      ${
                        idx + 1 === section
                          ? "text-[#0057E7] font-medium"
                          : "text-[#999999] group-hover:text-[#0057E7] group-hover:font-medium"
                      }`}
                    style={{
                      top: "24px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      textAlign: "center",
                    }}
                  >
                    {sectionNames[idx]}
                  </div>
                </div>
              ))}

              {/* Plane indicator */}
              <div
                className="absolute -top-6 transform -translate-x-1/2 text-[#0057E7] transition-all duration-300"
                style={{ left: `${((section - 1) * 100) / (totalSections - 1)}%` }}
              >
                <span role="img" aria-label="plane" className="text-lg">
                  ✈️
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Click anywhere to progress
  const handleScreenClick = (e) => {
    // Ignore clicks on buttons and links
    if (
      e.target.tagName.toLowerCase() === "button" ||
      e.target.tagName.toLowerCase() === "a" ||
      e.target.closest("button") ||
      e.target.closest("a")
    ) {
      return
    }

    if (isTyping) {
      completeCurrentText()
    } else {
      progressToNext()
    }
  }

  return (
    <main className="min-h-screen bg-white text-black font-mono" onClick={handleScreenClick}>
      {/* Audio element for typing sound */}
      <audio ref={audioRef} preload="auto" className="hidden">
        <source src="/typing-sound.mp3" type="audio/mpeg" />
      </audio>

      {renderProgressIndicator()}

      <div className="flex flex-col items-center justify-center min-h-[100vh] p-4 py-20">{renderContent()}</div>

      {renderNavArrows()}
    </main>
  )
}

