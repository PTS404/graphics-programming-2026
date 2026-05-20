#version 330 core

layout (location = 0) in vec3 VertexPosition;

out vec3 FragPosition;
out vec3 Normal;

uniform mat4 WorldMatrix;
uniform mat4 ViewProjectionMatrix;

void main()
{
    // Outputs
    vec4 worldPosition = WorldMatrix * vec4(VertexPosition, 1.0);
    FragPosition = worldPosition.xyz;
    Normal = normalize(mat3(WorldMatrix) * VertexPosition);

    // Set position
    gl_Position = ViewProjectionMatrix * worldPosition;
}