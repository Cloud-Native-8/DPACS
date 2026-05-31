export const getStoredToken = () => {
  if (typeof globalThis.window === "undefined") return null;

  return localStorage.getItem("token");
};

export const getApiUrl = (path) => {
  const apiBaseUrl = process.env.NEXT_PUBLIC_REPORT_API_BASE_URL;

  if (!apiBaseUrl) return path;

  return new URL(path, apiBaseUrl).toString();
};

export const fetchAccessApi = async (path, token = getStoredToken()) => {
  if (!token) {
    throw new Error("請先登入後再查看資料。");
  }

  const response = await fetch(getApiUrl(path), {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? "資料讀取失敗");
  }

  return data;
};
