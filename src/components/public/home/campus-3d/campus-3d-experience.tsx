import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { Campus3DQuality } from "./campus-3d-loader";

interface Campus3DExperienceProps {
  onReady: () => void;
  onUnavailable: (reason: string) => void;
  quality: Campus3DQuality;
}

interface BuildingOptions {
  position: [number, number, number];
  size: [number, number, number];
  color: number;
  accent: number;
  windows: number;
}

const CAMERA_POSITION = new THREE.Vector3(12, 10, 15);
const CAMERA_TARGET = new THREE.Vector3(0, 0.4, 0);

function createBuilding({ position, size, color, accent, windows }: BuildingOptions) {
  const group = new THREE.Group();
  group.position.set(...position);

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(...size),
    new THREE.MeshStandardMaterial({ color, roughness: 0.78, metalness: 0.02 }),
  );
  body.position.y = size[1] / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(size[0] + 0.28, 0.18, size[2] + 0.28),
    new THREE.MeshStandardMaterial({ color: accent, roughness: 0.7 }),
  );
  roof.position.y = size[1] + 0.09;
  roof.castShadow = true;
  group.add(roof);

  const windowMaterial = new THREE.MeshStandardMaterial({ color: 0xa9d7dc, roughness: 0.35, metalness: 0.08 });
  const windowWidth = Math.min(0.62, (size[0] - 0.6) / windows);
  const spacing = size[0] / windows;
  for (let index = 0; index < windows; index += 1) {
    const window = new THREE.Mesh(new THREE.BoxGeometry(windowWidth, 0.62, 0.05), windowMaterial);
    window.position.set(-size[0] / 2 + spacing * (index + 0.5), size[1] * 0.58, size[2] / 2 + 0.03);
    group.add(window);
  }

  const entrance = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, Math.min(1.15, size[1] * 0.7), 0.08),
    new THREE.MeshStandardMaterial({ color: 0x173f38, roughness: 0.65 }),
  );
  entrance.position.set(0, Math.min(1.15, size[1] * 0.7) / 2, size[2] / 2 + 0.05);
  group.add(entrance);

  return group;
}

function createTree(x: number, z: number, scale = 1) {
  const tree = new THREE.Group();
  tree.position.set(x, 0, z);

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09 * scale, 0.13 * scale, 0.75 * scale, 8),
    new THREE.MeshStandardMaterial({ color: 0x7d6042, roughness: 1 }),
  );
  trunk.position.y = 0.375 * scale;
  trunk.castShadow = true;

  const crown = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.56 * scale, 1),
    new THREE.MeshStandardMaterial({ color: 0x3d7456, roughness: 0.95 }),
  );
  crown.position.y = 1.12 * scale;
  crown.castShadow = true;

  tree.add(trunk, crown);
  return tree;
}

function buildCampusScene(scene: THREE.Scene) {
  const campus = new THREE.Group();
  campus.rotation.y = -0.1;

  const ground = new THREE.Mesh(
    new THREE.BoxGeometry(17, 0.25, 13),
    new THREE.MeshStandardMaterial({ color: 0xdde6d2, roughness: 0.96 }),
  );
  ground.position.y = -0.16;
  ground.receiveShadow = true;
  campus.add(ground);

  const courtyard = new THREE.Mesh(
    new THREE.CylinderGeometry(2.45, 2.45, 0.08, 48),
    new THREE.MeshStandardMaterial({ color: 0xd7c8aa, roughness: 0.9 }),
  );
  courtyard.position.set(0, 0.02, 0.25);
  courtyard.receiveShadow = true;
  campus.add(courtyard);

  const pathMaterial = new THREE.MeshStandardMaterial({ color: 0xc9b997, roughness: 0.92 });
  const paths: Array<[number, number, number, number]> = [
    [0, 5.6, 1.15, 5.1],
    [-5.1, 0.3, 4.6, 0.8],
    [5.1, 0.3, 4.6, 0.8],
  ];
  paths.forEach(([x, z, width, depth]) => {
    const path = new THREE.Mesh(new THREE.BoxGeometry(width, 0.05, depth), pathMaterial);
    path.position.set(x, 0, z);
    path.receiveShadow = true;
    campus.add(path);
  });

  campus.add(
    createBuilding({ position: [0, 0, -4.2], size: [6.4, 2.35, 1.65], color: 0xf1eee4, accent: 0xb4914e, windows: 7 }),
    createBuilding({ position: [-5.15, 0, -0.9], size: [3.35, 1.55, 2.1], color: 0xd98770, accent: 0xa85749, windows: 4 }),
    createBuilding({ position: [5.15, 0, -0.75], size: [3.8, 1.9, 2.25], color: 0x2f775d, accent: 0x174b3c, windows: 4 }),
    createBuilding({ position: [4.5, 0, 4.25], size: [4.7, 2.55, 2.15], color: 0x8ab8c9, accent: 0x315b70, windows: 5 }),
    createBuilding({ position: [-4.3, 0, 4.45], size: [3.6, 1.7, 1.8], color: 0xeee8d9, accent: 0xb4914e, windows: 4 }),
  );

  [[-7, -4.6, 1], [-7, 3, 0.85], [7.2, -4.4, 0.95], [7.1, 3.3, 1], [-2.4, 5.6, 0.75], [1.2, 5.7, 0.8]]
    .forEach(([x, z, scale]) => campus.add(createTree(x, z, scale)));

  const court = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 0.06, 2),
    new THREE.MeshStandardMaterial({ color: 0xb8624f, roughness: 0.88 }),
  );
  court.position.set(-4.2, 0.01, 2.1);
  court.receiveShadow = true;
  campus.add(court);

  scene.add(campus);
}

function disposeScene(scene: THREE.Scene) {
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => material.dispose());
  });
}

