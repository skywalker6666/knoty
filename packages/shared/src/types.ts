// ============================================================
// Knoty — packages/shared/src/types.ts
// 共用型別定義，所有 app 層從此 import
// 欄位對齊 supabase/migrations/001_initial_schema.sql
// DB snake_case → TypeScript camelCase
// ============================================================

// ============================================================
// Primitive / Enum Types
// ============================================================

/** 關係親近程度：1=陌生/有嫌隙, 2=不太熟, 3=普通, 4=不錯, 5=非常好 */
export type Closeness = 1 | 2 | 3 | 4 | 5;

/**
 * 關係方向語意。
 * DB 層強制 person_a < person_b（UUID 字典序），
 * direction 描述兩人關係的情感指向。
 */
export type RelationDirection = 'mutual' | 'a_to_b' | 'b_to_a';

/** 事件類型（對應 events.event_type CHECK constraint） */
export type EventType =
  | 'conflict'
  | 'favor'
  | 'betrayal'
  | 'reconcile'
  | 'milestone'
  | 'note';

/** 事件影響值（對應 events.impact CHECK -3..3） */
export type Impact = -3 | -2 | -1 | 0 | 1 | 2 | 3;

/** 社交風險等級（AI 分析輸出） */
export type RiskLevel = 'low' | 'medium' | 'high';

// ============================================================
// DB Entity Interfaces
// 欄位一對一對應 SQL table columns，UUID 以 string 表示
// ============================================================

/**
 * 人物節點（對應 persons table）
 *
 * 注意：real_name_local 為隱私設計，只存裝置端，此 interface 不含此欄位。
 */
export interface Person {
  id: string;
  userId: string;
  /** 暱稱 / 代稱 / 關係稱謂，如「社團學姐」 */
  displayName: string;
  /** emoji 頭像，如「🧑‍🎤」，降低隱私風險 */
  avatarEmoji?: string;
  /** 所屬情境圈，如 ["社團", "班上"] */
  circles: string[];
  /** 自定義標籤，如 ["話多", "值得信任"] */
  tags: string[];
  /** 私人備忘 */
  notes?: string;
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string;
}

/**
 * 關係邊（對應 relationships table）
 *
 * DB 層保證 personA < personB（UUID 字典序，CHECK constraint）。
 * 寫入前 app 層需排序：若 from > to，交換兩者並對應翻轉 direction：
 *   'a_to_b' ↔ 'b_to_a'，'mutual' 不變。
 */
