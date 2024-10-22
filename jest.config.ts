/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type { Config } from "jest"
import nextJest from "next/jest.js"

const createJestConfig = nextJest({
  dir: "./",
})

// Allows jest to be able to use ESM correctly in test setup
const esModules = [
  "@panva/hkdf",
  "data-uri-to-buffer",
  "fetch-blob",
  "formdata-polyfill",
  "jose",
  "node-fetch",
  "preact",
  "preact-render-to-string",
  "superjson",
  "uncrypto",
  "uuid",
]
const customConfig: Config = {
  clearMocks: true,
  collectCoverage: false,
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "**/*.{js,jsx,ts,tsx}",
    "!**/node_modules/**",
    "!**/vendor/**",
  ],
  coverageProvider: "v8",
  // setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"], - can uncomment when jest.setup.ts is reintroduced
  testEnvironment: "jsdom",
  transformIgnorePatterns: [`/node_modules/(?!(${esModules.join("|")})/)`],
}

module.exports = async () => {
  const jestConfig = await createJestConfig(customConfig)()
  return {
    ...jestConfig,
    transformIgnorePatterns:
      jestConfig.transformIgnorePatterns?.filter(
        (ptn) => ptn !== "/node_modules/",
      ) ?? [],
  }
}
