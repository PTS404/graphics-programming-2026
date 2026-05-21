#pragma once

#include <ituGL/application/Application.h>
#include <ituGL/shader/ShaderProgram.h>
#include <ituGL/geometry/Mesh.h>
#include <ituGL/camera/Camera.h>
#include <ituGL/geometry/VertexAttribute.h>

#include <memory>

#include "glm/trigonometric.hpp"
#include "ituGL/utils/DearImGui.h"

class HologramApplication : public Application
{
public:
    HologramApplication();

protected:
    void Initialize() override;
    void Update() override;
    void Render() override;
    void Cleanup() override;

private:
    void InitializeGeometry();
    void InitializeShaders();
    void LoadAndCompileShader(Shader& shader, const char* path);

private:
    // Camera
    Camera m_camera;

    // GUI
    DearImGui m_imGui;

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

    // Interaction Uniform Locations
    ShaderProgram::Location m_baseColorUniform;
    ShaderProgram::Location m_accentColorUniform;
    ShaderProgram::Location m_planetSizeUniform;
    ShaderProgram::Location m_ringSizeUniform;
    ShaderProgram::Location m_terrainScaleUniform;
    ShaderProgram::Location m_animationSpeedUniform;

    // Interaction
    glm::vec3 m_baseColor = glm::vec3(0.0f, 0.6f, 1.0f);
    glm::vec3 m_accentColor = glm::vec3(0.0f, 1.0f, 0.9f);
    float m_planetSize = 0.35f;
    float m_ringSize = 0.7f;
    float m_terrainScale = 0.02f;
    float m_animationSpeed = 0.6f;

    // Rotation
    float m_rotation = 0.0f;
    float m_rotationSpeed = glm::radians(30.0f);

    // Time
    float m_elapsedTime = 0.0f;
};
