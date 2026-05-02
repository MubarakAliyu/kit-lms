import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { login } from "@/_lib/api/auth";

const providers = [
  CredentialsProvider({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;

      try {
        // login() hits POST {API_URL}/login. In dev this is intercepted by
        // MSW (Node server, started from instrumentation.js).
        const result = await login({
          email: credentials.email,
          password: credentials.password,
        });

        // Force-reset path — admin-created accounts logging in for the first
        // time. Surface the flag so DashboardLayout's ForceResetGuard can
        // bounce them to /force-reset-password before any dashboard UI loads.
        if (result?.must_reset_password) {
          return {
            id: result.user?.id ?? `temp_${credentials.email}`,
            email: result.user?.email ?? credentials.email,
            name: result.user?.name,
            role: result.user?.role,
            language_preference: "en",
            must_reset_password: true,
            temp_token: result.temp_token,
          };
        }

        // Normal login.
        if (result?.user && result?.token) {
          return {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            role: result.user.role,
            language_preference: result.user.language_preference || "en",
            must_reset_password: false,
            accessToken: result.token,
          };
        }

        return null;
      } catch {
        return null;
      }
    },
  }),
];

// Google provider stays out of the registry until real credentials land —
// otherwise NextAuth throws on init when env vars are missing.
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.unshift(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const authOptions = {
  providers,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
        token.language_preference = user.language_preference;
        token.accessToken = user.accessToken;
        token.must_reset_password = user.must_reset_password ?? false;
        token.temp_token = user.temp_token ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.name = token.name;
        session.user.language_preference = token.language_preference;
        session.user.must_reset_password = token.must_reset_password ?? false;
        session.user.temp_token = token.temp_token ?? null;
      }
      session.accessToken = token.accessToken;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
