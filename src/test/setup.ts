import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// jsdom no tiene WebGL: el mapa usa un motor falso que deja los marcadores en el DOM.
vi.mock('../lib/motorMapa', () => import('./motorFalso'))
