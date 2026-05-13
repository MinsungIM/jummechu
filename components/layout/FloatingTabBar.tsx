'use client'
// mock_uiux/jummechu.pen comp_TabBar 그대로:
// - 화면 하단에서 띄움 (padding [12, 21, 21, 21])
// - pill: white BG, cornerRadius 36, shadow, 3 탭 가로 균등
// - 활성 탭: yellow pill (cornerRadius 26), ink-dark icon+label
// - 비활성: muted icon+label
// - FAB: 탭바 우측 외곽 분리, 62x62, white BG, cornerRadius 36, shadow, plus 아이콘 26px
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus, Users, Map, Settings } from 'lucide-react'

const tabs = [
  { href: '/', label: 'PARTY', Icon: Users },
  { href: '/map', label: 'MAP', Icon: Map },
  { href: '/settings', label: 'SETTINGS', Icon: Settings },
] as const

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/' || pathname.startsWith('/parties') || pathname.startsWith('/history') || pathname.startsWith('/restaurants')
  return pathname.startsWith(href)
}

export function FloatingTabBar() {
  const pathname = usePathname() ?? '/'
  const showFab = isActive(pathname, '/') // T1 파티 리스트에서만 FAB(파티 생성)
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-5 pt-3 pb-5 pointer-events-none">
      <div className="flex gap-3 items-center pointer-events-auto">
        <nav className="flex-1 h-[62px] bg-surface-primary rounded-[36px] shadow-tab p-1 flex gap-0">
          {tabs.map(({ href, label, Icon }) => {
            const active = isActive(pathname, href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-[26px] transition ${
                  active ? 'bg-accent-primary' : 'bg-transparent'
                }`}
              >
                <Icon
                  className={active ? 'text-accent-onPrimary' : 'text-ink-muted'}
                  size={20}
                  strokeWidth={2.2}
                />
                <span
                  className={`text-[10px] font-semibold tracking-[0.5px] ${
                    active ? 'text-accent-onPrimary' : 'text-ink-muted'
                  }`}
                >
                  {label}
                </span>
              </Link>
            )
          })}
        </nav>
        {showFab && (
          <Link
            href="/parties/new"
            aria-label="파티 만들기"
            className="w-[62px] h-[62px] rounded-[36px] bg-surface-primary shadow-tab flex items-center justify-center"
          >
            <Plus className="text-ink" size={26} strokeWidth={2.4} />
          </Link>
        )}
      </div>
    </div>
  )
}
