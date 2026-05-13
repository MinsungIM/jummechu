// Public API 컨벤션 강제 — features/{module}/index.ts만 외부 import 허용
// (unit-of-work.md 결정 Q3=B)
//
// Note: eslint-config-next 16.x + ESLint 9 flat config 호환 이슈로 next core-web-vitals
// extends는 보류. 추후 (1) eslint-config-next 패치 또는 (2) @next/eslint-plugin-next 직접
// 사용으로 복구 예정. 현재 lint는 Public API 컨벤션만 검사.
module.exports = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'drizzle/migrations/**',
      'tests/e2e/**', // playwright config과 충돌 회피
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*/server/*', '@/features/*/lib/*', '@/features/*/components/*'],
              message:
                'features/{module} 내부 경로 직접 import 금지. features/{module}/index.ts (Public API)만 import 가능.',
            },
            {
              group: ['features/*/server/*', 'features/*/lib/*', 'features/*/components/*'],
              message:
                'features/{module} 내부 경로 직접 import 금지. features/{module}/index.ts (Public API)만 import 가능.',
            },
          ],
        },
      ],
    },
  },
  {
    // features 모듈 내부에서는 자기 내부 import 허용
    files: ['features/*/server/**', 'features/*/lib/**', 'features/*/components/**', 'features/*/hooks/**'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  {
    files: ['tests/**'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
]
