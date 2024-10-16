import {
  getUserByApiKeyOrThrow,
  getUserFromCtxOrApiKeyOrThrow,
} from "../get_user"
import { TRPCError } from "@trpc/server"
import prisma from "../../../prisma"

jest.mock("../../../prisma", () => ({
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
  },
}))

describe("getUserByApiKeyOrThrow", () => {
  it("should return user if found", async () => {
    const mockUser = { id: "user1", apiKey: "validKey" }
    ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)

    const result = await getUserByApiKeyOrThrow("validKey")
    expect(result).toEqual(mockUser)
  })

  it("should throw error if user not found", async () => {
    ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

    await expect(getUserByApiKeyOrThrow("invalidKey")).rejects.toThrow(
      TRPCError,
    )
  })
})

describe("getUserFromCtxOrApiKeyOrThrow", () => {
  it("should return user from context if userId is present", async () => {
    const mockUser = { id: "user1" }
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

    const result = await getUserFromCtxOrApiKeyOrThrow(
      { userId: "user1", session: null },
      undefined,
    )
    expect(result).toEqual(mockUser)
  })

  it("should throw error if user not found in context", async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

    await expect(
      getUserFromCtxOrApiKeyOrThrow(
        { userId: "invalidUser", session: null },
        undefined,
      ),
    ).rejects.toThrow(TRPCError)
  })

  it("should use apiKey if userId is not in context", async () => {
    const mockUser = { id: "user1", apiKey: "validKey" }
    ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)

    const result = await getUserFromCtxOrApiKeyOrThrow(
      { userId: undefined, session: null },
      "validKey",
    )
    expect(result).toEqual(mockUser)
  })

  it("should throw error if neither userId nor apiKey is provided", async () => {
    await expect(
      getUserFromCtxOrApiKeyOrThrow({ userId: undefined, session: null }, undefined),
    ).rejects.toThrow(TRPCError)
  })
})
