import { useRouter } from "next/router";
import { useState } from "react";
import { getApiUrl } from "../src/lib/access-api-client.js";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    fetch(getApiUrl("/api/auth/login"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username,
        password
      })
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message ?? "登入失敗，請確認帳號密碼。");
        }

        return data;
      })
      .then((data) => {
        localStorage.setItem("token", data.token);
        localStorage.setItem("employee", JSON.stringify(data.employee));

        // const nextPath = typeof router.query.next === "string" ? router.query.next : "/realtime";
        const nextPath = "/realtime";

        router.push(nextPath);
      })
      .catch((submitError) => {
        setError(submitError.message);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-10">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-[1500px] items-center justify-center">
        <div className="w-full max-w-md rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-900/5 sm:p-8">
          <div>
            <h1 className="mt-6 text-2xl font-semibold text-slate-950">登入</h1>
            <p className="mt-2 text-sm text-slate-500">使用員工信箱登入出勤與門禁報表。</p>
          </div>

          <form className="mt-8 space-y-2" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">帳號</span>
              <input
                type="email"
                value={username}
                autoComplete="username"
                onChange={(event) => setUsername(event.target.value)}
                className="mt-2 h-12 w-full rounded-2xl border-0 bg-slate-100 px-4 text-sm font-medium text-slate-950 outline-none transition placeholder:text-slate-400 hover:bg-slate-200 focus:ring-2 focus:ring-slate-300"
                placeholder="name@company.com"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">密碼</span>
              <input
                type="password"
                value={password}
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 h-12 w-full rounded-2xl border-0 bg-slate-100 px-4 text-sm font-medium text-slate-950 outline-none transition placeholder:text-slate-400 hover:bg-slate-200 focus:ring-2 focus:ring-slate-300"
                placeholder="password"
              />
            </label>

            {error && (
              <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full rounded-2xl bg-slate-950 px-5 mt-8 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting ? "登入中" : "登入"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
