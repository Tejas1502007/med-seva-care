"use client";
import { useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sphere, Torus, OrbitControls, Environment, MeshWobbleMaterial } from "@react-three/drei";
import * as THREE from "three";

function DNAHelix() {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame(({ clock }) => {
    groupRef.current.rotation.y = clock.getElapsedTime() * 0.3;
    groupRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.2) * 0.1;
  });

  const points: React.ReactElement[] = [];
  const count = 12;
  for (let i = 0; i < count; i++) {
    const t = (i / count) * Math.PI * 2;
    const y = (i / count) * 4 - 2;
    const r1 = 0.6;
    const r2 = 0.6;

    points.push(
      <Float key={`s1-${i}`} speed={1.5} rotationIntensity={0} floatIntensity={0.3}>
        <mesh position={[Math.cos(t) * r1, y, Math.sin(t) * r1]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial color="#2563EB" emissive="#2563EB" emissiveIntensity={0.4} metalness={0.3} roughness={0.2} />
        </mesh>
      </Float>,
      <Float key={`s2-${i}`} speed={1.5} rotationIntensity={0} floatIntensity={0.3}>
        <mesh position={[Math.cos(t + Math.PI) * r2, y, Math.sin(t + Math.PI) * r2]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial color="#14B8A6" emissive="#14B8A6" emissiveIntensity={0.4} metalness={0.3} roughness={0.2} />
        </mesh>
      </Float>
    );

    if (i % 2 === 0) {
      const x1 = Math.cos(t) * r1;
      const z1 = Math.sin(t) * r1;
      const x2 = Math.cos(t + Math.PI) * r2;
      const z2 = Math.sin(t + Math.PI) * r2;
      const midX = (x1 + x2) / 2;
      const midZ = (z1 + z2) / 2;
      const dx = x2 - x1;
      const dz = z2 - z1;
      const len = Math.sqrt(dx * dx + dz * dz);

      points.push(
        <mesh
          key={`bar-${i}`}
          position={[midX, y, midZ]}
          rotation={[0, -Math.atan2(dz, dx), Math.PI / 2]}
        >
          <cylinderGeometry args={[0.02, 0.02, len, 6]} />
          <meshStandardMaterial color="#94A3B8" opacity={0.5} transparent metalness={0.5} roughness={0.3} />
        </mesh>
      );
    }
  }

  return <group ref={groupRef}>{points}</group>;
}

function FloatingOrb({ position, color, size = 0.3, speed = 1 }: {
  position: [number, number, number];
  color: string;
  size?: number;
  speed?: number;
}) {
  return (
    <Float speed={speed} rotationIntensity={0.5} floatIntensity={1}>
      <Sphere args={[size, 32, 32]} position={position}>
        <MeshDistortMaterial
          color={color}
          distort={0.3}
          speed={2}
          metalness={0.2}
          roughness={0.1}
          opacity={0.85}
          transparent
        />
      </Sphere>
    </Float>
  );
}

function MedicalRing({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    meshRef.current.rotation.x = clock.getElapsedTime() * 0.4;
    meshRef.current.rotation.z = clock.getElapsedTime() * 0.2;
  });
  return (
    <Torus ref={meshRef} args={[0.8, 0.06, 16, 100]} position={position}>
      <meshStandardMaterial color="#3B82F6" metalness={0.8} roughness={0.1} emissive="#3B82F6" emissiveIntensity={0.2} />
    </Torus>
  );
}

function HeartbeatPulse() {
  const meshRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    const s = 1 + Math.sin(clock.getElapsedTime() * 2) * 0.08;
    meshRef.current.scale.setScalar(s);
  });
  return (
    <Float speed={1} floatIntensity={0.5} rotationIntensity={0.1}>
      <mesh ref={meshRef} position={[1.8, 0.5, 0]}>
        <sphereGeometry args={[0.22, 32, 32]} />
        <MeshWobbleMaterial color="#EF4444" factor={0.2} speed={3} metalness={0.1} roughness={0.4} emissive="#EF4444" emissiveIntensity={0.3} />
      </mesh>
    </Float>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} color="#ffffff" />
      <directionalLight position={[-5, -3, -5]} intensity={0.4} color="#14B8A6" />
      <pointLight position={[2, 2, 2]} intensity={0.8} color="#2563EB" />
      <pointLight position={[-2, -2, 2]} intensity={0.5} color="#14B8A6" />

      <DNAHelix />
      <MedicalRing position={[0, 0, 0]} />
      <FloatingOrb position={[-2, 1, -1]} color="#2563EB" size={0.2} speed={1.2} />
      <FloatingOrb position={[2, -1, -0.5]} color="#14B8A6" size={0.15} speed={0.9} />
      <FloatingOrb position={[-1.5, -1.5, 0.5]} color="#6366F1" size={0.12} speed={1.5} />
      <HeartbeatPulse />

      <Environment preset="city" />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.5}
        maxPolarAngle={Math.PI * 0.65}
        minPolarAngle={Math.PI * 0.35}
      />
    </>
  );
}

function Fallback() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500/20 to-teal-500/20 animate-pulse" />
    </div>
  );
}

export default function Hero3D() {
  return (
    <div className="w-full h-full">
      <Suspense fallback={<Fallback />}>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true }}
          style={{ background: "transparent" }}
        >
          <Scene />
        </Canvas>
      </Suspense>
    </div>
  );
}
