import { defineMongooseModel } from '#nuxt/mongoose';
import mongoose from 'mongoose';

export const InstanceModel = defineMongooseModel({
  name: "Instance",
  schema: {
    _id: { type: String, default: () => crypto.randomUUID() },
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    assetId: { type: String, required: true, ref: 'Asset' },
    sourceType: {
      type: String,
      enum: ["file", "builtin", "custom", "asset"],
      default: "file",
      required: true,
    },
    sourceId: { type: String, required: true },
    fileId: { type: String, required: false, ref: 'File' },
    position: {
      type: [Number],
      default: [0, 0, 0]
    },
    quaternion: {
      type: [Number],
      default: [0, 0, 0, 1]
    },
    scale: {
      type: [Number],
      default: [1, 1, 1]
    },
  },
  options: {
    timestamps: true
  },
});
