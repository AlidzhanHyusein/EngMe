import React, { useState } from "react";
import { Zap } from "lucide-react";
import { loginWithEmail } from "../services/firebaseService";

const LoginScreen = ({ onGoogleLogin, onBack }: { onGoogleLogin: () => void, onBack: () => void }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await loginWithEmail(email, password);
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface p-6">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-2">
          <div className="w-20 h-20 bg-primary-container rounded-3xl flex items-center justify-center mx-auto shadow-xl">
            <Zap className="w-10 h-10 text-primary fill-primary" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-on-surface font-headline">The Atelier</h1>
          <p className="text-on-surface-variant text-lg">Your kinetic workspace for maximum flow.</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-xl border border-outline-variant/10 space-y-6">
          <form onSubmit={handleEmailLogin} className="space-y-4 text-left">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-surface-container-low border-none rounded-xl p-4 focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface-container-low border-none rounded-xl p-4 focus:ring-2 focus:ring-primary"
              />
            </div>

            {error && (
              <p className="text-xs text-error font-bold text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-black py-4 rounded-xl shadow-xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
            <button
              onClick={onBack}
              className="w-full text-on-surface-variant font-bold text-sm hover:text-primary transition-colors"
            >
              ← Back to Home
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-outline-variant/30"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-on-surface-variant font-bold">Or</span></div>
          </div>

          <button
            onClick={onGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border border-outline-variant p-4 rounded-xl font-bold shadow-sm hover:shadow-md transition-all active:scale-95"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
            Continue with Google
          </button>
        </div>

        <p className="text-xs text-on-surface-variant">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;