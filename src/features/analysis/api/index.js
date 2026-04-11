import * as mock from "./analysisApi.mock";
import * as http from "./analysisApi.http";

const mode = import.meta.env.VITE_API_MODE || "mock";
export const analysisApi = mode === "http" ? http : mock;
