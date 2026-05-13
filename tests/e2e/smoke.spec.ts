// Playwright E2E 하네스 작동 확인.
// critical path E2E (인증/파티 합류 등)는 각 트랙이 같은 패턴으로 추가.
import { test, expect } from '@playwright/test'

test('login page renders', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByText('점메추')).toBeVisible()
})
