#version 330 core

out vec4 FragColor;

uniform vec2 Resolution;
uniform float Time;
uniform vec3 CameraPosition;

uniform float PlanetSize;
uniform float RingSize;
uniform float AnimationSpeed;

// Randomization functions
float hash(float x) {
    return fract(sin(x) * 43758.5453123);
}
float noise(float x) {
    float i = floor(x);
    float f = fract(x);
    return mix(hash(i), hash(i + 1.0), f);
}

// 2D rotation matrix
mat2 rotation2d(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat2(c, -s, s, c);
}

// Creates sphere
float sphere(vec3 position, float radius) {
    return length(position) - radius;
}

// Creates ring
float ring(vec3 position, vec2 t) {
    float flatten = 4.0;

    position.y *= flatten;
    vec2 q = vec2(length(position.xz) - t.x, position.y);
    return (length(q) - t.y) / flatten;
}

// Create object
float createObject(vec3 position) {
    float animationSpeed = Time * AnimationSpeed;

    // Sphere position & rotation
    vec3 spherePosition = position;
    spherePosition.xz *= rotation2d(animationSpeed);
    spherePosition.xy *= rotation2d(animationSpeed * 0.3);

    // Sphere terrain
    vec3 normalizedPosition = normalize(spherePosition);
    float terrainNoise =
        noise(normalizedPosition.x * 5.0 + Time * 0.5) * 0.5 *
        noise(normalizedPosition.y * 10.0 - Time * 0.3) * 0.25 *
        noise(normalizedPosition.z * 20.0 + Time * 0.7) * 0.125;
    terrainNoise = terrainNoise / (0.5 * 0.25 * 0.125);

    float baseRadius = PlanetSize;
    float heightVariation = 0.02 * terrainNoise;

    // Create sphere
    float sphere = sphere(spherePosition, baseRadius + heightVariation);

    // Planet belt/ring
    vec3 ringPosition = position;
    ringPosition.xz *= rotation2d(animationSpeed * 1.5); // Give ring orbiting rotation
    ringPosition.xy *= rotation2d(0.1); // Add tilt
    ringPosition.yz *= rotation2d(0.1); // Add tilt
    float ring = ring(ringPosition, vec2(RingSize, 0.04));

    // Combine and return the minimum distance
    return min(sphere, ring);
}

// Normal estimation using differences
vec3 estimateNormal(vec3 position) {
    vec2 e = vec2(0.001, 0.0);
    return normalize(vec3(
        createObject(position + e.xyy) - createObject(position - e.xyy),
        createObject(position + e.yxy) - createObject(position - e.yxy),
        createObject(position + e.yyx) - createObject(position - e.yyx)
    ));
}

// Raymarch function: returns distance to hit or -1 if no hit
float raymarch(vec3 cameraOrigin, vec3 rayDirection, out vec3 hitPosition) {
    float totalDistance = 0.0;
    hitPosition = cameraOrigin;

    for (int i = 0; i < 100; i++) {
        vec3 position = cameraOrigin + rayDirection * totalDistance;
        float distance = createObject(position);

        if (distance < 0.001) {
            hitPosition = position;
            return totalDistance;
        }

        totalDistance += distance;
        if (totalDistance > 10.0) break;
    }
    return -1.0;
}

void main() {
    // UV
    vec2 position = gl_FragCoord.xy;
    vec2 uv = (position - 0.5 * Resolution.xy) / Resolution.y;

    // Camera
    vec3 rayDirection = normalize(vec3(uv, -1.0));

    // Raymarching
    vec3 hitPosition;
    float distance = raymarch(CameraPosition, rayDirection, hitPosition);

    // Color
    vec3 baseColor = vec3(0.0);
    float alpha = 0.0;

    // If object is hit, calculate effects
    if (distance > 0.0) {
        vec3 normal = estimateNormal(hitPosition);
        vec3 viewDirection = normalize(CameraPosition - hitPosition);

        // Fresnel
        float fresnel = pow(1.0 - max(dot(normal, viewDirection), 0.0), 2.5);
        fresnel = 0.3 + 0.7 * fresnel;

        // Hologram color
        vec3 mixColor = mix(
            vec3(0.0, 0.6, 1.0),  // blue
            vec3(0.0, 1.0, 0.9),  // cyan
            fresnel
        );

        baseColor = mixColor * fresnel;
        alpha = fresnel;

        // Add edge glow
        float edgeGlow = pow(fresnel, 3.0) * 1.5;
        baseColor += vec3(0.3, 0.7, 1.0) * edgeGlow;
    }

    // Scanline
    float scanline = sin(position.y * 2.5 - Time * 4.0) * 0.5 + 0.5;
    float fineScanline = sin(position.y * 0.8 + Time * 2.0) * 0.5 + 0.5;
    float scanlineMask = 0.7 + 0.3 * pow(scanline, 1.5) * fineScanline;

    // Hologram flicker
    float flicker = 1.0;
    flicker *= 0.92 + 0.08 * sin(Time * 60.0); // high
    flicker *= 0.95 + 0.05 * noise(Time * 8.0); // low
    flicker *= 1.0- 0.3 * step(0.93, hash(floor(Time * 4.0))); // randomness

    // Finalize output
    baseColor *= scanlineMask;
    alpha *= scanlineMask;
    baseColor *= flicker;
    alpha *= flicker;

    FragColor = vec4(baseColor, clamp(alpha, 0.0, 1.0));
}