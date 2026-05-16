#version 330 core

in vec2 TextureCoordinate;

out vec4 FragColor;

uniform vec2 Resolution;
uniform float Time;

void main()
{
    vec2 uv = (gl_FragCoord.xy / Resolution.xy) * 2.0 - 1.0;
    float distance = length(uv);

    float glow = 1.0 - smoothstep(0.2, 0.9, distance);
    glow *= 0.8 + 0.2 * sin(Time * 6.0 + uv.y * 30.0);

    vec3 color = vec3(0.0, 0.7, 1.0) * glow;

    FragColor = vec4(color, glow);
}