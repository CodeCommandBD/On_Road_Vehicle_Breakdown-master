import { createSwaggerSpec } from "next-swagger-doc";

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: "app/api", // Define where your API routes are located
    definition: {
      openapi: "3.0.0",
      info: {
        title: "On Road Vehicle Breakdown API",
        version: "1.0",
        description: "API Documentation for breakdown assistance platform",
        contact: {
          name: "API Support",
          email: "support@example.com",
        },
      },
      servers: [
        {
          url: "http://localhost:3000",
          description: "Local Server",
        },
        {
          url: "https://your-production-url.com",
          description: "Production Server",
        },
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      security: [],
    },
  });
  return spec;
};
