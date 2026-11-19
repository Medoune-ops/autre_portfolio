'use client'

import { Component, Suspense, lazy, useEffect, useState, type ReactNode } from 'react'
const Spline = lazy(() => import('@splinetool/react-spline'))

interface SplineSceneProps {
  scene: string
  className?: string
  /** Charge la scène seulement quand la valeur passe à true (évite de bloquer l'intro). */
  active?: boolean
}

function Spinner() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
    </div>
  )
}

function SceneUnavailable() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neon2/10 via-transparent to-neon/10">
      <p className="px-6 text-center text-xs text-white/40">Scène 3D indisponible</p>
    </div>
  )
}

/** Empêche une erreur de chargement de la scène de faire tomber toute la page. */
class SplineBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? <SceneUnavailable /> : this.props.children
  }
}

export function SplineScene({ scene, className, active = true }: SplineSceneProps) {
  // Rendu identique serveur/client au premier passage, puis montage côté client uniquement.
  const [mounted, setMounted] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!mounted || !active || sceneReady) return
    const timer = setTimeout(() => setTimedOut(true), 15000)
    return () => clearTimeout(timer)
  }, [mounted, active, sceneReady])

  if (!mounted || !active) return <Spinner />
  if (timedOut && !sceneReady) return <SceneUnavailable />

  return (
    <div className="relative h-full w-full">
      <SplineBoundary>
        <Suspense fallback={<Spinner />}>
          <Spline
            scene={scene}
            className={className}
            onLoad={() => setSceneReady(true)}
          />
        </Suspense>
        {!sceneReady && (
          <div className="absolute inset-0 z-10 bg-[#0A0F1C]/40">
            <Spinner />
          </div>
        )}
      </SplineBoundary>
    </div>
  )
}
