// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.

import { preInit } from "./src/pre-init";
preInit();

import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// A custom plugin to robustly suppress "use client" / MODULE_LEVEL_DIRECTIVE warnings
// in Vite 6 across all resolved environments (client, ssr, nitro, etc.)
const suppressWarningsPlugin = () => {
  const patchOnwarn = (rollupOptions: any) => {
    if (!rollupOptions) return;
    const originalOnwarn = rollupOptions.onwarn;
    rollupOptions.onwarn = (warning: any, warn: any) => {
      if (
        warning.code === "MODULE_LEVEL_DIRECTIVE" ||
        (warning.message && warning.message.toLowerCase().includes("use client"))
      ) {
        return;
      }
      if (originalOnwarn) {
        originalOnwarn(warning, warn);
      } else {
        warn(warning);
      }
    };
  };

  return {
    name: "suppress-warnings-plugin",
    config(config: any) {
      if (!config.build) config.build = {};
      if (!config.build.rollupOptions) config.build.rollupOptions = {};
      patchOnwarn(config.build.rollupOptions);

      if (config.environments) {
        for (const env of Object.values(config.environments)) {
          if (env && typeof env === "object") {
            const envObj = env as any;
            if (!envObj.build) envObj.build = {};
            if (!envObj.build.rollupOptions) envObj.build.rollupOptions = {};
            patchOnwarn(envObj.build.rollupOptions);
          }
        }
      }
    },
    configResolved(config: any) {
      if (config.build?.rollupOptions) {
        patchOnwarn(config.build.rollupOptions);
      }
      if (config.environments) {
        for (const env of Object.values(config.environments)) {
          const envObj = env as any;
          if (envObj?.build?.rollupOptions) {
            patchOnwarn(envObj.build.rollupOptions);
          }
        }
      }
    },
  };
};

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  nitro: {
    preset: "node-server",
  },
  vite: {
    plugins: [suppressWarningsPlugin()],
  },
});
