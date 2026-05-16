#version 330 core

layout (location = 0) in vec3 VertexPosition;

out vec2 TextureCoordinate;

uniform mat4 WorldMatrix;
uniform mat4 ViewProjectionMatrix;

void main()
{
    TextureCoordinate = VertexPosition.xy * 0.5 + 0.5;
    gl_Position = ViewProjectionMatrix * WorldMatrix * vec4(VertexPosition, 1.0);
}