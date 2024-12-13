import "./components.css/NavBar.css"
import logo from "../assets/logo.png"
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";

const NavBar = () => {

  const {user, logoutUser} = useContext(AuthContext);

    return (
        <nav className="navbar">
          <div className="navbar-logo">
            <img src={logo} alt="Logo"/>
            <h1>GogaChat</h1>
          </div>
          {user ? (
        <>
          <span><strong>Welcome, {user.name}</strong></span>
          <ul className="navbar-links">
            <li>
              <Link to="/login" onClick={() => logoutUser()} style={{ cursor: 'pointer' }}>
                Logout
              </Link>
            </li>
          </ul>
        </>
      ) : (
        <ul className="navbar-links">
          <li>
            <Link to="/login">Login</Link>
          </li>
          <li>
            <Link to="/register">Register</Link>
          </li>
        </ul>
      )}
    </nav>
      );
}
 
export default NavBar;