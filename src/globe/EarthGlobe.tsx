import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

export type EarthDisplayPreset = 'natural' | 'vivid' | 'high-contrast';

interface EarthGlobeProps {
  anomaly: number;
  isPlaying: boolean;
  reduceMotion?: boolean;
  sunPosition?: [number, number, number];
  displayPreset?: EarthDisplayPreset;
}

// Fresnel Atmosphere Shaders: Luminous celestial blue rim with warm amber terminator tint
const atmosphereVertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const atmosphereFragmentShader = `
  uniform vec3 uBaseColor;
  uniform vec3 uWarmColor;
  uniform vec3 uSunDir;
  uniform float uIntensity;
  uniform float uPower;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldNormal;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    vec3 worldNorm = normalize(vWorldNormal);

    // Rim Fresnel glow for BackSide
    float rim = clamp(1.0 - dot(viewDir, -normal), 0.0, 1.0);
    float glow = pow(rim, uPower) * uIntensity;

    // Subtle warm sunset tint along the day/night terminator boundary
    float sunDot = dot(worldNorm, uSunDir);
    float terminatorMask = smoothstep(-0.25, 0.25, sunDot) * smoothstep(0.6, 0.0, sunDot);
    vec3 blendedColor = mix(uBaseColor, uWarmColor, terminatorMask * 0.42);

    gl_FragColor = vec4(blendedColor, glow);
  }
`;

