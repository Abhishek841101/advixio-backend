
import mongoose from "mongoose";

const enquirySchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    buyerName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    buyerPhone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },

    quantity: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },

    status: {
      type: String,
      enum: ["new", "contacted", "closed"],
      default: "new",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

enquirySchema.index({ supplier: 1, createdAt: -1 });

export default mongoose.models.Enquiry ||
  mongoose.model("Enquiry", enquirySchema);
