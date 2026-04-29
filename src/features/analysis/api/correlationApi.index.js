/**
 * src/features/analysis/api/correlationApi.index.js
 * → Rename thành index.js trong folder correlationApi/ hoặc export từ đây
 *
 * Switch bằng .env:
 *   VITE_API_MODE=mock   → dùng mock (default)
 *   VITE_API_MODE=http   → call backend FastAPI thật
 */
import * as mock from "./correlationApi.mock";
import * as http from "./correlationApi.http";

const mode = import.meta.env.VITE_API_MODE || "mock";
export const correlationApi = mode === "http" ? http : mock;