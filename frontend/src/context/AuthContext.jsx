    import  {createContext, useCallback, useEffect, useState} from "react";
    import { baseUrl, postRequest } from "../utils/services";

    export const AuthContext = createContext()

    export const AuthContextProvider = ({children}) => {
        const [user, setUser] = useState(null);
        const [registerError, setRegisterError] = useState(null);
        const [isRegisterLoading, setRegisterLoading] = useState(false);
        const [registerInfo, setRegisterInfo] = useState({
            name: "",
            email: "",
            password: "",
        });
        const [loginError, setLoginError] = useState(null);
        const [isLoginLoading, setLoginLoading] = useState(false);
        const [loginInfo, setLoginInfo] = useState({
            email: "",
            password: "",
        });

        useEffect(() =>{
            const user = localStorage.getItem("User");
            setUser(JSON.parse(user));
        },[]);


        const updateRegisterInfo = useCallback((info) =>{
            setRegisterInfo(info)   
        },[]);

        const updateLoginInfo = useCallback((info) =>{
            setLoginInfo(info)   
        },[]);


        const registerUser = useCallback(async(e) => {
            e.preventDefault();

            setRegisterLoading(true);
            setRegisterError(null);
            const response = await postRequest(`${baseUrl}/users/register`, JSON.stringify(registerInfo))
            setRegisterLoading(false);

            // Handling Error
            if(response.error){
                return setRegisterError(response);
            }

            // If no error, log in the user
            localStorage.setItem("User", JSON.stringify(response));
            setUser(response);

        }, [registerInfo])

        const loginUser = useCallback(async(e)=>{

            e.preventDefault();
            setLoginLoading(true);
            setLoginError(null)

            const response = await postRequest(`${baseUrl}/users/login`, JSON.stringify(loginInfo))

            if(response.error){
                setLoginLoading(false);
                return setLoginError(response);
            }

            localStorage.setItem("User", JSON.stringify(response))
            setUser(response)

            setLoginLoading(false);
        }, [loginInfo]);

        const loguotUser = useCallback((e) => {
            setLoginInfo({ email: "", password: "" });
            localStorage.removeItem("User");
            setUser(null);
        }, [setLoginInfo, setUser]);

        return(
        <AuthContext.Provider value={{
            user, 
            registerInfo, 
            updateRegisterInfo, 
            registerUser, 
            registerError,
            isRegisterLoading,
            loguotUser,
            loginUser,
            loginError,
            loginInfo,
            updateLoginInfo,
            isLoginLoading
            }}>
                {children}
        </AuthContext.Provider>
        );
    };