import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  buildViewportRotateCommit,
  buildViewportScaleCommit,
  buildViewportTranslateCommit,
  type ProxyScene
} from "./sceneProjection";
import type {
  ViewportRotateCommit,
  ViewportScaleCommit,
  ViewportTranslateCommit
} from "./types";

type ViewportOptions = {
  onSelect: (instanceId: string) => void;
  onTranslateCommit: (commit: ViewportTranslateCommit) => void;
  onScaleCommit: (commit: ViewportScaleCommit) => void;
  onRotateCommit: (commit: ViewportRotateCommit) => void;
};

type DragState = {
  mode: "translate" | "scale" | "rotate";
  instanceId: string;
  mesh: THREE.Mesh;
  plane?: THREE.Plane;
  startIntersection?: THREE.Vector3;
  startPointerX?: number;
  startPointerY?: number;
  startPosition?: [number, number, number];
  startRotation?: [number, number, number];
  startScale?: [number, number, number];
  nextCommit?: ViewportTranslateCommit;
  nextScaleCommit?: ViewportScaleCommit;
  nextRotateCommit?: ViewportRotateCommit;
  moved: boolean;
};

export function mountViewport(
  container: HTMLElement,
  proxyScene: ProxyScene,
  options: ViewportOptions
): () => void {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.className = "viewport-canvas";
  container.replaceChildren(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#fbf6ea");

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  const controls = new OrbitControls(camera, renderer.domElement);
  const draggableControls = controls as OrbitControls & {
    enableRotate: boolean;
    enablePan: boolean;
  };
  controls.enableDamping = true;
  controls.target.set(proxyScene.center[0], proxyScene.center[1], proxyScene.center[2]);

  const ambient = new THREE.AmbientLight("#ffffff", 0.8);
  const keyLight = new THREE.DirectionalLight("#fff8ea", 1.3);
  keyLight.position.set(5, 9, 6);
  const fillLight = new THREE.DirectionalLight("#bed7ff", 0.7);
  fillLight.position.set(-4, 5, -2);
  const ground = new THREE.GridHelper(18, 18, "#d2c2a5", "#eadfc9");
  scene.add(ambient, keyLight, fillLight, ground);

  const boundsSize = Math.max(
    proxyScene.bounds.max[0] - proxyScene.bounds.min[0],
    proxyScene.bounds.max[1] - proxyScene.bounds.min[1],
    proxyScene.bounds.max[2] - proxyScene.bounds.min[2],
    2
  );
  camera.position.set(
    proxyScene.center[0] + boundsSize * 1.4,
    proxyScene.center[1] + boundsSize * 1.1,
    proxyScene.center[2] + boundsSize * 1.6
  );

  const proxyMeshes: THREE.Mesh[] = [];
  const outlinesByInstanceId = new Map<string, THREE.LineSegments>();
  for (const node of proxyScene.nodes) {
    const geometry = new THREE.BoxGeometry(node.size[0], node.size[1], node.size[2]);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(node.selected ? "#ef7d32" : node.colorHex),
      roughness: 0.72,
      metalness: 0.08
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(node.position[0], node.position[1], node.position[2]);
    mesh.rotation.set(
      THREE.MathUtils.degToRad(node.rotation[0]),
      THREE.MathUtils.degToRad(node.rotation[1]),
      THREE.MathUtils.degToRad(node.rotation[2])
    );
    mesh.userData.instanceId = node.instanceId;
    mesh.userData.selected = node.selected;
    mesh.userData.translationMode = node.translationMode;
    mesh.userData.scaleMode = node.scaleMode;
    mesh.userData.rotationMode = node.rotationMode;
    mesh.userData.authoredRotation = node.rotation;
    mesh.userData.authoredScale = node.authoredScale;
    scene.add(mesh);
    proxyMeshes.push(mesh);

    if (node.selected) {
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geometry),
        new THREE.LineBasicMaterial({ color: "#472316" })
      );
      edges.position.copy(mesh.position);
      edges.rotation.copy(mesh.rotation);
      scene.add(edges);
      outlinesByInstanceId.set(node.instanceId, edges);
    }
  }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let dragState: DragState | undefined;

  function updatePointer(event: PointerEvent): void {
    const bounds = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
  }

  function intersectAuthoringPlane(event: PointerEvent, plane: THREE.Plane): THREE.Vector3 | undefined {
    updatePointer(event);
    raycaster.setFromCamera(pointer, camera);
    const intersection = new THREE.Vector3();

    return raycaster.ray.intersectPlane(plane, intersection) ?? undefined;
  }

  function beginDrag(mode: DragState["mode"]): void {
    draggableControls.enableRotate = false;
    draggableControls.enablePan = false;
    renderer.domElement.classList.add("dragging", `dragging-${mode}`);
  }

  function clearDragClasses(): void {
    renderer.domElement.classList.remove(
      "dragging",
      "dragging-translate",
      "dragging-scale",
      "dragging-rotate"
    );
  }

  function handlePointerDown(event: PointerEvent): void {
    if (event.button !== 0) {
      return;
    }

    updatePointer(event);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(proxyMeshes, false)[0];
    const hitMesh = hit?.object as THREE.Mesh | undefined;
    const instanceId = hit?.object.userData.instanceId;
    if (typeof instanceId === "string") {
      if (event.altKey && hitMesh?.userData.rotationMode === "z") {
        const authoredRotation = hitMesh.userData.authoredRotation as [number, number, number];

        dragState = {
          mode: "rotate",
          instanceId,
          mesh: hitMesh,
          startPointerX: event.clientX,
          startRotation: authoredRotation,
          moved: false
        };
        beginDrag("rotate");
        event.preventDefault();
        return;
      }

      if (event.shiftKey && hitMesh?.userData.scaleMode === "uniform") {
        const authoredScale = hitMesh.userData.authoredScale as [number, number, number];

        dragState = {
          mode: "scale",
          instanceId,
          mesh: hitMesh,
          startPointerY: event.clientY,
          startScale: authoredScale,
          moved: false
        };
        beginDrag("scale");
        event.preventDefault();
        return;
      }

      if (hitMesh?.userData.translationMode === "xy") {
        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -hitMesh.position.z);
        const startIntersection = intersectAuthoringPlane(event, plane);

        if (startIntersection) {
          dragState = {
            mode: "translate",
            instanceId,
            mesh: hitMesh,
            plane,
            startIntersection: startIntersection.clone(),
            startPosition: [hitMesh.position.x, hitMesh.position.y, hitMesh.position.z],
            moved: false
          };
          beginDrag("translate");
          event.preventDefault();
          return;
        }
      }

      options.onSelect(instanceId);
    }
  }

  function handlePointerMove(event: PointerEvent): void {
    if (!dragState) {
      return;
    }

    if (dragState.mode === "rotate") {
      const startRotation = dragState.startRotation;
      const startPointerX = dragState.startPointerX;
      if (!startRotation || startPointerX === undefined) {
        return;
      }

      const nextRotateCommit = buildViewportRotateCommit(
        dragState.instanceId,
        startRotation,
        (event.clientX - startPointerX) / 2
      );
      dragState.nextRotateCommit = nextRotateCommit;
      dragState.moved =
        dragState.moved || Math.abs(nextRotateCommit.rotation[2] - startRotation[2]) > 0.1;

      const nextRotationZ = THREE.MathUtils.degToRad(nextRotateCommit.rotation[2]);
      dragState.mesh.rotation.z = nextRotationZ;
      const outline = outlinesByInstanceId.get(dragState.instanceId);
      if (outline) {
        outline.rotation.z = nextRotationZ;
      }
      return;
    }

    if (dragState.mode === "scale") {
      const startScale = dragState.startScale;
      const startPointerY = dragState.startPointerY;
      if (!startScale || startPointerY === undefined) {
        return;
      }

      const nextScaleCommit = buildViewportScaleCommit(
        dragState.instanceId,
        startScale,
        (startPointerY - event.clientY) / 160
      );
      dragState.nextScaleCommit = nextScaleCommit;
      dragState.moved =
        dragState.moved || Math.abs(nextScaleCommit.scale[0] - startScale[0]) > 0.001;

      const previewScale = nextScaleCommit.scale.map(
        (component, index) => component / startScale[index]
      ) as [number, number, number];
      dragState.mesh.scale.set(previewScale[0], previewScale[1], previewScale[2]);
      outlinesByInstanceId
        .get(dragState.instanceId)
        ?.scale.set(previewScale[0], previewScale[1], previewScale[2]);
      return;
    }

    const plane = dragState.plane;
    const startPosition = dragState.startPosition;
    const startIntersection = dragState.startIntersection;
    if (!plane || !startPosition || !startIntersection) {
      return;
    }

    const intersection = intersectAuthoringPlane(event, plane);
    if (!intersection) {
      return;
    }

    const nextCommit = buildViewportTranslateCommit(dragState.instanceId, startPosition, [
      intersection.x - startIntersection.x,
      intersection.y - startIntersection.y
    ]);
    dragState.nextCommit = nextCommit;
    dragState.moved =
      dragState.moved ||
      Math.abs(nextCommit.position[0] - startPosition[0]) > 0.001 ||
      Math.abs(nextCommit.position[1] - startPosition[1]) > 0.001;

    dragState.mesh.position.set(
      nextCommit.position[0],
      nextCommit.position[1],
      nextCommit.position[2]
    );
    outlinesByInstanceId
      .get(dragState.instanceId)
      ?.position.set(nextCommit.position[0], nextCommit.position[1], nextCommit.position[2]);
  }

  function handlePointerUp(): void {
    if (!dragState) {
      return;
    }

    const completedDrag = dragState;
    dragState = undefined;
    draggableControls.enableRotate = true;
    draggableControls.enablePan = true;
    clearDragClasses();

    if (completedDrag.moved && completedDrag.nextRotateCommit) {
      options.onRotateCommit(completedDrag.nextRotateCommit);
      return;
    }

    if (completedDrag.moved && completedDrag.nextScaleCommit) {
      options.onScaleCommit(completedDrag.nextScaleCommit);
      return;
    }

    if (completedDrag.moved && completedDrag.nextCommit) {
      options.onTranslateCommit(completedDrag.nextCommit);
    }
  }

  renderer.domElement.addEventListener("pointerdown", handlePointerDown);
  globalThis.addEventListener("pointermove", handlePointerMove);
  globalThis.addEventListener("pointerup", handlePointerUp);

  function resize(): void {
    const width = Math.max(container.clientWidth, 320);
    const height = Math.max(container.clientHeight, 320);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  const resizeObserver = new ResizeObserver(() => resize());
  resizeObserver.observe(container);
  resize();

  let frame = 0;
  const animate = () => {
    controls.update();
    renderer.render(scene, camera);
    frame = globalThis.requestAnimationFrame(animate);
  };
  animate();

  return () => {
    globalThis.cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
    globalThis.removeEventListener("pointermove", handlePointerMove);
    globalThis.removeEventListener("pointerup", handlePointerUp);
    controls.dispose();
    for (const mesh of proxyMeshes) {
      mesh.geometry.dispose();
      const material = mesh.material;
      if (Array.isArray(material)) {
        material.forEach((entry) => entry.dispose());
      } else {
        material.dispose();
      }
    }
    for (const outline of outlinesByInstanceId.values()) {
      outline.geometry.dispose();
      const material = outline.material;
      if (Array.isArray(material)) {
        material.forEach((entry) => entry.dispose());
      } else {
        material.dispose();
      }
    }
    renderer.dispose();
    container.replaceChildren();
  };
}
