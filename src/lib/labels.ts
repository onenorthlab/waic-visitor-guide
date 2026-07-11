import type { Locale } from "./i18n";
import type {
  EventCategory,
  PlannerGoal,
  PlannerIdentity,
  VenueId,
  WaicDate,
} from "./types";

const CATEGORY_LABELS: Record<Locale, Record<EventCategory, string>> = {
  zh: {
    综合论坛: "综合论坛", 大模型与AI基础: "大模型与AI基础", 算力与AI芯片: "算力与AI芯片",
    产业与工业智能化: "产业与工业智能化", 机器人与具身智能: "机器人与具身智能", 前沿科技与探索: "前沿科技与探索",
    治理标准与政策: "治理标准与政策", 金融与科技投资: "金融与科技投资", 内容创意与AIGC: "内容创意与AIGC",
    教育与人才发展: "教育与人才发展", 医疗与生命科学: "医疗与生命科学", 能源与可持续发展: "能源与可持续发展",
    女性与多元发展: "女性与多元发展",
  },
  en: {
    综合论坛: "Comprehensive Forums", 大模型与AI基础: "Foundation Models & AI", 算力与AI芯片: "Compute & AI Chips",
    产业与工业智能化: "Industrial AI", 机器人与具身智能: "Robotics & Embodied AI", 前沿科技与探索: "Frontier Science",
    治理标准与政策: "Governance & Standards", 金融与科技投资: "Finance & Tech Investment", 内容创意与AIGC: "Creative & AIGC",
    教育与人才发展: "Education & Talent", 医疗与生命科学: "Healthcare & Life Sciences", 能源与可持续发展: "Energy & Sustainability",
    女性与多元发展: "Women & Diversity",
  },
  ja: {
    综合论坛: "総合フォーラム", 大模型与AI基础: "基盤モデル・AI", 算力与AI芯片: "AIコンピューティング・チップ",
    产业与工业智能化: "産業・製造AI", 机器人与具身智能: "ロボティクス・身体性AI", 前沿科技与探索: "先端科学",
    治理标准与政策: "AIガバナンス・標準", 金融与科技投资: "金融・テック投資", 内容创意与AIGC: "クリエイティブ・AIGC",
    教育与人才发展: "教育・人材", 医疗与生命科学: "医療・ライフサイエンス", 能源与可持续发展: "エネルギー・持続可能性",
    女性与多元发展: "女性・ダイバーシティ",
  },
  ko: {
    综合论坛: "종합 포럼", 大模型与AI基础: "파운데이션 모델·AI", 算力与AI芯片: "AI 컴퓨팅·칩",
    产业与工业智能化: "산업·제조 AI", 机器人与具身智能: "로보틱스·피지컬 AI", 前沿科技与探索: "첨단 과학",
    治理标准与政策: "AI 거버넌스·표준", 金融与科技投资: "금융·기술 투자", 内容创意与AIGC: "크리에이티브·AIGC",
    教育与人才发展: "교육·인재", 医疗与生命科学: "헬스케어·생명과학", 能源与可持续发展: "에너지·지속가능성",
    女性与多元发展: "여성·다양성",
  },
  fr: {
    综合论坛: "Forums généraux", 大模型与AI基础: "Modèles fondamentaux et IA", 算力与AI芯片: "Calcul et puces IA",
    产业与工业智能化: "IA industrielle", 机器人与具身智能: "Robotique et IA incarnée", 前沿科技与探索: "Sciences de pointe",
    治理标准与政策: "Gouvernance et normes de l’IA", 金融与科技投资: "Finance et investissement technologique", 内容创意与AIGC: "Création et AIGC",
    教育与人才发展: "Éducation et talents", 医疗与生命科学: "Santé et sciences de la vie", 能源与可持续发展: "Énergie et durabilité",
    女性与多元发展: "Femmes et diversité",
  },
  de: {
    综合论坛: "Übergreifende Foren", 大模型与AI基础: "Basismodelle und KI", 算力与AI芯片: "KI-Computing und Chips",
    产业与工业智能化: "Industrielle KI", 机器人与具身智能: "Robotik und verkörperte KI", 前沿科技与探索: "Zukunftswissenschaften",
    治理标准与政策: "KI-Governance und Standards", 金融与科技投资: "Finanz- und Technologieinvestitionen", 内容创意与AIGC: "Kreativität und AIGC",
    教育与人才发展: "Bildung und Talente", 医疗与生命科学: "Gesundheit und Biowissenschaften", 能源与可持续发展: "Energie und Nachhaltigkeit",
    女性与多元发展: "Frauen und Vielfalt",
  },
  es: {
    综合论坛: "Foros generales", 大模型与AI基础: "Modelos fundacionales e IA", 算力与AI芯片: "Computación y chips de IA",
    产业与工业智能化: "IA industrial", 机器人与具身智能: "Robótica e IA corpórea", 前沿科技与探索: "Ciencia de vanguardia",
    治理标准与政策: "Gobernanza y estándares de IA", 金融与科技投资: "Finanzas e inversión tecnológica", 内容创意与AIGC: "Creatividad y AIGC",
    教育与人才发展: "Educación y talento", 医疗与生命科学: "Salud y ciencias de la vida", 能源与可持续发展: "Energía y sostenibilidad",
    女性与多元发展: "Mujeres y diversidad",
  },
  ar: {
    综合论坛: "المنتديات العامة", 大模型与AI基础: "النماذج الأساسية والذكاء الاصطناعي", 算力与AI芯片: "حوسبة ورقائق الذكاء الاصطناعي",
    产业与工业智能化: "الذكاء الاصطناعي الصناعي", 机器人与具身智能: "الروبوتات والذكاء الاصطناعي المتجسد", 前沿科技与探索: "العلوم المتقدمة",
    治理标准与政策: "حوكمة ومعايير الذكاء الاصطناعي", 金融与科技投资: "التمويل والاستثمار التقني", 内容创意与AIGC: "الإبداع والمحتوى المولد بالذكاء الاصطناعي",
    教育与人才发展: "التعليم والمواهب", 医疗与生命科学: "الصحة وعلوم الحياة", 能源与可持续发展: "الطاقة والاستدامة",
    女性与多元发展: "المرأة والتنوع",
  },
};

