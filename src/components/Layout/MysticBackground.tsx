import Particles, { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import { useEffect, useMemo, useState } from 'react'

export function MysticBackground() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine)
      setReady(true)
    })
  }, [])

  const options = useMemo(
    () => ({
      fullScreen: { enable: false, zIndex: 0 },
      background: { color: { value: 'transparent' } },
      fpsLimit: 60,
      particles: {
        number: { value: 48, density: { enable: true, width: 1024, height: 1024 } },
        color: { value: ['#d4af37', '#7c3aed', '#06b6d4', '#f5f0e6'] },
        opacity: { value: { min: 0.15, max: 0.55 } },
        size: { value: { min: 0.6, max: 2.2 } },
        move: {
          enable: true,
          speed: 0.35,
          direction: 'none' as const,
          random: true,
          straight: false,
          outModes: { default: 'out' as const },
        },
        links: { enable: false },
      },
      interactivity: {
        events: {
          onHover: { enable: true, mode: 'repulse' },
        },
        modes: {
          repulse: { distance: 120, duration: 0.35 },
        },
      },
      detectRetina: true,
    }),
    [],
  )

  if (!ready) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <Particles id="mystic-particles" className="h-full w-full" options={options} />
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 30%, #7c3aed 0%, transparent 45%),
            radial-gradient(circle at 80% 70%, #06b6d4 0%, transparent 40%)`,
        }}
      />
    </div>
  )
}
