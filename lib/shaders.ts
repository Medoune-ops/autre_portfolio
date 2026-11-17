export const impulseVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  void main() {
    vUv = uv;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const impulseFragment = /* glsl */ `
  uniform float uTime;
  uniform float uProgress; // 0..1 apparition du fil
  uniform float uSpeed;
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;
  varying vec3 vNormalW;
  void main() {
    float t = clamp(vUv.x / max(uProgress, 0.001), 0.0, 1.0);
    if (vUv.x > uProgress) discard;
    float head = fract(uTime * uSpeed);
    float pulse = exp(-pow((t - head) * 8.0, 2.0));
    float glow = 0.18 + 0.82 * pulse;
    float fres = pow(1.0 - abs(dot(normalize(vNormalW), vec3(0.0,0.0,1.0))), 2.0);
    vec3 col = mix(uColor * 0.35, uColor, glow) + uColor * fres * 0.25;
    float alpha = (0.25 + 0.75 * glow) * uOpacity;
    gl_FragColor = vec4(col, alpha);
  }
`;
