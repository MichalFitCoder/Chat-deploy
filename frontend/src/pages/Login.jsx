import React, { useContext, useState } from "react";
import "./pages.css/login.css";
import { AuthContext } from "../context/AuthContext";

const Login = () => {

  const{loginUser, loginError, loginInfo, updateLoginInfo, isLoginLoading} = useContext(AuthContext);

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={loginUser}>
        <div className="form-group">
          <label>Email:</label>
          <input type="email" name="email" onChange={(e)=>
            updateLoginInfo({...loginInfo, email: e.target.value})
          } />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input type="password" name="password" onChange={(e)=>
            updateLoginInfo({...loginInfo, password: e.target.value})
          } />
        </div>
        <button type="submit" className="submit-btn">
          {isLoginLoading ? "Loading..." : "Login"}
        </button>
        {
          loginError?.error && (        
            <div className="error-text">
              <p>{loginError?.message}</p>
            </div>
          )}
      </form>
    </div>
  );
};

export default Login;