export interface Relationship {
  id: string;
  userId: string;
  /** 較小 UUID（DB CHECK: personA < personB） */
  personA: string;
  /** 較大 UUID */
  personB: string;
  closeness: Closeness;
  /** 自由文字標籤，如「同盟」「競爭」「表面客氣」 */
  label?: string;
  direction: RelationDirection;
  /** 關係所在情境圈，如「職場」「朋友」；null 表示跨圈或未分類 */
  context?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 事件記錄（對應 events table）
 * 命名為 KnotyEvent 以避免與瀏覽器原生 Event 衝突。
 */
export interface KnotyEvent {
  id: string;
  userId: string;
  /** 涉及人物的 person IDs，至少 1 人（DB CHECK constraint） */
  involvedPersons: string[];
  eventType: EventType;
  /** 事件描述，如「A 在會議上幫我擋了一刀」 */
  description: string;
  impact: Impact;
  /** ISO 8601 date（YYYY-MM-DD） */
  occurredAt: string;
  createdAt: string;
}

/**
 * 情境模板（對應 circle_templates table）
 *
 * 系統模板：isSystem=true, userId=null（全用戶共享）
 * 用戶自訂：isSystem=false, userId=auth.uid()
 */
export interface CircleTemplate {
  id: string;
  /** null 代表系統模板 */
  userId: string | null;
  /** 模板名稱，如「職場」「朋友圈」「家族」 */
  name: string;
  isSystem: boolean;
  /** 預設角色清單，如 ["直屬主管", "同部門同事", "跨部門窗口"] */
  presetRoles: string[];
  /** 預設關係標籤，如 ["同盟", "競爭", "表面客氣"] */
  presetLabels: string[];
  description?: string;
  createdAt: string;
}

// ============================================================
// Graph Visualization Types（for D3.js force-directed layout）
// ============================================================

/**
 * 圖譜節點，相容 D3 SimulationNodeDatum。
 * 渲染資料欄位 + D3 simulation 運算時寫入的位置欄位。
 */
export interface GraphNode {
  // ── 節點資料 ──────────────────────────────────────────────
  /** person.id */
  id: string;
  displayName: string;
  avatarEmoji?: string;
  circles: string[];
  tags: string[];
  // ── D3 simulation 位置（由 D3 寫入，初始可 undefined） ──
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  /** null = 解除固定 */
  fx?: number | null;
  /** null = 解除固定 */
  fy?: number | null;
}

/**
 * 圖譜邊，相容 D3 SimulationLinkDatum。
 * source / target 在 simulation 初始化前為 ID 字串，
 * D3 執行後會解析為 GraphNode 參照。
 */
export interface GraphEdge {
  /** relationship.id */
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  closeness: Closeness;
  direction: RelationDirection;
  label?: string;
  context?: string;
}

// ============================================================
// API Request / Response Types（對應 /api/* routes）
// ============================================================

/**
 * find_relationship_paths() DB function 的單條結果。
 * 對應 SQL: RETURNS TABLE(path UUID[], min_closeness INT, depth INT)
 */
export interface RelationPath {
  /** 路徑上的 person IDs，index 0 = 起點，最後 = 終點 */
  path: string[];
  /** 路徑最弱一環的 closeness（1–5） */
  minCloseness: number;
  /** 關係跳數（1 = 兩人直接相識） */
  depth: number;
}

/** 社交風險查詢請求（POST /api/risk-check） */
export interface RiskCheckRequest {
  from_id: string;   // person UUID — 我要跟誰講
  to_id: string;     // person UUID — 我要聊到的人
}

/** AI summary returned by Claude in /api/risk-check */
export interface AiSummary {
  riskLevel: RiskLevel;
  summary: string;     // ≤ 150 chars, 繁體中文
  suggestion: string;  // ≤ 150 chars, 繁體中文
}

/** 社交風險查詢回應（POST /api/risk-check） */
export interface RiskCheckResponse {
  paths: RelationPath[];
  pathCount: number;
  ai: AiSummary | null;
  aiLimitReached?: boolean;
}

/** Response from POST /api/events/parse */
export interface ParseEventResponse {
  involved_persons: string[];
  matched_person_ids: (string | null)[];
  event_type: EventType;
  description: string;
  impact: Impact;
  occurred_at: string;  // ISO 8601 date string
}

// ============================================================
// API Utility Types
// CLAUDE.md: 每個 API route 必須 Zod validation，
// 這些 Input types 作為 Zod schema 的型別基礎。
// ============================================================

/** 建立 Person 的請求 body（id / userId / timestamps 由 DB 自動產生） */
export type CreatePersonInput = Omit<Person, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
export type UpdatePersonInput = Partial<CreatePersonInput>;

/**
 * 建立 Relationship 的請求 body。
 * app 層負責在送出前確保 personA < personB，
 * 並在必要時翻轉 direction。
 */
export type CreateRelationshipInput = Omit<Relationship, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
export type UpdateRelationshipInput = Partial<CreateRelationshipInput>;

/** 建立 KnotyEvent 的請求 body */
export type CreateEventInput = Omit<KnotyEvent, 'id' | 'userId' | 'createdAt'>;
export type UpdateEventInput = Partial<CreateEventInput>;

/** 建立 CircleTemplate 的請求 body（只限用戶自訂模板） */
export type CreateCircleTemplateInput = Omit<CircleTemplate, 'id' | 'userId' | 'isSystem' | 'createdAt'>;
export type UpdateCircleTemplateInput = Partial<CreateCircleTemplateInput>;

// ============================================================
// API Error（CLAUDE.md: 所有 API routes 回傳統一格式）
// ============================================================

export interface ApiError {
  error: string;
  code: string;
}
