/**
 * Sanitizer utility to simplify and clarify abstract, overly technical, or cold expressions,
 * transforming them into friendly, easily understandable, and warm Korean descriptions.
 * It removes mechanical terminology (like "지각 메커니즘", "정량 분석", "광학") and
 * restores the emotional and aesthetic resonance that is intuitive to general users.
 */
export function sanitizeText(text: string): string {
  if (!text) return "";
  let s = text;

  // 1. Simplify "지각" (perception) and "메커니즘" (mechanism) related words
  s = s.replace(/지각 메커니즘/g, "감상 스타일");
  s = s.replace(/지각방식/g, "감상 방식");
  s = s.replace(/지각 방식/g, "감상 방식");
  s = s.replace(/지각적 선택/g, "선택");
  s = s.replace(/지각적/g, "감상적인");
  s = s.replace(/지각 성향/g, "감상 성향");
  s = s.replace(/지각 스펙트럼/g, "감상 스타일");
  s = s.replace(/지각 역량/g, "감상 능력");
  s = s.replace(/지각/g, "감상");

  // 2. Simplify "인지" (cognitive) and "구조" (structural) related jargon
  s = s.replace(/인지 구조적/g, "마음속 깊은");
  s = s.replace(/인지 체계가/g, "마음이");
  s = s.replace(/시각 체계에/g, "마음에");
  s = s.replace(/지각 정밀도/g, "섬세한 감수성");
  s = s.replace(/광학적 선명도/g, "마음 깊은 울림");
  s = s.replace(/망막 자극의 중심 축/g, "마음을 사로잡는 붉은 색감");
  s = s.replace(/물리 지표/g, "신호");
  s = s.replace(/정합적/g, "자연스러운");
  s = s.replace(/정합/g, "조화");
  s = s.replace(/조형적 구도를 지탱하는/g, "마음을 편안하게 채우는");
  s = s.replace(/조형 식별력/g, "구도를 보는 안목");
  s = s.replace(/형태학적/g, "형태적인");
  s = s.replace(/미장센/g, "장면 연출");
  s = s.replace(/노이즈 제어|노이즈 배제/g, "깔끔한 배경 정리");
  s = s.replace(/초감각적 주파수/g, "섬세한 감수성");
  s = s.replace(/비선형적/g, "자유롭고 직관적인");
  s = s.replace(/수평수직의 질서/g, "안정적인 구도");
  s = s.replace(/미니멀리즘/g, "단순함의 미학");
  s = s.replace(/칼날 경계선/g, "선명한 윤곽선");
  s = s.replace(/채도와 온도의 조화/g, "색감의 조화");
  s = s.replace(/연출적 엔지니어링/g, "세심한 화면 연출");
  s = s.replace(/카메라 아이/g, "카메라의 시선");
  s = s.replace(/오리지널리티/g, "독창성");
  s = s.replace(/안티 포멀리즘/g, "자유로운 구도");
  s = s.replace(/황금비율/g, "아름다운 비례");

  // 3. Translate hard art/analytical terms
  s = s.replace(/본질주의적 관조자/g, "본질을 묵묵히 바라보는 관찰자");
  s = s.replace(/실존적/g, "깊은 울림을 주는");
  s = s.replace(/정량 분석/g, "세밀한 감상");
  s = s.replace(/정량적/g, "세밀한");
  s = s.replace(/지성적인 전율/g, "깊은 감동");
  s = s.replace(/지적 쾌감/g, "깊은 흥미");
  s = s.replace(/기호학자/g, "숨은 의미를 찾아내는 해석자");
  s = s.replace(/기호학적/g, "의미를 깊이 들여다보는");
  s = s.replace(/메타포/g, "상징과 은유");
  s = s.replace(/피사체 정위/g, "주인공 배치");
  s = s.replace(/인과 관계/g, "연결 고리");
  s = s.replace(/광학 데이터/g, "시각 정보");
  s = s.replace(/광학적 명암/g, "부드러운 명암");
  s = s.replace(/고속 판독/g, "빠르게 알아채는");
  s = s.replace(/지엽적인 세부 디테일 이전에/g, "작은 부분들보다는");
  s = s.replace(/구조 중심/g, "전체 구도 중심");
  s = s.replace(/크로마틱 온기/g, "색감의 따뜻함");
  s = s.replace(/마티에르/g, "거칠고 독특한 질감");
  s = s.replace(/데코레이션/g, "장식");
  s = s.replace(/에스테틱/g, "미적 감각");
  s = s.replace(/컴포지션/g, "화면 구성");

  // 4. Fallback patterns if they contain cold words
  s = s.replace(/광학 요소를 객관적으로 실측해내는/g, "따뜻하고 편안한 빛의 흐름을 읽어내는");
  s = s.replace(/정밀한 피사체 식별관/g, "대상을 바라보는 따뜻한 안목");
  s = s.replace(/정량화된 분석 지표/g, "풍부한 감성 지표");
  s = s.replace(/이성적인 관찰력/g, "감수성 어린 시선");
  s = s.replace(/체계적인 조형 식별력/g, "섬세한 미학적 안목");
  s = s.replace(/논리적인 시각 분석 태도/g, "감정의 결을 짚어내는 감상");
  s = s.replace(/기하학적 관측 지표/g, "마음의 미학적 울림");
  s = s.replace(/정교한 시각적 밸런스 감각/g, "안정적인 화면 구성 감각");
  s = s.replace(/구조적 분석 관점/g, "따뜻하고 서정적인 시선");
  s = s.replace(/미학적 비율 시야/g, "풍부한 감수성의 세계");
  s = s.replace(/선형적 기하 시야/g, "단정하고 깔끔한 구도");
  s = s.replace(/체계적 요소 인식/g, "마음의 균형감");
  s = s.replace(/정합적 구도 관점/g, "조화롭고 자연스러운 관점");
  s = s.replace(/대칭적 분석 시각/g, "안정적이고 편안한 시야");
  s = s.replace(/아날로그적 기하성/g, "아날로그 감수성");
  s = s.replace(/정밀한 구조적 맥락/g, "마음을 울리는 서사적 흐름");
  s = s.replace(/미학적 비례를/g, "낭만과 감수성을");
  s = s.replace(/시각적 자극/g, "마음의 상처나 피로");
  s = s.replace(/구도적 안정/g, "마음의 평온");
  s = s.replace(/물리적 본질인/g, "진정성 어린");
  s = s.replace(/객관적으로 조율하며/g, "고요히 침잠하며");
  s = s.replace(/시각적 안정을 도출합니다/g, "안식을 찾고자 하십니다");
  s = s.replace(/지표를 도출합니다/g, "영감을 공유하십니다");
  s = s.replace(/지표가 반응하였습니다/g, "흥미를 느끼셨습니다");
  s = s.replace(/반응성이 확인되었습니다/g, "흥미가 흘렀습니다");
  s = s.replace(/지표가 일치합니다/g, "안식을 찾으셨네요");
  s = s.replace(/시각 지표로서 높은 정합성을 보입니다/g, "가슴 깊이 압도당하셨습니다");
  s = s.replace(/정교한 물리적 디테일에 반응하였습니다/g, "다정한 디테일에 깊이 공명하셨습니다");
  s = s.replace(/낮은 채도의 브라운 색조가 지닌 아날로그 패턴을 주체적으로 선별해 낸 지표입니다/g, "따스한 세피아 톤의 여유와 낭만에 본능적으로 소통하신 것입니다");
  s = s.replace(/색조 밸런스에 정교하게 반응하는/g, "정서에 깊이 반응하는");
  s = s.replace(/시각적 안정을 지지합니다/g, "마음을 포근히 감쌉니다");
  s = s.replace(/명확히 지목하는/g, "깊숙하게 응시하는");
  s = s.replace(/구도 비례에/g, "배려심에");
  s = s.replace(/정합되어 정렬됩니다/g, "공명하고 이끌립니다");
  s = s.replace(/여백이 강조된/g, "고즈넉한");
  s = s.replace(/미미한/g, "아련한");
  s = s.replace(/수학적 질서/g, "조화롭고 단정한 질서");
  s = s.replace(/수학적/g, "아름다운");
  s = s.replace(/공학적/g, "체계적");
  s = s.replace(/조형 공식과 물리적 구조/g, "내면의 아름다운 조화와 가치");
  s = s.replace(/시각 엔지니어/g, "화면 속 조화를 찾아내는 예술가");

  return s;
}
