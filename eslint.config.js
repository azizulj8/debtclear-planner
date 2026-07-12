import js from '@eslint/js'

export default [
  { ignores: ['dist/**', 'node_modules/**', 'public/sw.js'] },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        document: 'readonly',
        window: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        navigator: 'readonly',
        matchMedia: 'readonly',
        CustomEvent: 'readonly',
        IntersectionObserver: 'readonly',
        alert: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        confirm: 'readonly',
        URLSearchParams: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'warn',
    },
  },
]
