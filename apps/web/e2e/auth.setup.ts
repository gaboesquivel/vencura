import { test as setup } from '@playwright/test'

// Dynamic sandbox auth paused — replace setup.skip with setup() to re-enable (needs E2E_* env).
setup.skip('authenticate', async () => {})
