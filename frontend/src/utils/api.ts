import axios from "axios";

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

// Define an interface that defines 2 overloads for the request function
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
          await api.post("/auth/logout", {}, { withCredentials: true });
        } catch (logoutErr) {
          console.error("Logout failed", logoutErr);
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