const VENUE_LABELS: Record<Locale, Record<VenueId, string>> = {
  zh: { "expo-center": "世博中心", "expo-exhibition": "世博展览馆", "west-bund": "西岸国际会展中心", "expo-tongsen-hotel": "世博桐森酒店", "expo-riverside-hotel": "世博滨江酒店", "zhangjiang-science-hall": "张江科学会堂", other: "其他场馆" },
  en: { "expo-center": "Shanghai Expo Center", "expo-exhibition": "Shanghai World Expo Exhibition & Convention Center", "west-bund": "West Bund International Convention Center", "expo-tongsen-hotel": "Expo Tongsen Hotel", "expo-riverside-hotel": "Expo Riverside Hotel", "zhangjiang-science-hall": "Zhangjiang Science Hall", other: "Other venues" },
  ja: { "expo-center": "上海世博センター", "expo-exhibition": "上海世博展覧館", "west-bund": "西岸国際会展センター", "expo-tongsen-hotel": "世博桐森ホテル", "expo-riverside-hotel": "世博リバーサイドホテル", "zhangjiang-science-hall": "張江科学会堂", other: "その他の会場" },
  ko: { "expo-center": "상하이 엑스포 센터", "expo-exhibition": "상하이 세계박람회 전시컨벤션센터", "west-bund": "웨스트번드 국제컨벤션센터", "expo-tongsen-hotel": "엑스포 통선 호텔", "expo-riverside-hotel": "엑스포 리버사이드 호텔", "zhangjiang-science-hall": "장장 과학회당", other: "기타 장소" },
  fr: { "expo-center": "Centre Expo de Shanghai", "expo-exhibition": "Centre d’exposition et de congrès de l’Expo de Shanghai", "west-bund": "Centre international des congrès de West Bund", "expo-tongsen-hotel": "Hôtel Expo Tongsen", "expo-riverside-hotel": "Hôtel Expo Riverside", "zhangjiang-science-hall": "Palais des sciences de Zhangjiang", other: "Autres lieux" },
  de: { "expo-center": "Shanghai Expo Center", "expo-exhibition": "Shanghai World Expo Exhibition & Convention Center", "west-bund": "West Bund International Convention Center", "expo-tongsen-hotel": "Expo Tongsen Hotel", "expo-riverside-hotel": "Expo Riverside Hotel", "zhangjiang-science-hall": "Zhangjiang Science Hall", other: "Weitere Veranstaltungsorte" },
  es: { "expo-center": "Centro de Exposiciones de Shanghái", "expo-exhibition": "Centro de Exposiciones y Convenciones de la Expo de Shanghái", "west-bund": "Centro Internacional de Convenciones West Bund", "expo-tongsen-hotel": "Hotel Expo Tongsen", "expo-riverside-hotel": "Hotel Expo Riverside", "zhangjiang-science-hall": "Palacio de Ciencias de Zhangjiang", other: "Otros recintos" },
  ar: { "expo-center": "مركز شنغهاي إكسبو", "expo-exhibition": "مركز شنغهاي العالمي للمعارض والمؤتمرات", "west-bund": "مركز ويست بوند الدولي للمؤتمرات", "expo-tongsen-hotel": "فندق إكسبو تونغسن", "expo-riverside-hotel": "فندق إكسبو ريفرسايد", "zhangjiang-science-hall": "قاعة تشانغجيانغ للعلوم", other: "أماكن أخرى" },
};

