import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface EarthGlobeProps {
  anomaly: number;
  isPlaying: boolean;
  pulseTrigger?: number; // timestamp or counter when a note triggers
  pulseFreq?: number;    // frequency of note played
  reduceMotion?: boolean;
}

// Maps anomaly to atmosphere color:
// < -0.2: cool blue (#3AA8FF)
// -0.2 to 0.2: cyan/white-blue (#8DEBFF)
// 0.2 to 0.7: warm gold/orange (#FFA439)
// > 0.7: intense fiery red-orange (#FF381E)
function getAtmosphereColor(anomaly: number): THREE.Color {
  if (anomaly <= -0.2) {
    const t = Math.max(0, (anomaly - (-0.5)) / 0.3); // -0.5 -> 0, -0.2 -> 1
    return new THREE.Color().lerpColors(new THREE.Color('#1B75D0'), new THREE.Color('#3AA8FF'), t);
  } else if (anomaly <= 0.2) {
    const t = (anomaly - (-0.2)) / 0.4;
    return new THREE.Color().lerpColors(new THREE.Color('#3AA8FF'), new THREE.Color('#A8F5FF'), t);
  } else if (anomaly <= 0.7) {
    const t = (anomaly - 0.2) / 0.5;
    return new THREE.Color().lerpColors(new THREE.Color('#A8F5FF'), new THREE.Color('#FFA439'), t);
  } else {
    const t = Math.min(1, (anomaly - 0.7) / 0.6);
    return new THREE.Color().lerpColors(new THREE.Color('#FFA439'), new THREE.Color('#FF2B12'), t);
  }
}

// Custom Fresnel atmosphere glow shader
const atmosphereVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const atmosphereFragmentShader = `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vec3 viewDir = normalize(-vPosition);
    float rim = 1.0 - max(0.0, dot(viewDir, vNormal));
    rim = pow(rim, 2.5);
    gl_FragColor = vec4(uColor, rim * uIntensity);
  }
`;

export default function EarthGlobe({
  anomaly,
  isPlaying,
  pulseTrigger = 0,
  pulseFreq = 440,
  reduceMotion = false,
}: EarthGlobeProps) {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const pulseRingRef = useRef<THREE.Mesh>(null);

  // Pulse animation state
  const pulseScale = useRef(1.0);
  const pulseAlpha = useRef(0.0);

  // Load NASA / Three.js textures
  const [dayMap, normalMap, specularMap, cloudsMap] = useTexture([
    '/textures/earth_day.jpg',
    '/textures/earth_normal.jpg',
    '/textures/earth_specular.jpg',
    '/textures/earth_clouds.png'
  ]);

  // Target atmosphere color
  const targetColor = useMemo(() => getAtmosphereColor(anomaly), [anomaly]);

  // Atmosphere shader material
  const atmosphereMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      uniforms: {
        uColor: { value: getAtmosphereColor(anomaly) },
        uIntensity: { value: 1.15 }
      },
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    });
  }, []);

  // Trigger pulse whenever pulseTrigger changes
  useEffect(() => {
    if (pulseTrigger > 0) {
      pulseScale.current = 1.02;
      pulseAlpha.current = 0.85;
    }
  }, [pulseTrigger]);

  useFrame((_, delta) => {
    // Rotation (unless reduced motion)
    if (!reduceMotion) {
      const rotSpeed = isPlaying ? 0.05 : 0.08;
      if (earthRef.current) {
        earthRef.current.rotation.y += delta * rotSpeed;
      }
      if (cloudsRef.current) {
        // Clouds drift slightly faster to create realistic atmospheric movement
        cloudsRef.current.rotation.y += delta * (rotSpeed * 1.18);
      }
    }

    // Atmosphere color lerp
    if (atmosphereRef.current) {
      const mat = atmosphereRef.current.material as THREE.ShaderMaterial;
      if (mat.uniforms?.uColor) {
        mat.uniforms.uColor.value.lerp(targetColor, 0.05);
      }
    }

    // Animate pulse ring ripple
    if (pulseRingRef.current && pulseAlpha.current > 0.01) {
      // Frequency scales the max size of ripple (higher freq = larger/faster ripple)
      const freqFactor = (pulseFreq - 220) / (880 - 220); // 0 to 1
      const expandSpeed = 0.6 + freqFactor * 0.8;

      pulseScale.current += delta * expandSpeed;
      pulseAlpha.current = Math.max(0, pulseAlpha.current - delta * 1.5);

      pulseRingRef.current.scale.set(pulseScale.current, pulseScale.current, pulseScale.current);
      const mat = pulseRingRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = pulseAlpha.current;
    }
  });

  return (
    <group>
      {/* 3D Earth Mesh */}
      <mesh ref={earthRef} castShadow receiveShadow>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          map={dayMap}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(0.6, 0.6)}
          roughnessMap={specularMap}
          roughness={0.7}
          metalness={0.15}
        />
      </mesh>

      {/* Drifting Cloud Layer */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[1.015, 64, 64]} />
        <meshStandardMaterial
          map={cloudsMap}
          transparent={true}
          opacity={0.38}
          blending={THREE.NormalBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Atmospheric Glow Shell */}
      <mesh ref={atmosphereRef} scale={[1.18, 1.18, 1.18]}>
        <sphereGeometry args={[1, 48, 48]} />
        <primitive object={atmosphereMaterial} />
      </mesh>

      {/* Sound Note Pulse Ripple Ring */}
      <mesh ref={pulseRingRef} scale={[1.02, 1.02, 1.02]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color={targetColor}
          wireframe={true}
          transparent={true}
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
