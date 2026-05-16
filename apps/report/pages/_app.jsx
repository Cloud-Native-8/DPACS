import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import "../styles/globals.css";
import { getStoredToken } from "../src/lib/access-api-client.js";

const publicPaths = new Set(["/login"]);

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    if (!router.isReady) return;

    if (publicPaths.has(router.pathname)) {
      setIsCheckingAuth(false);
      return;
    }

    setIsCheckingAuth(true);

    const token = getStoredToken();
    if (!token) {
      const next = encodeURIComponent(router.asPath);
      router.replace(`/login?next=${next}`);
      return;
    }

    setIsCheckingAuth(false);
  }, [router.asPath, router.isReady, router.pathname]);

  if (isCheckingAuth && !publicPaths.has(router.pathname)) {
    return null;
  }

  return <Component {...pageProps} />;
}
