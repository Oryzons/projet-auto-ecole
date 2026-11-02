import type { NextAuthConfig } from "next-auth";

import { requestOrigin } from "@/lib/request-origin";

/**
 * Redirection vers l'adresse que le navigateur utilise (ex. 192.168.1.21
 * depuis un téléphone). Auth.js réécrit `nextUrl` avec NEXTAUTH_URL, ce qui
 * renverrait vers localhost.
 */
function redirectTo(request: Request, path: string) {
  return Response.redirect(`${requestOrigin(request)}${path}`);
}

export const authConfig = {
  // secret de démo : à remplacer par AUTH_SECRET en production
  secret: process.env.AUTH_SECRET ?? "virage-demo-secret-a-remplacer-en-production",
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  // Session de 14 jours, prolongée à chaque visite (au lieu de 30 jours par défaut).
  session: { strategy: "jwt" as const, maxAge: 14 * 24 * 60 * 60 },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.organizationId = user.organizationId;
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          role: token.role as "ADMIN" | "CANDIDATE" | "SKIPPER",
          firstName: token.firstName as string,
          lastName: token.lastName as string,
          organizationId: token.organizationId as string,
        },
      };
    },
    authorized({ auth, request }) {
      const { nextUrl } = request;
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      const isProtected =
        pathname.startsWith("/admin") ||
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/documents") ||
        pathname.startsWith("/payment") ||
        pathname.startsWith("/messages") ||
        pathname.startsWith("/calendar") ||
        pathname.startsWith("/presence") ||
        pathname === "/profile" ||
        pathname.startsWith("/profile/");

      // Le rôle du jeton peut être périmé. Les layouts lisent le rôle en base
      // et redirigent. Le refaire ici provoque une boucle.
      if (isProtected && !isLoggedIn) {
        // Après connexion, retour à la page demandée (ex. : scan du QR code d'appel).
        const next = `${pathname}${nextUrl.search}`;
        return redirectTo(request, `/login?next=${encodeURIComponent(next)}`);
      }

      // Un moniteur n'a accès qu'au calendrier, à son profil et à la page données.
      if (
        auth?.user?.role === "SKIPPER" &&
        pathname.startsWith("/admin") &&
        !["/admin/calendar", "/admin/profile", "/admin/privacy"].some((p) => pathname === p || pathname.startsWith(`${p}/`))
      ) {
        return redirectTo(request, "/admin/calendar");
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
