import { defineMongooseModel } from '#nuxt/mongoose';
import mongoose from 'mongoose';

export const EntityModel = defineMongooseModel({
  name: "Entity",
  schema: {
    _id: { type: String, default: () => crypto.randomUUID() },
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    name: { type: String, required: true },
    description: { type: String, required: false },
    thumbnail: { type: String, required: false },
    camera: {
      position: {
        type: [Number],
        default: [0, 1.6, 5]
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
    deletedAt: { type: Date, default: null },
  },
  options: {
    timestamps: true
  },
});
