import { defineMongooseModel } from '#nuxt/mongoose';
import mongoose from 'mongoose';
import crypto from 'crypto';

export const AssetModel = defineMongooseModel({
    name: "Asset",
    schema: {
        _id: { type: String, default: () => crypto.randomUUID() },
        user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' }, // Owner
        // Future: collaborators: [{ user: ObjectId, permissions: [String], joinedAt: Date }]
        folder: { type: String, ref: 'Folder', default: null }, // Parent folder, null for root
        originalname: { type: String, required: true },
        thumbnail: { type: String, required: false },
        size: { type: Number, required: true },
        deletedAt: { type: Date, default: null },
    },
    options: {
        timestamps: true
    }
});
