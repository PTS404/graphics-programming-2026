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
    m_viewProjectionUniform(0)
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
}

void HologramApplication::Render()
{
    GetDevice().Clear(true, Color(0.0f, 0.0f, 0.0f), true, 1.0f);
    m_hologramShader.Use();

    // Set uniforms
    int width, height;
    GetMainWindow().GetDimensions(width, height);

    glm::vec2 resolution(static_cast<float>(width), static_cast<float>(height));
    m_hologramShader.SetUniform(m_resolutionUniform, resolution);
    m_hologramShader.SetUniform(m_timeUniform, m_elapsedTime);
    glm::mat4 worldMatrix = glm::identity<glm::mat4>();
    m_hologramShader.SetUniform(m_worldMatrixUniform, worldMatrix);
    glm::mat4 viewProjectionMatrix = glm::identity<glm::mat4>();
    m_hologramShader.SetUniform(m_viewProjectionUniform, viewProjectionMatrix);

    // Draw mesh
    m_quadMesh->DrawSubmesh(0);

    Application::Render();
}

void HologramApplication::InitializeGeometry()
{
    // Create mesh
    m_quadMesh = std::make_unique<Mesh>();

    // Create rendering
    VertexFormat vertexFormat;
    vertexFormat.AddVertexAttribute<float>(3, VertexAttribute::Semantic::Position);

    // Vertices
    std::vector<glm::vec3> vertices = {
        {-1.0f, -1.0f, 0.0f},
        {1.0f, -1.0f, 0.0f},
        {1.0f, 1.0f, 0.0f},
        {-1.0f, 1.0f, 0.0f}
    };

    std::vector<unsigned short> indices {0,1,2,2,3,0};

    m_quadMesh->AddSubmesh<glm::vec3, unsigned short>(
        Drawcall::Primitive::Triangles,
        vertices, indices,
        vertexFormat.LayoutBegin(static_cast<int>(vertices.size()), false),
        vertexFormat.LayoutEnd()
    );

}

void HologramApplication::InitializeShaders()
{
    Shader vertexShader(Shader::Type::VertexShader);
    LoadAndCompileShader(vertexShader, "shaders/hologram.vert");

    Shader fragmentShader(Shader::Type::FragmentShader);
    LoadAndCompileShader(fragmentShader, "shaders/hologram.frag");

    if (!m_hologramShader.Build(vertexShader, fragmentShader)) {
        std::cout << "Error building shader" << std::endl;
        return;
    }

    // Uniforms
    m_resolutionUniform = m_hologramShader.GetUniformLocation("Resolution");
    m_timeUniform = m_hologramShader.GetUniformLocation("Time");
    m_worldMatrixUniform = m_hologramShader.GetUniformLocation("WorldMatrix");
    m_viewProjectionUniform = m_hologramShader.GetUniformLocation("ViewProjectionMatrix");
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