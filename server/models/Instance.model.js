import { defineMongooseModel } from '#nuxt/mongoose';
import mongoose from 'mongoose';

export const InstanceModel = defineMongooseModel({
  name: "Instance",
  schema: {
    _id: { type: String, default: () => crypto.randomUUID() },
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    entity: { type: String, required: true, ref: 'Entity' },
    sourceType: {
      type: String,
      enum: ["asset", "builtin", "custom"],
      default: "asset",
      required: true,
    },
    sourceId: { type: String, required: true },
    asset: { type: String, required: false, ref: 'Asset' },
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
