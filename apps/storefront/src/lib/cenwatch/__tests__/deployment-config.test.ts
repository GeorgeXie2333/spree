import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workspaceRoot = resolve(__dirname, "../../../../../..");

function readWorkspaceFile(path: string) {
  return readFileSync(resolve(workspaceRoot, path), "utf8");
}

describe("CenWatch deployment configuration", () => {
  it("ignores local env files while preserving env examples", () => {
    const gitignore = readWorkspaceFile(".gitignore");

    expect(gitignore).toContain("**/.env*");
    expect(gitignore).toContain("!**/.env.example");
    expect(gitignore).toContain("!**/.env.local.example");
  });

  it("builds the storefront Docker image through pnpm with Stripe publishable key", () => {
    const dockerfile = readWorkspaceFile("apps/storefront/Dockerfile");

    expect(dockerfile).toContain("corepack enable");
    expect(dockerfile).toContain("pnpm install");
    expect(dockerfile).toContain("--filter @cenwatch/storefront");
    expect(dockerfile).toContain("ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
    expect(dockerfile).toContain(
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    );
  });

  it("documents root-context Docker builds with the Stripe build arg", () => {
    const readme = readWorkspaceFile("apps/storefront/README.md");

    expect(readme).toContain("docker build -f apps/storefront/Dockerfile");
    expect(readme).toContain("--build-arg NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=");
  });

  it("keeps local image optimization disabled in production", () => {
    const config = readWorkspaceFile("apps/storefront/next.config.ts");

    expect(config).toContain(
      'const allowLocalImages = process.env.NODE_ENV !== "production"',
    );
    expect(config).toContain("dangerouslyAllowLocalIP: allowLocalImages");

    const devOnlyPatternsStart = config.indexOf("...(allowLocalImages");
    const devOnlyPatternsEnd = config.indexOf(": []),", devOnlyPatternsStart);

    expect(devOnlyPatternsStart).toBeGreaterThan(-1);
    expect(devOnlyPatternsEnd).toBeGreaterThan(devOnlyPatternsStart);
    expect(config.slice(devOnlyPatternsStart, devOnlyPatternsEnd)).toContain(
      'hostname: "**.trycloudflare.com"',
    );
    expect(config.slice(devOnlyPatternsEnd)).not.toContain(
      'hostname: "**.trycloudflare.com"',
    );
  });

  it("roots Next builds at the pnpm workspace for standalone output", () => {
    const config = readWorkspaceFile("apps/storefront/next.config.ts");

    expect(config).toContain('path.resolve(__dirname, "../..")');
    expect(config).toContain("root: workspaceRoot");
    expect(config).toContain("outputFileTracingRoot: workspaceRoot");
  });

  it("server-renders localized html lang through the shop route group", () => {
    const rootLayoutPath = resolve(
      workspaceRoot,
      "apps/storefront/src/app/layout.tsx",
    );
    const shopLayout = readWorkspaceFile(
      "apps/storefront/src/app/(shop)/[country]/[locale]/layout.tsx",
    );

    expect(existsSync(rootLayoutPath)).toBe(false);
    expect(shopLayout).toContain("<html lang={getHtmlLang(normalizedLocale)}>");
    expect(shopLayout).not.toContain("htmlLangScript");
    expect(shopLayout).not.toContain("dangerouslySetInnerHTML");
  });
});
