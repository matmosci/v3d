import { defineMongooseModel } from '#nuxt/mongoose';
import mongoose from 'mongoose';

export const FolderModel = defineMongooseModel({
    name: "Folder",
    schema: {
        _id: { type: String, default: () => crypto.randomUUID() },
        user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
        name: { type: String, required: true },
        parent: { type: String, ref: 'Folder', default: null }, // Parent folder ID, null for root
        color: { type: String, default: '#3b82f6' }, // Folder color for UI
        deletedAt: { type: Date, default: null },
    },
    options: {
        timestamps: true
    }
});