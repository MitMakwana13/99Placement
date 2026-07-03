import { useState } from "react";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/auth-context";

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@99placement.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);

  const loginMutation = useLogin({
    mutation: {
      onSuccess(data) {
        login(data.token, data.employee);
      },
      onError(err: any) {
        setError(err?.data?.error || "Invalid credentials");
      },
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    loginMutation.mutate({ data: { email, password } });
  }

  return (
    <div className="min-h-screen bg-[oklch(0.97_0.01_90)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-[oklch(0.2_0.02_60)] flex items-center justify-center">
            <span className="text-[oklch(0.85_0.12_85)] font-bold text-sm">99</span>
          </div>
          <span className="text-2xl font-bold text-[oklch(0.15_0.02_60)]">99placement.</span>
        </div>

        <div className="bg-white rounded-2xl border border-[oklch(0.9_0.01_90)] shadow-sm p-8">
          <h1 className="text-xl font-bold text-[oklch(0.15_0.02_60)] mb-1">Welcome back</h1>
          <p className="text-sm text-[oklch(0.5_0.01_60)] mb-6">Sign in to your recruiter account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[oklch(0.3_0.02_60)] mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-lg border border-[oklch(0.88_0.01_90)] bg-[oklch(0.98_0.005_90)] px-3 py-2 text-sm text-[oklch(0.2_0.02_60)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.2_0.02_60)]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[oklch(0.3_0.02_60)] mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-lg border border-[oklch(0.88_0.01_90)] bg-[oklch(0.98_0.005_90)] px-3 py-2 text-sm text-[oklch(0.2_0.02_60)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.2_0.02_60)]"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-[oklch(0.2_0.02_60)] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[oklch(0.15_0.02_60)] transition-colors disabled:opacity-50"
            >
              {loginMutation.isPending ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-xs text-[oklch(0.6_0.01_60)] text-center mt-4">
            Default: admin@99placement.com / admin123
          </p>
        </div>
      </div>
    </div>
  );
}
