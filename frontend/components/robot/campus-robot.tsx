'use client'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

export type RobotState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error'

function Ell({ s, p, m }: { s: [number, number, number]; p: [number, number, number]; m: THREE.Material }) {
  return (
    <mesh scale={s} position={p} material={m}>
      <sphereGeometry args={[1, 48, 32]} />
    </mesh>
  )
}

type Expr = 'happy' | 'open' | 'blink' | 'think' | 'sad'
function paintFace(c: HTMLCanvasElement, e: Expr) {
  const g = c.getContext('2d')!, W = c.width, H = c.height
  g.clearRect(0, 0, W, H)
  g.save(); g.beginPath(); g.roundRect(0, 0, W, H, 230)
  const bg = g.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#1b1f27'); bg.addColorStop(0.35, '#0b0d12'); bg.addColorStop(1, '#050608')
  g.fillStyle = bg; g.fill(); g.clip()
  const hl = g.createRadialGradient(W * 0.28, H * 0.12, 0, W * 0.28, H * 0.12, W * 0.5)
  hl.addColorStop(0, 'rgba(255,255,255,0.22)'); hl.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = hl; g.fillRect(0, 0, W, H); g.restore()
  g.save(); g.translate(W / 2, 0); g.scale(0.74, 1); g.translate(-W / 2, 0)
  g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.lineCap = 'round'
  g.shadowColor = 'rgba(255,255,255,0.9)'; g.shadowBlur = 36
  const y = H * 0.52
  ;[W / 2 - W * 0.27, W / 2 + W * 0.27].forEach((x) => {
    g.beginPath()
    if (e === 'happy') { g.lineWidth = 46; g.arc(x, y + 34, 80, Math.PI * 1.12, Math.PI * 1.88); g.stroke() }
    else if (e === 'sad') { g.lineWidth = 46; g.arc(x, y + 110, 80, Math.PI * 0.12, Math.PI * 0.88); g.stroke() }
    else if (e === 'blink') { g.lineWidth = 40; g.moveTo(x - 72, y); g.lineTo(x + 72, y); g.stroke() }
    else if (e === 'think') { g.ellipse(x, y - 20, 46, 46, 0, 0, Math.PI * 2); g.fill() }
    else { g.ellipse(x, y, 54, 86, 0, 0, Math.PI * 2); g.fill() }
  })
  g.restore()
}
function Face({ state }: { state: RobotState }) {
  const { c, tex } = useMemo(() => {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 768
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8
    return { c, tex }
  }, [])
  const cur = useRef(''), blink = useRef({ next: 2, at: -1 })
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime(), b = blink.current
    if (t > b.next && b.at < 0) { b.at = t; b.next = t + 2.5 + Math.random() * 3 }
    let e: Expr = state === 'listening' ? 'open' : state === 'thinking' ? 'think' : state === 'error' ? 'sad' : 'happy'
    if (b.at >= 0) { if (t - b.at > 0.16) b.at = -1; else if (e !== 'think') e = 'blink' }
    if (e !== cur.current) { cur.current = e; paintFace(c, e); tex.needsUpdate = true }
  })
  return (
    <mesh scale={[1.366, 1.012, 1.012]}>
      <sphereGeometry args={[1, 64, 48, Math.PI / 2 - 1.0, 2.0, Math.PI / 2 - 0.75, 1.5]} />
      <meshStandardMaterial map={tex} transparent roughness={0.12} metalness={0.25} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={1.1} />
    </mesh>
  )
}

