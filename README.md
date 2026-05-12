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

## 배포 (Self-hosted GitHub Runner + Docker)

main 브랜치에 push되면 self-hosted runner가 `docker compose up -d --build`로 컨테이너를 다시 띄운다. 호스트 `5174` → 컨테이너 `3000` 매핑.

### 호스트 준비 (최초 1회)

```bash
# 1. Docker 설치
#    macOS: Docker Desktop 또는 colima
#    Linux: 공식 docker engine

# 2. Self-hosted runner 등록
#    GitHub repo → Settings → Actions → Runners → New self-hosted runner
#    안내된 명령으로 설치 후 백그라운드 서비스 등록 (./svc.sh install && ./svc.sh start)
#    runner를 실행하는 user가 `docker` 그룹에 포함되어야 함:
#      sudo usermod -aG docker $USER && newgrp docker
```

### 동작

1. `actions/checkout@v4`로 최신 코드 가져오기
2. `docker compose up -d --build --remove-orphans` — 이미지 재빌드 + 컨테이너 무중단 교체
3. `docker image prune -f` — 사용 안 하는 옛 이미지 정리
4. `curl http://127.0.0.1:5174/api/leaderboard` 헬스 체크 (최대 40초 대기)

### 접속

- 같은 머신: `http://localhost:5174`
- LAN: `http://<runner-host-ip>:5174`
- 외부 노출: 리버스 프록시(nginx/caddy) + TLS 권장

### 수동 조작

```bash
docker compose up -d --build      # 빌드 + 기동
docker compose logs -f cosmos     # 라이브 로그
docker compose restart cosmos     # 재시작
docker compose down               # 정지 + 컨테이너 제거 (./data는 유지)
docker compose down -v            # ./data 까지 모두 제거
```

### 데이터 영속성

SQLite DB는 호스트 `./data/cosmos.db`에 저장 (bind mount). `docker compose down` 해도 보존되며, 호스트에서 직접 백업 가능.

### 환경 변수 (compose에서 override)

| 변수 | 기본값 | 용도 |
| --- | --- | --- |
| `PORT` | `3000` | 컨테이너 내부 서버 포트 |
| `HOST` | `0.0.0.0` | 바인딩 호스트 |
| `COSMOS_DB` | `/data/cosmos.db` | SQLite 파일 경로 (컨테이너 내부) |
| `VITE_WS_URL` | (빈값) | 빌드 시 클라이언트 WS URL 강제 |
| `BASE_PATH` | `/` | 빌드 시 vite base path |

포트 변경하고 싶으면 [docker-compose.yml](docker-compose.yml)의 `ports` 한 줄만 바꾸면 된다 (`"5174:3000"` → `"포트:3000"`).

## 라이선스

MIT
