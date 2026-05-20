#version 330 core

in vec3 FragPosition;
in vec3 Normal;

out vec4 FragColor;

uniform vec2 Resolution;
uniform float Time;
uniform vec3 CameraPosition;

float hash(float n) {
    return fract(sin(n) * 43758.5453123);
}

float noise(float x) {
    float i = floor(x);
    float f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(hash(i), hash(i + 1.0), f);
}

mat2 rotation2d(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat2(c, s, -s, c);
}

float createSphere(vec3 position, float radius) {
    return length(position) - radius;
}

float createCone(vec3 position, float height, float radius) {
    float q = length(position.xz);
    return max(q - radius, position.y - height);
}

float raymarch(vec3 cameraOrigin, vec3 rayDirection, out vec3 hitPosition) {
    float totalDistance = 0.0;
    hitPosition = cameraOrigin;

    for (int i = 0; i < 100; i++) {
        vec3 p = cameraOrigin + rayDirection * totalDistance;

        p.xz *= rotation2d(Time * 0.6);
        p.xy *= rotation2d(Time * 0.6 * 0.3);

        float sphere = createSphere(p, 0.5);
        float distance = sphere;

        if (distance < 0.001) {
            hitPosition = p;
            return totalDistance;
        }

        totalDistance += distance;
        if (totalDistance > 10.0) break;
    }
    return -1.0;
}

void main()
{
    vec4 position = gl_FragCoord;

    // UV
    vec2 uv = (position.xy - 0.5 * Resolution.xy) / Resolution.y;

    // Camera
    vec3 cameraDirection = CameraPosition - FragPosition;
    vec3 rayDirection = normalize(vec3(uv, -1.0));

    // Raymarching
    vec3 hitPosition;
    float distance = raymarch(CameraPosition, rayDirection, hitPosition);

    // Base color
    vec3 baseColor = vec3(0.0);
    float alpha = 0.0;

    // If object is hit, calculate effects
    if (distance > 0.0) {
        vec3 normal = normalize(Normal);
        vec3 viewDirection = normalize(CameraPosition - hitPosition);

        // Fresnel
        float fresnel = 1.0 - max(dot(normal, viewDirection), 0.0);
        fresnel = pow(fresnel, 2.5);
        fresnel = 0.3 + 1.25 * fresnel;

        // Lighting
        vec3 lightDirection = normalize(vec3(0.5, 1.0, 0.5));
        float diff = max(dot(normal, lightDirection), 0.0) * 0.5 + 0.5;

        // Color
        vec3 color = mix(
            vec3(0.0, 0.6, 1.0), // blue
            vec3(0.0, 1.0, 0.9), // cyan
            fresnel
        );
        color += vec3(0.1, 0.05, 0.0) * sin(hitPosition.y * 20.0 + Time * 3.0);

        baseColor = color * diff * fresnel;
        alpha = fresnel;

        // Edge Glow
        float edgeGlow = pow(fresnel, 3.0) * 1.5;
        baseColor += vec3(0.3, 0.7, 1.0) * edgeGlow;
    }

    // Scanline
    float scanline = sin(position.y * 2.5 - Time * 4.0) * 0.5 + 0.5;
    float fineScanline = sin(position.y * 0.8 + Time * 2.0) * 0.5 + 0.5;
    float scanlineMask = 0.7 + 0.3 * pow(scanline, 1.5) * fineScanline;

    // Hologram Flicker
    float flicker = 1.0;
    flicker *= 0.92 + 0.08 * sin(Time * 60.0); // high
    flicker *= 0.95 + 0.05 * noise(Time * 8.0); // low
    flicker *= 1.0- 0.3 * step(0.93, hash(floor(Time * 4.0))); // randomness

    // Finalize color
    baseColor *= scanlineMask;
    alpha *= scanlineMask;
    baseColor *= flicker;
    alpha *= flicker;

    FragColor = vec4(baseColor, clamp(alpha, 0.0, 1.0));


    // Rotation
//    vec3 position = FragPosition;

}