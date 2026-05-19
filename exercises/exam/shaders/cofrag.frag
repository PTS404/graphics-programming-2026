#version 330 core

out vec4 FragColor;

uniform vec2 Resolution;
uniform float Time;

// --- hash + 1D noise only ---
float hash(float n) {
    return fract(sin(n) * 43758.5453123);
}

float noise(float x) {
    float i = floor(x);
    float f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(hash(i), hash(i + 1.0), f);
}

void main()
{
    // Normalized centered UV
    vec2 uv = (gl_FragCoord.xy - 0.5 * Resolution.xy) / Resolution.y;

    // Circular mask (sphere-like silhouette)
    float r = length(uv);
    float sphereMask = 1.0 - smoothstep(0.35, 0.85, r);

    // Fresnel-like edge boost (bright edge, dim center)
    float edge = smoothstep(0.25, 0.85, r);

    // Vertical banding based on 1D noise
    float bands = noise(uv.y * 18.0 + Time * 1.2);

    // Scanline pulse
    float scan = 0.75 + 0.25 * sin(gl_FragCoord.y * 2.0 - Time * 6.0);

    // Global flicker from 1D noise
    float flicker = 0.88 + 0.12 * noise(Time * 8.0);

    // Combine
    float glow = sphereMask * (0.25 + 0.9 * edge + 0.5 * bands) * scan * flicker;

    vec3 baseColor = vec3(0.0, 0.55, 1.0);
    vec3 accent = vec3(0.0, 1.0, 0.9) * bands;
    vec3 color = (baseColor + 0.35 * accent) * glow;

    FragColor = vec4(color, clamp(glow, 0.0, 1.0));
}