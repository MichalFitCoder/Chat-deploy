import React, { useState, useContext } from "react";
import "./pages.css/Register.css";
import { AuthContext } from "../context/AuthContext";

const Register = () => {
  const { registerInfo, updateRegisterInfo, registerUser, registerError, isRegisterLoading} = useContext(AuthContext);
    

  return (
    <div className="register-container">
      <h2>Register</h2>
      <form onSubmit={registerUser}>
        <div className="form-group">
          <label>Name:
          <input
            type="text"
            name="name"
            onChange={(e)=> updateRegisterInfo({...registerInfo, name: e.target.value})}
          /></label>
        </div>
        <div className="form-group">
          <label>Email:
          <input
            type="email"
            name="email"
            onChange={(e)=> updateRegisterInfo({...registerInfo, email: e.target.value})}
          /></label>
        </div>
        <div className="form-group">
          <label>Password:
          <input
            type="password"
            name="password"
            onChange={(e)=> updateRegisterInfo({...registerInfo, password: e.target.value})}
          /></label>
        </div>
        <button type="submit" className="submit-btn">
          {isRegisterLoading? "Creating account" : "Register"}
        </button>
          {
          registerError?.error && (        
            <div className="error-text">
              <p>{registerError?.message}</p>
            </div>
          )}
      </form>
    </div>
  );
};

export default Register;
