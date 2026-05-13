// Public API 컨벤션 강제 — features/{module}/index.ts만 외부 import 허용
// (unit-of-work.md 결정 Q3=B)
const { FlatCompat } = require('@eslint/eslintrc')

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

module.exports = [
  ...compat.extends('next/core-web-vitals'),
  {
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
    // features 모듈 내부에서는 자기 내부 import 허용 (위 규칙은 외부 import만 차단)
    files: ['features/*/server/**', 'features/*/lib/**', 'features/*/components/**'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  {
    // app/api Route Handler는 features public API 호출 정상
    // tests는 모든 import 허용
    files: ['tests/**'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
]