function debugCampus3D(stage: string, details: Record<string, unknown> = {}) {
  if (import.meta.env.DEV) console.info(`[Campus3D] ${stage}`, details);
}

export function Campus3DExperience({ onReady, onUnavailable, quality }: Campus3DExperienceProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const [isTouchInteractionActive, setIsTouchInteractionActive] = useState(false);
  const coarsePointer = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.enabled = !coarsePointer || isTouchInteractionActive;
    if (controls.domElement) {
      controls.domElement.style.touchAction = coarsePointer && !isTouchInteractionActive
        ? "pan-y pinch-zoom"
        : "none";
    }
  }, [coarsePointer, isTouchInteractionActive]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const lowQuality = quality === "low" || coarsePointer || window.innerWidth < 768;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe9eee5);
    scene.fog = new THREE.Fog(0xe9eee5, 22, 38);

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
    camera.position.copy(CAMERA_POSITION);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !lowQuality,
        alpha: false,
        powerPreference: lowQuality ? "default" : "high-performance",
      });
    } catch (error) {
      debugCampus3D("renderer initialization failed", { error, quality });
      onUnavailable("renderer-initialization-failed");
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowQuality ? 1.15 : 1.6));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.04;
    renderer.shadowMap.enabled = !lowQuality;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.className = "campus-3d-experience__canvas";
    renderer.domElement.tabIndex = 0;
    renderer.domElement.setAttribute("aria-label", "Interactive illustrative model of a school campus. Drag to rotate and use the reset button to return to the initial view.");
    mount.appendChild(renderer.domElement);

    const hemisphere = new THREE.HemisphereLight(0xf8fbf5, 0x80977d, 2.15);
    const sunlight = new THREE.DirectionalLight(0xfff3d2, 3.1);
    sunlight.position.set(8, 13, 7);
    sunlight.castShadow = !lowQuality;
    sunlight.shadow.mapSize.set(1024, 1024);
    sunlight.shadow.camera.left = -11;
    sunlight.shadow.camera.right = 11;
    sunlight.shadow.camera.top = 11;
    sunlight.shadow.camera.bottom = -11;
    scene.add(hemisphere, sunlight);
    buildCampusScene(scene);

    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.target.copy(CAMERA_TARGET);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.minDistance = 11;
    controls.maxDistance = 24;
    controls.minPolarAngle = Math.PI * 0.2;
    controls.maxPolarAngle = Math.PI * 0.47;
    controls.minAzimuthAngle = -Math.PI * 0.42;
    controls.maxAzimuthAngle = Math.PI * 0.42;
    controls.enabled = !coarsePointer;
    renderer.domElement.style.touchAction = coarsePointer ? "pan-y pinch-zoom" : "none";
    controls.update();

    let frameId = 0;
    let isInViewport = false;
    let isDocumentVisible = !document.hidden;
    let isRunning = false;

    const resize = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    const renderFrame = () => {
      if (!isRunning) return;
      controls.update();
      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(renderFrame);
    };

    const updateLoop = () => {
      const shouldRun = isInViewport && isDocumentVisible;
      if (shouldRun && !isRunning) {
        isRunning = true;
        debugCampus3D("rendering resumed");
        renderFrame();
      } else if (!shouldRun && isRunning) {
        isRunning = false;
        window.cancelAnimationFrame(frameId);
        debugCampus3D("rendering paused", { documentHidden: !isDocumentVisible, outsideViewport: !isInViewport });
      }
    };

    const resizeObserver = new ResizeObserver(resize);
    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        isInViewport = Boolean(entry?.isIntersecting);
        updateLoop();
      },
      { threshold: 0.01 },
    );
    const handleVisibilityChange = () => {
      isDocumentVisible = !document.hidden;
      updateLoop();
    };
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      isRunning = false;
      window.cancelAnimationFrame(frameId);
      renderer.domElement.style.opacity = "0";
      debugCampus3D("WebGL context lost");
      onUnavailable("webgl-context-lost");
    };

    resizeObserver.observe(mount);
    visibilityObserver.observe(mount);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    renderer.domElement.addEventListener("webglcontextlost", handleContextLost);
    resize();
    renderer.render(scene, camera);
    debugCampus3D("first frame rendered", {
      canvasHeight: renderer.domElement.height,
      canvasWidth: renderer.domElement.width,
      clientHeight: mount.clientHeight,
      clientWidth: mount.clientWidth,
      quality,
    });
    onReady();
    updateLoop();

    return () => {
      isRunning = false;
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      renderer.domElement.removeEventListener("webglcontextlost", handleContextLost);
      controls.dispose();
      controlsRef.current = null;
      disposeScene(scene);
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [coarsePointer, onReady, onUnavailable, quality]);

  const resetView = () => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.object.position.copy(CAMERA_POSITION);
    controls.target.copy(CAMERA_TARGET);
    controls.update();
  };

  return (
    <div className={`campus-3d-experience${isTouchInteractionActive ? " is-touch-active" : ""}`}>
      <div className="campus-3d-experience__mount" ref={mountRef} />
      <span className="campus-3d-experience__badge" aria-hidden="true">Interactive 3D campus</span>
      <div className="campus-3d-experience__legend" aria-hidden="true">
        <span><i className="is-nursery" />Nursery</span>
        <span><i className="is-primary" />Primary</span>
        <span><i className="is-secondary" />Secondary</span>
      </div>
      <div className="campus-3d-experience__controls">
        {coarsePointer ? (
          <button type="button" onClick={() => setIsTouchInteractionActive((active) => !active)}>
            {isTouchInteractionActive ? "Exit interaction" : "Explore 3D"}
          </button>
        ) : null}
        <button type="button" onClick={resetView}>Reset view</button>
      </div>
    </div>
  );
}
