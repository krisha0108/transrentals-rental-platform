import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';

export const vendorAuthOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'vendor-credentials',
      name: 'Vendor Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        const vendor = await prisma.vendors.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!vendor) {
          throw new Error('Invalid credentials');
        }

        // Check if vendor is blocked or suspended
        if (vendor.status === 'BLOCKED') {
          throw new Error('Your account has been blocked. Please contact support.');
        }
        if (vendor.status === 'SUSPENDED') {
          throw new Error('Your account is suspended. Please contact support.');
        }
        if (vendor.status === 'REJECTED') {
          throw new Error('Your application was rejected. Please contact support.');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          vendor.password
        );

        if (!isPasswordValid) {
          throw new Error('Invalid credentials');
        }

        // Update last login
        await prisma.vendors.update({
          where: { id: vendor.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: vendor.id,
          email: vendor.email,
          name: vendor.businessName,
          role: 'VENDOR',
          userType: 'vendor',
          status: vendor.status,
          phone: vendor.phone,
          ownerName: vendor.ownerName,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.userType = (user as any).userType;
        token.status = (user as any).status;
        token.phone = (user as any).phone;
        token.ownerName = (user as any).ownerName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role;
        (session.user as any).userType = token.userType;
        (session.user as any).status = token.status;
        (session.user as any).phone = token.phone;
        (session.user as any).ownerName = token.ownerName;
      }
      return session;
    },
  },
  pages: {
    signIn: '/vendor/login',
    error: '/vendor/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token-vendor',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: 'next-auth.callback-url-vendor',
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: 'next-auth.csrf-token-vendor',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
