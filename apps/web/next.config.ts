import '@gemastik/env/web'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactCompiler: true,
  transpilePackages: ['shiki'],
  allowedDevOrigins: ['100.70.142.22'],
}

export default nextConfig
