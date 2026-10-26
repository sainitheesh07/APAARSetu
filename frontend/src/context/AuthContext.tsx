import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: UserRole | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  isAicteAdmin: boolean;
  isInstitutionAdmin: boolean;
  isVerifier: boolean;
  isAuditor: boolean;
  isStudent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('apaarsetu_token') || localStorage.getItem('eduverify_token')
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('apaarsetu_user') || localStorage.getItem('eduverify_user');
    const savedToken = localStorage.getItem('apaarsetu_token') || localStorage.getItem('eduverify_token');
    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      } catch (e) {
        localStorage.removeItem('apaarsetu_user');
        localStorage.removeItem('apaarsetu_token');
        localStorage.removeItem('eduverify_user');
        localStorage.removeItem('eduverify_token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, user: loggedUser } = response.data;
      localStorage.setItem('apaarsetu_token', access_token);
      localStorage.setItem('apaarsetu_user', JSON.stringify(loggedUser));
      setToken(access_token);
      setUser(loggedUser);
      return loggedUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    try {
      api.post('/auth/logout').catch(() => {});
    } finally {
      localStorage.removeItem('apaarsetu_token');
      localStorage.removeItem('apaarsetu_user');
      localStorage.removeItem('eduverify_token');
      localStorage.removeItem('eduverify_user');
      setUser(null);
      setToken(null);
      window.location.href = '/login';
    }
  };

  const role = user?.role || null;
  const isAicteAdmin = role === 'aicte_admin';
  const isInstitutionAdmin = role === 'institution_admin';
  const isVerifier = role === 'verifier';
  const isAuditor = role === 'auditor';
  const isStudent = role === 'student';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isLoading,
        login,
        logout,
        isAicteAdmin,
        isInstitutionAdmin,
        isVerifier,
        isAuditor,
        isStudent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
