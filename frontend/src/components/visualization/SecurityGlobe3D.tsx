import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import {
  RotateCw,
  Pause,
  Play,
  ShieldAlert,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
  Layers,
  Crosshair,
  ExternalLink,
  ChevronRight,
  Maximize2,
  X,
  CheckCircle2
} from 'lucide-react';
import { Brand, Finding, OfficialAsset } from '../../types/brandguard';

interface SecurityGlobe3DProps {
  brand: Brand;
  officialAssets: OfficialAsset[];
  findings: Finding[];
  className?: string;
  onSelectFinding?: (id: string) => void;
}

interface GlobeNode {
  id: string;
  label: string;
  sublabel: string;
  type: 'brand' | 'official' | 'high_threat' | 'med_threat' | 'low_threat';
  status: string;
  score?: number;
  platform?: string;
  position: THREE.Vector3;
  findingId?: string;
  coordinates: string;
}

export const SecurityGlobe3D: React.FC<SecurityGlobe3DProps> = ({
  brand,
  officialAssets,
  findings,
  className = '',
  onSelectFinding,
}) => {
  const navigate = useNavigate();
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<GlobeNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GlobeNode | null>(null);
  const [isRotating, setIsRotating] = useState(true);
  const [rotationSpeed, setRotationSpeed] = useState<number>(1);
  const [viewFilter, setViewFilter] = useState<'all' | 'threats' | 'official'>('all');
  const [webglError, setWebglError] = useState(false);

  // References to keep state & prevent premature dismissal
  const isCardHoveredRef = useRef(false);
  const dismissTimeoutRef = useRef<number | null>(null);
  const selectedNodeRef = useRef<GlobeNode | null>(null);
  const hoveredNodeRef = useRef<GlobeNode | null>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameId = useRef<number | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const threatPulseRef = useRef<THREE.Mesh[]>([]);
  const dataPacketsRef = useRef<{ mesh: THREE.Mesh; start: THREE.Vector3; end: THREE.Vector3; progress: number; speed: number }[]>([]);

  useEffect(() => {
    selectedNodeRef.current = selectedNode;
  }, [selectedNode]);

  useEffect(() => {
    hoveredNodeRef.current = hoveredNode;
  }, [hoveredNode]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check WebGL availability
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebglError(true);
        return;
      }
    } catch {
      setWebglError(true);
      return;
    }

    const width = container.clientWidth || 540;
    const height = container.clientHeight || 360;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 2.5, 17.5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Balanced Studio Lighting (Clean white key light so Red and Amber colors render true)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight1.position.set(12, 16, 20);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.9);
    dirLight2.position.set(-15, -10, 10);
    scene.add(dirLight2);

    // 3. Main Rotating Group
    const globeGroup = new THREE.Group();
    globeGroupRef.current = globeGroup;
    scene.add(globeGroup);

    // Dark core sphere representing protected brand
    const coreGeo = new THREE.SphereGeometry(3.6, 40, 40);
    const coreMat = new THREE.MeshPhongMaterial({
      color: 0x050d14,
      emissive: 0x061e24,
      specular: 0x06b6d4,
      shininess: 35,
      transparent: true,
      opacity: 0.92,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    globeGroup.add(coreMesh);

    // Latitude & Longitude coordinate rings
    const gridGroup = new THREE.Group();
    for (let lat = -60; lat <= 60; lat += 30) {
      const radius = 3.65 * Math.cos((lat * Math.PI) / 180);
      const y = 3.65 * Math.sin((lat * Math.PI) / 180);
      const latRingGeo = new THREE.RingGeometry(radius - 0.015, radius + 0.015, 64);
      const latRingMat = new THREE.MeshBasicMaterial({
        color: 0x162c3e,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35,
      });
      const latRing = new THREE.Mesh(latRingGeo, latRingMat);
      latRing.rotation.x = Math.PI / 2;
      latRing.position.y = y;
      gridGroup.add(latRing);
    }

    // Longitudinal meridians
    for (let lon = 0; lon < 180; lon += 45) {
      const lonRingGeo = new THREE.RingGeometry(3.64, 3.67, 64);
      const lonRingMat = new THREE.MeshBasicMaterial({
        color: 0x162c3e,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.25,
      });
      const lonRing = new THREE.Mesh(lonRingGeo, lonRingMat);
      lonRing.rotation.y = (lon * Math.PI) / 180;
      gridGroup.add(lonRing);
    }
    globeGroup.add(gridGroup);

    // Outer Hexagonal / Icosahedron Defense Shield wireframe
    const wireGeo = new THREE.IcosahedronGeometry(3.8, 2);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    globeGroup.add(wireMesh);

    // 4. Subtle Orbital Defense Radar Rings
    const ringGeo1 = new THREE.RingGeometry(5.2, 5.25, 80);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3,
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 2.3;
    globeGroup.add(ring1);

    const ringGeo2 = new THREE.RingGeometry(6.7, 6.74, 80);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.22,
    });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.x = Math.PI / 3;
    ring2.rotation.y = Math.PI / 5;
    globeGroup.add(ring2);

    // Outer Threat Perimeter Ring (Red/Amber)
    const ringGeo3 = new THREE.RingGeometry(7.8, 7.84, 80);
    const ringMat3 = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.15,
    });
    const ring3 = new THREE.Mesh(ringGeo3, ringMat3);
    ring3.rotation.x = -Math.PI / 4;
    ring3.rotation.z = Math.PI / 6;
    globeGroup.add(ring3);

    // 5. Build Nodes from real brand official assets + threat findings
    const nodeList: GlobeNode[] = [];
    const interactiveMeshes: { mesh: THREE.Mesh; data: GlobeNode }[] = [];
    const pulseMeshes: THREE.Mesh[] = [];
    const dataPackets: { mesh: THREE.Mesh; start: THREE.Vector3; end: THREE.Vector3; progress: number; speed: number }[] = [];

    // Center brand node
    const brandNodeData: GlobeNode = {
      id: 'core-brand',
      label: brand.name,
      sublabel: brand.domain || 'Primary Domain',
      type: 'brand',
      status: 'Protected Core Asset',
      coordinates: '0.00°N / 0.00°E (HQ CORE)',
      position: new THREE.Vector3(0, 0, 0),
    };
    nodeList.push(brandNodeData);

    // Official assets (emerald nodes positioned along inner perimeter)
    officialAssets.forEach((ast, idx) => {
      const angle = (idx / Math.max(1, officialAssets.length)) * Math.PI * 2;
      const radius = 5.2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius * 0.45;
      const z = Math.sin(angle) * radius * 0.9;
      const pos = new THREE.Vector3(x, y, z);

      const latDeg = (Math.sin(angle) * 45).toFixed(1);
      const lonDeg = (Math.cos(angle) * 120).toFixed(1);

      const nodeData: GlobeNode = {
        id: ast.id,
        label: `${ast.platform || ast.store}: @${ast.handle || ast.package_id}`,
        sublabel: ast.display_name || 'Official Perimeter Asset',
        type: 'official',
        platform: ast.platform || ast.store,
        status: ast.verification_status === 'verified' ? 'Verified Official Baseline' : 'Registered Asset',
        coordinates: `${latDeg}°N / ${lonDeg}°E`,
        position: pos,
      };
      nodeList.push(nodeData);

      // Node Sphere Mesh
      const nodeGeo = new THREE.SphereGeometry(0.34, 20, 20);
      const nodeMat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        roughness: 0.2,
      });
      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
      nodeMesh.position.copy(pos);
      nodeMesh.userData = { id: ast.id, type: 'official' };
      globeGroup.add(nodeMesh);

      interactiveMeshes.push({ mesh: nodeMesh, data: nodeData });

      // Arc connecting core to official asset
      const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), pos]);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x10b981,
        transparent: true,
        opacity: 0.35,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      globeGroup.add(line);
    });

    // Threat candidates: sample both High (Red) and Medium (Amber) so both risk levels are visibly represented
    const highThreats = findings.filter((f) => f.band === 'high' || (typeof f.score === 'number' && f.score >= 75));
    const medThreats = findings.filter(
      (f) => (f.band === 'medium' || f.band === 'needs_review') && (!f.score || f.score < 75)
    );

    const selectedThreats: Finding[] = [];
    const maxThreatCount = 8;
    const maxHigh = Math.min(highThreats.length, Math.max(1, Math.ceil(maxThreatCount / 2)));
    const maxMed = Math.min(medThreats.length, maxThreatCount - maxHigh);

    selectedThreats.push(...highThreats.slice(0, maxHigh));
    selectedThreats.push(...medThreats.slice(0, maxMed));

    if (selectedThreats.length < maxThreatCount) {
      const remaining = [...highThreats.slice(maxHigh), ...medThreats.slice(maxMed)];
      selectedThreats.push(...remaining.slice(0, maxThreatCount - selectedThreats.length));
    }

    selectedThreats.forEach((th, idx) => {
      const angle = (idx / Math.max(1, selectedThreats.length)) * Math.PI * 2 + Math.PI / 4;
      const radius = 6.9;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius * 0.48 + (idx % 2 === 0 ? 0.9 : -0.9);
      const z = Math.sin(angle) * radius * 0.88;
      const pos = new THREE.Vector3(x, y, z);

      const isHigh = th.band === 'high' || (typeof th.score === 'number' && th.score >= 75);
      const latDeg = (Math.sin(angle * 2) * 55).toFixed(1);
      const lonDeg = (Math.cos(angle * 1.5) * 160).toFixed(1);

      const nodeData: GlobeNode = {
        id: th.id,
        label: `${th.candidate.platform_or_store}: ${th.candidate.name}`,
        sublabel: `Risk Score ${th.score}/100 (${isHigh ? 'High Risk Threat · Crimson Red Node' : 'Medium Risk Threat · Amber Yellow Node'})`,
        type: isHigh ? 'high_threat' : 'med_threat',
        status: th.summary_short,
        score: th.score,
        platform: th.candidate.platform_or_store,
        position: pos,
        findingId: th.id,
        coordinates: `${latDeg}°N / ${lonDeg}°W (${isHigh ? 'High Risk Adversarial Node' : 'Medium Suspicious Node'})`,
      };
      nodeList.push(nodeData);

      // Node Sphere Mesh: High risk is larger vivid crimson red; Medium risk is golden amber/yellow
      const nodeGeo = new THREE.SphereGeometry(isHigh ? 0.44 : 0.32, 22, 22);
      const nodeMat = new THREE.MeshStandardMaterial({
        color: isHigh ? 0xff1744 : 0xfbbf24,
        emissive: isHigh ? 0xd50000 : 0xb45309,
        emissiveIntensity: isHigh ? 0.95 : 0.75,
        roughness: 0.15,
        metalness: 0.1,
      });
      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
      nodeMesh.position.copy(pos);
      nodeMesh.userData = { id: th.id, type: 'threat' };
      globeGroup.add(nodeMesh);

      interactiveMeshes.push({ mesh: nodeMesh, data: nodeData });

      // Pulsing Radar Ring around threat nodes (Vivid Red for high, Golden Amber for medium)
      const pulseGeo = new THREE.RingGeometry(isHigh ? 0.52 : 0.38, isHigh ? 0.64 : 0.46, 24);
      const pulseMat = new THREE.MeshBasicMaterial({
        color: isHigh ? 0xff1744 : 0xfbbf24,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: isHigh ? 0.85 : 0.55,
      });
      const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
      pulseMesh.position.copy(pos);
      pulseMesh.lookAt(0, 0, 0);
      globeGroup.add(pulseMesh);
      pulseMeshes.push(pulseMesh);

      // Trajectory Line from threat toward core (Red for High, Amber for Medium)
      const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), pos]);
      const lineMat = new THREE.LineDashedMaterial({
        color: isHigh ? 0xff1744 : 0xf59e0b,
        dashSize: isHigh ? 0.4 : 0.3,
        gapSize: 0.25,
        transparent: true,
        opacity: isHigh ? 0.75 : 0.4,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      line.computeLineDistances();
      globeGroup.add(line);

      // Streaming telemetry packet mesh
      const packetGeo = new THREE.SphereGeometry(isHigh ? 0.14 : 0.1, 12, 12);
      const packetMat = new THREE.MeshBasicMaterial({
        color: isHigh ? 0xff1744 : 0xfbbf24,
      });
      const packet = new THREE.Mesh(packetGeo, packetMat);
      packet.position.copy(pos);
      globeGroup.add(packet);
      dataPackets.push({
        mesh: packet,
        start: pos.clone(),
        end: new THREE.Vector3(0, 0, 0),
        progress: (idx * 0.15) % 1,
        speed: 0.25 + (idx % 3) * 0.08,
      });
    });

    threatPulseRef.current = pulseMeshes;
    dataPacketsRef.current = dataPackets;

    // 6. Ambient Space & Cyber Data Dust
    const particlesGeo = new THREE.BufferGeometry();
    const particleCount = 160;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      const radius = 4.0 + Math.random() * 4.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = radius * Math.cos(phi);
    }
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particlesMat = new THREE.PointsMaterial({
      color: 0x06b6d4,
      size: 0.09,
      transparent: true,
      opacity: 0.55,
    });
    const particles = new THREE.Points(particlesGeo, particlesMat);
    globeGroup.add(particles);

    // 7. Interactive Raycasting & Mouse Controls with Persistence Protection
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (e: MouseEvent) => {
      isDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging) {
        const deltaX = e.clientX - prevMousePos.x;
        const deltaY = e.clientY - prevMousePos.y;
        globeGroup.rotation.y += deltaX * 0.006;
        globeGroup.rotation.x += deltaY * 0.006;
        prevMousePos = { x: e.clientX, y: e.clientY };
        return;
      }

      // If user's mouse is currently over the floating action card, NEVER clear it!
      if (isCardHoveredRef.current) {
        document.body.style.cursor = 'default';
        return;
      }

      // Raycast for hover on nodes
      raycaster.setFromCamera(mouse, camera);
      const visibleMeshes = interactiveMeshes
        .filter((m) => {
          if (viewFilter === 'threats') return m.data.type === 'high_threat' || m.data.type === 'med_threat';
          if (viewFilter === 'official') return m.data.type === 'official' || m.data.type === 'brand';
          return true;
        })
        .map((m) => m.mesh);

      const intersects = raycaster.intersectObjects(visibleMeshes);
      if (intersects.length > 0 && intersects[0]?.object) {
        const hit = interactiveMeshes.find((m) => m.mesh === intersects[0]?.object);
        if (hit) {
          // Found node: synchronously lock refs so subsequent mouse moves won't clear
          hoveredNodeRef.current = hit.data;
          selectedNodeRef.current = hit.data;
          if (dismissTimeoutRef.current) {
            window.clearTimeout(dismissTimeoutRef.current);
            dismissTimeoutRef.current = null;
          }
          setHoveredNode(hit.data);
          setSelectedNode(hit.data);
          document.body.style.cursor = 'pointer';
          return;
        }
      }

      // No node directly under ray
      document.body.style.cursor = 'default';

      // CRITICAL FIX: Once a node is hovered or selected, DO NOT clear or dismiss it
      // when the user moves their cursor towards the 'Validate & Triage' button!
      // The inspection stays pinned until the user clicks (X) close or selects a different node.
      if (selectedNodeRef.current || hoveredNodeRef.current || isCardHoveredRef.current) {
        return;
      }
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    const handleClick = () => {
      raycaster.setFromCamera(mouse, camera);
      const visibleMeshes = interactiveMeshes.map((m) => m.mesh);
      const intersects = raycaster.intersectObjects(visibleMeshes);
      if (intersects.length > 0 && intersects[0]?.object) {
        const hit = interactiveMeshes.find((m) => m.mesh === intersects[0]?.object);
        if (hit) {
          if (dismissTimeoutRef.current) {
            window.clearTimeout(dismissTimeoutRef.current);
            dismissTimeoutRef.current = null;
          }
          setSelectedNode(hit.data);
          setHoveredNode(hit.data);
          if (hit.data.findingId && onSelectFinding) {
            onSelectFinding(hit.data.findingId);
          }
        }
      }
    };

    // Zoom with scroll wheel
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = Math.min(26, Math.max(10, camera.position.z + e.deltaY * 0.015));
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    domElement.addEventListener('click', handleClick);
    domElement.addEventListener('wheel', handleWheel, { passive: false });

    // 8. Animation Loop
    let lastTime = performance.now();
    let pulsePhase = 0;

    const animate = () => {
      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      pulsePhase += delta * 2.5;

      // UX Improvement: Pause rotation while the user is actively inspecting a node or card
      // so the candidate/asset node doesn't rotate away while trying to reach it!
      const isInspecting = isCardHoveredRef.current || hoveredNodeRef.current !== null || selectedNodeRef.current !== null;

      if (isRotating && !isDragging && !isInspecting) {
        const speedMultiplier = rotationSpeed;
        globeGroup.rotation.y += 0.22 * speedMultiplier * delta;
        globeGroup.rotation.x += 0.04 * speedMultiplier * delta;
        ring1.rotation.z += 0.12 * speedMultiplier * delta;
        ring2.rotation.z -= 0.09 * speedMultiplier * delta;
        ring3.rotation.z += 0.06 * speedMultiplier * delta;
      }

      // Animate threat pulsing rings
      pulseMeshes.forEach((mesh, i) => {
        const scale = 1 + ((pulsePhase + i * 0.5) % 1) * 1.8;
        mesh.scale.set(scale, scale, 1);
        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(0, 0.8 - ((pulsePhase + i * 0.5) % 1) * 0.8);
      });

      // Animate flowing data telemetry packets
      dataPackets.forEach((p) => {
        p.progress = (p.progress + delta * p.speed) % 1;
        p.mesh.position.lerpVectors(p.start, p.end, p.progress);
      });

      particles.rotation.y += 0.04 * delta;

      renderer.render(scene, camera);
      animFrameId.current = requestAnimationFrame(animate);
    };

    animFrameId.current = requestAnimationFrame(animate);

    // Resize Handler
    const handleResize = () => {
      if (!container || !rendererRef.current) return;
      const newW = container.clientWidth || 540;
      const newH = container.clientHeight || 360;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      if (dismissTimeoutRef.current) window.clearTimeout(dismissTimeoutRef.current);
      window.removeEventListener('resize', handleResize);
      domElement.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      domElement.removeEventListener('click', handleClick);
      domElement.removeEventListener('wheel', handleWheel);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [brand, officialAssets, findings, isRotating, rotationSpeed, viewFilter, onSelectFinding]);

  const handleResetView = () => {
    if (globeGroupRef.current) {
      globeGroupRef.current.rotation.set(0, 0, 0);
    }
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 2.5, 17.5);
    }
  };

  const handleZoom = (direction: 'in' | 'out') => {
    if (cameraRef.current) {
      const delta = direction === 'in' ? -2.5 : 2.5;
      cameraRef.current.position.z = Math.min(26, Math.max(10, cameraRef.current.position.z + delta));
    }
  };

  const handleCloseCard = () => {
    setSelectedNode(null);
    setHoveredNode(null);
    selectedNodeRef.current = null;
    hoveredNodeRef.current = null;
    isCardHoveredRef.current = false;
    if (dismissTimeoutRef.current) {
      window.clearTimeout(dismissTimeoutRef.current);
      dismissTimeoutRef.current = null;
    }
  };

  const activeDisplayNode = hoveredNode || selectedNode;

  return (
    <div
      className={`relative w-full h-[380px] rounded-[10px] border border-[var(--line-strong)] bg-gradient-to-b from-[#080E16] via-[#060A0E] to-[#04070B] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.6)] ${className}`}
    >
      {/* Top Overlay HUD Bar */}
      <div className="absolute top-3.5 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        {/* Status indicator */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-[5px] bg-[#09121B]/85 backdrop-blur-md border border-[var(--line-strong)]">
          <div className="relative flex items-center justify-center w-2 h-2">
            <span className="absolute w-3 h-3 rounded-full bg-[var(--cyan-accent)] opacity-75 animate-ping" />
            <span className="w-2 h-2 rounded-full bg-[var(--cyan-accent)]" />
          </div>
          <span className="text-[11.5px] font-bold tracking-wider uppercase text-white font-mono-code">
            Spatial Threat Perimeter · {brand.name}
          </span>
          <span className="text-[10px] font-mono-code text-[var(--cyan-accent)] px-1.5 py-0.5 rounded bg-[var(--cyan-glow)]">
            LIVE 3D
          </span>
        </div>

        {/* View Filter Pill and Interactive Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Filter switches */}
          <div className="hidden sm:flex items-center p-0.5 rounded-[5px] bg-[#09121B]/90 backdrop-blur-md border border-[var(--line-strong)] text-[11px] font-mono-code text-[var(--text-muted)]">
            <button
              onClick={() => setViewFilter('all')}
              className={`px-2 py-0.5 rounded-[3px] transition-colors cursor-pointer ${
                viewFilter === 'all' ? 'bg-[var(--line-strong)] text-white font-medium' : 'hover:text-white'
              }`}
            >
              All ({officialAssets.length + findings.length})
            </button>
            <button
              onClick={() => setViewFilter('threats')}
              className={`px-2 py-0.5 rounded-[3px] transition-colors cursor-pointer ${
                viewFilter === 'threats' ? 'bg-[var(--high-bg)] text-[var(--high)] font-semibold' : 'hover:text-white'
              }`}
            >
              Threats
            </button>
            <button
              onClick={() => setViewFilter('official')}
              className={`px-2 py-0.5 rounded-[3px] transition-colors cursor-pointer ${
                viewFilter === 'official' ? 'bg-[var(--official-bg)] text-[var(--official)] font-semibold' : 'hover:text-white'
              }`}
            >
              Baselines
            </button>
          </div>

          {/* Speed Toggle */}
          <button
            onClick={() => setRotationSpeed((prev) => (prev === 1 ? 2 : prev === 2 ? 0.5 : 1))}
            className="h-7 px-2 rounded-[5px] bg-[#09121B]/90 backdrop-blur-md border border-[var(--line-strong)] text-[11px] font-mono-code text-[var(--text-secondary)] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title={`Rotation speed: ${rotationSpeed}x`}
          >
            {rotationSpeed}x
          </button>

          {/* Pause / Play */}
          <button
            onClick={() => setIsRotating(!isRotating)}
            className="w-7 h-7 rounded-[5px] bg-[#09121B]/90 backdrop-blur-md border border-[var(--line-strong)] text-[var(--text-secondary)] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title={isRotating ? 'Pause rotation' : 'Resume rotation'}
          >
            {isRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          {/* Zoom controls */}
          <button
            onClick={() => handleZoom('in')}
            className="w-7 h-7 rounded-[5px] bg-[#09121B]/90 backdrop-blur-md border border-[var(--line-strong)] text-[var(--text-secondary)] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Zoom in (+)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleZoom('out')}
            className="w-7 h-7 rounded-[5px] bg-[#09121B]/90 backdrop-blur-md border border-[var(--line-strong)] text-[var(--text-secondary)] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Zoom out (-)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          {/* Reset Camera View */}
          <button
            onClick={handleResetView}
            className="w-7 h-7 rounded-[5px] bg-[#09121B]/90 backdrop-blur-md border border-[var(--line-strong)] text-[var(--text-secondary)] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Reset perspective"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* WebGL Canvas Container */}
      {!webglError ? (
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      ) : (
        /* Fallback if WebGL unavailable */
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-2">
          <ShieldCheck className="w-10 h-10 text-[var(--official)]" />
          <p className="text-[13px] text-[var(--text-secondary)] font-medium">
            Brand Asset Topology: {officialAssets.length} verified official nodes protected against {findings.length} active threats.
          </p>
        </div>
      )}

      {/* Persistent & Interactive HUD Card with Dismiss Protection */}
      {activeDisplayNode && (
        <div
          onMouseEnter={() => {
            isCardHoveredRef.current = true;
            if (dismissTimeoutRef.current) {
              window.clearTimeout(dismissTimeoutRef.current);
              dismissTimeoutRef.current = null;
            }
          }}
          onMouseLeave={() => {
            isCardHoveredRef.current = false;
          }}
          className="absolute bottom-3.5 left-4 right-4 sm:right-auto sm:max-w-lg z-30 p-4 rounded-[10px] bg-[#09121B]/98 backdrop-blur-xl border border-[var(--line-active)] shadow-[0_16px_40px_rgba(0,0,0,0.9)] animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 min-w-0 flex-1">
              {/* Type Badge & Coordinates */}
              <div className="flex items-center gap-2">
                {activeDisplayNode.type === 'official' ? (
                  <span className="px-2 py-0.5 rounded bg-[var(--official-bg)] text-[var(--official)] text-[10.5px] font-mono-code font-bold flex items-center gap-1 border border-[var(--official-border)]">
                    <ShieldCheck className="w-3 h-3" /> VERIFIED OFFICIAL ASSET
                  </span>
                ) : activeDisplayNode.type === 'brand' ? (
                  <span className="px-2 py-0.5 rounded bg-[var(--cyan-glow)] text-[var(--cyan-accent)] text-[10.5px] font-mono-code font-bold border border-[var(--cyan-accent)]/40">
                    PROTECTED CORE BRAND
                  </span>
                ) : activeDisplayNode.type === 'high_threat' ? (
                  <span className="px-2 py-0.5 rounded bg-[var(--high-bg)] text-[#ff4d4d] text-[10.5px] font-mono-code font-bold flex items-center gap-1 border border-[var(--high-border)]">
                    <ShieldAlert className="w-3 h-3 text-[#ff4d4d]" /> HIGH RISK (RED NODE)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-[var(--med-bg)] text-[#fbbf24] text-[10.5px] font-mono-code font-bold flex items-center gap-1 border border-[var(--med-border)]">
                    <ShieldAlert className="w-3 h-3 text-[#fbbf24]" /> MEDIUM RISK (AMBER NODE)
                  </span>
                )}
                <span className="text-[11px] font-mono-code text-[var(--text-muted)] truncate">
                  {activeDisplayNode.coordinates}
                </span>
              </div>

              {/* Title & Platform */}
              <div className="font-bold text-white text-[14.5px] truncate">
                {activeDisplayNode.label}
              </div>

              {/* Description / Status */}
              <p className="text-[12px] text-[var(--text-secondary)] leading-snug line-clamp-2">
                {activeDisplayNode.sublabel}
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={handleCloseCard}
              className="w-6 h-6 rounded-[4px] border border-[var(--line-strong)] hover:border-[var(--line-active)] text-[var(--text-muted)] hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Close inspection card"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Action Footer Bar */}
          <div className="mt-3.5 pt-2.5 border-t border-[var(--line-subtle)] flex items-center justify-between gap-3">
            <span className="text-[11px] font-mono-code text-[var(--cyan-accent)] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--cyan-accent)] animate-pulse" />
              Inspection pinned · Rotation paused
            </span>

            {/* Dynamic Action Buttons */}
            {activeDisplayNode.findingId && onSelectFinding ? (
              <button
                type="button"
                onClick={() => onSelectFinding(activeDisplayNode.findingId!)}
                className={`h-8 px-4 rounded-[5px] text-white text-[12px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeDisplayNode.type === 'high_threat'
                    ? 'bg-[#ef4444] hover:bg-[#dc2626] shadow-[0_0_14px_rgba(239,68,68,0.6)]'
                    : 'bg-[#f59e0b] hover:bg-[#d97706] shadow-[0_0_14px_rgba(245,158,11,0.6)]'
                }`}
              >
                <span>Validate & Triage</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : activeDisplayNode.type === 'official' ? (
              <button
                type="button"
                onClick={() => navigate(`/brands/${brand.id}/profile`)}
                className="h-8 px-4 rounded-[5px] bg-gradient-to-r from-[#06b6d4] to-[#10b981] hover:brightness-110 text-[#041217] text-[12px] font-bold flex items-center gap-1.5 shadow-[0_0_14px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
              >
                <span>Validate Baseline</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate(`/brands/${brand.id}/profile`)}
                className="h-8 px-4 rounded-[5px] bg-[var(--bg-surface-elevated)] border border-[var(--cyan-accent)] hover:bg-[var(--cyan-accent)] hover:text-[#041217] text-[var(--cyan-accent)] text-[12px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Inspect Baseline</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Visual Color Legend Bar */}
      {!activeDisplayNode && (
        <div className="absolute bottom-3 left-4 z-10 hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-[6px] bg-[#09121B]/95 backdrop-blur-md border border-[var(--line-strong)] text-[11px] font-mono-code pointer-events-none shadow-lg">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff1744] shadow-[0_0_8px_rgba(255,23,68,0.95)]" />
            <span className="text-[#ff4d4d] font-bold">Red: High Risk</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24] shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
            <span className="text-[#fbbf24] font-bold">Amber: Medium Risk</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
            <span className="text-[#34d399] font-bold">Green: Verified</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#06b6d4] shadow-[0_0_8px_rgba(6,182,212,0.9)]" />
            <span className="text-[var(--cyan-accent)] font-bold">Cyan: HQ</span>
          </div>
        </div>
      )}

      {/* Cyber Corner HUD Crosshairs */}
      <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[var(--cyan-accent)]/40 pointer-events-none" />
      <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[var(--cyan-accent)]/40 pointer-events-none" />
      <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-[var(--cyan-accent)]/40 pointer-events-none" />
      <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-[var(--cyan-accent)]/40 pointer-events-none" />
    </div>
  );
};
