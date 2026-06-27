// Caminhos sensíveis que o pino deve redact em todos os logs.
// Mantenha esta lista atualizada conforme novos campos sensíveis aparecem.
export const REDACT_PATHS = [
  // headers
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["set-cookie"]',
  'req.headers["x-api-key"]',
  'req.headers["x-webhook-signature"]',

  // bodies — auth
  '*.password',
  '*.passwordConfirmation',
  '*.currentPassword',
  '*.newPassword',
  '*.token',
  '*.refreshToken',
  '*.accessToken',
  '*.sessionToken',

  // bodies — secrets
  '*.secret',
  '*.apiKey',
  '*.privateKey',
  '*.clientSecret',
  '*.webhookSecret',

  // payment
  '*.cardNumber',
  '*.cvv',
  '*.cvc',
] as const
