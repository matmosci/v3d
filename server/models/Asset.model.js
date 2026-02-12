import { defineMongooseModel } from '#nuxt/mongoose';
import mongoose from 'mongoose';
import crypto from 'crypto';

export const AssetModel = defineMongooseModel({
    name: "Asset",
    schema: {
        _id: { type: String, default: () => crypto.randomUUID() },
        user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
        originalname: { type: String, required: true },
        thumbnail: { type: String, required: false },
        size: { type: Number, required: true },
    },
    options: {
        timestamps: true
    }
});
