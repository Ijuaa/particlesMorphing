import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import GUI from "lil-gui";
import gsap from "gsap";
import particlesVertexShader from "./shaders/particles/vertex.glsl";
import particlesFragmentShader from "./shaders/particles/fragment.glsl";

/**
 * Base
 */
// Debug
const gui = new GUI({ width: 340 });
const debugObject = {};

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// Loaders
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("./draco/");
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: Math.min(window.devicePixelRatio, 2),
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  sizes.pixelRatio = Math.min(window.devicePixelRatio, 2);

  // Materials
  if (particles) {
    particles.material.uniforms.uResolution.value.set(
      sizes.width * sizes.pixelRatio,
      sizes.height * sizes.pixelRatio
    );
  }

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(sizes.pixelRatio);
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(1, 1, 14);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});

renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(sizes.pixelRatio);

debugObject.clearColor = "#160920";
gui.addColor(debugObject, "clearColor").onChange(() => {
  renderer.setClearColor(debugObject.clearColor);
});
renderer.setClearColor(debugObject.clearColor);

/**
 * Particles
 */
let particles = null;

gltfLoader.load("./pierreColpart.glb", (gltf) => {
  particles = {};
  particles.index = 0;

  // Positions
  const positions = gltf.scene.children.map(
    (child) => child.geometry.attributes.position
  );
  particles.maxCount = 0;

  for (const position of positions) {
    if (position.count > particles.maxCount) {
      particles.maxCount = position.count;
    }
  }

  particles.positions = [];
  for (const position of positions) {
    const originalArray = position.array;
    const newArray = new Float32Array(particles.maxCount * 3);

    for (let i = 0; i < particles.maxCount; i++) {
      const i3 = i * 3;

      if (i3 < originalArray.length) {
        newArray[i3 + 0] = originalArray[i3 + 0];
        newArray[i3 + 1] = originalArray[i3 + 1];
        newArray[i3 + 2] = originalArray[i3 + 2];
      } else {
        const randomIndex = Math.floor(position.count * Math.random()) * 3;
        newArray[i3 + 0] = originalArray[randomIndex + 0];
        newArray[i3 + 1] = originalArray[randomIndex + 1];
        newArray[i3 + 2] = originalArray[randomIndex + 2];
      }
    }

    particles.positions.push(new THREE.Float32BufferAttribute(newArray, 3));
  }

  // Geometry
  const sizesArray = new Float32Array(particles.maxCount);

  for (let i = 0; i < particles.maxCount; i++) {
    sizesArray[i] = Math.random();
  }

  particles.geometry = new THREE.BufferGeometry();
  particles.geometry.setAttribute(
    "position",
    particles.positions[particles.index]
  );
  particles.geometry.setAttribute("aPositionTarget", particles.positions[1]);
  particles.geometry.setAttribute(
    "aSize",
    new THREE.BufferAttribute(sizesArray, 1)
  );
  //   particles.geometry.setIndex(null);

  // Material
  particles.colorA = "#ff0000";
  particles.colorB = "#00ff9d";

  particles.material = new THREE.ShaderMaterial({
    vertexShader: particlesVertexShader,
    fragmentShader: particlesFragmentShader,
    uniforms: {
      uSize: new THREE.Uniform(0.08),
      uResolution: new THREE.Uniform(
        new THREE.Vector2(
          sizes.width * sizes.pixelRatio,
          sizes.height * sizes.pixelRatio
        )
      ),
      uProgress: new THREE.Uniform(-2),
      uColorA: new THREE.Uniform(new THREE.Color(particles.colorA)),
      uColorB: new THREE.Uniform(new THREE.Color(particles.colorB)),
    },
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  // Points
  particles.points = new THREE.Points(particles.geometry, particles.material);
  particles.points.rotation.x = Math.PI * 0.5;
  particles.points.position.set(-2.5, 0, 8);
  scene.add(particles.points);

  // Methods
  // particles.morph = (index) => {
  //   // Update attributes
  //   particles.geometry.attributes.position =
  //     particles.positions[particles.index];
  //   particles.geometry.attributes.aPositionTarget = particles.positions[index];

  //   // Animate uProgress
  //   gsap.fromTo(
  //     particles.material.uniforms.uProgress,
  //     { value: -2 },
  //     { value: 1, duration: 10, ease: "linear" }
  //   );

  //   // Save index
  //   particles.index = index;
  // };
  // particles.morph0 = () => {
  //   particles.morph(0);
  // };
  // particles.morph1 = () => {
  //   particles.morph(1);
  // };
  // particles.morph2 = () => {
  //   particles.morph(2);
  // };
  // particles.morph3 = () => {
  //   particles.morph(3);
  // };

  particles.animate = () => {
    let timeline = gsap.timeline();
  
    // Animation de uProgress de -7 à 0 sur 5 secondes avec une facilité linéaire
    // En même temps, animer la position de la caméra
    timeline.fromTo(
      particles.material.uniforms.uProgress,
      { value: -7 },
      { value: 0, duration: 5, ease: "linear" }
    ).to(
      camera.position,
      { x: 1, duration: 5, ease: "linear" },
      "<" // Commence cette animation en même temps que l'animation précédente
    );
  
    // Pause de 1.5 secondes
    timeline.to({}, { duration: 1.5 });
  
    // Animation de uProgress de 0 à 1 sur 2 secondes avec une facilité linéaire
    // En même temps, animer la position de la caméra
    timeline.to(
      particles.material.uniforms.uProgress,
      { value: 1, duration: 2, ease: "linear" }
    ).to(
      camera.position,
      { x: -1, z: 14, duration: 2, ease: "linear" },
      "<" // Commence cette animation en même temps que l'animation précédente
    );
  
    // Pause de 1.5 secondes
    timeline.to({}, { duration: 1.5 });
  
    // Animation de uProgress de 1 à 20 sur 50 secondes avec une facilité "power4"
    // En même temps, animer la position de la caméra
    timeline.to(
      particles.material.uniforms.uProgress,
      { value: 20, duration: 50, ease: "power4" }
    ).to(
      camera.position,
      { x: 3, duration: 50, ease: "power4" },
      "<" // Commence cette animation en même temps que l'animation précédente
    );
  
    // Lancement de la timeline
    timeline.play();
  }


  // Tweaks
  gui
    .add(particles.material.uniforms.uProgress, "value")
    .min(0)
    .max(1)
    .step(0.0001)
    .listen();

  // gui.add(particles, "morph0");
  // gui.add(particles, "morph1");
  // gui.add(particles, "morph2");
  // gui.add(particles, "morph3");

  gui.add(particles, "animate");

  gui.addColor(particles, "colorA").onChange(() => {
    particles.material.uniforms.uColorA.value.set(particles.colorA);
  });
  gui.addColor(particles, "colorB").onChange(() => {
    particles.material.uniforms.uColorB.value.set(particles.colorB);
  });
  
});

const axesHelper = new THREE.AxesHelper(5);
// scene.add(axesHelper);
/**
 * Animate
 */
const clock = new THREE.Clock();
const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update controls
  controls.update();

  // Update particles
  // if (particles) {
  //   particles.material.uniforms.uProgress.value = elapsedTime * 0.1;

  //   // Inverser l'animation lorsque uProgress dépasse 1 ou -1
  //   if (particles.material.uniforms.uProgress.value > 1 || particles.material.uniforms.uProgress.value < -1) {
  //     particles.material.uniforms.uProgress.value *= -1 * elapsedTime * 0.2;
  //   }
  // }
  // Render normal scene
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
