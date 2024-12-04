import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "@/context/auth.context";

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return useContext(AuthContext) ? <>{children}</> : <Navigate to="/login" />;
};

export default PrivateRoute;
