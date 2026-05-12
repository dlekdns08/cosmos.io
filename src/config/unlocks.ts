export type UnlockEffect =
  | 'startingSeed4'
  | 'bigBangPlus1'
  | 'chargeRate12'
  | 'themeAndromeda'
  | 'startingSeed5'
  | 'themeKarmanian'
  | 'chargeRate15';

export interface UnlockNode {
  id: UnlockEffect;
  np: number;
  name: string;
  desc: string;
}

export const UNLOCK_TRACK: readonly UnlockNode[] = [
  { id: 'startingSeed4',   np: 50,   name: '시드 4',         desc: '드롭 풀에 4단계까지 등장' },
  { id: 'bigBangPlus1',    np: 150,  name: '빅뱅 +1',        desc: '한 게임당 빅뱅 2회 사용 가능' },
  { id: 'chargeRate12',    np: 300,  name: '차지 가속 1.2',  desc: '코스믹 차지 충전 속도 +20%' },
  { id: 'themeAndromeda',  np: 500,  name: '안드로메다 테마', desc: '청록 + 핑크 팔레트 해금' },
  { id: 'startingSeed5',   np: 800,  name: '시드 5',         desc: '드롭 풀에 5단계까지 등장' },
  { id: 'themeKarmanian',  np: 1200, name: '카르마니안 테마', desc: '다크 골드 + 딥 레드 팔레트' },
  { id: 'chargeRate15',    np: 2000, name: '차지 가속 1.5',  desc: '코스믹 차지 충전 속도 +50%' },
];
