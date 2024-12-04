import "./App.css";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/routes";
import { AuthContextProvider } from "./context/auth.context";

function App() {

  return (
    <AuthContextProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthContextProvider>
  );


  
}

export default App;
