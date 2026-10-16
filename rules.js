// rules.js — 분류 사전 (공동 기준 파일)
// 이 파일만 고치면 분류가 바뀐다. 고친 뒤 브라우저를 새로 고침하고 다시 분석한다.
//
// fields(분야): 위에서부터 차례로 보고, 처음 맞은 분야 하나만 붙인다. → 순서가 곧 우선순위
//               어느 분야에도 안 맞으면 '미분류'
// issues(쟁점): 맞은 쟁점을 모두 붙인다. → 한 기사에 여러 개, 또는 하나도 없을 수 있음
// 낱말 맞추기: 한글 낱말은 제목에 그 글자가 들어 있으면 일치('규제' → '규제 완화'),
//             영문 낱말은 대소문자 무시·낱말 단위로 일치('AI'는 'Email'에 걸리지 않음)
// 주의: 짧은 한글 낱말은 엉뚱한 말에도 걸린다. 예) '사고' → '사고방식', '인수' → '인수분해'
//       그래서 아래에는 '사고를', '인수합병'처럼 앞뒤를 붙여 적은 낱말이 있다.
window.RULES = {
  fields: {
    '정책·규제': [
      '정책', '규제', '법안', '법원', '판결', '판사', '배심원', '소송', '의회', '국회', '정부',
      '과징금', '벌금', '제재', '입법', '행정명령', '차단 명령', '대통령', '장관', '선거', '당국',
      '폐지', '의무화', '기본법', '법률', '법적', '수사', '영장', '관세', '면세', '국방부',
      '유엔', '연준', '금리', '중재 판정', '백악관', '상원', '하원', '유럽연합',
      'EU', 'UN', 'FTC', 'FCC', 'DOJ', 'FDA', 'FBI', 'NTSB', 'regulation', 'lawsuit', 'court',
      'congress', 'senate', '시행령',
    ],
    '보안·개인정보': [
      '보안', '취약점', '해킹', '해커', '유출', '악성', '랜섬웨어', '피싱', '탈취', '백도어',
      '원격 코드 실행', '임의 코드 실행', '제로데이', '익스플로잇', '스파이웨어', '개인정보',
      '프라이버시', '감시', '감청', '추적당', '위치 추적', '사용자 추적', '텔레메트리', '비밀번호',
      '패스키', '인증',
      '샌드박스', '서명 키', '위조', '안티바이러스', '영지식',
      'security', 'vulnerability', 'malware', 'exploit', 'CVE', 'XSS', 'RCE', 'privacy',
      'phishing', 'backdoor', 'password', 'passkey', '2FA', 'DDoS', 'VPN', 'NSA', 'Antivirus',
      'C2PA', 'CAPTCHA', 'Flock',
    ],
    '반도체·하드웨어': [
      '반도체', '칩', '엔비디아', '인텔', '하이닉스', '파운드리', '데이터센터', '데이터 센터',
      '하드웨어', '프로세서', '컴퓨터', '노트북', '스마트폰', '휴대폰', '맥 미니', '맥 스튜디오',
      '맥북', '워크스테이션', '디스플레이', '배터리', '로봇', '드론', '센서', '키보드', '양자 컴퓨터',
      '양자컴퓨터', '양자 컴퓨팅', '전자기기', '전자책', '프린터', '냉장고', '무전기',
      'GPU', 'CPU', 'TPU', 'NPU', 'HBM', 'DRAM', 'Nvidia', 'AMD', 'Intel', 'TSMC', 'ASML',
      'MacBook', 'iPhone', 'Pixel', 'Phone', 'TV', 'Raspberry Pi', 'Arduino', 'FPGA', 'RISC-V',
      'x86', 'Z80', 'RP2350', 'CRT', 'NAS', 'KVM', 'hardware', 'robot', 'LED',
    ],
    '에이전트·개발도구': [
      '에이전트', '에이전틱', '코딩', '코드', '개발자', '개발 도구', '프로그래밍', '프로그래머',
      '프로그램', '컴파일러', '디컴파일', '인터프리터', '디버깅', '리팩터링', '리버스 엔지니어링',
      '바이너리', '유닛 테스트', '풀 리퀘스트', '깃허브', '터미널', '스킬', '자동화', '워크플로',
      '하네스', '계획 모드', '동시성',
      'agent', 'agentic', 'Claude Code', 'Codex', 'Cursor', 'Copilot', 'coding', 'IDE',
      'VS Code', 'Vim', 'Neovim', 'Emacs', 'Git', 'GitHub', 'GitLab', 'CLI', 'SDK', 'API',
      'MCP', 'LSP', 'CI', 'Rust', 'Python', 'TypeScript', 'JavaScript', 'Golang', 'Go', 'Zig',
      'Java', 'PHP', 'C++', '.NET', 'React', 'Rails', 'Bun', 'Wasm', 'WebAssembly', 'YAML',
      'Pandas', 'Polars', 'Jujutsu', 'Typst', 'async', 'programming', 'developer', 'compiler',
    ],
    'AI·모델': [
      '인공지능', '지능', '언어 모델', '언어모델', '모델', '머신러닝', '딥러닝', '신경망',
      '트랜스포머', '강화학습', '강화 학습', '사전 학습', '사후 학습', '파인튜닝', '생성형',
      '챗봇', '벤치마크', '임베딩', '멀티모달', '프롬프트', '토큰', '슬롭', '확률적 앵무새',
      '오픈AI', '앤트로픽', '딥시크', '제미나이', '클로드', '허깅페이스',
      'AI', 'AX', 'LLM', 'LiteLLM', 'GPT', 'ChatGPT', 'OpenAI', 'Anthropic', 'Claude', 'Gemini',
      'Grok', 'Llama', 'Mistral', 'DeepSeek', 'Qwen', 'GLM', 'xAI', 'AGI', 'RAG', 'Transformer',
      'Hugging Face', 'Opus', 'Sonnet', 'Haiku', 'Fable', 'MiMo', 'StepFun', 'Step 5', 'Kimi',
      'Jev', 'Artificial Analysis', 'machine learning', 'deep learning', 'neural', 'benchmark',
      'chatbot',
    ],
    '기타 기술': [
      '기술', '오픈소스', '오픈 소스', '소프트웨어', '리눅스', '윈도우', '안드로이드', '브라우저',
      '크롬', '웹', '앱', '데이터베이스', '클라우드', '네트워크', '인터넷', '프로토콜', '알고리즘',
      '플랫폼', '스타트업', '창업', '벤처', '엔지니어', '자율주행', '전기차', '위성', '로켓',
      '우주', '게임', '스팀', '이메일', '검색 엔진', '커널', '도커', '쿠버네티스', '폰트',
      '에디터', '편집기', '라이브러리', '프레임워크', '파일시스템', '백업', '서버', '셀프 호스팅',
      '데스크톱', '운영체제', '에뮬레이션', '시뮬레이션', '스타링크',
      '구글', '애플', '마이크로소프트', '메타', '아마존', '테슬라', '유튜브', '넷플릭스',
      'open source', 'software', 'Linux', 'Windows', 'macOS', 'iOS', 'Android', 'browser',
      'Chrome', 'Firefox', 'Safari', 'web', 'app', 'database', 'SQL', 'SQLite', 'Postgres',
      'PostgreSQL', 'cloud', 'AWS', 'Azure', 'Docker', 'Kubernetes', 'Unix', 'BSD', 'OpenBSD',
      'Debian', 'RHEL', 'GNOME', 'KDE', 'GNU', 'DNS', 'IPv6', 'HTTP', 'CDN', 'Cloudflare',
      'VMware', 'CSS', 'HTML', 'UTF-8', 'Unicode', 'JPEG', 'PDF', 'Excel', 'Slack', 'Signal',
      'SaaS', 'VC', 'UX', 'UI', 'OS', 'Google', 'Apple', 'Microsoft', 'Meta', 'Amazon',
      'Tesla', 'Waymo', 'Starlink', 'SpaceX', 'NASA', 'Steam', 'YouTube', 'Spotify', 'Netflix',
      'Wikipedia', 'Wayback Machine', 'arXiv', 'WordPress', 'Automattic', 'Tailscale',
      'Shopify', 'Figma', 'Databricks', 'Salesforce', 'GrapheneOS', 'Play Store', 'F-Droid',
      'Hacker News', 'Show GN', 'Show HN', 'Ask GN', 'Ask HN',
    ],
  },
  issues: {
    '안전·위험': [
      '안전', '위험', '사고를', '사고가', '사고로', '사고 조사', '재난', '재앙', '오작동', '장애',
      '위협', '탈옥', '환각', '오용', '무기', '딥페이크', '허위정보', '가짜뉴스', '중독',
      '정신건강', '사망', '부상', '화재', '리콜', '결함',
      'safety', 'risk', 'accident', 'outage', 'threat', 'jailbreak', 'hallucination',
      'deepfake', 'misinformation', 'alignment', 'recall', 'P(doom)',
    ],
    '일자리·노동': [
      '일자리', '고용 시장', '고용주', '고용률', '채용', '해고', '정리해고', '퇴직', '노동', '노조', '단체협약', '임금',
      '연봉', '월급', '급여', '근로', '직원', '직장', '커리어', '구직', '취업', '실업', '재택',
      '원격근무', '원격 근무', '프리랜서', '숙련', '직업', '인력', '취업 비자', '업무', '생산성',
      'H-1B', 'layoff', 'labor', 'wage', 'career', 'hiring', 'job', 'remote work', 'freelance',
    ],
    '저작권·데이터': [
      '저작권', '라이선스', '라이센스', '불법 복제', '해적판', '표절', '학습 데이터',
      '웹 크롤링', '크롤러', '스크래핑', '데이터셋', '공정 이용', '특허', '상표',
      '출판사', '도서', '워터마크', '출처 정보', '이용약관',
      'copyright', 'license', 'piracy', 'dataset', 'training data', 'crawler', 'scraping',
      'fair use', 'patent', 'trademark', 'GPL', 'Warez',
    ],
    '개인정보': [
      '개인정보', '개인 정보', '프라이버시', '계정 정보', '추적당', '위치 추적', '사용자 추적', '감시', '감청', '얼굴 인식',
      '생체', '위치 정보', '쿠키', '텔레메트리', '녹음', '도청', '익명', '연령 확인', '신분증',
      '운전면허증', '전화번호', '판매하는 데이터', '데이터 수집', '휴대전화 수색',
      'privacy', 'tracking', 'surveillance', 'facial recognition', 'telemetry', 'cookie',
      'GDPR', 'age verification', 'VPN', 'Flock',
    ],
    '경쟁·독점': [
      '독점', '반독점', '경쟁', '인수합병', '인수 추진', '인수했다', '인수한다', '합병', '점유율',
      '앱 마켓', '수수료', '공정거래', '시장 지배', '종속', '진입 장벽',
      'antitrust', 'monopoly', 'acquisition', 'acquires', 'merger', 'App Store', 'Play Store',
      'Google Play', 'lock-in',
    ],
    '에너지·환경': [
      '에너지', '전력', '전기요금', '전기차', '탄소', '배출', '기후', '온난화', '친환경',
      '환경오염', '환경 규제', '재생에너지', '태양광', '풍력', '원자력', '원전', '발전소', '냉각',
      '냉방', '생태통로', '야생동물', '지속 가능', '오염', '화석연료', '석탄', '석유', '연료', '빙하', '화학물질',
      'energy', 'power grid', 'carbon', 'emission', 'climate', 'solar', 'nuclear',
      'pollution', 'battery',
    ],
  },
};
