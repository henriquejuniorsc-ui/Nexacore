/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'

/**
 * NexaCore - Vitest Configuration
 * 
 * Configuração otimizada para Next.js 14 + Prisma + Clerk
 * Baseada nas melhores práticas de 2026 (Vitest 4.x)
 * 
 * @see https://vitest.dev/config/
 * @see https://nextjs.org/docs/app/guides/testing/vitest
 */
export default defineConfig({
    plugins: [
        // Suporte para path aliases do tsconfig.json
        tsconfigPaths(),
        // Plugin React para JSX transform
        react(),
    ],

    test: {
        // ============================================
        // AMBIENTE DE TESTE
        // ============================================

        // jsdom simula o ambiente do browser para testes de componentes React
        environment: 'jsdom',

        // Habilita APIs globais (describe, it, expect) sem imports explícitos
        globals: true,

        // Arquivo de setup executado antes de cada arquivo de teste
        setupFiles: ['./vitest.setup.ts'],

        // ============================================
        // PADRÕES DE INCLUSÃO/EXCLUSÃO
        // ============================================

        // Padrões de arquivos de teste
        include: [
            'src/**/*.{test,spec}.{ts,tsx}',
            '__tests__/**/*.{test,spec}.{ts,tsx}',
        ],

        // Excluir arquivos que não devem ser testados
        exclude: [
            'node_modules',
            '.next',
            'dist',
            'coverage',
            '**/*.d.ts',
            '**/types.ts',
            '**/types/**',
        ],

        // ============================================
        // COVERAGE (v8 provider - mais rápido e preciso desde Vitest 3.2)
        // ============================================
        coverage: {
            // V8 é mais rápido e produz resultados idênticos ao Istanbul desde Vitest 3.2
            provider: 'v8',

            // Reporters: text (terminal), json (CI), html (browser), lcov (sonar)
            reporter: ['text', 'text-summary', 'json', 'html', 'lcov'],

            // Diretório de saída do coverage
            reportsDirectory: './coverage',

            // Habilitar coverage apenas quando explicitamente solicitado
            enabled: false,

            // Incluir todos os arquivos, mesmo os não testados (important para métricas reais)
            all: true,

            // Arquivos a incluir no coverage
            include: [
                'src/**/*.{ts,tsx}',
            ],

            // Arquivos a excluir do coverage
            exclude: [
                'node_modules',
                '.next',
                'src/**/*.d.ts',
                'src/**/types.ts',
                'src/**/types/**',
                'src/**/*.test.{ts,tsx}',
                'src/**/*.spec.{ts,tsx}',
                'src/app/**/layout.tsx', // Layouts são difíceis de testar unitariamente
                'src/app/**/loading.tsx',
                'src/app/**/error.tsx',
                'src/middleware.ts',
                '__tests__/**',
                '__mocks__/**',
            ],

            // Ignorar linhas vazias e comentários para coverage mais preciso
            ignoreEmptyLines: true,

            // Gerar report mesmo se os testes falharem
            reportOnFailure: true,

            // ============================================
            // THRESHOLDS - Meta de 70% conforme checklist P0
            // ============================================
            // NOTA: Thresholds desabilitados temporariamente durante fase inicial
            // Habilite gradualmente conforme coverage aumenta
            // 
            // thresholds: {
            //   // Thresholds globais
            //   lines: 70,
            //   functions: 70,
            //   branches: 70,
            //   statements: 70,
            //   
            //   // Thresholds específicos para services (devem ter coverage mais alto)
            //   'src/services/**/*.ts': {
            //     lines: 80,
            //     functions: 80,
            //     branches: 75,
            //     statements: 80,
            //   },
            //   
            //   // Thresholds específicos para utils/lib
            //   'src/lib/**/*.ts': {
            //     lines: 75,
            //     functions: 75,
            //     branches: 70,
            //     statements: 75,
            //   },
            // },
        },

        // ============================================
        // PERFORMANCE E PARALELISMO
        // ============================================

        // Pool de workers (forks é mais estável para Next.js)
        pool: 'forks',

        // Número de workers paralelos (default: número de CPUs)
        // Pode ser reduzido se testes forem instáveis
        // poolOptions: {
        //   forks: {
        //     singleFork: false,
        //   },
        // },

        // Timeout para cada teste (30s é suficiente para a maioria dos casos)
        testTimeout: 30000,

        // Timeout para hooks (beforeAll, afterAll, etc)
        hookTimeout: 30000,

        // ============================================
        // REPORTERS
        // ============================================

        // Reporters para output
        reporters: ['default'],

        // Mostrar output de console.log durante testes
        // (útil para debugging, pode ser desabilitado em CI)
        silent: false,

        // ============================================
        // MOCKING
        // ============================================

        // Limpar todos os mocks automaticamente após cada teste
        clearMocks: true,

        // Restaurar implementação original após cada teste
        restoreMocks: true,

        // Mock automático do timer (útil para testes com setTimeout/setInterval)
        // fakeTimers: {
        //   shouldAdvanceTime: true,
        // },

        // ============================================
        // RETRY E ESTABILIDADE
        // ============================================

        // Número de retries para testes falhos (útil para testes flaky)
        // Desabilitado por padrão - habilite apenas se necessário
        retry: 0,

        // Sequência de execução
        sequence: {
            // Não randomizar ordem dos testes (mais previsível)
            shuffle: false,
        },

    },

    // ============================================
    // RESOLVE (aliases)
    // ============================================
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },

    // ============================================
    // ESBUILD (para remover comentários e melhorar coverage accuracy)
    // ============================================
    esbuild: {
        // Remove comentários do código transpilado (melhora ignoreEmptyLines)
        legalComments: 'none',
    },
})