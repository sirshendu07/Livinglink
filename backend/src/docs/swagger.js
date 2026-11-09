const swaggerUi = require('swagger-ui-express');

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'LivingLink Society Management API',
    version: '1.0.0',
    description:
      'Production-minded REST API documentation for LivingLink — Advanced Residential Society Management Platform.\n\n### User Roles:\n- **OWNER**: Society resident flat owner\n- **ADMIN**: Society management committee administrator\n- **SECURITY**: Gate & amenity security guard'
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API Version 1'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Pass your short-lived access token in the Authorization header: `Bearer <token>`'
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ],
  paths: {
    '/health': {
      get: {
        summary: 'System health check',
        description: 'Returns status of Express server, MongoDB, and Redis',
        security: [],
        responses: {
          200: { description: 'System healthy' },
          503: { description: 'System degraded' }
        }
      }
    },
    '/auth/register': {
      post: {
        summary: 'Register new flat owner (PUBLIC)',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'phone', 'password', 'tower', 'flatNumber'],
                properties: {
                  name: { type: 'string', example: 'John Doe' },
                  email: { type: 'string', example: 'john@example.com' },
                  phone: { type: 'string', example: '+919876543210' },
                  password: { type: 'string', example: 'SecretPass#123' },
                  tower: { type: 'string', example: 'Tower A' },
                  flatNumber: { type: 'string', example: '101' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Registration successful. OTP sent.' }
        }
      }
    },
    '/auth/verify-otp': {
      post: {
        summary: 'Verify registration or password-reset OTP',
        security: [],
        responses: {
          200: { description: 'OTP verified successfully' }
        }
      }
    },
    '/auth/login': {
      post: {
        summary: 'User login',
        security: [],
        responses: {
          200: { description: 'Returns access token and sets HttpOnly refresh cookie' }
        }
      }
    },
    '/auth/refresh-token': {
      post: {
        summary: 'Rotate tokens using refresh token',
        security: [],
        responses: {
          200: { description: 'New access token and refresh token' }
        }
      }
    },
    '/notices': {
      get: {
        summary: 'Get published notices (All authenticated roles)',
        responses: {
          200: { description: 'List of published notices' }
        }
      },
      post: {
        summary: 'Create notice (ADMIN only)',
        responses: {
          201: { description: 'Notice created' }
        }
      }
    },
    '/feed': {
      get: {
        summary: 'Get common society feed messages (All authenticated roles)',
        responses: {
          200: { description: 'Paginated messages' }
        }
      },
      post: {
        summary: 'Send feed message (All authenticated roles)',
        responses: {
          201: { description: 'Message broadcast to room' }
        }
      }
    },
    '/amenities': {
      get: {
        summary: 'Get active amenities catalog (All authenticated roles)',
        responses: {
          200: { description: 'Amenity catalog' }
        }
      }
    },
    '/amenity-access/cards/{amenityId}': {
      get: {
        summary: 'Get Digital Amenity Access Card (OWNER only)',
        responses: {
          200: { description: 'Card status (GREEN / RED) with signed QR verification token' }
        }
      }
    },
    '/amenity-access/verify': {
      post: {
        summary: 'Security scans QR verification token (SECURITY & ADMIN)',
        responses: {
          200: { description: 'Access verification result and entry log recorded' }
        }
      }
    },
    '/maintenance/my': {
      get: {
        summary: 'View maintenance invoices for own flat (OWNER only)',
        responses: {
          200: { description: 'List of bills' }
        }
      }
    },
    '/payments/pay-maintenance': {
      post: {
        summary: 'Pay maintenance bill via demo simulation passphrase (OWNER only)',
        responses: {
          200: { description: 'Bill marked PAID and receipt generated' }
        }
      }
    },
    '/receipts/{id}/download': {
      get: {
        summary: 'Download PDFKit payment receipt (OWNER for own, ADMIN for all)',
        responses: {
          200: { description: 'Binary application/pdf download' }
        }
      }
    },
    '/visitors': {
      post: {
        summary: 'Security creates visitor entry request at gate (SECURITY & ADMIN)',
        responses: {
          201: { description: 'Request created and resident notified in real-time' }
        }
      }
    },
    '/visitors/{id}/respond': {
      patch: {
        summary: 'Resident approves or rejects visitor (OWNER only)',
        responses: {
          200: { description: 'Decision recorded and security notified' }
        }
      }
    },
    '/sos/trigger': {
      post: {
        summary: 'Trigger critical emergency SOS (All authenticated roles)',
        responses: {
          201: { description: 'Emergency alert dispatched to guards and admins' }
        }
      }
    },
    '/analytics/dashboard': {
      get: {
        summary: 'Admin consolidated society analytics dashboard (ADMIN only)',
        responses: {
          200: { description: 'Aggregated society statistics' }
        }
      }
    }
  }
};

const setupSwagger = (app) => {
  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app.get('/api/v1/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerDocument);
  });
};

module.exports = setupSwagger;