const IDENTITY_LABELS: Record<Locale, Record<PlannerIdentity, string>> = {
  zh: { developer: "开发者", executive: "企业管理者", founder: "创业者", investor: "投资人", researcher: "研究者", creator: "内容创作者", "first-timer": "首次参会者" },
  en: { developer: "Developer", executive: "Business leader", founder: "Founder", investor: "Investor", researcher: "Researcher", creator: "Content creator", "first-timer": "First-time visitor" },
  ja: { developer: "開発者", executive: "ビジネスリーダー", founder: "創業者", investor: "投資家", researcher: "研究者", creator: "コンテンツ制作者", "first-timer": "初参加" },
  ko: { developer: "개발자", executive: "비즈니스 리더", founder: "창업자", investor: "투자자", researcher: "연구자", creator: "콘텐츠 크리에이터", "first-timer": "첫 방문자" },
  fr: { developer: "Développeur", executive: "Dirigeant", founder: "Fondateur", investor: "Investisseur", researcher: "Chercheur", creator: "Créateur de contenu", "first-timer": "Première visite" },
  de: { developer: "Entwickler", executive: "Führungskraft", founder: "Gründer", investor: "Investor", researcher: "Forscher", creator: "Content Creator", "first-timer": "Erstbesucher" },
  es: { developer: "Desarrollador", executive: "Líder empresarial", founder: "Fundador", investor: "Inversor", researcher: "Investigador", creator: "Creador de contenido", "first-timer": "Primera visita" },
  ar: { developer: "مطوّر", executive: "قائد أعمال", founder: "مؤسس", investor: "مستثمر", researcher: "باحث", creator: "صانع محتوى", "first-timer": "زائر لأول مرة" },
};

const GOAL_LABELS: Record<Locale, Record<PlannerGoal, string>> = {
  zh: { "technical-depth": "技术深度", "industry-insight": "产业洞察", "investment-opportunities": "投资机会", "policy-understanding": "政策理解", "creative-inspiration": "创意灵感", "talent-network": "人才连接", "sustainable-impact": "可持续影响" },
  en: { "technical-depth": "Technical depth", "industry-insight": "Industry insight", "investment-opportunities": "Investment opportunities", "policy-understanding": "Policy understanding", "creative-inspiration": "Creative inspiration", "talent-network": "Talent connections", "sustainable-impact": "Sustainable impact" },
  ja: { "technical-depth": "技術を深掘り", "industry-insight": "業界インサイト", "investment-opportunities": "投資機会", "policy-understanding": "政策理解", "creative-inspiration": "創造的な刺激", "talent-network": "人材交流", "sustainable-impact": "持続可能なインパクト" },
  ko: { "technical-depth": "기술 심화", "industry-insight": "산업 인사이트", "investment-opportunities": "투자 기회", "policy-understanding": "정책 이해", "creative-inspiration": "창작 영감", "talent-network": "인재 네트워킹", "sustainable-impact": "지속가능한 영향" },
  fr: { "technical-depth": "Approfondissement technique", "industry-insight": "Perspectives sectorielles", "investment-opportunities": "Opportunités d’investissement", "policy-understanding": "Compréhension des politiques", "creative-inspiration": "Inspiration créative", "talent-network": "Réseau de talents", "sustainable-impact": "Impact durable" },
  de: { "technical-depth": "Technische Vertiefung", "industry-insight": "Brancheneinblicke", "investment-opportunities": "Investitionschancen", "policy-understanding": "Politikverständnis", "creative-inspiration": "Kreative Inspiration", "talent-network": "Talentnetzwerk", "sustainable-impact": "Nachhaltige Wirkung" },
  es: { "technical-depth": "Profundidad técnica", "industry-insight": "Perspectiva sectorial", "investment-opportunities": "Oportunidades de inversión", "policy-understanding": "Comprensión de políticas", "creative-inspiration": "Inspiración creativa", "talent-network": "Red de talento", "sustainable-impact": "Impacto sostenible" },
  ar: { "technical-depth": "تعمق تقني", "industry-insight": "رؤى القطاع", "investment-opportunities": "فرص استثمارية", "policy-understanding": "فهم السياسات", "creative-inspiration": "إلهام إبداعي", "talent-network": "شبكة المواهب", "sustainable-impact": "أثر مستدام" },
};

