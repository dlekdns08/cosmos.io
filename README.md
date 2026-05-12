# COSMOS

> 우주의 진화를 손바닥 안에서 — 떨어지는 우주먼지를 합쳐 별을 만들고, 끝내 블랙홀을 만들어 세계를 삼키는 물리 머지 게임

Suika 류 머지 게임을 우주 진화 테마로 재해석한 물리 퍼즐. 합치는 행위 자체가 새로운 물리 법칙을 만들도록 설계되어 있다 — 항성은 주변을 끌어당기고, 초신성은 파괴하며, 블랙홀은 끝낸다.

## 실행

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/ 정적 빌드
npm run preview  # 빌드 결과 미리보기
```

## 진화 트리 (11단계)

| 단계 | 이름 | 특징 |
| --- | --- | --- |
| 1 | 우주먼지 | 가장 작음, 가볍게 떠다님 |
| 2 | 가스구름 | 부드러운 충돌 |
| 3 | 운석 | 질량 증가 |
| 4 | 소행성 | 회전 |
| 5 | 위성 | 표면 디테일 |
| 6 | 행성 | 푸른빛 글로우 |
| 7 | 거대행성 | 고리 |
| 8 | **항성** | **★ 중력장 — 주변 물체를 끌어당김** |
| 9 | 적색거성 | 팽창 펄스, 강한 글로우 |
| 10 | **초신성** | **★ 폭발 — 반경 산란 + 1단계 진화 보너스 + 500점** |
| 11 | **블랙홀** | **★ 최종 — 5초간 모든 것을 흡수** |

## 차별화 메커닉

- **단계별 중력장**: 8단계 이상은 주변 작은 물체에 거리 fall-off 인력 적용 → 자동 연쇄 발생
- **초신성 폭발**: 10단계 머지 시 반경 240px 내 물체 산란 + 단계 +1 + 보너스 점수
- **블랙홀 페이즈**: 11단계 도달 시 5초간 화면 전체를 흡수, 단계 합 × 10 보너스
- **빅뱅 리트라이**: 게임오버 임박 시 1회 사용, 모든 물체 재배치

## 점수 시스템

| 항목 | 점수 |
| --- | --- |
| 단계별 머지 | 2^단계 (1=2점, 11=2048점) |
| 연쇄 머지 (1초 내) | ×1.5 콤보 배율 (최대 ×5) |
| 초신성 발동 | +500점 |
| 블랙홀 흡수당 | 흡수한 물체 단계 합 × 10 |

## 도전 과제 (단판 내)

1. 첫 항성 만들기
2. 5 콤보 달성
3. 블랙홀 만들기
4. 100,000점 달성

## 기술 스택

| 영역 | 선택 |
| --- | --- |
| 물리 엔진 | matter.js |
| 렌더링 | Canvas 2D (커스텀 렌더, radial gradient 글로우) |
| 사운드 | Web Audio API (OscillatorNode 즉석 생성, 에셋 무필요) |
| 저장 | localStorage (최고점, 빅뱅 사용 횟수) |
| 빌드 | Vite + Vanilla JS |

## 디렉토리 구조

```text
src/
├── main.js               # 부트스트랩 + 게임 루프
├── config/tiers.js       # 11단계 메타데이터
├── physics/
│   ├── world.js          # matter.js 엔진/벽
│   ├── dropper.js        # 드롭 시스템 + 다음 미리보기
│   └── gravity.js        # 단계별 중력장
├── game/
│   ├── merge.js          # collisionStart → 같은 단계 머지
│   ├── events.js         # 초신성 / 블랙홀 / 빅뱅
│   └── score.js          # 점수, 콤보, localStorage
├── render/
│   ├── renderer.js       # Canvas 2D 커스텀 렌더
│   ├── particles.js      # 머지 파편
│   └── shake.js          # 화면 흔들림
├── audio/synth.js        # Web Audio 신디사이저
└── ui/
    ├── hud.js            # SCORE/BEST/COMBO/NEXT, 토스트
    └── gameover.js       # 게임오버 오버레이
```

## 조작

- **마우스 이동 / 터치 드래그** — 드롭 위치 조준
- **클릭 / 탭** — 드롭
- **빅뱅 버튼** — 게임오버 임박 시 노출 (1게임 1회)
- **다시 시작 버튼** — 게임오버 후 재시작

## 게임 종료 조건

- 박스 상단 라인을 3초 이상 물체가 점유

## 배포 (Self-hosted GitHub Runner)

`.github/workflows/deploy.yml`가 main 브랜치에 push가 들어오면 self-hosted runner에서 빌드 후 pm2로 서버를 무중단 재시작한다.

### 호스트 준비 (최초 1회)

```bash
# 1. Self-hosted runner 등록
#    GitHub repo → Settings → Actions → Runners → "New self-hosted runner"
#    안내된 명령으로 runner 설치 후 백그라운드 서비스로 등록 (./svc.sh install / start)

# 2. Node.js 20 + npm 설치 (nvm 권장)

# 3. pm2 글로벌 설치
npm install -g pm2

# 4. pm2를 OS 시작 시 자동 실행되도록 등록 (재부팅 후에도 서버 유지)
pm2 startup
# 안내된 명령을 sudo로 실행
```

### 워크플로우 동작

1. `actions/checkout@v4`로 코드 가져오기
2. Node 20 셋업 + `npm ci`
3. `npm run build` (typecheck + vite build)
4. `npx pm2 startOrReload ecosystem.config.cjs` — 이미 실행 중이면 무중단 reload, 없으면 새로 시작
5. `npx pm2 save` — 현재 프로세스 상태 영속화
6. `curl /api/leaderboard` 헬스 체크

### 접속

- 기본 포트: `3001` (변경: `PORT` env var 또는 `ecosystem.config.cjs` 수정)
- 같은 머신: `http://localhost:3001`
- LAN: `http://<runner-host-ip>:3001`
- 외부 노출: 리버스 프록시(nginx/caddy) + TLS 권장

### 수동 조작

```bash
pm2 status                    # 현재 프로세스 상태
pm2 logs cosmos               # 라이브 로그
pm2 restart cosmos            # 재시작
pm2 stop cosmos               # 정지
pm2 delete cosmos             # 등록 해제
```

### 환경 변수

| 변수 | 용도 |
| --- | --- |
| `PORT` | 서버 포트 (기본 3001) |
| `HOST` | 바인딩 호스트 (기본 0.0.0.0) |
| `COSMOS_DB` | SQLite 파일 경로 (기본 `server/data/cosmos.db`) |
| `VITE_WS_URL` | 빌드 시 클라이언트가 접속할 WS URL 강제 (프런트만 다른 곳에 호스팅할 때) |
| `BASE_PATH` | 빌드 시 vite base path (서브패스 호스팅용) |

## 라이선스

MIT
