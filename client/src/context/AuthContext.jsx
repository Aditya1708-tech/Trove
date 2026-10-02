import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

const initialState = {
  user:        null,
  isLoading:   true,   // true while checking stored token on mount
  isLoggedIn:  false,
  error:       null,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'LOGIN_SUCCESS':
      return { ...state, user: action.payload, isLoggedIn: true, isLoading: false, error: null };
    case 'LOGOUT':
      return { ...state, user: null, isLoggedIn: false, isLoading: false, error: null };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Rehydrate from stored access token on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      authAPI.getMe()
        .then(({ data }) => dispatch({ type: 'LOGIN_SUCCESS', payload: data.data.user }))
        .catch(() => {
          localStorage.removeItem('accessToken');
          dispatch({ type: 'SET_LOADING', payload: false });
        });
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }

    // Listen for forced logout (e.g. refresh token expired)
    const handleForceLogout = () => dispatch({ type: 'LOGOUT' });
    window.addEventListener('auth:logout', handleForceLogout);
    return () => window.removeEventListener('auth:logout', handleForceLogout);
  }, []);

  const login = useCallback(async (credentials) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { data } = await authAPI.login({
        ...credentials,
        sessionId: localStorage.getItem('sessionId'),
      });
      localStorage.setItem('accessToken', data.data.accessToken);
      dispatch({ type: 'LOGIN_SUCCESS', payload: data.data.user });
      return data.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      dispatch({ type: 'SET_ERROR', payload: msg });
      throw new Error(msg);
    }
  }, []);

  const register = useCallback(async (userData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { data } = await authAPI.register({
        ...userData,
        sessionId: localStorage.getItem('sessionId'),
      });
      localStorage.setItem('accessToken', data.data.accessToken);
      dispatch({ type: 'LOGIN_SUCCESS', payload: data.data.user });
      return data.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      dispatch({ type: 'SET_ERROR', payload: msg });
      throw new Error(msg);
    }
  }, []);

  const loginWithOtp = useCallback(async (email, otp) => {
    const { data } = await authAPI.verifyOtp({
      email,
      otp,
      sessionId: localStorage.getItem('sessionId'),
    });
    localStorage.setItem('accessToken', data.data.accessToken);
    dispatch({ type: 'LOGIN_SUCCESS', payload: data.data.user });
    return data.data;
  }, []);

  const logout = useCallback(async () => {
    try { await authAPI.logout(); } catch {}
    localStorage.removeItem('accessToken');
    dispatch({ type: 'LOGOUT' });
  }, []);

  const updateUser = useCallback((updates) => {
    dispatch({ type: 'UPDATE_USER', payload: updates });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, loginWithOtp, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
