import dotenv from "dotenv";
import mongoose from "mongoose";
import Category from "../models/Category.js";

dotenv.config();

const categories = [
  {
    name: "Industrial Machinery",
    slug: "industrial-machinery",
    description:
      "Industrial machines, production equipment and manufacturing solutions.",
  },
  {
    name: "Automobile & Auto Parts",
    slug: "automobile-auto-parts",
    description:
      "Vehicles, automotive components, spare parts and accessories.",
  },
  {
    name: "Electrical & Electronics",
    slug: "electrical-electronics",
    description:
      "Electrical equipment, electronic components, appliances and systems.",
  },
  {
    name: "Construction & Building Materials",
    slug: "construction-building-materials",
    description:
      "Construction materials, building products, equipment and solutions.",
  },
  {
    name: "Tools & Hardware",
    slug: "tools-hardware",
    description:
      "Hand tools, power tools, hardware and industrial accessories.",
  },
  {
    name: "Safety & Security",
    slug: "safety-security",
    description:
      "Personal protective equipment, workplace safety and security products.",
  },
  {
    name: "Agriculture & Farming",
    slug: "agriculture-farming",
    description:
      "Agricultural machinery, farming equipment, irrigation and farm supplies.",
  },
  {
    name: "Food Processing Machinery",
    slug: "food-processing-machinery",
    description:
      "Food processing, packaging and commercial kitchen machinery.",
  },
  {
    name: "Packaging & Printing",
    slug: "packaging-printing",
    description:
      "Packaging machines, packaging materials, printing equipment and supplies.",
  },
  {
    name: "Chemicals",
    slug: "chemicals",
    description:
      "Industrial chemicals, specialty chemicals and chemical raw materials.",
  },
  {
    name: "Pharmaceuticals & Medical",
    slug: "pharmaceuticals-medical",
    description:
      "Pharmaceutical products, medical equipment and healthcare supplies.",
  },
  {
    name: "Textiles & Garments",
    slug: "textiles-garments",
    description:
      "Textile machinery, fabrics, garments, yarns and textile accessories.",
  },
  {
    name: "Plastic & Rubber",
    slug: "plastic-rubber",
    description:
      "Plastic products, rubber products, raw materials and processing machinery.",
  },
  {
    name: "Metals & Metal Products",
    slug: "metals-metal-products",
    description:
      "Steel, aluminium, copper, metal products and metal processing solutions.",
  },
  {
    name: "Welding & Fabrication",
    slug: "welding-fabrication",
    description:
      "Welding machines, fabrication equipment, consumables and accessories.",
  },
  {
    name: "Pumps & Motors",
    slug: "pumps-motors",
    description:
      "Industrial pumps, motors, pumping systems and related equipment.",
  },
  {
    name: "Valves & Pipes",
    slug: "valves-pipes",
    description:
      "Industrial valves, pipes, fittings, flanges and piping systems.",
  },
  {
    name: "HVAC & Refrigeration",
    slug: "hvac-refrigeration",
    description:
      "Heating, ventilation, air conditioning and refrigeration equipment.",
  },
  {
    name: "Material Handling",
    slug: "material-handling",
    description:
      "Cranes, hoists, conveyors, forklifts and material handling equipment.",
  },
  {
    name: "Laboratory Equipment",
    slug: "laboratory-equipment",
    description:
      "Laboratory instruments, testing equipment and scientific supplies.",
  },
  {
    name: "Renewable Energy",
    slug: "renewable-energy",
    description:
      "Solar, wind, battery storage and renewable energy products.",
  },
  {
    name: "Batteries & Power Solutions",
    slug: "batteries-power-solutions",
    description:
      "Batteries, UPS systems, inverters, generators and power backup solutions.",
  },
  {
    name: "IT & Computer Hardware",
    slug: "it-computer-hardware",
    description:
      "Computers, networking equipment, servers, accessories and IT hardware.",
  },
  {
    name: "Telecommunication",
    slug: "telecommunication",
    description:
      "Telecommunication equipment, networking products and communication systems.",
  },
  {
    name: "Office Supplies & Equipment",
    slug: "office-supplies-equipment",
    description:
      "Office furniture, stationery, printers and workplace equipment.",
  },
  {
    name: "Furniture",
    slug: "furniture",
    description:
      "Office, industrial, commercial and residential furniture.",
  },
  {
    name: "Home Appliances",
    slug: "home-appliances",
    description:
      "Home appliances, kitchen appliances and consumer electrical products.",
  },
  {
    name: "Industrial Automation",
    slug: "industrial-automation",
    description:
      "Automation systems, PLCs, sensors, robotics and control equipment.",
  },
  {
    name: "Robotics",
    slug: "robotics",
    description:
      "Industrial robots, robotic systems, automation and robotic accessories.",
  },
  {
    name: "Instrumentation & Control",
    slug: "instrumentation-control",
    description:
      "Industrial instruments, measurement systems and process control equipment.",
  },
  {
    name: "Material & Handling Equipment",
    slug: "material-handling-equipment",
    description:
      "Industrial handling, lifting, storage and warehouse equipment.",
  },
  {
    name: "Cleaning & Maintenance",
    slug: "cleaning-maintenance",
    description:
      "Industrial cleaning machines, maintenance products and facility supplies.",
  },
  {
    name: "Water Treatment & Waste Management",
    slug: "water-treatment-waste-management",
    description:
      "Water treatment systems, filtration, wastewater and waste management equipment.",
  },
  {
    name: "Mining & Quarrying",
    slug: "mining-quarrying",
    description:
      "Mining machinery, quarrying equipment and mineral processing solutions.",
  },
  {
    name: "Petroleum & Oil Equipment",
    slug: "petroleum-oil-equipment",
    description:
      "Oil, gas, petroleum handling equipment and related industrial products.",
  },
  {
    name: "Renewable & Environmental Solutions",
    slug: "renewable-environmental-solutions",
    description:
      "Environmental technology, renewable energy and pollution control solutions.",
  },
  {
    name: "Woodworking Machinery",
    slug: "woodworking-machinery",
    description:
      "Wood cutting, processing, furniture and woodworking machinery.",
  },
  {
    name: "Glass & Ceramics",
    slug: "glass-ceramics",
    description:
      "Glass products, ceramic products, manufacturing equipment and supplies.",
  },
  {
    name: "Leather & Footwear",
    slug: "leather-footwear",
    description:
      "Leather products, footwear, machinery and manufacturing supplies.",
  },
  {
    name: "Paper & Pulp",
    slug: "paper-pulp",
    description:
      "Paper products, pulp, paper manufacturing machinery and supplies.",
  },
  {
    name: "Hospitality & Hotel Supplies",
    slug: "hospitality-hotel-supplies",
    description:
      "Hotel, restaurant, catering and hospitality equipment and supplies.",
  },
  {
    name: "Restaurant & Commercial Kitchen",
    slug: "restaurant-commercial-kitchen",
    description:
      "Commercial kitchen equipment, restaurant supplies and food service products.",
  },
  {
    name: "Medical & Hospital Equipment",
    slug: "medical-hospital-equipment",
    description:
      "Hospital equipment, medical devices, diagnostic equipment and healthcare supplies.",
  },
  {
    name: "Beauty & Personal Care",
    slug: "beauty-personal-care",
    description:
      "Beauty products, salon equipment, cosmetics and personal care supplies.",
  },
  {
    name: "Gems, Jewellery & Handicrafts",
    slug: "gems-jewellery-handicrafts",
    description:
      "Jewellery, gemstones, handicrafts, decorative products and artisan goods.",
  },
  {
    name: "Apparel & Fashion",
    slug: "apparel-fashion",
    description:
      "Clothing, fashion accessories, footwear and fashion products.",
  },
  {
    name: "Sports & Fitness",
    slug: "sports-fitness",
    description:
      "Sports equipment, gym equipment, fitness products and accessories.",
  },
  {
    name: "Toys & Games",
    slug: "toys-games",
    description:
      "Toys, games, educational products and recreational equipment.",
  },
  {
    name: "Electrical Cables & Wires",
    slug: "electrical-cables-wires",
    description:
      "Power cables, wires, control cables and electrical wiring products.",
  },
  {
    name: "Industrial Supplies",
    slug: "industrial-supplies",
    description:
      "General industrial consumables, components and manufacturing supplies.",
  },
];

const seedCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ MongoDB Connected");

    await Category.deleteMany({});

    const categoriesWithOrder = categories.map((category, index) => ({
      ...category,
      sortOrder: index + 1,
    }));

    await Category.insertMany(categoriesWithOrder);

    console.log(
      `✅ ${categoriesWithOrder.length} categories inserted successfully`
    );

    await mongoose.disconnect();

    console.log("🔌 MongoDB disconnected");

    process.exit(0);
  } catch (error) {
    console.error("❌ Category seed failed:", error);

    await mongoose.disconnect();

    process.exit(1);
  }
};

seedCategories();