#version 330 core

in vec3 FragPosition;
in vec3 Normal;

out vec4 FragColor;

uniform vec2 Resolution;
uniform float Time;
uniform vec3 CameraPosition;

void main()
{
    vec3 viewDirection = normalize(CameraPosition - FragPosition);

    float fresnel = 1.0 - max(dot(normalize(Normal), viewDirection), 0.0);
    fresnel = pow(fresnel, 2);

    float scanline = 0.8 + 0.2 * sin(Time * 6.0 + FragPosition.y * 20.0);
    float glow = fresnel * scanline;

    vec3 color = vec3(0.0, 0.7, 1.0) * glow;

    FragColor = vec4(color, glow);
}