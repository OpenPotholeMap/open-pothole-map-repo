import axios from "axios";
import { logger } from "./logger";

let clearUserCallback: (() => void) | null = null;

export const setAuthClearCallback = (callback: () => void) => {
  clearUserCallback = callback;
};

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

interface RequestBaseArgs<T> {
  method: "GET" | "POST" | "DELETE" | "PUT";
  url: string;
  data?: object;
  schema: { parse: (data: object) => T };
}

interface IRequest {
  <T extends { data: object }>(
    args: RequestBaseArgs<T> & {
      options: { includeOnlyDataField: true; requireAuth?: boolean };
    }
  ): Promise<T["data"]>;

  <T extends { data: object }>(
    args: RequestBaseArgs<T> & {
      options?: {
        includeOnlyDataField?: false | undefined;
        requireAuth?: boolean;
      };
    }
  ): Promise<T>;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      const status = error.response.status;

      if (status === 401) {
        try {
          if (clearUserCallback) {
            clearUserCallback();
          }
          await api.post("/auth/logout", {}, { withCredentials: true });
        } catch (logoutErr) {
          logger.error("Logout failed", logoutErr);
        }
      }
    }
    return Promise.reject(error);
  }
);

export const request: IRequest = async <T extends { data: object }>({
  method,
  url,
  data = {},
  schema,
  options = {},
}: {
  method: "GET" | "POST" | "DELETE" | "PUT";
  url: string;
  data?: object;
  schema: { parse: (data: object) => T };
  options?: { includeOnlyDataField?: boolean; requireAuth?: boolean };
}): Promise<T["data"] | T> => {
  const { includeOnlyDataField = false } = options;
  const response = await api.request({
    method,
    url,
    ...(method === "GET" ? { params: data } : { data }),
    withCredentials: true,
  });
  const parsedData = schema.parse(response.data);

  return includeOnlyDataField ? parsedData.data : parsedData;
};
