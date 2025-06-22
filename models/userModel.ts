import mongoose, { Document, Schema, Model, model, models } from "mongoose";

const userSchema = new Schema(
 {
    username: {
        type: String,
        required: true,
        trim: true,
    },
    
 }
)