import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: {type:String, required:true},
    description: { type: String },
    photo:{type: String, default:''},
}, {timestamps:true});

export const User = mongoose.model('User', userSchema);