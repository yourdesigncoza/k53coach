import { createNavigation } from "next-intl/navigation";
import { routing } from "@/i18n/routing";

/**
 * Locale-aware navigation. Use THESE instead of next/link and next/navigation
 * so the active locale is preserved across navigation:
 *   import { Link, useRouter, usePathname, redirect } from "@/i18n/navigation";
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
