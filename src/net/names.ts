const ADJECTIVES = [
  '은하수', '빛나는', '고요한', '흔들리는', '방랑하는', '심연의', '잠든', '춤추는',
  '오래된', '잊혀진', '끝없는', '타오르는', '차가운', '신성한', '고독한', '황금빛',
  '보랏빛', '어둠의', '찬란한', '은빛', '푸른', '붉은', '하얀', '검은',
];

const NOUNS = [
  '성운', '혜성', '퀘이사', '은하', '별', '위성', '행성', '운석',
  '블랙홀', '초신성', '별자리', '달', '태양', '안드로메다', '오리온', '북극성',
  '유성', '성단', '오로라', '암흑물질', '쌍성', '맥동성', '백색왜성', '중성자별',
];

export function generateAnonName(): string {
  const a = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const n = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const suffix = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `${a} ${n} ${suffix}`;
}
