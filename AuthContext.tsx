
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from './types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedSession = localStorage.getItem('expensify_session');
    if (savedSession) {
      setUser(JSON.parse(savedSession));
    }
    setLoading(false);
  }, []);

  const signup = async (name: string, email: string, password: string) => {
    const users = JSON.parse(localStorage.getItem('expensify_users') || '[]');
    if (users.find((u: User) => u.email === email)) {
      throw new Error("User already exists");
    }
    
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      email,
      password,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      baseCurrency: 'INR' // Default to INR as requested
    };

    users.push(newUser);
    localStorage.setItem('expensify_users', JSON.stringify(users));
    
    // Auto login
    const { password: _, ...userSafe } = newUser;
    setUser(userSafe as User);
    localStorage.setItem('expensify_session', JSON.stringify(userSafe));
  };

  const login = async (email: string, password: string) => {
    const users = JSON.parse(localStorage.getItem('expensify_users') || '[]');
    const foundUser = users.find((u: User) => u.email === email && u.password === password);
    
    if (!foundUser) {
      throw new Error("Invalid email or password");
    }

    const { password: _, ...userSafe } = foundUser;
    setUser(userSafe as User);
    localStorage.setItem('expensify_session', JSON.stringify(userSafe));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('expensify_session');
  };

  const updateProfile = (updates: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('expensify_session', JSON.stringify(updatedUser));
    
    // Update in "database"
    const users = JSON.parse(localStorage.getItem('expensify_users') || '[]');
    const updatedUsers = users.map((u: User) => u.id === user.id ? { ...u, ...updates } : u);
    localStorage.setItem('expensify_users', JSON.stringify(updatedUsers));
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, updateProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
