export type User = {
  id: string;
  name: string;
  email: string;
  token: string;
};

export type RegisterInfo = {
  name: string;
  email: string;
  password: string;
};

export type RegisterResponse = User | { error: string };

export type AuthContextType = {
  user: User | null;
  authError: string | null;
  isAuthLoading: boolean;
  registerUser: (info: RegisterInfo) => Promise<void>;
  loginUser: (info: LoginInfo) => Promise<void>;
  logoutUser: () => void;
};

// new
export interface LoginInfo {
  email: string;
  password: string;
}

export type AuthResponse = User | { error: string };
