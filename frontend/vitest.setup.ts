/**
 * NexaCore - Vitest Setup File
 * 
 * Este arquivo é executado antes de cada arquivo de teste.
 * Contém:
 * - Extensões do Testing Library (toBeInTheDocument, etc)
 * - Mocks globais (Next.js, Clerk, Prisma)
 * - Cleanup automático após cada teste
 * 
 * @see https://vitest.dev/config/#setupfiles
 */

import { vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// ============================================
// CLEANUP AUTOMÁTICO
// ============================================

/**
 * Limpa o DOM após cada teste
 * Isso previne vazamento de estado entre testes
 */
afterEach(() => {
    cleanup()
})

// ============================================
// MOCK: Next.js Navigation
// ============================================

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        refresh: vi.fn(),
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
    useParams: () => ({}),
    redirect: vi.fn(),
    notFound: vi.fn(),
}))

// ============================================
// MOCK: Next.js Headers & Cookies
// ============================================

vi.mock('next/headers', () => ({
    headers: () => new Map(),
    cookies: () => ({
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
        has: vi.fn(),
        getAll: vi.fn(() => []),
    }),
}))

// ============================================
// MOCK: Next.js Cache
// ============================================

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
    unstable_cache: vi.fn((fn) => fn),
    unstable_noStore: vi.fn(),
}))

// ============================================
// MOCK: Clerk Auth
// ============================================

/**
 * Mock do Clerk para testes
 * Simula um usuário autenticado por padrão
 * 
 * Para testar cenários sem autenticação, use:
 * vi.mocked(useAuth).mockReturnValue({ userId: null, isLoaded: true, ... })
 */
vi.mock('@clerk/nextjs', () => ({
    // Server-side auth
    auth: vi.fn(() => ({
        userId: 'test-user-id',
        sessionId: 'test-session-id',
        orgId: null,
        getToken: vi.fn().mockResolvedValue('mock-token'),
    })),

    currentUser: vi.fn(() => Promise.resolve({
        id: 'test-user-id',
        firstName: 'Test',
        lastName: 'User',
        emailAddresses: [{ emailAddress: 'test@example.com' }],
        primaryEmailAddress: { emailAddress: 'test@example.com' },
        imageUrl: 'https://example.com/avatar.png',
    })),

    // Client-side hooks
    useUser: vi.fn(() => ({
        user: {
            id: 'test-user-id',
            firstName: 'Test',
            lastName: 'User',
            emailAddresses: [{ emailAddress: 'test@example.com' }],
            primaryEmailAddress: { emailAddress: 'test@example.com' },
            imageUrl: 'https://example.com/avatar.png',
        },
        isLoaded: true,
        isSignedIn: true,
    })),

    useAuth: vi.fn(() => ({
        userId: 'test-user-id',
        sessionId: 'test-session-id',
        isLoaded: true,
        isSignedIn: true,
        getToken: vi.fn().mockResolvedValue('mock-token'),
        signOut: vi.fn(),
    })),

    useClerk: vi.fn(() => ({
        user: { id: 'test-user-id' },
        session: { id: 'test-session-id' },
        signOut: vi.fn(),
        openSignIn: vi.fn(),
        openSignUp: vi.fn(),
    })),

    useOrganization: vi.fn(() => ({
        organization: null,
        isLoaded: true,
    })),

    useOrganizationList: vi.fn(() => ({
        organizationList: [],
        isLoaded: true,
    })),

    // Components
    SignIn: vi.fn(() => null),
    SignUp: vi.fn(() => null),
    SignedIn: vi.fn(({ children }) => children),
    SignedOut: vi.fn(() => null),
    UserButton: vi.fn(() => null),
    ClerkProvider: vi.fn(({ children }) => children),

    // Middleware helper
    clerkMiddleware: vi.fn(() => vi.fn()),
    createRouteMatcher: vi.fn(() => vi.fn(() => true)),
}))

// ============================================
// MOCK: Clerk Server
// ============================================

vi.mock('@clerk/nextjs/server', () => ({
    auth: vi.fn(() => ({
        userId: 'test-user-id',
        sessionId: 'test-session-id',
        orgId: null,
        getToken: vi.fn().mockResolvedValue('mock-token'),
    })),
    currentUser: vi.fn(() => Promise.resolve({
        id: 'test-user-id',
        firstName: 'Test',
        lastName: 'User',
        emailAddresses: [{ emailAddress: 'test@example.com' }],
        primaryEmailAddress: { emailAddress: 'test@example.com' },
    })),
    clerkClient: vi.fn(() => ({
        users: {
            getUser: vi.fn(),
            updateUser: vi.fn(),
        },
    })),
}))

