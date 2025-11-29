# Evolution Simulator 🧬

생물의 진화와 생태계를 시뮬레이션하는 웹 기반 프로젝트입니다.

## 프로젝트 구조

```
evolution-simulator/
├── src/
│   ├── renderer/           # 렌더링 시스템 (PixiJS)
│   │   ├── Renderer.ts     # 메인 렌더러
│   │   ├── Camera.ts       # 카메라 시스템
│   │   ├── InputHandler.ts # 입력 처리
│   │   ├── TerrainRenderer.ts # 지형 렌더링
│   │   ├── colors.ts       # 색상 팔레트
│   │   └── index.ts        # Export
│   ├── types/              # TypeScript 타입 정의
│   │   └── renderer.ts
│   ├── main.ts             # 메인 진입점
│   └── style.css           # 스타일
├── docs/                   # 문서
│   └── RENDERING.md        # 렌더링 시스템 가이드
├── index.html              # HTML 진입점
├── package.json            # 의존성
├── tsconfig.json           # TypeScript 설정
└── vite.config.ts          # Vite 설정
```

## 기술 스택

- **렌더링**: PixiJS v8 (WebGL)
- **언어**: TypeScript
- **빌드**: Vite
- **테스트**: Vitest
- **린트**: ESLint + TypeScript ESLint

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:5173 접속

### 3. 빌드

```bash
npm run build
```

### 4. 프리뷰

```bash
npm run preview
```

## 조작법

### 마우스
- **드래그**: 카메라 이동
- **휠**: 줌 인/아웃
- **클릭**: 개체 선택 (예정)

### 키보드
- **+/-**: 줌 조절
- **Home**: 원점으로 리셋

## 현재 구현 상태

### ✅ 완료
- [x] PixiJS 렌더러 초기화
- [x] 카메라 시스템 (줌, 팬)
- [x] 입력 처리 (마우스, 터치)
- [x] 지형 렌더러 (청크, LOD)
- [x] 색상 팔레트
- [x] 성능 모니터

### 🚧 진행 중
- [ ] World 시스템 (지형 생성)
- [ ] Organism 렌더링
- [ ] 유전자 시스템
- [ ] 시뮬레이션 로직

### 📋 예정
- [ ] UI 패널 (상세 정보)
- [ ] 미니맵
- [ ] 통계 그래프
- [ ] 저장/로드 기능

## 성능 목표

| 개체 수 | 목표 FPS | 기법 |
|---------|----------|------|
| 1,000 | 60 | 기본 렌더링 |
| 10,000 | 60 | LOD + 컬링 |
| 100,000 | 30+ | ParticleContainer |

## 문서

자세한 문서는 `docs/` 폴더를 참고하세요:
- [렌더링 시스템 가이드](docs/RENDERING.md)

## 개발 환경

- Node.js 18+
- macOS (개발 기준)
- 모던 브라우저 (Chrome, Safari, Firefox)

## 라이선스

MIT License

## 기여

이슈와 Pull Request는 언제나 환영합니다!