const DATE_LABELS_ALL: Record<Locale, Record<WaicDate, string>> = {
  zh: { "2026-07-17": "7月17日", "2026-07-18": "7月18日", "2026-07-19": "7月19日", "2026-07-20": "7月20日" },
  en: { "2026-07-17": "Jul 17", "2026-07-18": "Jul 18", "2026-07-19": "Jul 19", "2026-07-20": "Jul 20" },
  ja: { "2026-07-17": "7月17日", "2026-07-18": "7月18日", "2026-07-19": "7月19日", "2026-07-20": "7月20日" },
  ko: { "2026-07-17": "7월 17일", "2026-07-18": "7월 18일", "2026-07-19": "7월 19일", "2026-07-20": "7월 20일" },
  fr: { "2026-07-17": "17 juil.", "2026-07-18": "18 juil.", "2026-07-19": "19 juil.", "2026-07-20": "20 juil." },
  de: { "2026-07-17": "17. Juli", "2026-07-18": "18. Juli", "2026-07-19": "19. Juli", "2026-07-20": "20. Juli" },
  es: { "2026-07-17": "17 jul", "2026-07-18": "18 jul", "2026-07-19": "19 jul", "2026-07-20": "20 jul" },
  ar: { "2026-07-17": "17 يوليو", "2026-07-18": "18 يوليو", "2026-07-19": "19 يوليو", "2026-07-20": "20 يوليو" },
};

export const CATEGORY_LABELS_EN = CATEGORY_LABELS.en;
export const IDENTITY_LABELS_EN = IDENTITY_LABELS.en;
export const GOAL_LABELS_EN = GOAL_LABELS.en;
export const DATE_LABELS: Record<WaicDate, { zh: string; en: string }> = {
  "2026-07-17": { zh: DATE_LABELS_ALL.zh["2026-07-17"], en: DATE_LABELS_ALL.en["2026-07-17"] },
  "2026-07-18": { zh: DATE_LABELS_ALL.zh["2026-07-18"], en: DATE_LABELS_ALL.en["2026-07-18"] },
  "2026-07-19": { zh: DATE_LABELS_ALL.zh["2026-07-19"], en: DATE_LABELS_ALL.en["2026-07-19"] },
  "2026-07-20": { zh: DATE_LABELS_ALL.zh["2026-07-20"], en: DATE_LABELS_ALL.en["2026-07-20"] },
};

export const categoryLabel = (category: EventCategory, locale: Locale) => CATEGORY_LABELS[locale][category];
export const venueLabel = (venue: VenueId, locale: Locale) => VENUE_LABELS[locale][venue];
export const identityLabel = (identity: PlannerIdentity, locale: Locale) => IDENTITY_LABELS[locale][identity];
export const goalLabel = (goal: PlannerGoal, locale: Locale) => GOAL_LABELS[locale][goal];
export const dateLabel = (date: WaicDate, locale: Locale) => DATE_LABELS_ALL[locale][date];
