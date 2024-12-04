import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { useAuth } from "@/context/auth.context";

const Login: React.FC = () => {
  const [loginInfo, setLoginInfo] = useState({ email: "", password: "" });
  const { loginUser, authError, isAuthLoading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginInfo({ ...loginInfo, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await loginUser(loginInfo);
    navigate("/chat/1");
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-screen bg-gray-50">
      <Card className="w-full max-w-md p-4 shadow-md">
        <CardHeader>
          <CardTitle className="text-center text-xl font-semibold">
            Login
          </CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            {authError && <Alert variant="destructive">{authError}</Alert>}
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <Input
                  type="email"
                  name="email"
                  id="email"
                  value={loginInfo.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <Input
                  type="password"
                  name="password"
                  id="password"
                  value={loginInfo.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full mt-4"
              disabled={isAuthLoading}
            >
              {isAuthLoading ? "Logging in..." : "Login"}
            </Button>
            <p className="text-center text-sm text-gray-600">
              Don't have an account? Register!{" "}
              <Link to="/register" className="text-blue-600 hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
