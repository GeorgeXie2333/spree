import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const deployDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const composePath = resolve(deployDir, 'compose.yml')
const deployScriptPath = resolve(deployDir, 'deploy.sh')
const dockerfilePath = resolve(deployDir, 'spree.Dockerfile')
const initializerPath = resolve(deployDir, 'overrides', 'cenwatch_locale_isolation.rb')
const auditPath = resolve(deployDir, 'scripts', 'audit_locale_content.rb')
const repairPath = resolve(deployDir, 'scripts', 'repair_locale_content.rb')

function read(path) {
  return readFileSync(path, 'utf8')
}

test('builds web and worker from the pinned Spree base image', () => {
  assert.ok(existsSync(dockerfilePath), 'expected the derived Spree Dockerfile')

  const dockerfile = read(dockerfilePath)
  const compose = read(composePath)

  assert.match(dockerfile, /ARG SPREE_VERSION_TAG/)
  assert.match(dockerfile, /FROM ghcr\.io\/spree\/spree:\$\{SPREE_VERSION_TAG\}/)
  assert.match(compose, /image: cenwatch-spree:local/)
  assert.match(compose, /dockerfile: deploy\/cenwatch\/spree\.Dockerfile/)
})

test('isolates admin UI locale and Store API content locale', () => {
  assert.ok(existsSync(initializerPath), 'expected the locale isolation initializer')

  const initializer = read(initializerPath)

  assert.match(initializer, /Spree::Admin::BaseController/)
  assert.match(initializer, /Spree::Api::V3::BaseController/)
  assert.match(initializer, /I18n\.default_locale\s*=\s*content_locale/)
  assert.match(initializer, /Mobility\.locale\s*=\s*content_locale/)
  assert.match(
    initializer,
    /module ApiContentLocale[\s\S]*I18n\.default_locale\s*=\s*content_locale[\s\S]*super[\s\S]*Mobility\.locale\s*=\s*current_locale/,
  )
})

test('builds the derived backend before replacing Rails services', () => {
  const deployScript = read(deployScriptPath)

  assert.match(deployScript, /compose build --pull web worker/)
  assert.match(deployScript, /compose pull postgres redis/)
  assert.match(deployScript, /compose up -d --wait --force-recreate storefront/)
})

test('ships a read-only audit and opt-in default-locale repair', () => {
  assert.ok(existsSync(auditPath), 'expected the locale content audit script')
  assert.ok(existsSync(repairPath), 'expected the locale content repair script')

  const audit = read(auditPath)
  const repair = read(repairPath)

  assert.match(audit, /JSON\.pretty_generate/)
  assert.match(audit, /read_attribute/)
  assert.match(repair, /ENV\.fetch\("APPLY", "false"\) == "true"/)
  assert.match(repair, /Mobility\.with_locale\(store\.default_locale\)/)
  assert.match(repair, /next unless missing_default_content/)
  assert.match(repair, /record\.read_attribute\(field\)\.blank\?\s*&&\s*value\.present\?/)
  assert.match(repair, /record\.with_lock do/)
  assert.match(repair, /record\.reload/)
  assert.match(repair, /skipped_due_to_concurrent_update/)
})
