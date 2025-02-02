import nextConfig from '../next.config'
import tailwindConfig from '../tailwind.config'
import tsConfig from '../tsconfig.json'

describe('Project Setup', () => {
  describe('Next.js Configuration', () => {
    it('should have proper Next.js configuration', () => {
      expect(nextConfig).toBeDefined()
      expect(nextConfig.reactStrictMode).toBe(true)
    })
  })

  describe('TypeScript Configuration', () => {
    it('should have TypeScript properly configured', () => {
      expect(tsConfig.compilerOptions.strict).toBe(true)
      expect(tsConfig.compilerOptions.jsx).toBe('preserve')
      expect(tsConfig.compilerOptions.paths).toHaveProperty('@/*')
    })

    it('should include necessary files', () => {
      expect(tsConfig.include).toContain('next-env.d.ts')
      expect(tsConfig.include).toContain('**/*.ts')
      expect(tsConfig.include).toContain('**/*.tsx')
    })
  })

  describe('Tailwind Configuration', () => {
    it('should have Tailwind CSS properly configured', () => {
      expect(tailwindConfig.content).toContain('./pages/**/*.{js,ts,jsx,tsx,mdx}')
      expect(tailwindConfig.content).toContain('./components/**/*.{js,ts,jsx,tsx,mdx}')
    })

    it('should have proper theme configuration', () => {
      expect(tailwindConfig.theme?.extend?.colors).toBeDefined()
      expect(tailwindConfig.theme?.extend?.borderRadius).toBeDefined()
    })
  })
}) 