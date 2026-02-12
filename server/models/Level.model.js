import { defineMongooseModel } from '#nuxt/mongoose';
import mongoose from 'mongoose';

export const LevelModel = defineMongooseModel({
  name: "Level",
  schema: {
    _id: { type: String, default: () => crypto.randomUUID() },
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    name: { type: String, required: true },
    description: { type: String, required: false },
    camera: {
      matrix: {
        type: [Number],
        default: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1]
      },
    }
  },
  options: {
    timestamps: true
  },
});
