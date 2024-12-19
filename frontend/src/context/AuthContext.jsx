    import  {createContext, useCallback, useContext, useEffect, useState} from "react";
    import { baseUrl, postRequest } from "../utils/services";
    import { generateKeyPair, exportPublicKey, importPublicKey ,exportPrivateKey} from "../security/keyManager";
    import { io } from "socket.io-client";
    import { ChatContext } from "./ChatContext";

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
            const user = sessionStorage.getItem("User");
            setUser(JSON.parse(user));
        },[]);


        const updateRegisterInfo = useCallback((info) =>{
            setRegisterInfo(info)   
        },[]);

        const updateLoginInfo = useCallback((info) =>{
            setLoginInfo(info)   
        },[]);
        
        // Generating pair of keys every session, and storing private key in the session storage
        const initializeSessionKeys = async () => {

            const keyPair = await generateKeyPair();
            const publicKey = await exportPublicKey(keyPair.publicKey);
            //const privateKey = await exportKey(keyPair.privateKey);
            const privateKey = await exportPrivateKey(keyPair.privateKey);

            // Saving encrypted private key in session storage
            sessionStorage.setItem("privateKey", JSON.stringify(privateKey));
            sessionStorage.setItem("publicKey", JSON.stringify(publicKey));

            return publicKey; 
        };


        const registerUser = useCallback(async(e) => {
            e.preventDefault();

            setRegisterLoading(true);
            setRegisterError(null);

            // Create Keys pair and return public key
            const exportedPublicKey = await initializeSessionKeys(); 

            // Adding public key to the registration data
            const updatedRegisterInfo = {
                ...registerInfo,
                publicKey: exportedPublicKey,
            };

            // Add New user data with session key to the database
            const response = await postRequest(`${baseUrl}/users/register`, JSON.stringify(updatedRegisterInfo))
            setRegisterLoading(false);

            // Handling Error
            if(response.error){
                return setRegisterError(response);
            }

            // If no error, log in the user
            sessionStorage.setItem("User", JSON.stringify(response));
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

            // If the user is authenticated generate new pair of keys for the session
            const exportedPublicKey = await initializeSessionKeys(); 

            // Adding public key to the user data
            const updatedUserInfo = {
                ...loginInfo,
                publicKey: exportedPublicKey,
                userId: response._id,
            };          

            const responseUpdate = await postRequest(`${baseUrl}/users/updateKey`, JSON.stringify(updatedUserInfo))

            if(responseUpdate.error){
                setLoginLoading(false);
                return setLoginError(responseUpdate);
            }
            
            sessionStorage.setItem("User", JSON.stringify(response))
            setUser(response)

            setLoginLoading(false);
        }, [loginInfo]);


        const logoutUser = useCallback(async(e) => {
            setLoginInfo({ email: "", password: "" });
            setUser(null);
            sessionStorage.clear();
            location.reload();

        }, [setLoginInfo, setUser]);

        return(
        <AuthContext.Provider value={{
            user, 
            registerInfo, 
            updateRegisterInfo, 
            registerUser, 
            registerError,
            isRegisterLoading,
            logoutUser,
            loginUser,
            loginError,
            loginInfo,
            updateLoginInfo,
            isLoginLoading,
            }}>
                {children}
        </AuthContext.Provider>
        );
    };