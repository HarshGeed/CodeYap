import NextAuth, {NextAuthConfig, Session, User as NextAuthUser} from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import User from "@/models/userModel";
import { connect } from "@/lib/dbConn";

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
          
          await connect();

          const user = await User.findOne({ email: credentials.email });

          if (!user) throw new Error("User not found");

          const isValidPassword = await compare(credentials.password as string, user.password as string);

          if (!isValidPassword) throw new Error("Password is wrong");

          // console.log(user);
          return user as CustomUser;
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
      // connect();
      if (account?.provider === "google") {
        // Find user in DB or create new one if not exists
        let dbUser = await User.findOne({ email: user.email });

        if (!dbUser) {
          dbUser = await User.create({
            username: user.name,
            email: user.email,
            isOauth: true,
            profileImage: user.image,
          });
        }

        token.id = dbUser.id;
        token.email = dbUser.email;
        token.name = dbUser.username;
        token.profileImage = dbUser.profileImage;
      } else if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = (user as CustomUser).username;
        token.profileImage = (user as CustomUser).profileImage;
      }
      // console.log("Token after processing:", token);
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
 