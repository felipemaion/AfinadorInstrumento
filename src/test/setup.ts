import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Unmount React trees between tests so DOM doesn't accumulate.
// Safe in Node env too — it's a no-op when nothing was rendered.
afterEach(() => {
  cleanup()
})
