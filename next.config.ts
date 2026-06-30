import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Pin the workspace root so Turbopack ignores unrelated lockfiles higher up.
  turbopack: { root: __dirname },
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
