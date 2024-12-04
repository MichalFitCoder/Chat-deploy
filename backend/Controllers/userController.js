const userModel = require("../Models/userModel");
const bcrypt = require("bcrypt");
const validator = require("validator");
const jwt = require("jsonwebtoken");

const createToken = ({ _id, name, email, password }) => {
    const jwtkey = process.env.JWT_SECRET_KEY;

    return jwt.sign({ _id, name, email, password }, jwtkey, { expiresIn: "30m" });
};


const registerUser = async(req,res) =>{

    try
    {
        const {name, email, password} = req.body;

        // Serching users by email that is unique
        let user = await userModel.findOne({email});
        // If user already exists throw error
        if(user) 
            return res.status(400).json("User already exists");

        // Throw error if inputs are empty
        if(!email || !name || !password) 
            return  res.status(400).json("All fields are required to create a new user");

        // Using validator for validating email
        if(!validator.isEmail(email)) 
            return res.status(400).json("Email must be a valid email");

        // Using validator for validating password
        if(!validator.isStrongPassword(password)){
            return res.status(400).json("Password must contain at least one upper case character, \
            lowercase character, special character and a number");
        }

        // If everything is okay create a new user
        user = new userModel({name, email, password});

        // Hashing a password before sending it do database, 12 is highest cost with resonable generating time
        const salt  = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);

        await user.save();

        // Create a token for a user
        const token = createToken(user._id, user.name, user.email, user.password);

        // Sending to the frontend
        return res.status(200).json({_id: user._id, name, email, token});
    }
    catch(error){
        console.log(error)
        return res.status(500).json(error);
    }
};

const loginUser  = async(req,res) =>{
    try
    {
        const {email, password} = req.body;
        let user = await userModel.findOne({email});

        if(!user)
            return res.status(400).json("Invalid email or password");

        const isValidPassword = await bcrypt.compare(password, user.password);

        if(!isValidPassword) return res.status(400).json("Invalid email or password");

        // Create a token for a user
        const token = createToken(user._id, user.name, user.email, user.password);

        // Sending to the frontend
        return res.status(200).json({_id: user._id, name: user.name, email, token});


    }
    catch(error){
        console.log(error)
        return res.status(500).json(error);
    }
};

const findUser = async(req, res) => {

    const userId = req.params.userId;
    try{

        const user = await userModel.findById(userId)
        return res.status(200).json(user);

    }
    catch(error){
        console.log(error)
        return res.status(500).json(error);
    }
}

const getUsers = async(req, res) => {

    try{
        const users = await userModel.find();
        return res.status(200).json(users);
    }
    catch(error){
        console.log(error)
        return res.status(500).json(error);
    }
}


module.exports = {registerUser, loginUser, findUser, getUsers};