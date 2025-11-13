import { z } from 'zod';
import { router, publicProcedure } from './_core/trpc';
import { TRPCError } from '@trpc/server';
import { hashPassword, comparePassword, generateToken, setAuthCookie, clearAuthCookie } from './_core/auth';
import { getDb } from './db';
import { users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

export const authRouter = router({
  /**
   * Register new user
   */
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      // Check if user already exists
      const existing = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (existing.length > 0) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Email already registered' });
      }

      // Hash password
      const hashedPassword = await hashPassword(input.password);

      // Create user
      await db.insert(users).values({
        email: input.email,
        password: hashedPassword,
        name: input.name,
        role: 'user',
      });

      // Fetch created user
      const [newUser] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);

      // Generate token
      const token = generateToken({
        id: newUser.id,
        email: newUser.email,
        name: newUser.name || '',
        role: newUser.role,
      });

      // Set cookie
      setAuthCookie(ctx.res, token);

      return {
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
        },
        token,
      };
    }),

  /**
   * Login user
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      // Find user
      const [user] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (!user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid email or password' });
      }

      // Verify password
      const isValid = await comparePassword(input.password, user.password);
      if (!isValid) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid email or password' });
      }

      // Update last signed in
      await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));

      // Generate token
      const token = generateToken({
        id: user.id,
        email: user.email,
        name: user.name || '',
        role: user.role,
      });

      // Set cookie
      setAuthCookie(ctx.res, token);

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
      };
    }),

  /**
   * Get current user
   */
  me: publicProcedure.query(({ ctx }) => {
    return ctx.user || null;
  }),

  /**
   * Logout user
   */
  logout: publicProcedure.mutation(({ ctx }) => {
    clearAuthCookie(ctx.res);
    return { success: true };
  }),
});
