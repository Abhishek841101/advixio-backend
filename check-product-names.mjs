import mongoose from "mongoose";
import "dotenv/config";

try {
  await mongoose.connect(process.env.MONGO_URI);

  const c = mongoose.connection.collection("products");

  console.log(
    "Missing normalizedName:",
    await c.countDocuments({ normalizedName: { $exists: false } })
  );

  console.log(
    "Empty normalizedName:",
    await c.countDocuments({ normalizedName: "" })
  );

  const duplicates = await c.aggregate([
    { $match: { normalizedName: { $type: "string", $ne: "" } } },
    {
      $group: {
        _id: "$normalizedName",
        count: { $sum: 1 },
        ids: { $push: "$_id" }
      }
    },
    { $match: { count: { $gt: 1 } } }
  ]).toArray();

  console.log("Duplicate names:", JSON.stringify(duplicates, null, 2));
} catch (error) {
  console.error("Database check failed:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