export default function EarthGlobe({
  anomaly,
  isPlaying,
  reduceMotion = false,
  sunPosition = [5.5, 2.0, 4.0],
  displayPreset = 'natural',
}: EarthGlobeProps) {
  const { gl } = useThree();

  // Configure ACES Filmic Tone Mapping and lifted exposure ~1.2 for bright, beautiful Earth
  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.22;
  }, [gl]);

  // Scene references
  const tiltGroupRef = useRef<THREE.Group>(null);
  const earthMeshRef = useRef<THREE.Mesh>(null);
  const cloudsMeshRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const outerHaloRef = useRef<THREE.Mesh>(null);

  // Normalized sun direction vector
  const sunDir = useMemo(() => new THREE.Vector3(...sunPosition).normalize(), [sunPosition]);

  // Load NASA / Three.js textures
  const [dayMap, normalMap, specularMap, cloudsMap, lightsMap] = useTexture([
    '/textures/earth_day.jpg',
    '/textures/earth_normal.jpg',
    '/textures/earth_specular.jpg',
    '/textures/earth_clouds.png',
    '/textures/earth_lights.png',
  ]);

  useMemo(() => {
    [dayMap, normalMap, specularMap, cloudsMap, lightsMap].forEach((tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
    });
  }, [dayMap, normalMap, specularMap, cloudsMap, lightsMap]);

  // Atmosphere color: Luminous oceanic cyan-blue with subtle, restrained anomaly tint (max 35%)
  const { atmosphereBaseColor, terminatorWarmColor } = useMemo(() => {
    // Subtle data tint (max 35% modulation):
    // Cold (<0) leans icy azure; Warm (>0.6) leans golden cyan; never flat red
    const coolBlue = new THREE.Color('#38BDF8');
    const warmCyan = new THREE.Color('#67E8F9');
    const terminatorGold = new THREE.Color('#FDBA74');

    const t = Math.max(0, Math.min(1, (anomaly - (-0.5)) / 1.8)); // 0 to 1
    const base = new THREE.Color().lerpColors(coolBlue, warmCyan, t * 0.35);

    return {
      atmosphereBaseColor: base,
      terminatorWarmColor: terminatorGold,
    };
  }, [anomaly]);

  // Display preset material parameters
  const presetParams = useMemo(() => {
    if (displayPreset === 'vivid') {
      return { roughness: 0.45, metalness: 0.15, normalScale: 0.95, lightIntensity: 2.6 };
    }
    if (displayPreset === 'high-contrast') {
      return { roughness: 0.35, metalness: 0.22, normalScale: 1.15, lightIntensity: 2.8 };
    }
    // natural default
    return { roughness: 0.62, metalness: 0.1, normalScale: 0.8, lightIntensity: 2.2 };
  }, [displayPreset]);

  // Earth surface material with Black Marble night lights on shadow side
  const earthMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      map: dayMap,
      normalMap: normalMap,
      normalScale: new THREE.Vector2(presetParams.normalScale, presetParams.normalScale),
      roughnessMap: specularMap,
      roughness: presetParams.roughness,
      metalness: presetParams.metalness,
    });

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uNightLights = { value: lightsMap };
      shader.uniforms.uSunDir = { value: sunDir };

      shader.fragmentShader = `
        uniform sampler2D uNightLights;
        uniform vec3 uSunDir;
        ${shader.fragmentShader}
      `;

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `
        #include <dithering_fragment>
        vec3 worldNorm = normalize(vNormal);
        float sunDot = dot(worldNorm, uSunDir);
        float nightMask = smoothstep(0.12, -0.25, sunDot);
        vec3 nightColor = texture2D(uNightLights, vMapUv).rgb * vec3(1.0, 0.85, 0.58) * 2.4 * nightMask;
        gl_FragColor.rgb += nightColor;
        `
      );
    };

    return mat;
  }, [dayMap, normalMap, specularMap, lightsMap, sunDir, presetParams]);

  // Inner Fresnel Rim Atmosphere Shader
  const atmosphereMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      uniforms: {
        uBaseColor: { value: atmosphereBaseColor.clone() },
        uWarmColor: { value: terminatorWarmColor.clone() },
        uSunDir: { value: sunDir },
        uIntensity: { value: 1.25 },
        uPower: { value: 3.0 },
      },
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
  }, [atmosphereBaseColor, terminatorWarmColor, sunDir]);

  // Soft Outer Halo Shader
  const outerHaloMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      uniforms: {
        uBaseColor: { value: atmosphereBaseColor.clone() },
        uWarmColor: { value: terminatorWarmColor.clone() },
        uSunDir: { value: sunDir },
        uIntensity: { value: 0.38 },
        uPower: { value: 2.1 },
      },
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
  }, [atmosphereBaseColor, terminatorWarmColor, sunDir]);

  // Animation frame loop: Earth & drifting clouds rotation with axial tilt
  useFrame((_, delta) => {
    if (!reduceMotion) {
      const baseSpeed = isPlaying ? 0.09 : 0.055;
      if (earthMeshRef.current) {
        earthMeshRef.current.rotation.y += delta * baseSpeed;
      }
      if (cloudsMeshRef.current) {
        // Clouds drift slightly faster (atmospheric trade winds)
        cloudsMeshRef.current.rotation.y += delta * (baseSpeed * 1.16);
      }
    }

    if (atmosphereMaterial.uniforms?.uBaseColor) {
      atmosphereMaterial.uniforms.uBaseColor.value.lerp(atmosphereBaseColor, delta * 3.0);
    }
    if (outerHaloMaterial.uniforms?.uBaseColor) {
      outerHaloMaterial.uniforms.uBaseColor.value.lerp(atmosphereBaseColor, delta * 3.0);
    }
  });

  // Earth's real axial tilt: 23.44 degrees
  const axialTiltRad = (23.44 * Math.PI) / 180;

  return (
    <group>
      {/* Lifted scene lighting */}
      <ambientLight intensity={0.92} color="#E0F2FE" />
      <directionalLight
        position={sunPosition}
        intensity={presetParams.lightIntensity}
        color="#FFFFFF"
        castShadow
      />
      {/* Soft fill light from dark hemisphere */}
      <directionalLight position={[-sunPosition[0], -sunPosition[1], -sunPosition[2]]} intensity={0.22} color="#0F172A" />

      {/* Earth Group with 23.44° Axial Tilt */}
      <group ref={tiltGroupRef} rotation={[0, 0, -axialTiltRad]}>
        {/* Main Earth Sphere (Day + Normal + Specular + Night lights) */}
        <mesh ref={earthMeshRef} castShadow receiveShadow>
          <sphereGeometry args={[1, 64, 64]} />
          <primitive object={earthMaterial} attach="material" />
        </mesh>

        {/* Soft Drifting Clouds Layer */}
        <mesh ref={cloudsMeshRef}>
          <sphereGeometry args={[1.014, 64, 64]} />
          <meshStandardMaterial
            map={cloudsMap}
            transparent={true}
            opacity={0.32}
            blending={THREE.NormalBlending}
            roughness={1.0}
            depthWrite={false}
          />
        </mesh>

        {/* Primary Atmosphere Fresnel Rim (Scale 1.045) */}
        <mesh ref={atmosphereRef} scale={[1.045, 1.045, 1.045]}>
          <sphereGeometry args={[1, 64, 64]} />
          <primitive object={atmosphereMaterial} attach="material" />
        </mesh>

        {/* Soft Outer Halo (Scale 1.072) */}
        <mesh ref={outerHaloRef} scale={[1.072, 1.072, 1.072]}>
          <sphereGeometry args={[1, 48, 48]} />
          <primitive object={outerHaloMaterial} attach="material" />
        </mesh>
      </group>
    </group>
  );
}
