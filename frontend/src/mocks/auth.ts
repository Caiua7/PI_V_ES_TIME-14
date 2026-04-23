import type { UserProfile } from '../types'

export const mockUsers: UserProfile[] = [
  {
    id: 'u-1',
    nome: 'Ana Pricing',
    email: 'pricing@neoprice.com',
    areaCargo: 'Pricing Manager',
    role: 'pricing',
  },
  {
    id: 'u-2',
    nome: 'Bruno Pre Sales',
    email: 'presales@neoprice.com',
    areaCargo: 'Pre Sales',
    role: 'pre-sales',
  },
  {
    id: 'u-3',
    nome: 'Carla CS',
    email: 'cs@neoprice.com',
    areaCargo: 'Customer Success',
    role: 'cs',
  },
]
