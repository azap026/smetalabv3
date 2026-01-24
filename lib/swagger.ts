import { createSwaggerSpec } from 'next-swagger-doc';

export const getApiDocs = () => {
    const spec = createSwaggerSpec({
        apiFolder: 'app/api',
        definition: {
            openapi: '3.0.0',
            info: {
                title: 'Smetalab API Documentation',
                version: '1.0.0',
                description: 'Detailed API documentation for Smetalab SaaS project',
            },
            components: {
                securitySchemes: {
                    BearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                    },
                },
            },
            security: [],
        },
    });
    return spec;
};