// ============================================
// MOCK: Prisma Client
// ============================================

/**
 * Mock do Prisma usando vitest-mock-extended
 * Permite mockar queries como: prisma.user.findMany()
 * 
 * Em testes individuais, configure o retorno:
 * prismaMock.user.findMany.mockResolvedValue([{ id: '1', name: 'Test' }])
 */
vi.mock('@/lib/prisma', async () => {
    const { mockDeep, mockReset } = await import('vitest-mock-extended')
    const { PrismaClient } = await import('@prisma/client')

    const prismaMock = mockDeep<typeof PrismaClient.prototype>()

    return {
        default: prismaMock,
        prisma: prismaMock,
        __prismaMock: prismaMock,
    }
})

// ============================================
// MOCK: OpenAI
// ============================================

vi.mock('openai', () => {
    const mockCreate = vi.fn().mockResolvedValue({
        choices: [
            {
                message: {
                    content: 'Mock AI response',
                    role: 'assistant',
                },
                finish_reason: 'stop',
            },
        ],
        usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30,
        },
    })

    return {
        default: vi.fn(() => ({
            chat: {
                completions: {
                    create: mockCreate,
                },
            },
        })),
        OpenAI: vi.fn(() => ({
            chat: {
                completions: {
                    create: mockCreate,
                },
            },
        })),
    }
})

// ============================================
// MOCK: Environment Variables
// ============================================

/**
 * Define variáveis de ambiente padrão para testes
 * Pode ser sobrescrito em testes individuais com vi.stubEnv()
 */
beforeAll(() => {
    vi.stubEnv('NODE_ENV', 'test')
    vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/test')
    vi.stubEnv('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'pk_test_mock')
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_mock')
    vi.stubEnv('OPENAI_API_KEY', 'sk-test-mock')
    vi.stubEnv('EVOLUTION_API_URL', 'http://localhost:8080')
    vi.stubEnv('EVOLUTION_API_KEY', 'test-evolution-key')
})

afterAll(() => {
    vi.unstubAllEnvs()
})

// ============================================
// MOCK: Fetch API (para APIs externas)
// ============================================

/**
 * Mock global do fetch
 * Por padrão retorna sucesso, configure em testes específicos:
 * 
 * vi.mocked(global.fetch).mockResolvedValueOnce({
 *   ok: true,
 *   json: () => Promise.resolve({ data: 'test' }),
 * } as Response)
 */
const mockFetch = vi.fn().mockImplementation(() =>
    Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(''),
        blob: () => Promise.resolve(new Blob()),
    })
)

vi.stubGlobal('fetch', mockFetch)

// ============================================
// MOCK: Console (para testes mais limpos)
// ============================================

/**
 * Silencia console.error e console.warn durante testes
 * Isso evita poluição do output com erros esperados
 * 
 * Para habilitar em testes específicos:
 * vi.spyOn(console, 'error').mockImplementation(() => {})
 */
// Descomente se quiser silenciar o console:
// beforeEach(() => {
//   vi.spyOn(console, 'error').mockImplementation(() => {})
//   vi.spyOn(console, 'warn').mockImplementation(() => {})
// })

// ============================================
// MOCK: Window/Document APIs (quando necessário)
// ============================================

// Mock do matchMedia (necessário para responsive components)
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
})

// Mock do ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}))

// Mock do IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    root: null,
    rootMargin: '',
    thresholds: [],
}))

// Mock do scrollTo
window.scrollTo = vi.fn()

// ============================================
// HELPERS EXPORTADOS
// ============================================

/**
 * Helper para resetar todos os mocks entre testes
 * Use em beforeEach se precisar de isolamento completo
 */
export function resetAllMocks() {
    vi.clearAllMocks()
    vi.resetAllMocks()
}

/**
 * Helper para criar um mock de Response do fetch
 */
export function createMockResponse<T>(data: T, status = 200): Response {
    return {
        ok: status >= 200 && status < 300,
        status,
        statusText: status === 200 ? 'OK' : 'Error',
        json: () => Promise.resolve(data),
        text: () => Promise.resolve(JSON.stringify(data)),
        blob: () => Promise.resolve(new Blob([JSON.stringify(data)])),
        headers: new Headers(),
        redirected: false,
        type: 'basic',
        url: '',
        clone: vi.fn(),
        body: null,
        bodyUsed: false,
        arrayBuffer: vi.fn(),
        formData: vi.fn(),
    } as unknown as Response
}
