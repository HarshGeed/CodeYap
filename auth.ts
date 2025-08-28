import NextAuth, {NextAuthConfig, User as NextAuthUser} from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";

interface CustomUser extends NextAuthUser{
  id: string;
  username?: string;
  isOauth?: boolean;
  profileImage?: string;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      username: string;
      profileImage?: string;
      emailVerified?: Date | null;
    };
  }
}

 const authConfig: NextAuthConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if(!credentials?.email || !credentials?.password){
            throw new Error("Missing Email or Password");
          }
          
          // For Edge Runtime compatibility, we'll handle auth via API call
          const response = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/validate-credentials`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            return null;
          }

          const user = await response.json();
          
          if (user && user.id) {
            return {
              id: user.id,
              email: user.email,
              username: user.username,
              profileImage: user.profileImage,
              isOauth: false,
            } as CustomUser;
          }
          
          return null;
        } catch (error) {
          console.log("Error =>", (error as Error).message);
          return null;
        }
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET!,
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async jwt({ token, user, account }) {
      // For Edge Runtime compatibility, avoid database calls in JWT callback
      // Database operations should be handled in API routes instead
      
      if (account?.provider === "google" || account?.provider === "github") {
        // Store basic user info from OAuth provider
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.profileImage = user.image;
        token.isOauth = true;
      } else if (user) {
        // For credentials login, user data is already available
        token.id = user.id;
        token.email = user.email;
        token.name = (user as CustomUser).username;
        token.profileImage = (user as CustomUser).profileImage;
        token.isOauth = (user as CustomUser).isOauth || false;
      }
      
      return token;
    },
    async session({ session, token }) {
      // console.log("Session callback triggered with token:", token);
      if (token) {
       session.user = {
        id: token.id as string,
        email: token.email as string,
        name: token.name as string,
        username: token.name as string,
        profileImage: token.profileImage as string,
        emailVerified: new Date,
       };
      }
      return session;
    },
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
 