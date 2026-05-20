#version 330 core

out vec4 FragColor;

uniform vec2 Resolution;
uniform float Time;

// ============================================================
// HOLOGRAM & GLITCH EFFECT - Raymarched 3D Holographic Display
// Features: rotating 3D object, scan lines, chromatic aberration,
//           glitch displacement, Fresnel transparency, flickering
// ============================================================

// --- Utility: pseudo-random hash ---
float hash(float n) {
    return fract(sin(n) * 43758.5453123);
}

// --- Noise for organic variation ---
float noise(float x) {
    float i = floor(x);
    float f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(hash(i), hash(i + 1.0), f);
}

// --- Rotation matrix ---
mat2 rot2D(float a) {
    float c = cos(a), s = sin(a);
    return mat2(c, -s, s, c);
}

// --- SDF primitives ---
float sdSphere(vec3 p, float r) {
    return length(p) - r;
}

float sdTorus(vec3 p, vec2 t) {
    vec2 q = vec2(length(p.xz) - t.x, p.y);
    return length(q) - t.y;
}

float sdOctahedron(vec3 p, float s) {
    p = abs(p);
    return (p.x + p.y + p.z - s) * 0.57735027;
}

// --- Smooth min for blending shapes ---
float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
}

// --- Scene SDF: a composite holographic object ---
float sceneSDF(vec3 p) {
    float t = Time * 0.6;

    // Rotate the entire object
    p.xz *= rot2D(t);
    p.xy *= rot2D(t * 0.3);

    // Central octahedron (crystal-like core)
    float octa = sdOctahedron(p, 0.55);

    // Inner sphere
    float sphere = sdSphere(p, 0.35);

    // Orbiting torus ring
    vec3 tp = p;
    tp.xz *= rot2D(t * 1.5);
    float torus = sdTorus(tp, vec2(0.7, 0.04));

    // Second torus at a different angle
    vec3 tp2 = p;
    tp2.xy *= rot2D(1.5708);
    tp2.xz *= rot2D(-t * 1.2);
    float torus2 = sdTorus(tp2, vec2(0.75, 0.03));

    // Small floating satellite spheres
    vec3 sp1 = p - vec3(sin(t * 2.0) * 0.5, cos(t * 1.7) * 0.4, cos(t * 2.0) * 0.5);
    float sat1 = sdSphere(sp1, 0.06);

    vec3 sp2 = p - vec3(-cos(t * 1.5) * 0.55, sin(t * 2.2) * 0.35, sin(t * 1.5) * 0.55);
    float sat2 = sdSphere(sp2, 0.05);

    // Blend core shapes smoothly
    float core = smin(octa, sphere, 0.2);

    // Combine everything
    float d = sphere;
    d = min(d, torus);
    d = min(d, torus2);
    d = min(d, sat1);
    d = min(d, sat2);

    return d;
}

// --- Estimate normal via gradient ---
vec3 estimateNormal(vec3 p) {
    vec2 e = vec2(0.001, 0.0);
    return normalize(vec3(
    sceneSDF(p + e.xyy) - sceneSDF(p - e.xyy),
    sceneSDF(p + e.yxy) - sceneSDF(p - e.yxy),
    sceneSDF(p + e.yyx) - sceneSDF(p - e.yyx)
    ));
}

// --- Raymarching ---
float raymarch(vec3 ro, vec3 rd, out vec3 hitPos) {
    float t = 0.0;
    hitPos = ro;
    for (int i = 0; i < 80; i++) {
        vec3 p = ro + rd * t;
        float d = sceneSDF(p);
        if (d < 0.001) {
            hitPos = p;
            return t;
        }
        if (t > 5.0) break;
        t += d;
    }
    return -1.0;
}

void main() {
    // ---- UV setup ----
    vec2 fragCoord = gl_FragCoord.xy;
    vec2 uv = (fragCoord - 0.5 * Resolution.xy) / Resolution.y;
    vec2 uvOrig = uv;

    // ---- Camera setup ----
    vec3 ro = vec3(0.0, 0.0, 3.2); // camera origin
    vec3 rd = normalize(vec3(uv, -1.0)); // ray direction

    // ---- Raymarch the scene ----
    vec3 hitPos;
    float dist = raymarch(ro, rd, hitPos);

    // ---- Base hologram color ----
    vec3 holoColor = vec3(0.0);
    float alpha = 0.0;

    if (dist > 0.0) {
        vec3 normal = estimateNormal(hitPos);
        vec3 viewDir = normalize(ro - hitPos);

        // Fresnel effect: edges glow brighter (hologram transparency)
        float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.5);
        fresnel = 0.3 + 0.7 * fresnel;

        // Basic directional lighting
        vec3 lightDir = normalize(vec3(0.5, 1.0, 0.5));
        float diff = max(dot(normal, lightDir), 0.0) * 0.5 + 0.5;

        // Hologram base color: cyan-blue palette
        vec3 baseColor = mix(
        vec3(0.0, 0.6, 1.0),  // deep blue
        vec3(0.0, 1.0, 0.9),  // cyan
        fresnel
        );

        // Add slight color variation based on height
        baseColor += vec3(0.1, 0.05, 0.0) * sin(hitPos.y * 20.0 + Time * 3.0);

        holoColor = baseColor * diff * fresnel;
        alpha = fresnel;

        // Edge glow: boost the silhouette edges
        float edgeGlow = pow(fresnel, 3.0) * 1.5;
        holoColor += vec3(0.3, 0.7, 1.0) * edgeGlow;
    }

    // ---- Scan lines ----
    // Horizontal scan lines that scroll slowly downward
    float scanLine = sin(fragCoord.y * 2.5 - Time * 4.0) * 0.5 + 0.5;
    scanLine = pow(scanLine, 1.5);
    // Fine detail scan lines
    float fineScan = sin(fragCoord.y * 0.8 + Time * 2.0) * 0.5 + 0.5;
    float scanMask = 0.7 + 0.3 * scanLine * fineScan;

    holoColor *= scanMask;
    alpha *= scanMask;

    // ---- Global flicker ----
    // Simulate power instability: occasional brightness dips
    float flicker = 1.0;
    flicker *= 0.92 + 0.08 * sin(Time * 60.0);            // high-frequency
    flicker *= 0.95 + 0.05 * noise(Time * 8.0);            // low-frequency wobble
    flicker *= 1.0 - 0.3 * step(0.93, hash(floor(Time * 4.0))); // random dropout

    holoColor *= flicker;
    alpha *= flicker;

    // Output with slight overall transparency for compositing feel
    float finalAlpha = clamp(alpha, 0.0, 1.0);
    FragColor = vec4(holoColor, finalAlpha);
}