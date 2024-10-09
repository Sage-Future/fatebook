import { createNextApiHandler } from "@trpc/server/adapters/next"
import { appRouter } from "../../lib/web/app_router"
import prisma from "../../lib/prisma"
import { NextApiRequest, NextApiResponse } from "next"
import { createMocks, RequestMethod } from "node-mocks-http"
import { Context } from "../../lib/web/trpc_base"

const createTestContext = (req: NextApiRequest, res: NextApiResponse): Context => {
  return {
    session: null,
    userId: undefined,
  }
}

const nextApiHandler = createNextApiHandler({
  router: appRouter,
  createContext: (opts) => createTestContext(opts.req, opts.res),
})

describe('Question Router v0', () => {
  let apiKey: string
  let questionId: string

  beforeAll(async () => {
    try {
      // Create a test user and get their API key
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          apiKey: 'test_api_key_v0',
        },
      })
      
      if (!user) {
        throw new Error('User creation failed: user is undefined')
      }
      
      apiKey = user.apiKey || 'test_api_key_v0'
    } catch (error) {
      console.error('Error in beforeAll:', error)
      throw error // Re-throw to fail the test setup
    }
  })

  afterAll(async () => {
    // Clean up the test user and questions
    await prisma.user.delete({
      where: { email: 'test@example.com' },
    })
    await prisma.question.deleteMany({
      where: { title: { startsWith: 'Test Question' } },
    })
  })

  const callApi = async (method: RequestMethod, path: string, body?: any) => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method,
      query: {
        trpc: path,
      },
      headers: {
        'x-api-key': apiKey,
      },
      body,
    })

    await nextApiHandler(req, res)

    return { req, res }
  }

  test('Create a question', async () => {
    const { res } = await callApi('POST', 'legacyQuestion.create', {
      title: 'Test Question v0',
      resolveBy: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
      prediction: 0.7,
    })

    expect(res._getStatusCode()).toBe(200)
    const result = JSON.parse(res._getData())
    expect(result.result.data.url).toBeDefined()
    questionId = result.result.data.url.split('/').pop()
  })

  test('Get a question', async () => {
    const { res } = await callApi('GET', `legacyQuestion.getQuestion?input=${JSON.stringify({ questionId })}`)

    expect(res._getStatusCode()).toBe(200)
    const result = JSON.parse(res._getData())
    expect(result.result.data.title).toBe('Test Question v0')
  })

  test('Add a forecast', async () => {
    const { res } = await callApi('POST', 'questionRouter.addForecast', {
      questionId,
      forecast: 0.8,
    })

    expect(res._getStatusCode()).toBe(200)
  })

  test('Resolve a question', async () => {
    const { res } = await callApi('POST', 'questionRouter.resolveQuestion', {
      questionId,
      resolution: 'YES',
      questionType: 'BINARY',
    })

    expect(res._getStatusCode()).toBe(200)
  })

  test('Delete a question', async () => {
    const { res } = await callApi('POST', 'questionRouter.deleteQuestion', {
      questionId,
    })

    expect(res._getStatusCode()).toBe(200)
  })
})