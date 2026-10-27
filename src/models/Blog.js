
import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Blog title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },

    slug: {
      type: String,
      required: [true, "Blog slug is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },

    excerpt: {
      type: String,
      trim: true,
      maxlength: [500, "Excerpt cannot exceed 500 characters"],
      default: "",
    },

    content: {
      type: String,
      required: [true, "Blog content is required"],
    },

    category: {
      type: String,
      required: [true, "Blog category is required"],
      trim: true,
      maxlength: 100,
    },

    tags: {
      type: [String],
      default: [],
    },

    coverImage: {
      url: {
        type: String,
        default: "",
      },
      publicId: {
        type: String,
        default: "",
      },
    },

    images: [
      {
        url: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
          default: "",
        },
        alt: {
          type: String,
          default: "",
        },
      },
    ],

    video: {
      url: {
        type: String,
        default: "",
      },
      publicId: {
        type: String,
        default: "",
      },
      duration: {
        type: Number,
        default: 0,
      },
      format: {
        type: String,
        default: "",
      },
    },

    author: {
      type: String,
      trim: true,
      default: "Advixio Team",
      maxlength: 100,
    },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "published",
      index: true,
    },

    publishedAt: {
      type: Date,
      default: Date.now,
    },

    seo: {
      metaTitle: {
        type: String,
        trim: true,
        maxlength: 200,
        default: "",
      },
      metaDescription: {
        type: String,
        trim: true,
        maxlength: 320,
        default: "",
      },
      keywords: {
        type: [String],
        default: [],
      },
    },

    views: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

blogSchema.index({ status: 1, publishedAt: -1 });
blogSchema.index({ title: "text", excerpt: "text", content: "text" });

const Blog = mongoose.model("Blog", blogSchema);

export default Blog;
