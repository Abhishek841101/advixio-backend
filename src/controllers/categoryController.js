import Category from "../models/Category.js";

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({
      isActive: true,
    }).sort({
      sortOrder: 1,
      name: 1,
    });

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    console.error("Get categories error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
};

export const getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const category = await Category.findOne({
      slug: slug.toLowerCase(),
      isActive: true,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Get category by slug error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch category",
    });
  }
};