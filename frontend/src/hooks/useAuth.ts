/**
 * @fileoverview 인증 상태 관리 훅
 *
 * localStorage에 JWT 토큰을 저장/관리하며,
 * 로그인/로그아웃/인증 상태 확인 기능을 제공합니다.
 */
import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';

const TOKEN_KEY = 'auth_token';
const USERNAME_KEY = 'auth_username';

interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  isLoading: boolean;
}

/**
 * 인증 상태 관리 커스텀 훅.
 *
 * - login(): 서버에 로그인 요청 후 토큰 저장
 * - logout(): 토큰 삭제 후 로그인 페이지로 이동
 * - isAuthenticated: 현재 인증 상태
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: !!localStorage.getItem(TOKEN_KEY),
    username: localStorage.getItem(USERNAME_KEY),
    isLoading: true,
  });

  // 앱 시작 시 토큰 유효성 검증
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setState({ isAuthenticated: false, username: null, isLoading: false });
      return;
    }

    axios
      .get('/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        setState({
          isAuthenticated: true,
          username: localStorage.getItem(USERNAME_KEY),
          isLoading: false,
        });
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USERNAME_KEY);
        setState({ isAuthenticated: false, username: null, isLoading: false });
      });
  }, []);

  const login = useCallback(
    async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const response = await axios.post('/api/auth/login', { username, password });
        const { token, username: returnedUsername } = response.data;

        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USERNAME_KEY, returnedUsername);
        setState({ isAuthenticated: true, username: returnedUsername, isLoading: false });

        return { success: true };
      } catch (error: any) {
        const message = error.response?.data?.error || '로그인에 실패했습니다.';
        return { success: false, error: message };
      }
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
    setState({ isAuthenticated: false, username: null, isLoading: false });
    window.location.href = '/login';
  }, []);

  return {
    ...state,
    login,
    logout,
  };
}
