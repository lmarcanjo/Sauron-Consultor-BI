import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    define: {
      'process.env.SAURON_RUNTIME_MODE': JSON.stringify(process.env.SAURON_RUNTIME_MODE || 'local'),
      'process.env.API_BASE_URL': JSON.stringify(process.env.API_BASE_URL || 'http://localhost:3001'),
      'process.env.CLOUD_AUTH_ENABLED': JSON.stringify(process.env.CLOUD_AUTH_ENABLED || 'false'),
      'process.env.CLOUD_ENTERPRISE_PERSISTENCE_ENABLED': JSON.stringify(process.env.CLOUD_ENTERPRISE_PERSISTENCE_ENABLED || 'false'),
      'process.env.CLOUD_WORKBOOK_METADATA_ENABLED': JSON.stringify(process.env.CLOUD_WORKBOOK_METADATA_ENABLED || 'false'),
      'process.env.CLOUD_OBJECT_STORAGE_ENABLED': JSON.stringify(process.env.CLOUD_OBJECT_STORAGE_ENABLED || 'false'),
      'process.env.CLOUD_AUDIT_ENABLED': JSON.stringify(process.env.CLOUD_AUDIT_ENABLED || 'false'),
    },
    build: {
      outDir: 'dist',
    },
    test: {
      exclude: [
        'node_modules',
        'dist',
        '.git',
        '.cache',
        'tests/e2e'
      ]
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
