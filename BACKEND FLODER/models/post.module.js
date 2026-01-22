import mongoose, { Schema } from "mongoose";

const postSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            unique: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },
        description : {
            type: String,
            required: true,
            trim: true,
        },

        content: {
            type: String,
            required: true,

            age : Number,
            required : true,
            min : 1,
            max : 120
        },
    },
    { timestamps: true }
);
        
        export const posts = mongoose.model("Posts", postSchema);