import { useCallback, useEffect, useRef, useState } from 'react'
import { AgentPlayback } from './audio/playback'
import { Downsampler, pcm16ToBytes } from './audio/resampler'
import type {
  ConsoleLevel,
  ConsoleLine,
  OrderSummary,
  Phase,
  TranscriptLine,
} from './model'

/** The browser connects here; Vite proxies /ws -> the Django backend (:8000). */
function socketUrl() {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${location.host}/ws/demo/chiang-mai-ai`
}

let uid = 0
const nextId = () => `id-${Date.now().toString(36)}-${(uid += 1)}`

function nowStamp() {
  const d = new Date()
  const p = (n: number, len = 2) => String(n).padStart(len, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(d.getMilliseconds(), 3)}`
}

interface ServerMessage {
  type?: string
  phase?: Phase
  role?: string
  text?: string
  seed?: boolean
  message?: string
  level?: ConsoleLevel
  reason?: string
  order?: OrderSummary
  note?: string
}

export interface VoiceAgent {
  phase: Phase
  statusBanner: string | null
  fatal: string | null
  transcript: TranscriptLine[]
  consoleLines: ConsoleLine[]
  order: OrderSummary | null
  callSeconds: number
  running: boolean
  start: () => Promise<void>
  stop: () => void
  injectUserText: (text: string) => void
}

