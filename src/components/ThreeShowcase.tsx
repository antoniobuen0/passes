import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  varying vec2 vUv;
  uniform float uTime;

  float sdSphere(vec3 p, float r) {
    return length(p) - r;
  }

  float sdTorus(vec3 p, vec2 t) {
    vec2 q = vec2(length(p.xz) - t.x, p.y);
    return length(q) - t.y;
  }

  float mapScene(vec3 p) {
    vec3 q = p;
    q.y += sin(uTime * 0.8 + p.x * 1.4) * 0.1;

    float orb = sdSphere(q, 0.72);
    float ring = sdTorus(q, vec2(1.05, 0.12));
    return min(orb, ring);
  }

  vec3 estimateNormal(vec3 p) {
    float h = 0.001;
    vec2 k = vec2(1.0, -1.0);

    return normalize(
      k.xyy * mapScene(p + k.xyy * h) +
      k.yyx * mapScene(p + k.yyx * h) +
      k.yxy * mapScene(p + k.yxy * h) +
      k.xxx * mapScene(p + k.xxx * h)
    );
  }

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(41.0, 289.0))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    uv.x *= 1.65;

    vec3 ro = vec3(0.0, 0.0, 3.4);
    vec3 rd = normalize(vec3(uv, -1.65));

    float t = 0.0;
    float dist;
    bool hit = false;

    for (int i = 0; i < 84; i++) {
      vec3 p = ro + rd * t;
      dist = mapScene(p);

      if (dist < 0.001) {
        hit = true;
        break;
      }

      t += dist * 0.72;
      if (t > 9.0) break;
    }

    vec3 color = vec3(0.03, 0.08, 0.18);

    if (hit) {
      vec3 p = ro + rd * t;
      vec3 n = estimateNormal(p);
      vec3 lightDir = normalize(vec3(-0.38, 0.84, 0.52));
      float diff = max(dot(n, lightDir), 0.0);

      float spec = pow(max(dot(reflect(-lightDir, n), -rd), 0.0), 28.0);
      float fresnel = pow(1.0 - max(dot(n, -rd), 0.0), 3.0);

      float caustic = noise(p.xz * 5.8 + vec2(uTime * 0.42, -uTime * 0.3));
      vec3 deep = vec3(0.02, 0.32, 0.72);
      vec3 bright = vec3(0.42, 0.9, 1.0);
      vec3 liquid = mix(deep, bright, smoothstep(0.38, 0.96, caustic));

      color = liquid * (0.22 + 0.95 * diff) + spec * vec3(0.92) + fresnel * vec3(0.36, 0.7, 1.0);
    }

    float vignette = smoothstep(1.35, 0.15, length(uv));
    color *= vignette;

    gl_FragColor = vec4(color, 0.95);
  }
`;

function RaymarchLayer() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useFrame((state) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
    }),
    []
  );

  return (
    <mesh position={[0, 0, -0.2]}>
      <planeGeometry args={[8.4, 5.2]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
      />
    </mesh>
  );
}

function PhysicalMesh() {
  return (
    <Float speed={1.2} rotationIntensity={0.7} floatIntensity={1.5}>
      <mesh castShadow position={[0, 0, 0.2]}>
        <torusKnotGeometry args={[0.62, 0.18, 220, 32]} />
        <meshPhysicalMaterial
          color="#8fd3ff"
          metalness={1}
          roughness={0.16}
          transmission={0.18}
          thickness={0.9}
          clearcoat={1}
          clearcoatRoughness={0.1}
          envMapIntensity={1.6}
        />
      </mesh>
    </Float>
  );
}

export function ThreeShowcase() {
  return (
    <div className="h-[360px] w-full overflow-hidden rounded-2xl border border-white/20 bg-slate-950/70">
      <Canvas camera={{ position: [0, 0, 3.1], fov: 48 }} dpr={[1, 1.8]}>
        <color attach="background" args={["#020b1c"]} />
        <hemisphereLight intensity={0.45} groundColor="#0f172a" color="#dbeafe" />
        <directionalLight position={[2.4, 2.8, 2.1]} intensity={2.2} castShadow />
        <spotLight position={[-2.5, 1.6, 2.1]} intensity={24} distance={11} angle={0.28} penumbra={1} />

        <RaymarchLayer />
        <PhysicalMesh />

        <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={0.65} />
      </Canvas>
    </div>
  );
}
