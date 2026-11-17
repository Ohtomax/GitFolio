import { OAuthCallbackSchema, type ApiResponse, type AuthSession } from '@gitfolio/shared';
import type { RequestHandler } from 'express';
import { z } from 'zod';
import type { Environment } from '../../config/env.schema.js';
import { cookieOptions, OAUTH_COOKIE, readCookie, SESSION_COOKIE } from '../../utils/cookies.js';
import { ServiceError } from '../../utils/service-error.js';
import type { AuthService } from './auth.service.js';
import type { SessionService } from './session.service.js';

export function createAuthController(environment: Environment, auth: AuthService, sessions: SessionService) {
  const options = cookieOptions(environment);
  const oauthOptions = { ...options, path: '/api/auth' };
  const github: RequestHandler = (_request, response, next) => {
    auth.begin().then((attempt) => {
      response.cookie(OAUTH_COOKIE, attempt.binding, { ...oauthOptions, maxAge: 600000 });
      response.redirect(302, attempt.authorizationUrl);
    }).catch(next);
  };
  const publish: RequestHandler = (request, response, next) => {
    try {
      if (!request.auth) throw new ServiceError(401, 'UNAUTHENTICATED', 'Please sign in.');
      const input = z.object({ format: z.enum(['static', 'react']) }).strict().parse(request.query);
      auth.beginPublish(request.auth.userId, input.format === 'react').then((attempt) => {
        response.cookie(OAUTH_COOKIE, attempt.binding, { ...oauthOptions, maxAge: 600000 });
        response.redirect(302, attempt.authorizationUrl);
      }).catch(next);
    } catch (error) { next(error); }
  };
  const callback: RequestHandler = (request, response, next) => {
    response.clearCookie(OAUTH_COOKIE, oauthOptions);
    try {
      if (request.get('Origin') !== environment.CLIENT_URL) {
        throw new ServiceError(403, 'ORIGIN_NOT_ALLOWED', 'This origin is not allowed.');
      }
      const input = OAuthCallbackSchema.parse(request.body);
      const binding = z.string().regex(/^[A-Za-z0-9_-]{43}$/).parse(readCookie(request, OAUTH_COOKIE));
      auth.complete(input, binding).then(async (user) => {
        const session = await sessions.issue(user.id);
        response.cookie(SESSION_COOKIE, session.token, { ...options, maxAge: session.expiresAt - Date.now() });
        response.json({ success: true, data: { user, expiresAt: session.expiresAt } } satisfies ApiResponse<AuthSession>);
      }).catch(next);
    } catch (error) { next(error); }
  };
  const me: RequestHandler = (request, response, next) => {
    if (!request.auth) { next(new ServiceError(401, 'UNAUTHENTICATED', 'Please sign in.')); return; }
    const identity = request.auth;
    auth.getUser(identity.userId).then((user) => {
      response.json({ success: true, data: { user, expiresAt: identity.expiresAt } } satisfies ApiResponse<AuthSession>);
    }).catch(next);
  };
  const logout: RequestHandler = (request, response, next) => {
    if (!request.auth) { next(new ServiceError(401, 'UNAUTHENTICATED', 'Please sign in.')); return; }
    sessions.revoke(request.auth).then(() => {
      response.clearCookie(SESSION_COOKIE, options);
      response.json({ success: true, data: null } satisfies ApiResponse<null>);
    }).catch(next);
  };
  return { github, publish, callback, me, logout };
}
