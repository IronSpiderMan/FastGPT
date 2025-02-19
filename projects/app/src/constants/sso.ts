const SSO_CONFIG = {
  CLIENT_ID: process.env.NEXT_PUBLIC_CLIENT_ID || 'code.test.client',
  REDIRECT_URI: process.env.NEXT_PUBLIC_REDIRECT_URI || 'http://localhost:8080/signin-oidc',
  SSO_DOMAIN: process.env.NEXT_PUBLIC_SSO_DOMAIN || 'devsso.hkust-gz.edu.cn',
  RESPONSE_TYPE: 'code',
  RESPONSE_MODE: 'query',
  SCOPE: 'openid profile',
  CODE_CHALLENGE_METHOD: 'S256'
};

function generateCodeVerifier(length = 128) {
  // 定义允许的字符集合
  const allowedChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let verifier = '';
  // 生成一个与目标长度相同的随机数组
  const randomValues = new Uint32Array(length);
  window.crypto.getRandomValues(randomValues);
  // 将随机数映射到 allowedChars 中
  for (let i = 0; i < length; i++) {
    verifier += allowedChars[randomValues[i] % allowedChars.length];
  }
  return verifier;
}

export const generateCodeChallenge = async () => {
  const codeVerifier = generateCodeVerifier();
  // const codeVerifier = "OqDgqfRGsdY81wGmR93pCjfzAqHqLUAXGuhmHQX9e1H";
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const base64 = btoa(String.fromCharCode(...hashArray));
  const codeChallenge = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return {
    codeVerifier,
    codeChallenge
  };
  // return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
};

export const getSSOAuthorizeUrl = (codeVerifier: string, codeChallenge: string): string => {
  const params = new URLSearchParams({
    client_id: SSO_CONFIG.CLIENT_ID,
    redirect_uri: SSO_CONFIG.REDIRECT_URI,
    response_type: SSO_CONFIG.RESPONSE_TYPE,
    response_mode: SSO_CONFIG.RESPONSE_MODE,
    scope: SSO_CONFIG.SCOPE,
    code_challenge: codeChallenge,
    code_challenge_method: SSO_CONFIG.CODE_CHALLENGE_METHOD,
    state: codeVerifier
  });
  return `https://${SSO_CONFIG.SSO_DOMAIN}/connect/authorize?${params.toString()}`;
};
