const userModel = require("../Models/userModel");
const bcrypt = require("bcrypt");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");


const algorithm = "aes-256-cbc";
const getSecretKey = () => {
    const secretKeyEnv = process.env.AES_EMAIL_SECRET_KEY;
    if (!secretKeyEnv) {
        throw new Error("AES_EMAIL_SECRET_KEY must be set in environment variables.");
    }
    const keyBuffer = Buffer.from(secretKeyEnv, 'hex');
    if (keyBuffer.length !== 32) {
        throw new Error("AES_EMAIL_SECRET_KEY must be a 32-byte hexadecimal string.");
    }
    return keyBuffer;
};

const encrypt = (data) => {
    try {
        const secretKey = getSecretKey();
        if (!secretKey || secretKey.length !== 32) {
            throw new Error('Invalid AES secret key');
        }

        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
        let encrypted = cipher.update(data, "utf8", "hex");
        encrypted += cipher.final("hex");
        return {
            iv: iv.toString("hex"),
            encryptedData: encrypted,
        };
    } catch (error) {
        console.error("Encryption error:", error);
        throw error;
    }
};

const hashEmail = (email) => {
    return crypto.createHash("sha256").update(email).digest("hex");
};

const decrypt = (hash) => {
    try {
        const secretKey = getSecretKey();
        const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(hash.iv, "hex"));
        const decrypted = Buffer.concat([
            decipher.update(Buffer.from(hash.encryptedData, "hex")),
            decipher.final(),
        ]);
        return decrypted.toString();
    } catch (error) {
        console.error("Decryption error:", error);
        throw error;
    }
};

const createToken = (user) => {
    const jwtkey = process.env.JWT_SECRET_KEY;
    if (!jwtkey) {
        throw new Error("JWT_SECRET_KEY is not defined in environment variables.");
    }
    return jwt.sign(
        { _id: user._id, name: user.name, email: user.email },
        jwtkey,
        { expiresIn: "30m" }
    );
};

const registerUser = async (req, res) => {
    try {
        const { name, email, password, publicKey} = req.body;

       
        if (!email || !name || !password)
            return res.status(400).json("All fields are required to create a new user");

        if (!validator.isEmail(email))
            return res.status(400).json("Email must be a valid email");

        if (!validator.isStrongPassword(password)) {
            return res.status(400).json(
                "Password must contain at least one upper case character, lowercase character, special character, and a number"
            );
        }

        // Making hash of the Email to avoid duplicated in the database.
        const emailHash = hashEmail(email);

        // Check if hashed email already exists
        const existingUser = await userModel.findOne({ emailHash });
        if (existingUser) {
            return res.status(400).json("User with this email already exists");
        }


        const { encryptedData: encryptedEmail, iv } = encrypt(email);
  
        const user = new userModel({
            name,
            email: { encryptedData: encryptedEmail, iv },
            emailHash,
            password,
            publicKey,
        });

        try {
            const salt = await bcrypt.genSalt(12);
            user.password = await bcrypt.hash(user.password, salt);
            if (!user.password) {
                throw new Error("Failed to hash password.");
            }
            // Saving created user in the database
            await user.save();

        } catch (saveError) {
         
            if (saveError.code === 11000) {
                return res.status(400).json("User with this email already exists");
            }
            throw saveError;
        }

        const token = createToken(user);
        return res.status(200).json({ _id: user._id, name, email, token });
    } catch (error) {
        console.error(error);
        return res.status(500).json("User exists");
    }
};



const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
     
        const users = await userModel.find();

        const matchedUser = users.find(user => {
            try {
                    
                if (!user.email || !user.email.encryptedData || !user.email.iv) {
                    console.log('Incomplete email data for user:', user._id);
                    return false;
                }
          
                const decryptedStoredEmail = decrypt({
                    encryptedData: user.email.encryptedData,
                    iv: user.email.iv
                });
             
                return decryptedStoredEmail === email;
            } catch (decryptError) {
                console.error(`Decryption error for user ${user._id}:`, decryptError);
                return false;
            }
        });

      
        if (!matchedUser) {
            console.log('No user found with matching email');
            return res.status(400).json("Invalid email or password");
        }


        const isValidPassword = await bcrypt.compare(password, matchedUser.password);
        if (!isValidPassword) {
            console.log('Invalid password');
            return res.status(400).json("Invalid email or password");
        }

        const decryptedStoredEmail = decrypt({
            encryptedData: matchedUser.email.encryptedData, 
            iv: matchedUser.email.iv
        });

        const token = createToken(matchedUser);
        return res.status(200).json({
            _id: matchedUser._id,
            name: matchedUser.name,
            email: decryptedStoredEmail,
            token,
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json("Login failed");
    }
};

const findUser = async (req, res) => {
    const userId = req.params.userId;
    try {
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json("User not found");
        }
        
     
        if (!user.email || !user.email.encryptedData || !user.email.iv) {
            return res.status(400).json("Incomplete user email data");
        }
        

        const decryptedEmail = decrypt({
            encryptedData: user.email.encryptedData,
            iv: user.email.iv
        });

        return res.status(200).json({
            _id: user._id,
            name: user.name,
            email: decryptedEmail
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json("Error finding user");
    }
};

const getUsers = async (req, res) => {
    try {
        const users = await userModel.find();
        
        const decryptedUsers = users.reduce((acc, user) => {
            try {
              
                if (user.email && user.email.encryptedData && user.email.iv) {
                    const decryptedEmail = decrypt({
                        encryptedData: user.email.encryptedData,
                        iv: user.email.iv
                    });
                    
                    acc.push({
                        _id: user._id,
                        name: user.name,
                        email: decryptedEmail
                    });
                } else {
                    console.warn(`User ${user._id} has incomplete email data`);
                }
            } catch (decryptError) {
                console.error(`Error decrypting email for user ${user._id}:`, decryptError);
            }
            return acc;
        }, []);

        return res.status(200).json(decryptedUsers);
    } catch (error) {
        console.error("Error in getUsers:", error);
        return res.status(500).json("Cannot retrieve users");
    }
};

const addPublicKey = async (req, res) => {
    try {
        // Getting the user ID from the request body
        const { userId, publicKey } = req.body;

        if (!userId || !publicKey) {
            return res.status(400).json("User ID and public key are required.");
        }

        // Find the user by their ID
        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(404).json("User not found.");
        }

        user.publicKey = publicKey;
        // Save the updated user data to the database
        await user.save();

        return res.status(200).json({ message: "Public key updated successfully." });
    } catch (error) {
        console.error("Error updating public key:", error);
        return res.status(500).json("Internal server error.");
    }
};

const getPublicKey = async (req, res) => {
    const userId = req.params.userId;
    try {
        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json({ publicKey: user.publicKey });
    } catch (error) {
        console.error("Error fetching public key", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


module.exports = { registerUser, loginUser, findUser, getUsers, addPublicKey, getPublicKey };