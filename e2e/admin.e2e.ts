import { expect, test } from '@playwright/test'
import { ADMIN, entrar } from './ayuda'

test('un administrador ve cuentas y dispositivos sin datos sensibles', async ({ page }) => {
  await entrar(page, ADMIN)
  await page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'Administración' }).click()

  const cuentas = page.getByRole('table', { name: 'Cuentas' })
  await expect(cuentas.getByRole('row')).toHaveCount(4) // encabezado + 3
  const baja = cuentas.getByRole('row').filter({ hasText: 'baja@sheets.tt' })
  await expect(baja).toContainText('Experto de campo')
  await expect(baja).toContainText('Desactivada')

  const dispositivos = page.getByRole('table', { name: 'Dispositivos' })
  await expect(dispositivos.getByRole('row').filter({ hasText: 'demo-pixel-7-pro' })).toContainText('demo@sheets.tt')

  // Ni hashes bcrypt ni tokens de dispositivo llegan al navegador.
  const cuerpo = await page.content()
  expect(cuerpo).not.toContain('$2a$')
  expect(cuerpo.toLowerCase()).not.toContain('token')
})
