'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface Hive3DSceneProps {
  className?: string;
}

export function Hive3DScene({ className }: Hive3DSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1. Scene & Camera setup
    const scene = new THREE.Scene();
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 24;

    // 2. WebGL Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setIsSupported(false);
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // 3. Central Hive Node (Icosahedron Crystal Wireframe + Solid Core)
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    // Outer wireframe dodecahedron
    const outerGeo = new THREE.DodecahedronGeometry(5.2, 1);
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b, // Amber-500
      wireframe: true,
      transparent: true,
      opacity: 0.28,
    });
    const outerMesh = new THREE.Mesh(outerGeo, outerMat);
    coreGroup.add(outerMesh);

    // Inner glowing crystal
    const innerGeo = new THREE.IcosahedronGeometry(3.5, 0);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0x6366f1, // Indigo-500
      roughness: 0.2,
      metalness: 0.8,
      transparent: true,
      opacity: 0.75,
      wireframe: false,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    coreGroup.add(innerMesh);

    // Vertex points on outer shell
    const vertexMat = new THREE.PointsMaterial({
      color: 0xfbbf24,
      size: 0.35,
      transparent: true,
      opacity: 0.9,
    });
    const vertexPoints = new THREE.Points(outerGeo, vertexMat);
    coreGroup.add(vertexPoints);

    // 4. Floating Student Particle Swarm (Orbiting Ring)
    const particleCount = 220;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const amberColor = new THREE.Color(0xf59e0b);
    const cyanColor = new THREE.Color(0x38bdf8);
    const purpleColor = new THREE.Color(0xa855f7);

    for (let i = 0; i < particleCount; i++) {
      const radius = 7 + Math.random() * 6;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.8;

      particlePositions[i * 3] = radius * Math.cos(theta) * Math.cos(phi);
      particlePositions[i * 3 + 1] = radius * Math.sin(phi);
      particlePositions[i * 3 + 2] = radius * Math.sin(theta) * Math.cos(phi);

      const colorChoice = Math.random();
      const c = colorChoice < 0.5 ? amberColor : colorChoice < 0.8 ? cyanColor : purpleColor;
      particleColors[i * 3] = c.r;
      particleColors[i * 3 + 1] = c.g;
      particleColors[i * 3 + 2] = c.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const swarmMat = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });

    const particleSwarm = new THREE.Points(particleGeo, swarmMat);
    scene.add(particleSwarm);

    // 5. Orbital Ring
    const ringGeo = new THREE.TorusGeometry(8.5, 0.04, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.22,
    });
    const orbitalRing = new THREE.Mesh(ringGeo, ringMat);
    orbitalRing.rotation.x = Math.PI / 3;
    orbitalRing.rotation.y = Math.PI / 6;
    scene.add(orbitalRing);

    // 6. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xf59e0b, 2.5, 50);
    pointLight1.position.set(10, 10, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x818cf8, 2, 50);
    pointLight2.position.set(-10, -8, -5);
    scene.add(pointLight2);

    // 7. Interactive Mouse / Touch Parallax
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetX = x * 0.45;
      targetY = y * 0.35;
    };

    window.addEventListener('mousemove', onPointerMove, { passive: true });

    // 8. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Smooth camera / group parallax easing
      currentX += (targetX - currentX) * 0.05;
      currentY += (targetY - currentY) * 0.05;

      coreGroup.rotation.y += (prefersReducedMotion ? 0.001 : 0.005);
      coreGroup.rotation.x = currentY * 0.8 + Math.sin(elapsedTime * 0.4) * 0.08;
      coreGroup.rotation.z = currentX * 0.8;

      innerMesh.rotation.y -= (prefersReducedMotion ? 0.002 : 0.008);
      innerMesh.rotation.x += 0.004;

      particleSwarm.rotation.y += 0.002;
      orbitalRing.rotation.z += 0.003;

      // Subtle breathing scale pulse
      const scale = 1 + Math.sin(elapsedTime * 1.2) * 0.03;
      innerMesh.scale.set(scale, scale, scale);

      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      }
    });

    resizeObserver.observe(container);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', onPointerMove);
      resizeObserver.disconnect();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      outerGeo.dispose();
      innerGeo.dispose();
      particleGeo.dispose();
      ringGeo.dispose();
    };
  }, []);

  if (!isSupported) return null;

  return (
    <div
      ref={mountRef}
      className={className || 'w-full h-full min-h-[380px] sm:min-h-[460px] relative pointer-events-auto'}
      aria-label="Interactive 3D ProjectHive Collaboration Core"
    />
  );
}

