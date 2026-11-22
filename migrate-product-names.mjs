import mongoose from "mongoose";
import "dotenv/config";

try {
  await mongoose.connect(process.env.MONGO_URI);

  const products = mongoose.connection.collection("products");

  const result = await products.updateMany(
    {
      $or: [
        { normalizedName: { $exists: false } },
        { normalizedName: null }
      ],
      name: { $type: "string", $ne: "" }
    },
    [
      {
        $set: {
          normalizedName: {
            $toLower: {
              $trim: { input: "$name" }
            }
          }
        }
      }
    ]
  );

  console.log("Matched products:", result.matchedCount);
  console.log("Updated products:", result.modifiedCount);

  const missing = await products.countDocuments({
    $or: [
      { normalizedName: { $exists: false } },
      { normalizedName: null },
      { normalizedName: "" }
    ]
  });

  console.log("Still missing normalizedName:", missing);

  const duplicates = await products.aggregate([
    {
      $match: {
        normalizedName: { $type: "string", $ne: "" }
      }
    },
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
  console.error("Migration failed:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
