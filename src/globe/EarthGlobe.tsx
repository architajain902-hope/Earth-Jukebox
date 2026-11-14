import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface EarthGlobeProps {
  anomaly: number;
  isPlaying: boolean;
  pulseTrigger?: number;
  pulseFreq?: number;
  reduceMotion?: boolean;
  sunPosition?: [number, number, number];
}

// Fixed 4-token color gradient according to exact specification:
// -0.5 °C -> #3AA0FF (deep blue)
//  0.0 °C -> #9FE8FF (neutral cyan)
// +0.6 °C -> #FFB020 (warm amber)
// +1.3 °C -> #FF4D2E (orange-red)
export function getAtmosphereColor(anomaly: number): THREE.Color {
  const cCool = new THREE.Color('#3AA0FF');
  const cNeutral = new THREE.Color('#9FE8FF');
  const cWarm = new THREE.Color('#FFB020');
  const cHot = new THREE.Color('#FF4D2E');

  if (anomaly <= 0.0) {
    const t = Math.max(0, Math.min(1, (anomaly - (-0.5)) / 0.5));
    return new THREE.Color().lerpColors(cCool, cNeutral, t);
  } else if (anomaly <= 0.6) {
    const t = Math.max(0, Math.min(1, anomaly / 0.6));
    return new THREE.Color().lerpColors(cNeutral, cWarm, t);
  } else {
    const t = Math.max(0, Math.min(1, (anomaly - 0.6) / 0.7));
    return new THREE.Color().lerpColors(cWarm, cHot, t);
  }
}

// Atmosphere Fresnel Vertex & Fragment Shaders
const atmosphereVertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const atmosphereFragmentShader = `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uPower;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    // For BackSide rendering, normal points inward
    float rim = clamp(1.0 - dot(viewDir, -normal), 0.0, 1.0);
    float glow = pow(rim, uPower) * uIntensity;
    gl_FragColor = vec4(uColor, glow);
  }
`;

