import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'node',
          environment: 'node',
          setupFiles: ['./tests/setup.ts'],
          include: ['tests/!(react)/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'react',
          environment: 'happy-dom',
          setupFiles: ['./tests/react/setup.ts'],
          include: ['tests/react/**/*.test.ts'],
        },
      },
    ],
  },
})
