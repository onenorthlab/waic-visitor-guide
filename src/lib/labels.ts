import type {
  EventCategory,
  PlannerGoal,
  PlannerIdentity,
  WaicDate,
} from "./types";

export const CATEGORY_LABELS_EN: Record<EventCategory, string> = {
  综合论坛: "Comprehensive Forums",
  大模型与AI基础: "Foundation Models & AI",
  算力与AI芯片: "Compute & AI Chips",
  产业与工业智能化: "Industrial AI",
  机器人与具身智能: "Robotics & Embodied AI",
  前沿科技与探索: "Frontier Science",
  治理标准与政策: "Governance & Standards",
  金融与科技投资: "Finance & Tech Investment",
  内容创意与AIGC: "Creative & AIGC",
  教育与人才发展: "Education & Talent",
  医疗与生命科学: "Healthcare & Life Sciences",
  能源与可持续发展: "Energy & Sustainability",
  女性与多元发展: "Women & Diversity",
};

export const IDENTITY_LABELS_EN: Record<PlannerIdentity, string> = {
  developer: "Developer",
  executive: "Business leader",
  founder: "Founder",
  investor: "Investor",
  researcher: "Researcher",
  creator: "Content creator",
  "first-timer": "First-time visitor",
};

export const GOAL_LABELS_EN: Record<PlannerGoal, string> = {
  "technical-depth": "Technical depth",
  "industry-insight": "Industry insight",
  "investment-opportunities": "Investment opportunities",
  "policy-understanding": "Policy understanding",
  "creative-inspiration": "Creative inspiration",
  "talent-network": "Talent connections",
  "sustainable-impact": "Sustainable impact",
};

export const DATE_LABELS: Record<WaicDate, { zh: string; en: string }> = {
  "2026-07-17": { zh: "7月17日", en: "Jul 17" },
  "2026-07-18": { zh: "7月18日", en: "Jul 18" },
  "2026-07-19": { zh: "7月19日", en: "Jul 19" },
  "2026-07-20": { zh: "7月20日", en: "Jul 20" },
};
