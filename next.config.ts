import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Pin the workspace root so Turbopack ignores unrelated lockfiles higher up.
  turbopack: { root: __dirname },
  env: {
    // Stamped into every bug report so "works on my machine" becomes "that build
    // was three deploys ago". Vercel sets the SHA at build time; locally it is
    // absent and reports read "dev".
    NEXT_PUBLIC_APP_VERSION:
      process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
  },
  // Pretty URLs for the static (non-localised) design pages in public/.
  // These sit outside the [locale] tree, so map the bare paths to the files.
  async rewrites() {
    return [
      { source: "/prototype", destination: "/prototype/index.html" },
      { source: "/styleguide", destination: "/admin/styles.html" },
    ];
  },
};

export default withNextIntl(nextConfig);
