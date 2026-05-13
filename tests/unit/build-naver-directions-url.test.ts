// buildNaverDirectionsUrl 단위 테스트 — Functional Design §4.12
import { describe, it, expect } from 'vitest'
import { buildNaverDirectionsUrl } from '@/features/map'

describe('buildNaverDirectionsUrl', () => {
  it('출발지 좌표가 있으면 directions URL 생성', () => {
    const url = buildNaverDirectionsUrl(
      { lat: 37.5663, lng: 126.9779 },
      37.5512,
      126.9882,
      '국밥집'
    )
    expect(url).toContain('https://map.naver.com/p/directions/')
    expect(url).toContain('126.977900')
    expect(url).toContain('37.566300')
    expect(url).toContain('126.988200')
    expect(url).toContain('37.551200')
    expect(url).toContain(encodeURIComponent('국밥집'))
  })

  it("from='current' 일 때는 장소 검색 fallback URL 생성", () => {
    const url = buildNaverDirectionsUrl('current', 37.5512, 126.9882, '국밥집')
    expect(url).toContain('https://map.naver.com/p/search/')
    expect(url).toContain(encodeURIComponent('국밥집'))
  })

  it('좌표가 NaN/유효하지 않으면 안전 fallback 으로 검색 URL 반환', () => {
    const url = buildNaverDirectionsUrl({ lat: 37.5, lng: 127 }, Number.NaN, 126.9882, '국밥집')
    expect(url).toContain('https://map.naver.com/p/search/')
    expect(url).toContain(encodeURIComponent('국밥집'))
  })

  it('식당명이 비어있으면 기본 라벨 사용', () => {
    const url = buildNaverDirectionsUrl({ lat: 37.5, lng: 127 }, 37.55, 127.01, '')
    expect(url).toContain(encodeURIComponent('식당'))
  })

  it('식당명에 한글·공백·특수문자가 있어도 URL 인코딩된다', () => {
    const url = buildNaverDirectionsUrl({ lat: 37.5, lng: 127 }, 37.55, 127.01, '국밥 & 칼국수')
    expect(url).toContain(encodeURIComponent('국밥 & 칼국수'))
  })
})
