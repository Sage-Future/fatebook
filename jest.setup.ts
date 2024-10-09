import "@testing-library/jest-dom"
import { TextEncoder, TextDecoder } from "util"
import { jest } from "@jest/globals"

// Move this to the top
jest.doMock("next-auth/providers/google", () => {
  const GoogleProvider = jest.fn(() => ({
    id: "google",
    name: "Google",
    type: "oauth",
  }))
  return { default: GoogleProvider, GoogleProvider }
})

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as any

jest.mock("./lib/_constants", () => ({
  postmarkApiToken: "mocked-postmark-api-token",
  // Add other constants you're using from this file
}))

// Mock Next.js router
jest.mock("next/router", () => ({
  useRouter() {
    return {
      route: "/",
      pathname: "",
      query: "",
      asPath: "",
      push: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
      },
      beforePopState: jest.fn(() => null),
      prefetch: jest.fn(() => null),
    }
  },
}))

// Update the mock for next-auth/providers/google
jest.mock("next-auth/providers/google", () => {
  const GoogleProvider = jest.fn(() => ({
    id: "google",
    name: "Google",
    type: "oauth",
  }))
  return { default: GoogleProvider, GoogleProvider }
})

// Update the next-auth mock
jest.mock("next-auth", () => {
  const originalModule = jest.requireActual("next-auth")
  return {
    __esModule: true,
    ...(originalModule as object),
    default: jest.fn(() => Promise.resolve({ status: "mocked" })),
    getServerSession: jest.fn(() =>
      Promise.resolve({ user: { id: "mocked-user-id" } }),
    ),
    NextAuth: jest.fn(() => ({ status: "mocked" })),
  }
})

// Mock PrismaAdapter
jest.mock("@next-auth/prisma-adapter", () => ({
  PrismaAdapter: jest.fn(() => ({
    createUser: jest.fn(),
    // Add other methods as needed
  })),
}))

// Mock prisma client
// jest.mock("./lib/prisma", () => ({
//   __esModule: true,
//   default: {
//     user: {
//       create: jest.fn(),
//       findUnique: jest.fn(),
//       update: jest.fn(),
//       // Add other methods as needed
//     },
//     // Add other models as needed
//   },
// }))

// Mock the [...nextauth].ts file
jest.mock("./pages/api/auth/[...nextauth]", () => {
  const GoogleProvider = jest.fn(() => ({
    id: "google",
    name: "Google",
    type: "oauth",
  }))
  return {
    __esModule: true,
    authOptions: {
      adapter: {},
      providers: [GoogleProvider()],
      // Add other properties as needed
    },
    default: jest.fn(),
  }
})

// Add any other global mocks or setup here