function Robot({ state, reduce }: { state: RobotState; reduce: boolean }) {
  const root = useRef<THREE.Group>(null!)
  const head = useRef<THREE.Group>(null!)
  const ant = useRef<THREE.Group>(null!)
  const armL = useRef<THREE.Group>(null!)
  const armR = useRef<THREE.Group>(null!)
  const ptr = useRef({ x: 0, y: 0, last: -99, spin: 0, drag: false, dx: 0 })
  const wave = useRef({ start: 3 })
  const m = useMemo(() => ({
    white: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3, metalness: 0.05, emissive: '#ffffff', emissiveIntensity: 0.18 }),
    black: new THREE.MeshStandardMaterial({ color: '#0b0d12', roughness: 0.1, metalness: 0.25 }),
    accent: new THREE.MeshStandardMaterial({ color: '#b3401e', roughness: 0.35 }),
    grey: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.5, emissive: '#ffffff', emissiveIntensity: 0.18 }),
  }), [])

  useEffect(() => {
    const mv = (e: PointerEvent) => {
      ptr.current.x = Math.max(-1, Math.min(1, (e.clientX - innerWidth / 2) / (innerWidth / 2)))
      ptr.current.y = Math.max(-1, Math.min(1, (e.clientY - innerHeight / 2) / (innerHeight / 2)))
      ptr.current.last = performance.now() / 1000
      if (ptr.current.drag) { ptr.current.spin += (e.clientX - ptr.current.dx) * 0.012; ptr.current.dx = e.clientX }
    }
    const dn = (e: PointerEvent) => { ptr.current.drag = true; ptr.current.dx = e.clientX }
    const up = () => { ptr.current.drag = false }
    addEventListener('pointermove', mv); addEventListener('pointerdown', dn); addEventListener('pointerup', up)
    return () => { removeEventListener('pointermove', mv); removeEventListener('pointerdown', dn); removeEventListener('pointerup', up) }
  }, [])

  const cur = useRef({ x: 0, y: 0, lean: 0 })
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime(), k = reduce ? 0 : 1, P = ptr.current, C = cur.current
    let tx = P.x, ty = P.y
    if (performance.now() / 1000 - P.last > 4) { tx = Math.sin(t * 0.4) * 0.6; ty = Math.sin(t * 0.27) * 0.25 }
    C.x += (tx - C.x) * 0.06; C.y += (ty - C.y) * 0.06; P.spin *= 0.96
    C.lean += ((state === 'listening' ? 0.55 : 0) - C.lean) * 0.08
    root.current.position.set(0, Math.sin(t * 1.6) * 0.09 * k, C.lean)
    root.current.rotation.y = C.x * 0.35 + Math.sin(t * 0.5) * 0.1 * k + P.spin
    head.current.rotation.set(C.y * 0.3, C.x * 0.45, -C.x * 0.06)
    ant.current.rotation.set(Math.sin(t * 1.7) * 0.08 * k, 0, Math.sin(t * 2.2) * 0.12 * k)
    if (state === 'thinking') { head.current.rotation.z += 0.14 + Math.sin(t * 3) * 0.05; ant.current.rotation.z += Math.sin(t * 9) * 0.18 }
    if (state === 'speaking' && !reduce) { head.current.rotation.x += Math.sin(t * 9) * 0.05; root.current.position.y += Math.abs(Math.sin(t * 7)) * 0.04 }
    if (state === 'error') head.current.rotation.z += 0.22
    // arms + wave (idle only)
    armL.current.rotation.z = 0.22 + Math.sin(t * 1.6 + 1) * 0.05 * k
    const w = t - wave.current.start
    let rz = -0.22 - Math.sin(t * 1.6) * 0.05 * k
    if (!reduce && state === 'idle' && w > 0 && w < 2.4) {
      rz = -(0.55 + Math.abs(Math.sin(w * 5)) * 0.9) * Math.min(1, w * 3) * Math.min(1, (2.4 - w) * 3) - 0.22 * (1 - Math.min(1, w * 3))
    } else if (w >= 2.4) wave.current.start = t + 7
    armR.current.rotation.z = rz
  })

  return (
    <group ref={root}>
      <Ell s={[1.05, 1, 0.95]} p={[0, -1.2, 0]} m={m.white} />
      <mesh position={[0, -1.5, 0.9]} material={m.grey}><boxGeometry args={[0.42, 0.07, 0.03]} /></mesh>
      <group ref={head} position={[0, 0.55, 0]}>
        <Ell s={[1.35, 1, 1]} p={[0, 0, 0]} m={m.white} />
        <Face state={state} />
        {[-1, 1].map((sx) => (
          <group key={sx} position={[sx * 1.4, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <mesh material={m.white}><cylinderGeometry args={[0.2, 0.2, 0.3, 32]} /></mesh>
            <mesh material={m.accent}><cylinderGeometry args={[0.13, 0.13, 0.34, 32]} /></mesh>
          </group>
        ))}
        <group ref={ant} position={[0, 0.95, 0]}>
          <mesh position={[0, 0.25, 0]} material={m.black}><cylinderGeometry args={[0.04, 0.04, 0.5, 16]} /></mesh>
          <Ell s={[0.15, 0.15, 0.15]} p={[0, 0.5, 0]} m={m.accent} />
        </group>
      </group>
      {[-1, 1].map((sx) => (
        <group key={sx} ref={sx < 0 ? armL : armR} position={[sx * 1.02, -0.65, 0]}>
          <Ell s={[0.22, 0.5, 0.22]} p={[0, -0.42, 0]} m={m.white} />
          <Ell s={[0.2, 0.2, 0.2]} p={[0, -0.9, 0]} m={m.black} />
        </group>
      ))}
    </group>
  )
}

export default function CampusRobot({ state = 'idle', distance = 10.5 }: { state?: RobotState, distance?: number }) {
  const reduce = typeof window !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  return (
    <Canvas
      camera={{ position: [0, 0.1, distance], fov: 30 }}
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 2]}
      style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
      onCreated={({ camera }) => camera.lookAt(0, -0.25, 0)}
    >
      <hemisphereLight args={['#ffffff', '#aab1bf', 1.6]} />
      <directionalLight position={[3, 5, 7]} intensity={1.8} />
      <directionalLight position={[-4, 2, -3]} intensity={0.5} color="#ffd9c8" />
      <Robot state={state} reduce={reduce} />
      <ContactShadows position={[0, -2.45, 0]} opacity={0.35} scale={6} blur={2.5} far={3} />
    </Canvas>
  )
}
