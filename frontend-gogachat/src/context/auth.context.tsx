import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AuthContextType, User, AuthResponse, RegisterInfo, LoginInfo } from "@/types/auth.types";
import { postRequest, baseUrl } from "@/utils/api";

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("User");
    if (storedUser) {
      setUser(JSON.parse(storedUser) as User);
    }
  }, []);

  const saveUserToStorage = (userData: User) => {
    localStorage.setItem("User", JSON.stringify(userData));
    setUser(userData);
  };

  const registerUser = useCallback(async (registerInfo: RegisterInfo): Promise<void> => {
    setAuthLoading(true);
    setAuthError(null);

    try {
      const response: AuthResponse = await postRequest(
        `${baseUrl}/users/register`,
        JSON.stringify(registerInfo)
      );

      if ("error" in response) {
        setAuthError(response.error);
      } else {
        saveUserToStorage(response);
      }
    } catch (error) {
      setAuthError("Failed to register. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const loginUser = useCallback(async (loginInfo: LoginInfo): Promise<void> => {
    setAuthLoading(true);
    setAuthError(null);

    try {
      // TODO on created api and correct login, change this mocked data into real from database
      console.log("Mocked login active. Ignoring API call.");
      
      const mockUser: User = {
        id: "mocked-user-id",
        name: "John Doe",
        email: "mocked@example.com",
        token: 'abc'
      };
      
      saveUserToStorage(mockUser); 
      return;
      // const response: AuthResponse = await postRequest(
      //   `${baseUrl}/users/login`,
      //   JSON.stringify(loginInfo)
      // );

      // if ("error" in response) {
      //   setAuthError(response.error);
      // } else {
      //   saveUserToStorage(response);
      // }
    } catch (error) {
      setAuthError("Failed to login. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const logoutUser = useCallback(() => {
    localStorage.removeItem("User");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        authError,
        isAuthLoading,
        registerUser,
        loginUser,
        logoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthContextProvider");
  }
  return context;
};
