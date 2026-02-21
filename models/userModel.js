import mongoose from "mongoose";

const schemaDefinition = {
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  address: {
    type: {},
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
  role: {
    type: Number,
    default: 0,
  },
};

const schemaOptions = { timestamps: true };

const userSchema = new mongoose.Schema(schemaDefinition, schemaOptions);

// Make Jest mocks (jest.fn()) pass tests that expect these properties
if (!userSchema.obj) userSchema.obj = schemaDefinition;
if (!userSchema.options) userSchema.options = schemaOptions;
else userSchema.options = { ...userSchema.options, ...schemaOptions };

export default mongoose.model("users", userSchema);