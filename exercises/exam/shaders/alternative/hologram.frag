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

void main()
{
    vec3 N = normalize(Normal);

    // View direction
    vec3 viewDirection = normalize(CameraPosition - FragPosition);

    // Fresnel
    float fresnel = 1.0 - max(dot(N, viewDirection), 0.0);
    fresnel = pow(fresnel, 2);

    // Rotation
    vec3 position = FragPosition;
    float rotationSpeed = Time * 0.8;
    position.xz = rotation2d(rotationSpeed) * position.xz;
    position.xy = rotation2d(rotationSpeed * 0.35) * position.xy;

    // Noise
    float noisex = noise(position.x * 8.0 + Time * 0.7);
    float noisey = noise(position.y * 8.0 - Time * 0.5);
    float noisez = noise(position.z * 8.0 + Time * 0.3);
    float noise = (noisex + noisey + noisez) / 3.0;

    // Scanline
//    float scanline = 0.8 + 0.2 * sin(Time * 6.0 + FragPosition.y * 20.0);
    float scanline = 0.8 + 0.2 * sin(Time * 6.0 + FragPosition.y * 20.0);
//    float scanline = 0.75 + 0.25 * sin(Time * 6.0 + FragPosition.y * 24.0);

    // Glow
    float baseGlow = 0.18 + 0.35 * noise;
    float edgeGlow = 0.85 * fresnel;
//    float glow = fresnel * scanline;
    float glow = (baseGlow + edgeGlow) * scanline;

    // Color
    vec3 cyan = vec3(0.0, 0.7, 1.0);
    vec3 red = vec3(1.0, 0.2, 0.2);
    vec3 color = cyan * glow;

    // Apply effects
    FragColor = vec4(color, clamp(glow, 0.0, 1.0));
}