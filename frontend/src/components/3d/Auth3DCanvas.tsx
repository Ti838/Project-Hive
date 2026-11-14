'use client';
// ─── ProjectHive — Auth 3D Interactive Canvas ─────────────────────────────────
// Inspired by Clerk, WorkOS AuthKit, and Spline.
// Embedded WebGL 3D Canvas tailored specifically for /login and /register portals.
// Features dual mode compositions:
//   - 'signin': Secure Golden Crystal & Gyroscopic Orbital Shell (Security & Access)
//   - 'signup': Expanding Neural Collaboration Mesh & Student Nodes (Discovery & Growth)

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface Auth3DCanvasProps {
  mode: 'signin' | 'signup' | 'admin';
  className?: string;
}

export function Auth3DCanvas({ mode, className }: Auth3DCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1. Scene, Camera, Depth
    const scene = new THREE.Scene();
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 450;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 0, 16);

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
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // 3. Mode-Specific 3D Assets
    const disposables: { dispose: () => void }[] = [];

    if (mode === 'admin') {
      // ── ADMIN MODE: "The Institutional Cryptographic Core" ──
      // Central high-security Icosahedron core
      const coreGeo = new THREE.IcosahedronGeometry(2.5, 0);
      const coreMat = new THREE.MeshPhysicalMaterial({
        color: 0x0f172a, // Slate-900 titanium
        emissive: 0xd97706, // Amber glow
        emissiveIntensity: 0.45,
        roughness: 0.1,
        metalness: 0.95,
        wireframe: false,
        flatShading: true,
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      rootGroup.add(core);
      disposables.push(coreGeo, coreMat);

      // Wireframe overlay for tactical lattice
      const wireMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, wireframe: true, transparent: true, opacity: 0.6 });
      const wireCore = new THREE.Mesh(coreGeo, wireMat);
      wireCore.scale.setScalar(1.02);
      rootGroup.add(wireCore);
      disposables.push(wireMat);

      // Dual rotating radar rings (Emerald & Amber)
      const radarGeo1 = new THREE.TorusGeometry(4.6, 0.04, 16, 100);
      const radarMat1 = new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.55 });
      const radar1 = new THREE.Mesh(radarGeo1, radarMat1);
      radar1.rotation.x = Math.PI / 3;
      rootGroup.add(radar1);
      disposables.push(radarGeo1, radarMat1);

      const radarGeo2 = new THREE.TorusGeometry(5.4, 0.035, 16, 100);
      const radarMat2 = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.45 });
      const radar2 = new THREE.Mesh(radarGeo2, radarMat2);
      radar2.rotation.y = Math.PI / 4;
      rootGroup.add(radar2);
      disposables.push(radarGeo2, radarMat2);

      // Floating security telemetry nodes
      const pCount = 90;
      const pGeo = new THREE.BufferGeometry();
      const pPos = new Float32Array(pCount * 3);
      for (let i = 0; i < pCount; i++) {
        const rad = 3.4 + Math.random() * 3.0;
        const ang = Math.random() * Math.PI * 2;
        const elevation = (Math.random() - 0.5) * 2.8;
        pPos[i * 3] = rad * Math.cos(ang);
        pPos[i * 3 + 1] = elevation;
        pPos[i * 3 + 2] = rad * Math.sin(ang);
      }
      pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
      const pMat = new THREE.PointsMaterial({ color: 0x10b981, size: 0.16, transparent: true, opacity: 0.85 });
      const pField = new THREE.Points(pGeo, pMat);
      rootGroup.add(pField);
      disposables.push(pGeo, pMat);
    } else if (mode === 'signin') {
      // ── SIGN IN MODE: "The Key of Knowledge" ──
      // Central multifaceted amber crystal
      const crystalGeo = new THREE.OctahedronGeometry(2.8, 0);
      const crystalMat = new THREE.MeshPhysicalMaterial({
        color: 0xf59e0b, // Amber-500
        emissive: 0x78350f,
        emissiveIntensity: 0.35,
        roughness: 0.15,
        metalness: 0.8,
        flatShading: true,
        transparent: true,
        opacity: 0.9,
      });
      const crystal = new THREE.Mesh(crystalGeo, crystalMat);
      rootGroup.add(crystal);
      disposables.push(crystalGeo, crystalMat);

      // Gyroscopic protective ring 1
      const ringGeo1 = new THREE.TorusGeometry(4.4, 0.04, 16, 80);
      const ringMat1 = new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.45 });
      const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
      ring1.rotation.x = Math.PI / 4;
      rootGroup.add(ring1);
      disposables.push(ringGeo1, ringMat1);

      // Gyroscopic protective ring 2
      const ringGeo2 = new THREE.TorusGeometry(5.2, 0.035, 16, 80);
      const ringMat2 = new THREE.MeshBasicMaterial({ color: 0x818cf8, transparent: true, opacity: 0.35 });
      const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
      ring2.rotation.y = Math.PI / 3;
      rootGroup.add(ring2);
      disposables.push(ringGeo2, ringMat2);

      // Subtle orbiting security particles
      const pCount = 80;
      const pGeo = new THREE.BufferGeometry();
      const pPos = new Float32Array(pCount * 3);
      for (let i = 0; i < pCount; i++) {
        const rad = 3.6 + Math.random() * 2.8;
        const ang = Math.random() * Math.PI * 2;
        const elevation = (Math.random() - 0.5) * 2.2;
        pPos[i * 3] = rad * Math.cos(ang);
        pPos[i * 3 + 1] = elevation;
        pPos[i * 3 + 2] = rad * Math.sin(ang);
      }
      pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
      const pMat = new THREE.PointsMaterial({ color: 0xf59e0b, size: 0.15, transparent: true, opacity: 0.8 });
      const pField = new THREE.Points(pGeo, pMat);
      rootGroup.add(pField);
      disposables.push(pGeo, pMat);
    } else {
      // ── SIGN UP MODE: "The Neural Collaboration Mesh" ──
      // Central team cluster: multiple student node spheres connected by glowing lines
      const nodeCount = 9;
      const nodesGroup = new THREE.Group();
      rootGroup.add(nodesGroup);

      const nodePositions: THREE.Vector3[] = [
        new THREE.Vector3(0, 0, 0),         // Hub node
        new THREE.Vector3(2.5, 1.4, 0.8),   // Frontend dev
        new THREE.Vector3(-2.2, 1.8, -0.5), // Backend engineer
        new THREE.Vector3(1.8, -2.0, 1.2),  // UI/UX designer
        new THREE.Vector3(-2.0, -1.6, -1.0),// AI researcher
        new THREE.Vector3(0.5, 2.6, -1.2),  // Mobile lead
        new THREE.Vector3(-0.8, -2.4, 1.5), // Data scientist
        new THREE.Vector3(2.8, -0.4, -1.4), // QA engineer
        new THREE.Vector3(-2.6, 0.2, 1.6),  // Product manager
      ];

      const nodeColors = [
        0xf59e0b, // Amber
        0x6366f1, // Indigo
        0x38bdf8, // Cyan
        0xec4899, // Pink
        0x10b981, // Emerald
        0xa855f7, // Purple
        0xf97316, // Orange
        0x06b6d4, // Cyan
        0xfbbf24, // Amber
      ];

      nodePositions.forEach((pos, idx) => {
        const radius = idx === 0 ? 0.9 : 0.45;
        const sphereGeo = new THREE.SphereGeometry(radius, 24, 24);
        const sphereMat = new THREE.MeshPhysicalMaterial({
          color: nodeColors[idx],
          emissive: nodeColors[idx],
          emissiveIntensity: 0.35,
          roughness: 0.2,
          metalness: 0.7,
        });
        const sphere = new THREE.Mesh(sphereGeo, sphereMat);
        sphere.position.copy(pos);
        nodesGroup.add(sphere);
        disposables.push(sphereGeo, sphereMat);
      });

      // Connecting network filaments
      const lineMat = new THREE.LineBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.25 });
      disposables.push(lineMat);

      for (let i = 1; i < nodePositions.length; i++) {
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
          nodePositions[0],
          nodePositions[i],
        ]);
        const line = new THREE.Line(lineGeo, lineMat);
        nodesGroup.add(line);
        disposables.push(lineGeo);
      }

      // Outer bounding constellation ring
      const ringGeo = new THREE.TorusGeometry(4.8, 0.025, 16, 80);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x818cf8, transparent: true, opacity: 0.3 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 3;
      rootGroup.add(ring);
      disposables.push(ringGeo, ringMat);
    }

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const warmLight = new THREE.PointLight(0xf59e0b, 2.5, 35);
    warmLight.position.set(8, 8, 8);
    scene.add(warmLight);

    const coolLight = new THREE.PointLight(0x6366f1, 2.2, 35);
    coolLight.position.set(-8, -6, 6);
    scene.add(coolLight);

    // 5. Pointer Parallax
    let targetX = 0;
    let targetY = 0;
    let curX = 0;
    let curY = 0;

    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetY = nx * 0.35;
      targetX = -ny * 0.25;
    };

    window.addEventListener('mousemove', onPointerMove, { passive: true });

    // 6. Animation Loop
    let animationFrameId: number;
    let isVisible = true;
    const clock = new THREE.Clock();

    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    }, { threshold: 0.1 });
    observer.observe(container);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const elapsed = clock.getElapsedTime();

      // Smooth inertia
      curX += (targetX - curX) * 0.05;
      curY += (targetY - curY) * 0.05;

      rootGroup.rotation.x = curX + Math.sin(elapsed * 0.4) * 0.06;
      rootGroup.rotation.y += prefersReducedMotion ? 0.001 : 0.006 + curY * 0.04;

      // Subtle breathing
      const scale = 1 + Math.sin(elapsed * 1.6) * 0.02;
      rootGroup.scale.set(scale, scale, scale);

      renderer.render(scene, camera);
    };

    animate();

    // 7. Resize Observer
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

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      disposables.forEach((d) => d.dispose());
    };
  }, [mode]);

  if (!hasWebGL) {
    return (
      <div className={`relative flex items-center justify-center ${className || 'w-full h-full min-h-[300px]'}`}>
        <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center p-3">
          <img src="/logo.png" alt="ProjectHive" className="w-full h-full object-contain" />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[320px] pointer-events-auto cursor-grab active:cursor-grabbing ${className || ''}`}
      aria-label={`Interactive 3D ${mode === 'signin' ? 'Sign In' : 'Sign Up'} Visual`}
    />
  );
}

