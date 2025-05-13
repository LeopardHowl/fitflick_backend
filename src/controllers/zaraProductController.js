import axios from "axios";
import Product from "../models/productModel.js";
import { ApiResponse } from "../utils/responseUtil.js";

export const zaraProductController = async (req, res) => {
  try {
    // Configure headers to mimic a browser request
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: "https://www.zara.com/my/en/",
      Origin: "https://www.zara.com",
      Connection: "keep-alive",
      "Cache-Control": "max-age=0",
    };

    const zaraCategories = [
      { key: "LINEN", value: "2418878" },
      { key: "DRESSES", value: "2420896" },
      { key: "TOPS", value: "2419940" },
      { key: "T-SHIRTS", value: "2420417" },
      { key: "JEANS", value: "2419185" },
      { key: "TROUSERS", value: "2420795" },
      { key: "SHORTS", value: "2420480" },
      { key: "SKIRTS", value: "2420285" },
      { key: "SHIRTS", value: "2420369" },
      { key: "CARDIGANS", value: "2419844" },
      { key: "WAISTCOATS", value: "2420506" },
      { key: "CO-ORD SETS", value: "2420285" },
      { key: "SWEATSHIRTS", value: "2467841" },
      { key: "BLAZERS", value: "2420942" },
      { key: "KNITWEAR", value: "2420306" },
      { key: "JACKETS", value: "2417772" },
      { key: "COATS", value: "2419032" },
    ];

    const createdProducts = [];

    for (const category of zaraCategories) {
      const response = await axios.get(
        `https://www.zara.com/my/en/category/${category.value}/products?ajax=true`,
        { headers }
      );

      const data = response.data;

      // Check if data and productGroups exist
      if (!data || !data.productGroups || !data.productGroups[0]) {
        console.log(`No products found for category: ${category.key}`);
        continue;
      }

      let elements = data.productGroups[0].elements;
      let products = [];

      elements.forEach((block) => {
        if (Array.isArray(block.commercialComponents)) {
          products.push(...block.commercialComponents);
        }
      });

      const wearProducts = products.filter((p) => p.kind === "Wear");

      console.log(
        `Found ${wearProducts.length} products in category ${category.key}`
      );

      for (const p of wearProducts) {
        try {
          let images = [];
          let colors = [];

          if (p.detail && p.detail.colors && Array.isArray(p.detail.colors)) {
            colors = extractColors(p.detail.colors);
            images = [];
            for (let i = 0; i < p.detail.colors.length; i++) {
              if (p.detail.colors[i].xmedia) {
                images.push(...extractImages(p.detail.colors[i].xmedia));
              }
            }
          }

          const sizes = extractSizes(p.detail);

          let price = p.price ? p.price / 100 : 0;
          let discountPrice = p.oldPrice ? p.oldPrice / 100 : null;

          if (discountPrice !== null && discountPrice > price) {
            discountPrice = null;
          }

          const product = await Product.create({
            name: p.name || "No Name",
            description: p.description || "",
            category: category.key,
            price,
            discountPrice,
            images,
            colors,
            sizes,
            rating: {
              average: 0,
              count: 0,
            },
            favoritesCount: 0,
            brand: "67e6c0ecb1ed8c770edb0a1a",
            isActive: true,
          });

          createdProducts.push(product);
        } catch (productError) {
          console.error(`Error creating product ${p.name}:`, productError);
        }
      }
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { count: createdProducts.length, products: createdProducts },
          "Products fetched and created successfully"
        )
      );
  } catch (error) {
    console.error("Error fetching Zara products:", error);

    if (error.response && error.response.status === 403) {
      return res
        .status(403)
        .json(
          new ApiResponse(
            403,
            null,
            "Access denied by Zara API. This might be due to IP blocking or anti-scraping measures."
          )
        );
    }

    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          null,
          `Failed to fetch Zara products: ${error.message || "Unknown error"}`
        )
      );
  }
};

function extractImages(xmediaArray) {
  // Check if xmediaArray exists and is an array
  if (!xmediaArray || !Array.isArray(xmediaArray) || xmediaArray.length === 0) {
    // Try to extract images from the color details if xmediaArray is empty
    return [];
  }

  // Create a Set to track unique URLs
  const uniqueUrls = new Set();

  // Map each xmedia item to your schema image object
  // Mark the first image as primary and filter duplicates
  return xmediaArray
    .map((media, index) => {
      const url = media.url ? media.url.replace("{width}", "800") : "";
      return {
        url,
        alt: media.extraInfo?.originalName || "",
        isPrimary: index === 0,
      };
    })
    .filter((img) => {
      if (img.url && !uniqueUrls.has(img.url)) {
        uniqueUrls.add(img.url);
        return true;
      }
      return false;
    }); // Filter out duplicates and images without URL
}
function extractColors(colorsArray) {
  if (!Array.isArray(colorsArray)) return [];

  const colorHexMap = {
    "Light blue": "#ADD8E6",
    MARSALA: "#964F4C",
    "Oyster - white": "#F0EAD6",
    "Oyster-white": "#F0EAD6",
    Brick: "#8B4513",
    camel: "#C19A6B",
    Burgundy: "#800020",
    Indigo: "#4B0082",
    Sand: "#F4A460",
    Black: "#000000",
    White: "#FFFFFF",
    Chocolate: "#7B3F00",
    Blue: "#0000FF",
    "Light camel": "#D4B59C",
    "Navy blue": "#000080",
    Ecru: "#C2B280",
    Brown: "#964B00",
    "Light yellow": "#FFFFE0",
    "Chocolate brown": "#7B3F00",
    Oil: "#3B3131",
    "Dark grey": "#A9A9A9",
    "DARK SALMON": "#E9967A",
    "Sand / Black": "#826644",
    "Anthracite Grey": "#383838",
    "Intense red": "#FF0000",
    "Sky blue": "#87CEEB",
    "Ecru / Green": "#90A955",
    "Red / Black": "#800000",
    Khaki: "#C3B091",
    "Mid-grey": "#808080",
    "Grey marl": "#B4B4B4",
    "Ecru / Maroon": "#8B4513",
    Green: "#008000",
    Caramel: "#C68E17",
    "Light green": "#90EE90",
    Grey: "#808080",
    Aubergine: "#472D47",
    Lilac: "#C8A2C8",
    Multicoloured: "#FFFFFF",
    "Ink blue": "#006994",
    striped: "#FFFFFF",
    Pistachio: "#93C572",
    "dark russet": "#7C4848",
    "Deep blue": "#000080",
    Wine: "#722F37",
    "Maroon Grey": "#8B4513",
    Yellow: "#FFFF00",
    Red: "#FF0000",
    "Light beige": "#F5F5DC",
    "Light indigo": "#6F00FF",
    Orange: "#FFA500",
    Bluish: "#0000FF",
    Terracotta: "#E2725B",
    Beige: "#F5F5DC",
    "Pastel pink": "#FFB6C1",
  };

  return colorsArray.map((color) => {
    const colorName = color.name || "Unknown";
    const hexCode = colorHexMap[colorName] || "#CCCCCC";

    return {
      name: colorName,
      hexCode: hexCode,
    };
  });
}
function extractSizes(detail) {
  // If we have actual size data, use it
  if (detail && detail.sizes && Array.isArray(detail.sizes)) {
    // Map the sizes to the expected format
    const validSizes = ["S", "M", "L", "XL", "XXL"];
    return detail.sizes
      .map((size) => size.name)
      .filter((size) => validSizes.includes(size));
  }

  // Fallback to default sizes
  return ["S", "M", "L", "XL", "XXL"];
}
