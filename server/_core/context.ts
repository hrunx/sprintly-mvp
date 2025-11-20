import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { extractToken, verifyToken } from './auth';
import { getUserById } from '../db';

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // Extract JWT token from request
    const token = extractToken(opts.req);
    console.log('[Auth Debug] Token extracted:', token ? 'YES' : 'NO');
    
    if (token) {
      // Verify token
      const payload = verifyToken(token);
      console.log('[Auth Debug] Token verified:', payload ? 'YES' : 'NO', payload ? `userId: ${payload.userId}` : '');
      
      if (payload && payload.userId) {
        // Get user from database
        const dbUser = await getUserById(payload.userId);
        console.log('[Auth Debug] User from DB:', dbUser ? `Found: ${dbUser.email}` : 'NOT FOUND');
        if (dbUser) {
          user = dbUser;
        }
      }
    }
  } catch (error) {
    // Authentication is optional for public procedures
    console.log('[Auth Debug] Error:', error);
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
