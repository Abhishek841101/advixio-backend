import mongoose from "mongoose";
import "dotenv/config";

try {
  await mongoose.connect(process.env.MONGO_URI);

  const products = await mongoose.connection
    .collection("products")
    .find(
      { $or: [
        { normalizedName: { $exists: false } },
        { normalizedName: null }
      ] },
      { projection: { _id: 1, name: 1, normalizedName: 1, slug: 1 } }
    )
    .toArray();

  console.log(JSON.stringify(products, null, 2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
