import { resolve } from 'path';
import { mergeConfig, defineConfig } from 'vite';
import { crx, ManifestV3Export } from '@crxjs/vite-plugin';
import baseConfig, { baseManifest, baseBuildOptions } from './vite.config.base'

const outDir = resolve(__dirname, 'dist_firefox');

export default mergeConfig(
  baseConfig,
  defineConfig({
    plugins: [
      crx({
        manifest: {
          ...baseManifest,
          background: {
            scripts: [ 'src/pages/background/index.ts' ]
          },
          browser_specific_settings: {
            gecko: {
              id: "{724d1c91-059e-4392-8478-494513fc8241}",
              update_url: "https://helper.chrsnv.ru/api/versions.json"
            }
          }
        } as unknown as ManifestV3Export,
        browser: 'firefox',
        contentScripts: {
          injectCss: true,
        }
      })
    ],
    build: {
      ...baseBuildOptions,
      outDir
    },
    publicDir: resolve(__dirname, 'public'),
  })
)
