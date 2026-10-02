// Settings from the .env files. Anything starting with VITE_ is public: never put secrets here.
export const env = {
  API_URL: import.meta.env.VITE_API_URL ?? "/api/v1",
  USE_MOCKS: import.meta.env.VITE_USE_MOCKS === "true",
};
