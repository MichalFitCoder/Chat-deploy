import { useEffect, useState } from "react";
import { baseUrl, getRequest } from "../utils/services";

export const useFetchRecipientUsers = (chat, user) =>{
    const [recipientUsers, setRecipientUsers] = useState([]);
    const [error, setError] = useState(null);
    
    const recipientIds = chat?.members?.filter((id) => id !== user?._id);

    useEffect(()=>{
        const getUser = async()=>{
            if(!recipientIds || recipientIds.length === 0) return null;

            try {
                // Fetching all recipient users one by one
                const userResponses = await Promise.all(
                    recipientIds.map(async (recipientId) => {
                        const response = await getRequest(`${baseUrl}/users/find/${recipientId}`);
                        if (response.error) {
                            throw new Error(`Error fetching user: ${response.error}`);
                        }
                        return response;
                    })
                );

                setRecipientUsers(userResponses);
            } catch (err) {
                setError(err.message || "Error fetching users");
            }

        }

        getUser();
    },[recipientIds]);

    return {recipientUsers, error, setRecipientUsers};
}