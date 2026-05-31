import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import "../styles/globals.css";
import { getStoredToken } from "../src/lib/access-api-client.js";

const publicPaths = new Set(["/login"]);
const managerOnlyPaths = new Set(["/realtime", "/employee", "/trends", "/anomalies"]);

function getHomePath(employee) {
  return employee?.isManager === true ? "/realtime" : "/attendance";
}

function getStoredEmployee() {
  const storedEmployee = localStorage.getItem("employee");
  if (!storedEmployee) return null;

  try {
    return JSON.parse(storedEmployee);
  } catch {
    return null;
  }
}

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    if (!router.isReady) return;

    setIsCheckingAuth(true);

    const token = getStoredToken();
    const employee = getStoredEmployee();

    if (publicPaths.has(router.pathname)) {
      if (token) {
        router.replace(getHomePath(employee));
        return;
      }

      setIsCheckingAuth(false);
      return;
    }

    if (!token) {
      const next = encodeURIComponent(router.asPath);
      router.replace(`/login`);
      return;
    }

    if (managerOnlyPaths.has(router.pathname) && employee?.isManager === false) {
      router.replace("/attendance");
      return;
    }

    setIsCheckingAuth(false);
  }, [router.asPath, router.isReady, router.pathname]);

  if (isCheckingAuth && !publicPaths.has(router.pathname)) {
    return null;
  }

  return <Component {...pageProps} />;
}
