import { timingSafeEqual } from 'node:crypto';
import { IdentityResolver } from './app';
import { Principal } from './pets/domain';

export function demoIdentity(token: string, principal: Principal, environment: string | undefined): IdentityResolver {
  if (environment !== 'development' || token.length < 32) throw new Error('DEMO_REQUIRES_DEVELOPMENT');
  return { resolve: async request => {
    const candidate = request.headers.authorization;
    const expected = 'Bearer ' + token;
    if (!candidate || Buffer.byteLength(candidate) !== Buffer.byteLength(expected)) return undefined;
    return timingSafeEqual(Buffer.from(candidate), Buffer.from(expected)) ? principal : undefined;
  } };
}

