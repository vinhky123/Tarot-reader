import Particles, { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import { memo, useEffect, useState } from 'react'

/**
 * Cấu hình cố định ở scope module — tránh object mới mỗi lần render App
 * (tsparticles có thể reset hạt khi `options` đổi reference).
 * Không dùng repulse/hover; drift chậm + bounce để không respawn liên tục.
 */
const MYSTIC_PARTICLE_OPTIONS = {
  fullScreen: { enable: false, zIndex: 0 },
  background: { color: { value: 'transparent' } },
  fpsLimit: 60,
  pauseOnBlur: false,
  particles: {
    number: { value: 78, density: { enable: false } },
    color: { value: ['#d4af37', '#7c3aed', '#06b6d4', '#f5f0e6'] },
    opacity: {
      value: { min: 0.1, max: 0.55 },
      animation: {
        enable: true,
        speed: { min: 0.6, max: 2.4 },
        sync: false,
        destroy: 'none' as const,
        startValue: 'random' as const,
      },
    },
    size: { value: { min: 0.5, max: 2.8 } },
    move: {
      enable: true,
      speed: { min: 0.14, max: 0.36 },
      direction: 'none' as const,
      random: true,
      straight: false,
      outModes: { default: 'bounce' as const },
      attract: { enable: false },
      drift: 0,
    },
    links: { enable: false },
    reduceDuplicates: true,
  },
  interactivity: {
    detectsOn: 'canvas' as const,
    events: {
      onHover: { enable: false },
      onClick: { enable: false },
      resize: { enable: true },
    },
  },
  detectRetina: true,
}

function MysticMoon() {
  return (
    <div
      className="mystic-moon-spin pointer-events-none absolute bottom-6 right-4 z-[1] opacity-[0.28] sm:bottom-8 sm:right-8 sm:opacity-[0.32]"
      aria-hidden
    >
      <svg
        width="112"
        height="112"
        viewBox="0 0 120 120"
        className="drop-shadow-[0_0_18px_rgba(212,175,55,0.25)]"
      >
        <defs>
          <linearGradient id="mystic-moon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f5f0e6" stopOpacity="0.95" />
            <stop offset="45%" stopColor="#d4af37" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.65" />
          </linearGradient>
          <filter id="mystic-moon-soft" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.8" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Trăng khuyết — path đơn */}
        <path
          fill="url(#mystic-moon-grad)"
          filter="url(#mystic-moon-soft)"
          d="M 78 18 A 46 46 0 1 0 78 102 A 38 38 0 1 1 78 18 Z"
          opacity="0.92"
        />
        <circle cx="88" cy="38" r="2.2" fill="#f5f0e6" opacity="0.35" />
        <circle cx="72" cy="88" r="1.4" fill="#06b6d4" opacity="0.4" />
      </svg>
    </div>
  )
}

function MysticBackgroundInner() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine)
      setReady(true)
    })
  }, [])

  if (!ready) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <Particles
        id="mystic-particles"
        className="h-full w-full"
        options={MYSTIC_PARTICLE_OPTIONS}
      />
      <div
        className="absolute inset-0 z-[1] opacity-[0.12]"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 30%, #7c3aed 0%, transparent 45%),
            radial-gradient(circle at 80% 70%, #06b6d4 0%, transparent 40%)`,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-[2]"
        style={{
          boxShadow:
            'inset 0 0 100px rgba(0,0,0,0.55), inset 0 0 180px rgba(0,0,0,0.35), inset 0 -40px 80px rgba(10,10,26,0.5)',
        }}
        aria-hidden
      />
      <MysticMoon />
    </div>
  )
}

export const MysticBackground = memo(MysticBackgroundInner)
