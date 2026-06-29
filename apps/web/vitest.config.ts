import { fileURLToPath } from 'node:url'

import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      // Raiz do overflow cumulativo de foco (RangeError: Maximum call stack) sob
      // jsdom: o FocusScope real do Radix instala listeners de focus reentrantes
      // e mantém um stack singleton só limpo em setTimeout(0), acumulando entre
      // testes do mesmo worker. Stub passthrough sem trap. Ver o arquivo abaixo.
      '@radix-ui/react-focus-scope': fileURLToPath(
        new URL('./src/test/stubs/radix-focus-scope.tsx', import.meta.url),
      ),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    passWithNoTests: true,
    testTimeout: 20_000,
    env: {
      VITE_API_BASE_URL: 'http://localhost:3333',
    },
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.{spec,test}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      reporter: ['text', 'lcov'],
      exclude: [
        'src/main.tsx',
        'src/env.ts',
        'src/components/ui/**',
        'src/test/**',
        'src/test-setup.ts',
        'src/**/*.spec.{ts,tsx}',
        // Protótipo visual de referência (mock, sem backend) — rota /preview.
        // Não é feature de produção; as telas reais conectadas têm cobertura 100%.
        'src/features/agroflow/**',
        'src/features/dashboard/**',
      ],
      thresholds: {
        lines: 100,
        branches: 100,
        functions: 100,
        statements: 100,
      },
    },
  },
})