export default function EarthGlobe({
  anomaly,
  isPlaying,
  pulseTrigger = 0,
  pulseFreq = 440,
  reduceMotion = false,
  sunPosition = [5.5, 2.0, 4.0],
}: EarthGlobeProps) {
  // Scene references
  const tiltGroupRef = useRef<THREE.Group>(null);
  const earthMeshRef = useRef<THREE.Mesh>(null);
  const cloudsMeshRef = useRef<THREE.Mesh>(null);
  const moonOrbitRef = useRef<THREE.Group>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const outerHaloRef = useRef<THREE.Mesh>(null);
  const pulseRingsRef = useRef<THREE.Group>(null);

  // Pulse ring animation states (supports multiple simultaneous wavelets)
  const activePulses = useRef<{ id: number; scale: number; alpha: number; color: THREE.Color; speed: number }[]>([]);

  // Load verified NASA / Three.js textures
  const [dayMap, normalMap, specularMap, cloudsMap, lightsMap] = useTexture([
    '/textures/earth_day.jpg',
    '/textures/earth_normal.jpg',
    '/textures/earth_specular.jpg',
    '/textures/earth_clouds.png',
    '/textures/earth_lights.png',
  ]);

  // Texture filter and anisotropy settings
  useMemo(() => {
    [dayMap, normalMap, specularMap, cloudsMap, lightsMap].forEach((tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
    });
  }, [dayMap, normalMap, specularMap, cloudsMap, lightsMap]);

  // Target atmosphere color
  const targetGlowColor = useMemo(() => getAtmosphereColor(anomaly), [anomaly]);
  const currentGlowColor = useRef<THREE.Color>(targetGlowColor.clone());

  // Earth surface material with Black Marble night lights blend on shadow side
  const earthMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      map: dayMap,
      normalMap: normalMap,
      normalScale: new THREE.Vector2(0.8, 0.8),
      roughnessMap: specularMap,
      roughness: 0.65,
      metalness: 0.1,
    });

    // Inject night lights via onBeforeCompile
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uNightLights = { value: lightsMap };
      shader.uniforms.uSunDir = { value: new THREE.Vector3(...sunPosition).normalize() };

      shader.fragmentShader = `
        uniform sampler2D uNightLights;
        uniform vec3 uSunDir;
        ${shader.fragmentShader}
      `;

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `
        #include <dithering_fragment>
        // Calculate night light emission on the unlit hemisphere
        vec3 worldNorm = normalize(vNormal);
        float sunDot = dot(worldNorm, uSunDir);
        float nightMask = smoothstep(0.15, -0.25, sunDot);
        vec3 nightColor = texture2D(uNightLights, vMapUv).rgb * vec3(1.0, 0.82, 0.55) * 2.2 * nightMask;
        gl_FragColor.rgb += nightColor;
        `
      );
    };

    return mat;
  }, [dayMap, normalMap, specularMap, lightsMap, sunPosition]);

  // Atmosphere inner rim shader
  const atmosphereMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      uniforms: {
        uColor: { value: targetGlowColor.clone() },
        uIntensity: { value: 1.1 },
        uPower: { value: 3.2 },
      },
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
  }, []);

  // Faint second outer halo
  const outerHaloMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      uniforms: {
        uColor: { value: targetGlowColor.clone() },
        uIntensity: { value: 0.35 },
        uPower: { value: 2.2 },
      },
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
  }, []);

  // Trigger pulse wave on note play
  useEffect(() => {
    if (pulseTrigger > 0) {
      // Frequency scales propagation speed and reach
      const freqFactor = (pulseFreq - 220) / (880 - 220); // 0 to 1
      activePulses.current.push({
        id: Date.now() + Math.random(),
        scale: 1.01,
        alpha: 0.8,
        color: targetGlowColor.clone(),
        speed: 0.5 + freqFactor * 0.7,
      });
      // Limit to 4 pulses max
      if (activePulses.current.length > 4) {
        activePulses.current.shift();
      }
    }
  }, [pulseTrigger, pulseFreq, targetGlowColor]);

  // Animation frame loop
  useFrame((_, delta) => {
    // 1. Earth & Clouds continuous rotation with axial tilt
    if (!reduceMotion) {
      // Base rotation: 1 revolution per ~75 seconds (0.084 rad/s)
      const baseSpeed = isPlaying ? 0.11 : 0.07;
      if (earthMeshRef.current) {
        earthMeshRef.current.rotation.y += delta * baseSpeed;
      }
      if (cloudsMeshRef.current) {
        // Clouds drift slightly faster (simulating atmospheric trade winds)
        cloudsMeshRef.current.rotation.y += delta * (baseSpeed * 1.18);
      }
      if (moonOrbitRef.current) {
        // Tiny moon orbits slowly around Earth
        moonOrbitRef.current.rotation.y += delta * 0.025;
      }
    }

    // 2. Smooth 600ms transition for atmosphere glow color
    currentGlowColor.current.lerp(targetGlowColor, delta * 3.5);
    if (atmosphereMaterial.uniforms?.uColor) {
      atmosphereMaterial.uniforms.uColor.value.copy(currentGlowColor.current);
    }
    if (outerHaloMaterial.uniforms?.uColor) {
      outerHaloMaterial.uniforms.uColor.value.copy(currentGlowColor.current);
    }

    // 3. Update pulse ring wavelets
    for (let i = activePulses.current.length - 1; i >= 0; i--) {
      const pulse = activePulses.current[i];
      pulse.scale += delta * pulse.speed;
      pulse.alpha -= delta * 1.2;
      if (pulse.alpha <= 0.01) {
        activePulses.current.splice(i, 1);
      }
    }
  });

  // Earth's real axial tilt: 23.44 degrees = 0.4091 radians
  const axialTiltRad = (23.44 * Math.PI) / 180;

  return (
    <group>
      {/* Group with Earth's 23.4° Axial Tilt */}
      <group ref={tiltGroupRef} rotation={[0, 0, -axialTiltRad]}>
        {/* Main Earth Sphere (Lit by Sun + Night lights on dark side) */}
        <mesh ref={earthMeshRef} castShadow receiveShadow>
          <sphereGeometry args={[1, 64, 64]} />
          <primitive object={earthMaterial} attach="material" />
        </mesh>

        {/* Drifting Clouds Shell (Transparent Alpha Layer) */}
        <mesh ref={cloudsMeshRef}>
          <sphereGeometry args={[1.014, 64, 64]} />
          <meshStandardMaterial
            map={cloudsMap}
            transparent={true}
            opacity={0.34}
            blending={THREE.NormalBlending}
            roughness={1.0}
            depthWrite={false}
          />
        </mesh>

        {/* Primary Atmosphere Feathered Fresnel Shell (Scale 1.045) */}
        <mesh ref={atmosphereRef} scale={[1.045, 1.045, 1.045]}>
          <sphereGeometry args={[1, 64, 64]} />
          <primitive object={atmosphereMaterial} attach="material" />
        </mesh>

        {/* Soft Second Outer Halo (Scale 1.072) */}
        <mesh ref={outerHaloRef} scale={[1.072, 1.072, 1.072]}>
          <sphereGeometry args={[1, 48, 48]} />
          <primitive object={outerHaloMaterial} attach="material" />
        </mesh>

        {/* Acoustic Pulse Ripples */}
        <group ref={pulseRingsRef}>
          {activePulses.current.map((p) => (
            <mesh key={p.id} scale={[p.scale, p.scale, p.scale]}>
              <sphereGeometry args={[1, 32, 32]} />
              <meshBasicMaterial
                color={p.color}
                wireframe={true}
                transparent={true}
                opacity={p.alpha}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          ))}
        </group>

        {/* Tiny Orbiting Moon */}
        <group ref={moonOrbitRef}>
          <mesh position={[3.6, 0.4, 0]} scale={[0.12, 0.12, 0.12]}>
            <sphereGeometry args={[1, 24, 24]} />
            <meshStandardMaterial color="#A8AAB2" roughness={0.9} metalness={0.05} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
