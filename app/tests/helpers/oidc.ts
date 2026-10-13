import { createHash } from 'node:crypto';
import { generateKeyPair, SignJWT } from 'jose';
import { vi } from 'vitest';
import { TEST_CLIENT_ID, TEST_ISSUER } from './environment';

export const IDENTITY = {
  sub: 'subject-alice',
  email: 'Alice@Example.test',
  name: 'Alice',
  groups: ['developers'],
};

// Ephemeral keys stay in memory. The actual openid-client parses and validates
// responses; only the provider's HTTP boundary is synthetic.
const signingKey = generateKeyPair('RS256');

export function createOidcProvider() {
  const provider = {
    authorizationUrl: undefined as URL | undefined,
    discoveryStatus: 200,
    userInfoEnabled: true,
    userInfoStatus: 200,
    userInfo: { ...IDENTITY } as Record<string, unknown>,
    idClaims: {} as Record<string, unknown>,
    omitIdToken: false,
    tokenStatus: 200,
    tokenRequests: [] as URLSearchParams[],
    userInfoRequests: 0,
    codeUsed: false,
    onTokenRequest: () => {},
    authorize(url: URL) {
      provider.authorizationUrl = new URL(url);
      const callback = new URL('http://internal-service:3000/api/auth/callback');
      callback.searchParams.set('code', 'synthetic-authorization-code');
      callback.searchParams.set('state', url.searchParams.get('state')!);
      return callback;
    },
    fetch: vi.fn<typeof fetch>(async (input, init): Promise<Response> => {
      const url = new URL(input instanceof Request ? input.url : input.toString());
      if (url.origin !== TEST_ISSUER) throw new Error('Unexpected synthetic OIDC origin');
      switch (url.pathname) {
        case '/.well-known/openid-configuration':
          return Response.json(
            {
              issuer: TEST_ISSUER,
              authorization_endpoint: `${TEST_ISSUER}/authorize`,
              token_endpoint: `${TEST_ISSUER}/token`,
              ...(provider.userInfoEnabled ? { userinfo_endpoint: `${TEST_ISSUER}/userinfo` } : {}),
              response_types_supported: ['code'],
              id_token_signing_alg_values_supported: ['RS256'],
            },
            { status: provider.discoveryStatus },
          );
        case '/token': {
          const params = new URLSearchParams(init?.body as URLSearchParams);
          provider.tokenRequests.push(params);
          provider.onTokenRequest();
          const authorization = provider.authorizationUrl?.searchParams;
          const challenge = createHash('sha256')
            .update(params.get('code_verifier') ?? '')
            .digest('base64url');
          if (
            provider.tokenStatus !== 200 ||
            provider.codeUsed ||
            params.get('code') !== 'synthetic-authorization-code' ||
            params.get('grant_type') !== 'authorization_code' ||
            params.get('client_id') !== TEST_CLIENT_ID ||
            params.get('redirect_uri') !== authorization?.get('redirect_uri') ||
            challenge !== authorization?.get('code_challenge')
          ) {
            return Response.json({ error: 'invalid_grant' }, { status: 400 });
          }
          provider.codeUsed = true;
          const now = Math.floor(Date.now() / 1000);
          const idToken = await new SignJWT({
            ...IDENTITY,
            iss: TEST_ISSUER,
            aud: TEST_CLIENT_ID,
            iat: now,
            exp: now + 300,
            nonce: authorization?.get('nonce'),
            ...provider.idClaims,
          })
            .setProtectedHeader({ alg: 'RS256' })
            .sign((await signingKey).privateKey);
          return Response.json({
            access_token: 'synthetic-access-token',
            token_type: 'Bearer',
            ...(provider.omitIdToken ? {} : { id_token: idToken }),
          });
        }
        case '/userinfo':
          provider.userInfoRequests++;
          return Response.json(provider.userInfo, { status: provider.userInfoStatus });
        default:
          throw new Error('Unexpected synthetic OIDC endpoint');
      }
    }),
  };
  return provider;
}
