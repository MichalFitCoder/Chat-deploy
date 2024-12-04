import { Routes, Route } from "react-router-dom";
import PrivateRoute from "./private-routes";
import Login from "@/pages/auth/login";
import { Register } from "@/pages/auth/register";
import ChatLayout from "@/pages/chat/chat-layout";

const AppRoutes: React.FC = () => {  

  // TODO secure private routes, access only for authenticated user
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/chat/:chatId"
        element={
          <PrivateRoute>
            <ChatLayout/>
          </PrivateRoute>
        }
      />
      
      <Route path="*" element={<Login />} />
    </Routes>
  );
};

export default AppRoutes;
