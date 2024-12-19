import "./components.css/NavBar.css"
import logo from "../assets/logo.png"
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { ChatContext } from "../context/ChatContext";

const NavBar = () => {

  const {user, logoutUser} = useContext(AuthContext);
  const {onlineUsers, inicializeGroupChat} = useContext(ChatContext);



  const createGroupChat = async () => {
    const filteredUsers = onlineUsers.filter((u) => u.userId !== user?._id);
    const userOptions = filteredUsers
      .map((u, index) => `${index + 1}. ${u.name}`)
      .join("\n");
  
    // Showing list of existing users as prompt
    const selected = prompt(
      `Enter numbers of users separated by comma: \n${userOptions}`
    );

    const chatName = prompt(
      `How would you like to name this chat: `
    )
  
    if (selected) {
      const selectedIndexes = selected
        .split(",")
        .map((num) => parseInt(num.trim(), 10) - 1);
      const selectedUserIds = selectedIndexes
        .filter((index) => index >= 0 && index < filteredUsers.length)
        .map((index) => filteredUsers[index].userId);
      const selectedUserNames = selectedIndexes
        .filter((index) => index >= 0 && index < filteredUsers.length)
        .map((index) => filteredUsers[index].name);


      if (selectedUserIds.length > 0) {
        try {
          await inicializeGroupChat(selectedUserIds, chatName);
        } catch (error) {
          console.error("Error creating group chat:", error);
          alert("Failed to create group chat. Please try again.");
        }
      } else {
        alert("No valid users selected.");
      }
    }};


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
              <Link className="menu-button" onClick={() => createGroupChat()} style={{ cursor: 'pointer' }}>
                New Group Chat
              </Link>
            </li>           
            <li>
              <Link to="/login" className="menu-button" onClick={() => logoutUser()} style={{ cursor: 'pointer' }}>
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