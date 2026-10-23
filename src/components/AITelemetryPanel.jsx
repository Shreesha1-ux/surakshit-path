import React, { useState, useEffect } from 'react'

export default function AITelemetryPanel({ activeRoute, theme }) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [promptInput, setPromptInput] = useState('')

  const currentAdviceText = activeRoute === 'A'
    ? '"Route A is recommended. It adds 4 mins duration, but 88% of route has verified lighting and 3 open safe havens. Route B has unlit sections."'
    : '"Route B is a shortcut saving 4 mins duration, but only 41% of route has street lighting and contains high-risk unlit corridors."'

  const handlePlayVoice = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.')
      return
    }

    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(currentAdviceText)
    utterance.rate = 0.95
    utterance.pitch = 1.0

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }

  const handleStopVoice = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!promptInput.trim()) return
    setPromptInput('')
  }

  // Dynamic metrics based on active route
  const metrics = activeRoute === 'A' ? {
    lighting: '88%',
    lightingVal: 88,
    havens: '3 points',
    risk: 'Low',
    confidence: '92% (High)'
  } : {
    lighting: '41%',
    lightingVal: 41,
    havens: '0 points',
    risk: 'High',
    confidence: '78% (Medium)'
  }

  return (
    <div className="w-full h-full bg-card flex flex-col justify-between p-4 sm:p-5 select-none overflow-hidden font-mono border-l border-border transition-colors duration-200">
      
      {/* Top Stack: Header, Chat Bubble, Voice Controls, Metrics */}
      <div className="space-y-4">
        {/* Top Header Label (Blueprint: < AI CHAT & TELEMETRY (35% WIDTH) >) */}
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
          &lt; AI CHAT &amp; TELEMETRY (35% WIDTH) &gt;
        </div>

        {/* Chat Bubble Box */}
        <div className="border border-border p-4 bg-accent/30 rounded-lg shadow-sm transition-colors">
          <div className="font-bold text-xs uppercase tracking-tight text-foreground mb-2 flex items-center justify-between">
            <span className="text-primary">[AI] Gemini Route Evaluation:</span>
            {isSpeaking && (
              <span className="text-[10px] font-normal text-primary animate-pulse">
                Speaking...
              </span>
            )}
          </div>
          <p className="text-xs text-foreground/90 leading-relaxed font-sans">
            {currentAdviceText}
          </p>
        </div>

        {/* Voice Controls: Side-by-side buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handlePlayVoice}
            className={`py-2 px-3 text-xs font-semibold uppercase tracking-wider rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              isSpeaking 
                ? 'bg-foreground text-background' 
                : 'bg-primary hover:opacity-90 text-primary-foreground shadow-sm'
            }`}
          >
            <span>[(&gt;)] Play Voice</span>
          </button>

          <button
            onClick={handleStopVoice}
            className="py-2 px-3 text-xs font-semibold uppercase tracking-wider border border-border text-muted-foreground hover:text-foreground hover:border-foreground/50 bg-card rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>[||] Stop Voice</span>
          </button>
        </div>

        {/* Metrics Telemetry Box */}
        <div className="border border-border p-4 bg-card rounded-lg transition-colors">
          <div className="font-bold text-xs uppercase tracking-wider text-foreground mb-3 border-b border-border pb-2 flex items-center justify-between">
            <span>SAFETY METRICS TELEMETRY</span>
            <span className="text-[10px] text-primary font-normal">Realtime</span>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Metric 1: Street Lighting Coverage */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-muted-foreground">Street Lighting Coverage</span>
                <span className="font-bold text-foreground">{metrics.lighting}</span>
              </div>
              <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${metrics.lightingVal}%` }}
                />
              </div>
            </div>

            {/* Metric 2: Verified Safe Havens */}
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="text-muted-foreground">Verified Safe Havens</span>
              <span className="font-bold text-foreground">{metrics.havens}</span>
            </div>

            {/* Metric 3: Incident History Risk */}
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="text-muted-foreground">Incident History Risk</span>
              <span className={`font-bold uppercase ${metrics.risk === 'Low' ? 'text-primary' : 'text-destructive'}`}>
                {metrics.risk}
              </span>
            </div>

            {/* Metric 4: Data Confidence Score */}
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="text-muted-foreground">Data Confidence Score</span>
              <span className="font-bold text-foreground">{metrics.confidence}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Input Field pinned at bottom (Blueprint: Ask about route safety... [>]) */}
      <div className="pt-3 border-t border-border bg-card">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            type="text"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            placeholder="Ask about route safety..."
            className="flex-1 text-xs font-sans border border-border focus:border-primary outline-none px-3 py-2.5 bg-background text-foreground rounded-md transition-colors"
          />
          <button
            type="submit"
            className="w-9 h-9 bg-primary hover:opacity-90 text-primary-foreground transition-colors flex items-center justify-center font-bold text-xs flex-shrink-0 cursor-pointer rounded-md"
            aria-label="Send query"
          >
            <span>&gt;</span>
          </button>
        </form>
      </div>

    </div>
  )
}