export function useVoiceAgent(): VoiceAgent {
  const [phase, setPhaseState] = useState<Phase>('idle')
  const [statusBanner, setStatusBanner] = useState<string | null>(null)
  const [fatal, setFatal] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<TranscriptLine[]>([])
  const [consoleLines, setConsoleLines] = useState<ConsoleLine[]>([])
  const [order, setOrder] = useState<OrderSummary | null>(null)
  const [callSeconds, setCallSeconds] = useState(0)

  const phaseRef = useRef<Phase>('idle')
  const setPhase = useCallback((p: Phase) => {
    phaseRef.current = p
    setPhaseState(p)
  }, [])

  const wsRef = useRef<WebSocket | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const wletRef = useRef<AudioWorkletNode | null>(null)
  const scriptRef = useRef<ScriptProcessorNode | null>(null)
  const silentGainRef = useRef<GainNode | null>(null)
  const playbackRef = useRef<AgentPlayback | null>(null)
  const downsampleRef = useRef<Downsampler | null>(null)
  const timerRef = useRef<number | null>(null)
  /** True once the conversation ended on purpose (server or user). */
  const endedRef = useRef(false)

  const pushTranscript = useCallback((role: TranscriptLine['role'], text: string) => {
    setTranscript((prev) => {
      const last = prev[prev.length - 1]
      // Merge incremental "growing text" transcription events from the same role.
      if (last && last.role === role && text) {
        if (text === last.text) return prev
        if (text.startsWith(last.text)) {
          return [...prev.slice(0, -1), { ...last, text }]
        }
        if (last.text.startsWith(text)) return prev
      }
      return [...prev, { id: nextId(), role, text }]
    })
  }, [])

  const pushConsole = useCallback((level: ConsoleLevel, text: string) => {
    setConsoleLines((prev) => [
      ...prev.slice(-199),
      { id: nextId(), time: nowStamp(), level, text },
    ])
  }, [])

  /** Tear down mic capture + Web Audio. Does not touch WebSocket. */
  const stopAudioHardware = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    playbackRef.current?.stop()
    playbackRef.current = null
    try {
      wletRef.current?.disconnect()
      scriptRef.current?.disconnect()
      sourceRef.current?.disconnect()
      silentGainRef.current?.disconnect()
    } catch {
      /* already disconnected */
    }
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    wletRef.current = null
    scriptRef.current = null
    sourceRef.current = null
    silentGainRef.current = null
    ctxRef.current?.close().catch(() => undefined)
    ctxRef.current = null
  }, [])

  const handleServerMessage = useCallback(
    (msg: ServerMessage) => {
      switch (msg.type) {
        case 'phase':
          if (msg.phase && msg.phase !== 'ended') setPhase(msg.phase)
          break
        case 'transcript': {
          const role: TranscriptLine['role'] = msg.role === 'user' ? 'user' : 'agent'
          if (msg.text) pushTranscript(role, msg.text)
          break
        }
        case 'order':
          setOrder(msg.order ?? {})
          pushConsole('ok', 'Order captured — see the recap above')
          break
        case 'console':
          pushConsole(msg.level ?? 'info', msg.text ?? '')
          break
        case 'ended':
          endedRef.current = true
          setPhase('ended')
          pushConsole('info', 'Conversation ended — the agent closed the call')
          break
        case 'error':
          setStatusBanner(msg.message ?? 'Something went wrong — try again.')
          pushConsole('err', msg.message ?? 'Agent error')
          break
        case 'fatal':
          setFatal(msg.message ?? 'The backend is not reachable.')
          setPhase('error')
          break
        default:
          break
      }
    },
    [pushConsole, pushTranscript, setPhase]
  )

  /** Start a voice session from the "Talk To Your Agent" click (user gesture). */
  const start = useCallback(async () => {
    if (
      phaseRef.current === 'connecting' ||
      phaseRef.current === 'listening' ||
      phaseRef.current === 'speaking' ||
      phaseRef.current === 'processing'
    ) {
      return
    }

    // Fresh session.
    endedRef.current = false
    setFatal(null)
    setStatusBanner(null)
    setTranscript([])
    setConsoleLines([])
    setOrder(null)
    setCallSeconds(0)
    setPhase('connecting')

    // 1. Microphone (needs the click as a secure-context user gesture).
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
        video: false,
      })
    } catch (err) {
      const name = err instanceof DOMException ? err.name : ''
      const denied = name === 'NotAllowedError' || name === 'PermissionDeniedError'
      setStatusBanner(
        denied
          ? 'Microphone permission was denied. Allow mic access for this tab, then try again.'
          : 'Could not start the microphone. Check that a mic is connected and allowed.'
      )
      setPhase('idle')
      return
    }
    streamRef.current = stream

    // 2. Web Audio graph (mic is never routed to output — no echo loop).
    const AC: typeof AudioContext =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AC()
    ctxRef.current = ctx
    try {
      await ctx.resume()
    } catch {
      /* Chrome may not need a resume on a fresh gesture */
    }
    playbackRef.current = new AgentPlayback(ctx)
    const downsampler = new Downsampler()
    downsampleRef.current = downsampler

    const sendMicChunk = (float32: Float32Array) => {
      const ws = wsRef.current
      if (!ws || ws.readyState !== WebSocket.OPEN) return
      if (phaseRef.current === 'ended' || phaseRef.current === 'error') return
      const pcm = downsampler.process(float32, ctx.sampleRate)
      if (pcm.length > 0) ws.send(pcm16ToBytes(pcm))
    }

    // 3. WebSocket.
    const ws = new WebSocket(socketUrl())
    ws.binaryType = 'arraybuffer'
    wsRef.current = ws

    ws.onopen = () => {
      pushConsole('ok', 'WebSocket connected — relaying to the Deepgram voice agent')
    }

    ws.onmessage = (event: MessageEvent) => {
      if (typeof event.data === 'string') {
        try {
          handleServerMessage(JSON.parse(event.data) as ServerMessage)
        } catch {
          /* ignore malformed frame */
        }
        return
      }
      // Agent audio (linear16 @ 16k).
      if (event.data instanceof ArrayBuffer) {
        playbackRef.current?.pushLinear16Bytes(event.data)
      } else if (event.data instanceof Blob) {
        event.data.arrayBuffer().then((buf) => playbackRef.current?.pushLinear16Bytes(buf))
      }
    }

    ws.onclose = (event) => {
      pushConsole(event.wasClean ? 'info' : 'warn', `Connection closed (code ${event.code})`)
      if (!endedRef.current) {
        setPhase('error')
        if (!event.wasClean) {
          setStatusBanner('Lost the connection to the voice agent — try again.')
        }
      }
      stopAudioHardware()
    }

    // 4. Capture pipeline (worklet with a ScriptProcessor fallback).
    const source = ctx.createMediaStreamSource(stream)
    sourceRef.current = source
    const silent = ctx.createGain()
    silent.gain.value = 0
    silentGainRef.current = silent
    silent.connect(ctx.destination)

    try {
      await ctx.audioWorklet.addModule(
        new URL('./audio/pcmCapture.worklet.js', import.meta.url)
      )
      const node = new AudioWorkletNode(ctx, 'pcm-capture')
      node.port.onmessage = (ev: MessageEvent<Float32Array>) => sendMicChunk(ev.data)
      node.connect(silent)
      source.connect(node)
      wletRef.current = node
    } catch {
      // Fallback: ScriptProcessorNode (deprecated but universal).
      const script = ctx.createScriptProcessor(4096, 1, 1)
      script.onaudioprocess = (e: AudioProcessingEvent) => {
        const input = e.inputBuffer.getChannelData(0)
        sendMicChunk(new Float32Array(input))
      }
      script.connect(silent)
      source.connect(script)
      scriptRef.current = script
    }

    // 5. Call timer.
    timerRef.current = window.setInterval(() => {
      setCallSeconds((s) => s + 1)
    }, 1000)
  }, [handleServerMessage, pushConsole, setPhase, stopAudioHardware])

  /** End the conversation (hang up). */
  const stop = useCallback(() => {
    endedRef.current = true
    setPhase('ended')
    const ws = wsRef.current
    if (ws) {
      try {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'end' }))
        ws.close(1000, 'user_ended')
      } catch {
        /* already closing */
      }
    }
    wsRef.current = null
    stopAudioHardware()
    pushConsole('info', 'You ended the conversation')
  }, [pushConsole, setPhase, stopAudioHardware])

  /** Inject a phrase as if the visitor said it (quick-reply chips / menu buttons). */
  const injectUserText = useCallback(
    (text: string) => {
      const ws = wsRef.current
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        pushConsole('warn', 'Start a conversation before injecting a phrase')
        return
      }
      if (phaseRef.current !== 'listening') {
        pushConsole('warn', 'Injections work while the agent is listening — wait a moment')
        return
      }
      ws.send(JSON.stringify({ type: 'inject', text }))
    },
    [pushConsole]
  )

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      endedRef.current = true
      try {
        wsRef.current?.close(1000, 'unmount')
      } catch {
        /* noop */
      }
      stopAudioHardware()
    }
  }, [stopAudioHardware])

  const running =
    phase === 'connecting' ||
    phase === 'listening' ||
    phase === 'speaking' ||
    phase === 'processing'

  return {
    phase,
    statusBanner,
    fatal,
    transcript,
    consoleLines,
    order,
    callSeconds,
    running,
    start,
    stop,
    injectUserText,
  }
}
