import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const deployDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dockerfilePath = resolve(deployDir, 'spree.Dockerfile')
const publicMediaInitializerPath = resolve(deployDir, 'overrides', 'cenwatch_public_media.rb')
const repairPath = resolve(deployDir, 'scripts', 'repair_product_media.rb')
const deployScriptPath = resolve(deployDir, 'deploy.sh')

function read(path) {
  return readFileSync(path, 'utf8')
}

test('configures Spree media URLs from a validated public origin', () => {
  assert.ok(existsSync(publicMediaInitializerPath), 'expected the public media initializer')

  const initializer = read(publicMediaInitializerPath)
  const dockerfile = read(dockerfilePath)

  assert.match(initializer, /ENV\.fetch\('SPREE_PUBLIC_URL'\)/)
  assert.match(initializer, /URI\.parse/)
  assert.match(initializer, /URI::HTTP/)
  assert.match(initializer, /public_uri\.port == public_uri\.default_port/)
  assert.match(initializer, /Spree\.cdn_host\s*=\s*public_uri\.host/)
  assert.match(
    dockerfile,
    /COPY deploy\/cenwatch\/overrides\/cenwatch_public_media\.rb \/rails\/config\/initializers\/cenwatch_public_media\.rb/,
  )
})

test('repairs missing product thumbnails before recreating the storefront', () => {
  assert.ok(existsSync(repairPath), 'expected the product media repair runner')

  const repair = read(repairPath)
  const deployScript = read(deployScriptPath)

  assert.match(repair, /Spree::Product\.where\(primary_media_id: nil\)/)
  assert.match(repair, /inspected: 0/)
  assert.match(repair, /summary\[:inspected\] \+= 1/)
  assert.match(repair, /product\.with_lock do/)
  assert.match(repair, /product\.reload/)
  assert.match(repair, /product\.media\.exists\? \|\| product\.variant_images\.exists\?/)
  assert.match(repair, /product\.update_thumbnail!/)
  assert.match(repair, /JSON\.pretty_generate/)
  assert.match(
    deployScript,
    /bin\/rails runner \/rails\/cenwatch-scripts\/repair_product_media\.rb/,
  )

  const repairIndex = deployScript.indexOf('log "Repairing missing product primary media"')
  const storefrontBuildIndex = deployScript.indexOf('Building the CenWatch storefront')
  assert.ok(repairIndex >= 0, 'expected the repair step in deploy.sh')
  assert.ok(
    repairIndex < storefrontBuildIndex,
    'expected product media repair before storefront build',
  )
})
