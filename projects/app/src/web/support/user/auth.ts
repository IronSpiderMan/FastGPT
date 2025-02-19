import { loginOut } from '@/web/support/user/api';

const tokenKey = 'token';
export const clearToken = () => {
  try {
    loginOut();
    localStorage.removeItem(tokenKey);
    const idToken = getIdToken() as string;
    if (!idToken) {
      return;
    }
    const params = new URLSearchParams({
      id_token_hint: idToken,
      post_logout_redirect_uri:
        process.env.NEXT_PUBLIC_LOGOUT_CALLBACK || 'http://localhost:8080/signout-callback'
    });
    localStorage.removeItem('id_token');
    window.location.href = `https://${process.env.NEXT_PUBLIC_SSO_DOMAIN}/connect/endsession?${params.toString()}`;
  } catch (error) {
    error;
  }
};

export const setToken = (token: string) => {
  if (typeof window === 'undefined') return '';
  localStorage.setItem(tokenKey, token);
};
export const getToken = () => {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(tokenKey) || '';
};

export const setIdToken = (token: string) => {
  if (typeof window === 'undefined') return '';
  localStorage.setItem('id_token', token);
};

export const getIdToken = () => {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('id_token');
};
