#include "HologramApplication.h"

#include <ituGL/shader/Shader.h>
#include <ituGL/shader/ShaderProgram.h>
#include <ituGL/geometry/VertexFormat.h>
#include <ituGL/geometry/VertexAttribute.h>
#include <ituGL/geometry/Drawcall.h>
#include <cassert>  // for asserts
#include <array>    // to get shader error messages
#include <fstream>  // shader loading
#include <sstream>  // shader loading
#include <iostream> // to print messages to the console
#include <vector>   // to store vertices and indices
#include <numbers>  // for PI constant
#include <glm/gtx/transform.hpp>  // for matrix transformations

#include "imgui.h"

HologramApplication::HologramApplication()
    : Application(1024, 1024, "Hologram Planet Shader"),
    m_resolutionUniform(0),
    m_timeUniform(0),
    m_worldMatrixUniform(0),
    m_viewProjectionUniform(0),
    m_cameraPositionUniform(0)
{
}

void HologramApplication::Initialize()
{
    Application::Initialize();
    GetDevice().EnableFeature(GL_DEPTH_TEST);
    InitializeGeometry();
    InitializeShaders();
}

void HologramApplication::Update()
{
    Application::Update();
    m_elapsedTime += GetDeltaTime();
    m_rotation += m_rotationSpeed * GetDeltaTime();
}

void HologramApplication::Render()
{
    GetDevice().Clear(true, Color(0.0f, 0.0f, 0.0f), true, 1.0f);
    m_hologramShader.Use();

    // Get resolution
    int width, height;
    GetMainWindow().GetDimensions(width, height);

    // Camera position
    glm::vec3 cameraPosition(0.0f, 0.0f, 3.0f);

    // Set uniforms
    glm::vec2 resolution(static_cast<float>(width), static_cast<float>(height));
    m_hologramShader.SetUniform(m_resolutionUniform, resolution);
    m_hologramShader.SetUniform(m_timeUniform, m_elapsedTime);
    m_hologramShader.SetUniform(m_cameraPositionUniform, cameraPosition);

    // World Matrix
    glm::mat4 rotate = glm::rotate(m_rotation, glm::vec3(0, 1, 0));
    glm::mat4 scale = glm::scale(glm::vec3(1.0f));

    glm::mat4 worldMatrix = rotate * scale;
    m_hologramShader.SetUniform(m_worldMatrixUniform, worldMatrix);

    // Projection Matrix
    glm::mat4 projection = glm::perspective(glm::radians(60.0f), width / float(height), 0.1f, 100.0f);
    glm::mat4 view = glm::lookAt(cameraPosition, glm::vec3(0, 0, 0), glm::vec3(0, 1, 0));

    glm::mat4 viewProjectionMatrix = projection * view;
    m_hologramShader.SetUniform(m_viewProjectionUniform, viewProjectionMatrix);


    // Draw mesh
    m_mesh->DrawSubmesh(0);

    Application::Render();
}

void HologramApplication::InitializeGeometry()
{
    // Create mesh
    m_mesh = std::make_unique<Mesh>();

    // Create rendering
    VertexFormat vertexFormat;
    vertexFormat.AddVertexAttribute<float>(3, VertexAttribute::Semantic::Position);

    // Vertices & Indices
    std::vector<glm::vec3> vertices;
    std::vector<unsigned int> indices;

    // Sphere smoothness
    const int bands = 32;
    const int segments = 64;

    // Create sphere vertices and indices
    for (int i = 0; i <= bands; ++i) {
        float phi = (float)i / bands * glm::pi<float>();

        for (int j = 0; j <= segments; ++j) {
            float theta = (float)j / segments * glm::two_pi<float>();

            float x = sin(phi) * cos(theta);
            float y = cos(phi);
            float z = sin(phi) * sin(theta);

            vertices.emplace_back(x, y, z);
        }
    }
    for (int i = 0; i < bands; ++i) {
        for (int j = 0; j < segments; ++j) {
            int row1 = i * (segments + 1);
            int row2 = (i + 1) * (segments + 1);

            indices.push_back(row1 + j);
            indices.push_back(row2 + j);
            indices.push_back(row1 + j + 1);

            indices.push_back(row1 + j + 1);
            indices.push_back(row2 + j);
            indices.push_back(row2 + j + 1);
        }
    }

    // Create submesh
    m_mesh->AddSubmesh<glm::vec3, unsigned int>(
        Drawcall::Primitive::Triangles,
        vertices, indices,
        vertexFormat.LayoutBegin(static_cast<int>(vertices.size()), false),
        vertexFormat.LayoutEnd()
    );

}

void HologramApplication::InitializeShaders()
{
    Shader vertexShader(Shader::Type::VertexShader);
    LoadAndCompileShader(vertexShader, "shaders/planet.vert");

    Shader fragmentShader(Shader::Type::FragmentShader);
    LoadAndCompileShader(fragmentShader, "shaders/planet.frag");

    if (!m_hologramShader.Build(vertexShader, fragmentShader)) {
        std::cout << "Error building shader" << std::endl;
        return;
    }

    // Uniforms
    m_resolutionUniform = m_hologramShader.GetUniformLocation("Resolution");
    m_timeUniform = m_hologramShader.GetUniformLocation("Time");
    m_worldMatrixUniform = m_hologramShader.GetUniformLocation("WorldMatrix");
    m_viewProjectionUniform = m_hologramShader.GetUniformLocation("ViewProjectionMatrix");
    m_cameraPositionUniform = m_hologramShader.GetUniformLocation("CameraPosition");
}

// Taken from exercise03
void HologramApplication::LoadAndCompileShader(Shader& shader, const char* path)
{
    // Open the file for reading
    std::ifstream file(path);
    if (!file.is_open())
    {
        std::cout << "Can't find file: " << path << std::endl;
        std::cout << "Is your working directory properly set?" << std::endl;
        return;
    }

    // Dump the contents into a string
    std::stringstream stringStream;
    stringStream << file.rdbuf() << '\0';

    // Set the source code from the string
    shader.SetSource(stringStream.str().c_str());

    // Try to compile
    if (!shader.Compile())
    {
        // Get errors in case of failure
        std::array<char, 256> errors;
        shader.GetCompilationErrors(errors);
        std::cout << "Error compiling shader: " << path << std::endl;
        std::cout << errors.data() << std::endl;
    }
}