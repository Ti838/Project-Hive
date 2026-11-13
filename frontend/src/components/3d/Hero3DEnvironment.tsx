'use client';
// ─── ProjectHive — Hero 3D Interactive Environment ──────────────────────────────
// Inspired by Lusion, Active Theory, and Spline.
// High-performance Three.js scene featuring the Neural ProjectHive Core,
// orbital team rings, constellation particle field, and inertia-damped cursor parallax.

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface Hero3DEnvironmentProps {
  className?: string;
  onLoaded?: () => void;
}

export function Hero3DEnvironment({ className, onLoaded }: Hero3DEnvironmentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [isInteractive, setIsInteractive] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Detect reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1. Scene, Camera, and Depth Setup
    const scene = new THREE.Scene();
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(0, 0, 22);

    // 2. High-Performance WebGL Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setHasWebGL(false);
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // 3. Central Hive Architecture (The Neural Incubation Core)
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // Outer Geodesic Amber Honeycomb Lattice
    const outerGeo = new THREE.DodecahedronGeometry(4.8, 1);
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b, // Amber-500
      wireframe: true,
      transparent: true,
      opacity: 0.32,
    });
    const outerLattice = new THREE.Mesh(outerGeo, outerMat);
    masterGroup.add(outerLattice);

    // Golden Crystalline Nodes on Vertices
    const vertexMat = new THREE.PointsMaterial({
      color: 0xfbbf24,
      size: 0.32,
      transparent: true,
      opacity: 0.95,
    });
    const vertexPoints = new THREE.Points(outerGeo, vertexMat);
    masterGroup.add(vertexPoints);

    // Inner Translucent Hologram Crystal (Violet / Indigo Core)
    const innerGeo = new THREE.IcosahedronGeometry(3.0, 0);
    const innerMat = new THREE.MeshPhysicalMaterial({
      color: 0x6366f1, // Indigo
      emissive: 0x312e81,
      emissiveIntensity: 0.45,
      roughness: 0.25,
      metalness: 0.65,
      transparent: true,
      opacity: 0.85,
      flatShading: true,
    });
    const innerCrystal = new THREE.Mesh(innerGeo, innerMat);
    masterGroup.add(innerCrystal);

    // 4. Concentric Orbital Energy Rings (Representing Squads & Teams in Orbit)
    const ringsGroup = new THREE.Group();
    masterGroup.add(ringsGroup);

    const ringDefs = [
      { radius: 6.8, tube: 0.035, color: 0xf59e0b, rotX: Math.PI / 3, rotY: Math.PI / 8, opacity: 0.4 },
      { radius: 8.6, tube: 0.03, color: 0x818cf8, rotX: -Math.PI / 4, rotY: Math.PI / 4, opacity: 0.3 },
      { radius: 10.4, tube: 0.025, color: 0x38bdf8, rotX: Math.PI / 2.3, rotY: -Math.PI / 6, opacity: 0.25 },
    ];

    const ringMeshes: THREE.Mesh[] = [];
    ringDefs.forEach(({ radius, tube, color, rotX, rotY, opacity }) => {
      const geo = new THREE.TorusGeometry(radius, tube, 16, 120);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = rotX;
      mesh.rotation.y = rotY;
      ringsGroup.add(mesh);
      ringMeshes.push(mesh);
    });

    // 5. Constellation Swarm of Student Talent Nodes
    const particleCount = 260;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const colAmber = new THREE.Color(0xf59e0b);
    const colIndigo = new THREE.Color(0x818cf8);
    const colCyan = new THREE.Color(0x38bdf8);

    for (let i = 0; i < particleCount; i++) {
      const radius = 6.5 + Math.random() * 8.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.9;

      particlePositions[i * 3] = radius * Math.cos(theta) * Math.cos(phi);
      particlePositions[i * 3 + 1] = radius * Math.sin(phi);
      particlePositions[i * 3 + 2] = radius * Math.sin(theta) * Math.cos(phi);

      const dice = Math.random();
      const col = dice < 0.45 ? colAmber : dice < 0.8 ? colIndigo : colCyan;
      particleColors[i * 3] = col.r;
      particleColors[i * 3 + 1] = col.g;
      particleColors[i * 3 + 2] = col.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.19,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    const particleSwarm = new THREE.Points(particleGeo, particleMat);
    masterGroup.add(particleSwarm);

    // 6. Realistic Ambient & Key Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const amberLight = new THREE.PointLight(0xf59e0b, 3.2, 45);
    amberLight.position.set(12, 10, 12);
    scene.add(amberLight);

    const indigoLight = new THREE.PointLight(0x6366f1, 2.8, 45);
    indigoLight.position.set(-12, -8, 8);
    scene.add(indigoLight);

    // 7. Inertia-Damped Cursor & Parallax Controls
    let targetRotX = 0;
    let targetRotY = 0;
    let curRotX = 0;
    let curRotY = 0;

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetRotY = nx * 0.45;
      targetRotX = -ny * 0.35;
      if (!isInteractive) setIsInteractive(true);
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });

    // 8. Visibility & RAF Loop with IntersectionObserver
    let isVisible = true;
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.1 }
    );
    observer.observe(container);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth inertia easing
      curRotX += (targetRotX - curRotX) * 0.04;
      curRotY += (targetRotY - curRotY) * 0.04;

      masterGroup.rotation.x = curRotX + Math.sin(elapsed * 0.35) * 0.05;
      masterGroup.rotation.y += prefersReducedMotion ? 0.001 : 0.004 + curRotY * 0.05;

      innerCrystal.rotation.y -= 0.007;
      innerCrystal.rotation.x += 0.003;

      // Subtle pulse
      const breathe = 1 + Math.sin(elapsed * 1.5) * 0.025;
      innerCrystal.scale.set(breathe, breathe, breathe);

      // Rotate individual orbital rings
      ringMeshes.forEach((rm, idx) => {
        rm.rotation.z += (idx + 1) * 0.0018;
      });

      particleSwarm.rotation.y += 0.0015;

      renderer.render(scene, camera);
    };

    animate();
    if (onLoaded) onLoaded();

    // 9. Resize Handling
    const handleResize = () => {
      if (!container) return;
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      if (nw > 0 && nh > 0) {
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
      }
    };

    window.addEventListener('resize', handleResize, { passive: true });

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      outerGeo.dispose();
      outerMat.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      ringMeshes.forEach((rm) => {
        rm.geometry.dispose();
        (rm.material as THREE.Material).dispose();
      });
    };
  }, [onLoaded]);

  if (!hasWebGL) {
    return (
      <div className={`relative flex items-center justify-center ${className || 'w-full h-full min-h-[400px]'}`}>
        <div className="absolute inset-0 bg-radial from-amber-500/10 via-indigo-500/5 to-transparent blur-3xl" />
        <div className="relative z-10 text-center p-6 border border-white/10 rounded-2xl bg-white/[0.02] backdrop-blur-md">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center p-3">
            <img src="/logo.png" alt="ProjectHive" className="w-full h-full object-contain" />
          </div>
          <p className="text-xs text-muted-foreground font-mono">ProjectHive Neural Mesh • Active</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[420px] sm:min-h-[520px] overflow-hidden pointer-events-auto cursor-grab active:cursor-grabbing ${className || ''}`}
      aria-label="Interactive 3D ProjectHive Collaboration Core"
    />
  );
}

