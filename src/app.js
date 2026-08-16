import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Advixio API is running",
  });
});

// Category API
app.use("/api/categories", categoryRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);

export default app;