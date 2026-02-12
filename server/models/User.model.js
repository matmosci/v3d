import { defineMongooseModel } from '#nuxt/mongoose';

export const UserModel = defineMongooseModel({
    name: "User",
    schema: {
        email: { type: String, unique: true, minlength: [5, "Min 5 znaków"], maxlength: [64, "Max 64 znaki"], match: [/[^@ \t\r\n]+@[^@ \t\r\n]+\.[^@ \t\r\n]+/, "Niepoprawny format"] },
        access: { type: Number, default: 0 },
    },
    options: {
        timestamps: true
    },
    hooks(schema) {
        schema.pre("save", function () {
            this.email = this.email.trim().toLowerCase();
        });
    },
});
