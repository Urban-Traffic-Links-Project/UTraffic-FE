import * as http from "./trafficDataApi.http";
import * as mock from "./trafficDataApi.mock";

const mode = import.meta.env.VITE_API_MODE || "mock";
export const trafficDataApi = mode === "http" ? http : mock;