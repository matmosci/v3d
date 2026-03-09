import { defineMongooseModel } from '#nuxt/mongoose';
import mongoose from 'mongoose';
import crypto from 'crypto';

export const EntityLinkModel = defineMongooseModel({
    name: "EntityLink", 
    schema: {
        _id: { type: String, default: () => crypto.randomUUID() },
        user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' }, // Właściciel linka
        folder: { type: String, ref: 'Folder', default: null }, // Folder docelowy
        
        // Target info - zawsze entity z community
        targetEntityId: { type: String, required: true, ref: 'Entity' }, 
        targetOwner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Cache właściciela
        
        // Metadata (może być różna od oryginału)
        name: { type: String, required: true }, // Nazwa linka (może być customowa)
        description: { type: String, default: '' },
        tags: { type: [String], default: [] }, // Własne tagi
        
        // Cache info about target entity (for performance)
        cachedThumbnail: { type: String },
        lastVerified: { type: Date, default: Date.now },
        isValid: { type: Boolean, default: true }, // Czy target jeszcze istnieje
        
        deletedAt: { type: Date, default: null },
    },
    options: {
        timestamps: true
    }
});