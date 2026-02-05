/**
 * NexaCore - Prisma Mock
 * 
 * Mock do Prisma Client para testes unitários
 * Usa vitest-mock-extended para criar deep mocks
 * 
 * Uso em testes:
 * 
 * ```typescript
 * import { prismaMock } from '@/lib/__mocks__/prisma'
 * 
 * // Configure o retorno esperado
 * prismaMock.user.findUnique.mockResolvedValue({
 *   id: '1',
 *   name: 'Test User',
 *   email: 'test@example.com'
 * })
 * 
 * // Execute o código que usa Prisma
 * const result = await getUserById('1')
 * 
 * // Verifique as chamadas
 * expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
 *   where: { id: '1' }
 * })
 * ```
 * 
 * @see https://www.prisma.io/blog/testing-series-1-8eRB5p0Y8o
 */

import { PrismaClient } from '@prisma/client'
import { beforeEach } from 'vitest'
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended'

/**
 * Mock profundo do PrismaClient
 * Todos os métodos e propriedades são automaticamente mockados
 */
export const prismaMock = mockDeep<PrismaClient>()

/**
 * Reset automático do mock antes de cada teste
 * Isso garante isolamento entre testes
 */
beforeEach(() => {
    mockReset(prismaMock)
})

/**
 * Tipo exportado para uso em testes
 */
export type PrismaMock = DeepMockProxy<PrismaClient>

/**
 * Export default para compatibilidade com imports
 */
export default prismaMock
