#pragma once

#include <ituGL/application/Application.h>
#include <ituGL/shader/ShaderProgram.h>
#include <ituGL/geometry/Mesh.h>
#include <ituGL/camera/Camera.h>
#include <ituGL/geometry/VertexAttribute.h>

#include <memory>

#include "glm/trigonometric.hpp"

class HologramApplication : public Application
{
public:
    HologramApplication();

protected:
    void Initialize() override;
    void Update() override;
    void Render() override;

private:
    void InitializeGeometry();
    void InitializeShaders();
    void LoadAndCompileShader(Shader& shader, const char* path);

private:
    // Camera
    Camera m_camera;

    // Rotation
    float m_rotation = 0.0f;
    float m_rotationSpeed = glm::radians(30.0f);

    // Mesh
    std::unique_ptr<Mesh> m_mesh;

    // Hologram Shader
    ShaderProgram m_hologramShader;

    // Shader uniform locations
    ShaderProgram::Location m_resolutionUniform;
    ShaderProgram::Location m_timeUniform;
    ShaderProgram::Location m_worldMatrixUniform;
    ShaderProgram::Location m_viewProjectionUniform;
    ShaderProgram::Location m_cameraPositionUniform;


    // Time
    float m_elapsedTime = 0.0f;

};
