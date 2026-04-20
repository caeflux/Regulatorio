import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { config } from './config/env'
import { authRoutes } from './modules/auth/routes'
import { obligationRoutes } from './modules/obligations/routes'
import { contributionRoutes } from './modules/contributions/routes'
import { diciRoutes } from './modules/dici/routes'
import { contractRoutes } from './modules/contracts/routes'
import { knowledgeRoutes } from './modules/knowledge/routes'
import { authMiddleware } from './middleware/auth'
import { tenantMiddleware } from './middleware/tenant'
import { initEmailService } from './utils/email'

const app = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true },
    },
  },
})

async function bootstrap() {
  // Plugins
  await app.register(cors, {
    origin: config.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })

  await app.register(jwt, {
    secret: config.JWT_SECRET,
    sign: { expiresIn: config.JWT_ACCESS_EXPIRY || '15m' },
  })

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  })

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'RegTelecom API',
        description: 'API de compliance regulatório ANATEL para ISPs',
        version: '0.1.0',
      },
      servers: [{ url: `http://localhost:${config.API_PORT}` }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  })

  await app.register(swaggerUi, {
    routePrefix: '/docs',
  })

  // SendGrid
  if (config.SENDGRID_API_KEY) {
    initEmailService({
      apiKey: config.SENDGRID_API_KEY,
      fromEmail: config.SENDGRID_FROM_EMAIL,
      fromName: config.SENDGRID_FROM_NAME,
    })
  }

  // Decorators
  app.decorate('authenticate', authMiddleware)
  app.decorate('tenant', tenantMiddleware)

  // Health check
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
  }))

  // Routes
  await app.register(authRoutes, { prefix: '/api/v1/auth' })
  await app.register(obligationRoutes, { prefix: '/api/v1/obligations' })
  await app.register(contributionRoutes, { prefix: '/api/v1/contributions' })
  await app.register(diciRoutes, { prefix: '/api/v1/dici' })
  await app.register(contractRoutes, { prefix: '/api/v1/contracts' })
  await app.register(knowledgeRoutes, { prefix: '/api/v1/knowledge' })

  // Start
  try {
    await app.listen({ port: config.API_PORT, host: config.API_HOST })
    app.log.info(`RegTelecom API rodando em http://${config.API_HOST}:${config.API_PORT}`)
    app.log.info(`Documentação em http://localhost:${config.API_PORT}/docs`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

bootstrap()

export default app
