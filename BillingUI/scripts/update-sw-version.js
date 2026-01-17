// Script to update service worker version during build
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const packageJsonPath = join(__dirname, '..', 'package.json')
const swPath = join(__dirname, '..', 'public', 'sw.js')

try {
  // Read package.json to get version
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
  const version = packageJson.version || '1.0.0'
  
  // Generate cache version with timestamp for better cache busting
  const timestamp = Date.now()
  const cacheVersion = `v${version}-${timestamp}`
  
  // Read service worker file
  let swContent = readFileSync(swPath, 'utf8')
  
  // Update CACHE_VERSION
  swContent = swContent.replace(
    /const CACHE_VERSION = ['"](.*?)['"]/,
    `const CACHE_VERSION = '${cacheVersion}'`
  )
  
  // Write updated service worker
  writeFileSync(swPath, swContent, 'utf8')
  
  console.log(`[SW] Updated service worker version to: ${cacheVersion}`)
} catch (error) {
  console.error('[SW] Error updating service worker version:', error)
  process.exit(1)
}

