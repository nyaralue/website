require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const Category = require('./models/Category');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://info_db_user:DtBE84LlLUD6yaEg@free.ltju6fx.mongodb.net/?appName=Free';

// Products data from CSV
const products = [
  {
    id: "TL_001",
    category: "table-lamp",
    name: "Crystal Cylinder Table Lamp",
    price: 722,
    description: "Tall Curve Crystal Table Lamp – USB Rechargeable Modern LED Décor Light\n\nEnhance any space with this luxury tall crystal-cut cylinder lamp, featuring a sleek acrylic design and warm ambient LED glow. The metallic base adds elegance and stability, while USB charging makes it convenient and energy-efficient for everyday use.\n\nKey Features:\n• Modern Cylinder Design: Tall, stylish crystal-cut acrylic body\n• Warm LED Light: Creates a cozy, decorative atmosphere\n• USB Rechargeable: Easy to charge and portable\n• Premium Build: Sturdy metallic base for long-lasting use\n• Multi-Purpose: Perfect for bedside, study table, office, and living room décor\n• Energy-Saving LED: Bright, long-life, low power consumption",
    sku: "TL_001",
    amazonLink: "https://amzn.to/4sR6p2g",
    meeshoLink: "https://www.meesho.com/dumble-crystal-lamp/p/atzvmw",
    flipkartLink: "",
    media: []
  },
  {
    id: "TL_002",
    category: "table-lamp",
    name: "Cone Touch Table Lamp",
    price: 519,
    description: "Minimalist Cone Table Lamp – Touch Control LED Light with 3 Color Modes (USB Rechargeable)\n\nThis modern minimalist cone lamp features a sleek aluminum body and warm, elegant lighting that suits any room. With 3 touch-controlled color modes (warm, white, neutral), it's perfect for bedrooms, bars, cafes, or desks. Cordless and rechargeable, it offers flexibility for any space.\n\nKey Features:\n• 3 Color Modes: Touch to switch between warm, white, and neutral light\n• Modern Design: Stylish cone shape with aluminum body\n• Portable & Cordless: USB rechargeable with built-in battery\n• Soft Ambient Light: Creates a cozy atmosphere anywhere\n• Non-Slip Base: Silicone bottom protects surfaces\n• Gift-Ready Packaging: Includes 1 lamp + USB cable in a premium box\n\nIdeal For: Bedrooms · Coffee tables · Dining areas · Study desks · Restaurants · Gift giving",
    sku: "TL_002",
    amazonLink: "https://amzn.to/4qs9Uub",
    meeshoLink: "https://www.meesho.com/dumble-crystal-lamp/p/atzvms",
    flipkartLink: "",
    media: []
  },
  {
    id: "TL_003",
    category: "table-lamp",
    name: "3D Crystal Diamond Multicolor Lamp",
    price: 356,
    description: "Crystal Multicolor LED Touch Table Lamp – USB Powered 3D Diamond Night Light\n\nA stylish 3D crystal-cut LED lamp that adds a sparkling, ambient glow to any room. USB-powered for continuous use, with touch and remote control for easy color and brightness adjustment. Perfect for bedrooms, décor accents, and gifting.\n\nKey Features:\n• USB powered (non-rechargeable)\n• 3D diamond-cut surface with prism lighting\n• Multicolor LED modes: static, flash, fade, smooth\n• Touch + remote control\n• Energy-efficient, bright, and decorative\n\nIdeal For: Bedside & mood lighting · Home décor & parties · Festivals & gifting · Cafés and desk setups\n\nSpecifications:\n• Material: Acrylic + ABS\n• Power: USB\n• Light Type: LED\n• Control: Touch & remote\n• Includes: Lamp, Remote, USB Cable",
    sku: "TL_003",
    amazonLink: "https://amzn.to/49sFTo9",
    meeshoLink: "https://www.meesho.com/crystal-cylinder-multicolor-lamp/p/as93pj?_ms=1.2",
    flipkartLink: "",
    media: []
  },
  {
    id: "TL_004",
    category: "table-lamp",
    name: "3D Crystal Diamond Golden Lamp",
    price: 286,
    description: "Crystal golden LED Touch Table Lamp – USB Powered 3D Diamond Night Light\n\nA stylish 3D crystal-cut LED lamp that adds a sparkling, ambient glow to any room. USB-powered for continuous use, with touch and remote control for easy color and brightness adjustment. Perfect for bedrooms, décor accents, and gifting.\n\nKey Features:\n• USB powered (non-rechargeable)\n• 3D diamond-cut surface with prism lighting\n• Multicolor LED modes: static, flash, fade, smooth\n• Touch + remote control\n• Energy-efficient, bright, and decorative\n\nIdeal For: Bedside & mood lighting · Home décor & parties · Festivals & gifting · Cafés and desk setups\n\nSpecifications:\n• Material: Acrylic + ABS\n• Power: USB\n• Light Type: LED\n• Control: Touch & remote\n• Includes: Lamp, Remote, USB Cable",
    sku: "TL_004",
    amazonLink: "https://amzn.to/45k5Eoh",
    meeshoLink: "https://www.meesho.com/dumble-crystal-lamp/p/atzvmr?_ms=1.2",
    flipkartLink: "",
    media: []
  },
  {
    id: "TL_005",
    category: "table-lamp",
    name: "Crystal Dumble Night Lamp",
    price: 227,
    description: "Crystal dumble shape Night Lamp – Soft Lighting, Eye-Safe, Battery-Operated Table Light (1 Pc)\n\nAdd a gentle glow to any space with this crystal-style night lamp, designed to provide soft, eye-friendly lighting for bedrooms, nurseries, studies, and more. The transparent crystal-like shade delivers a beautiful rhinestone shine while diffusing light evenly to protect your eyes.\n\nKey Features:\n• Wide Application: Ideal for bedrooms, children's rooms, hotels, cafés, and night-time reading\n• Battery Operated: Safe, portable, and energy-efficient—no electric shock risk\n• Crystal-Like Shine: Transparent shade spreads light beautifully like a real crystal\n• Soft, Eye-Protective Light: High light transmittance ensures gentle, non-glare illumination",
    sku: "TL_005",
    amazonLink: "https://amzn.to/4qRgb2k",
    meeshoLink: "https://www.meesho.com/dumble-crystal-lamp/p/atf0ru",
    flipkartLink: "",
    media: []
  },
  {
    id: "TL_006",
    category: "table-lamp",
    name: "Crystal Cup Night Lamp",
    price: 120,
    description: "Cup Shape Crystal Table Lamp – Modern LED Night Light for Home & Gifting (1 Pc)\n\nAdd a touch of elegance to any space with this Cup-Shaped Crystal LED Table Lamp, designed to create a sparkling, ambient glow. Made from high-quality, durable plastic, it's safe, lightweight, and ideal for bedrooms, living rooms, cafés, bars, and festive décor.\n\nKey Features:\n• Premium Build: Sturdy, wear-resistant plastic for long-lasting use\n• Crystal-Like Glow: Shines beautifully like a crystal when illuminated\n• Battery Powered: Safe for kids and convenient for indoor/outdoor use\n• Stable & Reliable: Resists dust and light water splashes\n• Perfect Gift: Great for birthdays, Valentine's Day, Christmas, Diwali, and more\n\nIdeal For: Bedrooms, living rooms, baby rooms, cafés, bars, restaurants, dorms, reading corners, and decorative home lighting.",
    sku: "TL_006",
    amazonLink: "https://amzn.to/49uhgaN",
    meeshoLink: "https://www.meesho.com/dumble-crystal-lamp/p/atzvmt",
    flipkartLink: "",
    media: []
  },
  {
    id: "TL_007",
    category: "table-lamp",
    name: "Flower Vase LED Lamp",
    price: 106,
    description: "Battery-Operated Flower Vase Table Lamp – Decorative Mood Light for Home & Diwali\n\nThis elegant vase-style table lamp doubles as a daytime décor piece and a cozy night light. Powered by alkaline batteries, it offers wireless convenience and easy portability. The soft glow enhances any room, while the included silk flowers and glass base add a decorative touch.\n\nKey Features:\n• Easy Operation: Simple ON/OFF switch on the base\n• Dual-Purpose Decor: Looks beautiful by day, becomes a mood lamp at night\n• Battery Powered: Wireless and portable for use anywhere\n• All-in-One Design: Vase + silk flowers + soft LED lighting\n• Perfect for Festive Use: Great for Diwali décor, gifting, and home ambiance",
    sku: "TL_007",
    amazonLink: "https://amzn.to/3Z5gpHD",
    meeshoLink: "https://www.meesho.com/dumble-crystal-lamp/p/atzvmv",
    flipkartLink: "",
    media: []
  },
  {
    id: "TL_008",
    category: "table-lamp",
    name: "Mini Crystal Night Lamp",
    price: 106,
    description: "Mini Crystal LED Table Lamp – Portable Decorative Light for Home, Parties & Diwali (1 Pc)\n\nAdd sparkle to any space with this portable crystal-style LED lamp, crafted from premium acrylic with a glossy, elegant finish. Its shimmering design catches the light beautifully, making it a perfect décor piece for bedrooms, restaurants, parties, and festive celebrations.\n\nKey Features:\n• High-Quality Build: Made from premium acrylic/plastic with a crystal-like shine\n• Eye-Catching Design: Adds glamour, elegance, and a luxurious glow to any setting\n• Battery Powered: Portable and easy to place anywhere without wiring\n• Multi-Purpose Use: Ideal for parties, weddings, birthdays, Diwali décor, home décor, tables, and events\n• Golden LED Light: Soft warm glow perfect for ambience and display\n\nPerfect For: Bedroom · Living Room · Restaurants · Office · Outdoor décor · Festival gifting · New Year & Diwali decoration",
    sku: "TL_008",
    amazonLink: "https://amzn.to/461jOe6",
    meeshoLink: "",
    flipkartLink: "",
    media: []
  },
  {
    id: "TL_009",
    category: "table-lamp",
    name: "Flexible LED Desk Lamp",
    price: 555,
    description: "Cute Lovely LED Desk Light – Portable, USB Rechargeable, Flexible Neck (1 Pc)\n\nBrighten your workspace with this eye-care LED desk lamp, designed with soft, uniform lighting that reduces glare and visual fatigue. Its flexible neck, lightweight design, and simple button control make it perfect for reading, studying, and bedtime use.\n\nKey Features:\n• Eye-Protection Light: Soft, non-dazzling illumination to reduce strain\n• Flexible Neck: Easily adjust the angle for reading or relaxation\n• USB Rechargeable: Charge via laptop, power bank, or phone adapter\n• Soft Diffuser Lens: Wider, gentle light spread with no flicker\n• Energy-Saving LED: Low power use with high brightness",
    sku: "TL_009",
    amazonLink: "https://amzn.to/4pLvMjc",
    meeshoLink: "https://www.meesho.com/cute-kids-study-lamp/p/atf0rv",
    flipkartLink: "",
    media: []
  },
  {
    id: "TL_010",
    category: "table-lamp",
    name: "Tulip Cube Night Lamp",
    price: 319,
    description: "Cube Tulip Night Lamp – LED Decorative Flower Light with Mirror (1 Set, Multicolor/Design)\n\nAdd charm to any room with this 2-in-1 Tulip Night Lamp, which functions as a high-definition mirror when off and reveals a glowing bouquet of tulips when lit. The realistic flowers and soft LED lighting create a romantic, elegant ambiance perfect for bedrooms, dressing tables, or gifting.\n\nKey Features:\n• 2-in-1 Mirror + Lamp: Acts as a clear mirror when off; opens to reveal a glowing tulip display\n• Romantic Tulip Light: Soft LED with realistic tulip and leaf design for cozy mood lighting\n• Handmade DIY Design: Arrange the tulips yourself to create a personalized decorative lamp\n• Quality Build: Durable plastic, glass, and lifelike flowers for long-lasting use\n• Perfect Gift: Ideal for women, girls, moms, girlfriends—great for birthdays, Mother's Day, Christmas, etc.\n\nNote: This item requires simple DIY assembly. Please follow the installation video for best results.",
    sku: "TL_010",
    amazonLink: "https://amzn.to/4pGTeOt",
    meeshoLink: "https://www.meesho.com/tulip-cube-lamp/p/atzv5t?_ms=1.2",
    flipkartLink: "",
    media: []
  },
  {
    id: "TL_011",
    category: "table-lamp",
    name: "3-in-1 LED Desk Lamp",
    price: 635,
    description: "3-in-1 LED Lamp with Humidifier & Mosquito Repellent – USB Powered Multifunction Night Light\n\nThis compact 3-in-1 LED Lamp combines a humidifier, mosquito repellent, and soft night light in one stylish crescent-shaped design. It releases a fine mist to improve air moisture, helps keep mosquitoes away, and provides gentle LED lighting—perfect for bedrooms, offices, and study spaces.\n\nKey Features:\n• 3-in-1 Function: Humidifier + mosquito repellent + LED night lamp\n• Fine Mist Output: Helps relieve dryness and improves air comfort\n• Mosquito Protection: Supports a peaceful, bite-free sleep\n• Soft Ambient Light: Ideal for bedtime or mood lighting\n• Modern Design: Crescent frame with clear spherical water tank\n• USB Powered: Works with adapters, laptops, power banks\n• Silent Operation: Suitable for baby rooms and quiet environments\n\nIdeal For: Bedroom & nursery air hydration · Desk use in offices or study areas · Living room décor with light + insect protection · Gifting for home & wellness lovers",
    sku: "TL_011",
    amazonLink: "https://amzn.to/4qXb2G5",
    meeshoLink: "https://meesho.com/mosquitohumidifier-lamp/p/au00wt?_ms=1.2",
    flipkartLink: "",
    media: []
  },
  {
    id: "GL_001_S",
    category: "garden-lights",
    name: "Metal black golden Spiral Pendant light (Set of 1)",
    price: 661,
    description: "Contemporary Spiral Pendant Light – This unique spiral-shaped metal hanging lamp features flowing curves with decorative cut detailing and a luxurious golden green finish.\n\nKey Features:\n• Dynamic Light & Shadow Effect: The spiral structure allows light to create dramatic patterns, adding movement and artistic flair to your space\n• Single Bulb Illumination: Designed to provide focused lighting while serving as a statement décor piece\n• Adjustable Ceiling Suspension: Includes mounting hardware and an adjustable cord to suit different ceiling heights\n• Wide Application: Ideal for living rooms, dining spaces, bedrooms, balconies, offices, cafés, restaurants, and designer interiors\n\nDimensions: Shade size approx. 15 cm; adjustable hanging cord up to 85 cm\nColor Variants: bulb - golden, blue, green, red, pink",
    sku: "GL_001_S",
    amazonLink: "https://amzn.to/4qzjFXQ",
    meeshoLink: "https://meesho.com/geometric--teardrop-pendant/p/b4ugg3?_ms=1.2",
    flipkartLink: "https://www.flipkart.com/nyara-luxe-metal-black-golden-hanging-modern-style-chandelier-pendant-lights-ceiling-lamp/p/itm782febee9a0b7?pid=CILHJU7YXFMFVHSF&lid=LSTCILHJU7YXFMFVHSFHULJDO&marketplace=FLIPKART&sattr[]=color&sattr[]=dimension&st=color",
    media: []
  },
  {
    id: "GL_001_S_3pc",
    category: "garden-lights",
    name: "Metal black golden Spiral Pendant light (Set of 3)",
    price: 1983,
    description: "Contemporary Spiral Pendant Light – This unique spiral-shaped metal hanging lamp features flowing curves with decorative cut detailing and a luxurious golden green finish.\n\nKey Features:\n• Dynamic Light & Shadow Effect: The spiral structure allows light to create dramatic patterns, adding movement and artistic flair to your space\n• Single Bulb Illumination: Designed to provide focused lighting while serving as a statement décor piece\n• Adjustable Ceiling Suspension: Includes mounting hardware and an adjustable cord to suit different ceiling heights\n• Wide Application: Ideal for living rooms, dining spaces, bedrooms, balconies, offices, cafés, restaurants, and designer interiors\n\nDimensions: Shade size approx. 15 cm; adjustable hanging cord up to 85 cm\nColor Variants: bulb - golden, blue, green, red, pink",
    sku: "GL_001_S_3pc",
    amazonLink: "https://amzn.to/4qCAh0H",
    meeshoLink: "",
    flipkartLink: "https://www.flipkart.com/nyara-luxe-metal-black-golden-hanging-modern-style-chandelier-pendant-lights-ceiling-lamp/p/itmf0afb07a5570e?pid=CILHJX4YC5PPYUGF",
    media: []
  },
  {
    id: "GL_001_R",
    category: "garden-lights",
    name: "Metal black golden Rectangular Pendant light (Set of 1)",
    price: 661,
    description: "Geometric Cuboidal Pendant Light – Crafted in a bold rectangular metal frame with a grass-inspired cutwork design, this golden green pendant light delivers a modern architectural appeal.\n\nKey Features:\n• Ambient Decorative Lighting: The open metal pattern casts striking shadow effects, enhancing visual depth and atmosphere in your space\n• Single Lamp Lighting Fixture: Provides directed illumination while acting as a stylish décor centerpiece\n• Custom Height Installation: Includes ceiling mounting hardware and an adjustable suspension cord for flexible installation\n• Versatile Usage: Suitable for dining rooms, living spaces, bedrooms, balconies, offices, cafés, restaurants, and designer interiors\n\nDimensions: Shade width approx. 15 cm; hanging cord length adjustable up to 85 cm\nColor Variants: bulb - golden, blue, green, red, pink",
    sku: "GL_001_R",
    amazonLink: "https://amzn.to/3LPXkGc",
    meeshoLink: "https://meesho.com/black-golden-metal-hanging-light/p/b4ugej?_ms=1.2",
    flipkartLink: "https://www.flipkart.com/nyara-luxe-metal-black-golden-hanging-modern-style-chandelier-pendant-lights-ceiling-lamp/p/itm9280f11b79bc2?pid=CILHJU89KAW5GAU9",
    media: []
  },
  {
    id: "GL_001_R_3pc",
    category: "garden-lights",
    name: "Metal black golden Rectangular Pendant light (Set of 3)",
    price: 1983,
    description: "Geometric Cuboidal Pendant Light – Crafted in a bold rectangular metal frame with a grass-inspired cutwork design, this golden green pendant light delivers a modern architectural appeal.\n\nKey Features:\n• Ambient Decorative Lighting: The open metal pattern casts striking shadow effects, enhancing visual depth and atmosphere in your space\n• Single Lamp Lighting Fixture: Provides directed illumination while acting as a stylish décor centerpiece\n• Custom Height Installation: Includes ceiling mounting hardware and an adjustable suspension cord for flexible installation\n• Versatile Usage: Suitable for dining rooms, living spaces, bedrooms, balconies, offices, cafés, restaurants, and designer interiors\n\nDimensions: Shade width approx. 15 cm; hanging cord length adjustable up to 85 cm\nColor Variants: bulb - golden, blue, green, red, pink",
    sku: "GL_001_R_3pc",
    amazonLink: "https://amzn.to/4pH2Fxz",
    meeshoLink: "",
    flipkartLink: "https://www.flipkart.com/nyara-luxe-metal-black-golden-hanging-modern-style-chandelier-pendant-lights-ceiling-lamp/p/itm0facdd33cd77d?pid=CILHJX5KZPZEXBSF",
    media: []
  },
  {
    id: "GL_001_C",
    category: "garden-lights",
    name: "Metal black golden Cylindrical Pendant light (Set of 1)",
    price: 661,
    description: "Modern Cylindrical Pendant Design – This elegant metal hanging light features a sleek cylindrical silhouette with a nature-inspired cut pattern and a rich golden green finish, adding a refined contemporary touch to any space.\n\nKey Features:\n• Decorative Light & Shadow Play: The precision-cut metal shade allows light to diffuse beautifully, creating artistic shadow patterns and a warm ambient glow\n• Focused Single-Light Illumination: Designed with a single lamp holder, this pendant provides balanced lighting ideal for accent and mood illumination\n• Adjustable Ceiling Mount: Comes with complete ceiling mounting accessories and an adjustable hanging cord for customized height placement\n• Ideal for Multiple Settings: Perfect for balconies, gardens, dining areas, living rooms, bedrooms, offices, cafés, and restaurants\n\nDimensions: Shade diameter 15 cm; adjustable cord length up to 85 cm\nColor Variants: bulb - golden, blue, green, red, pink",
    sku: "GL_001_C",
    amazonLink: "https://amzn.to/4sL0Jqt",
    meeshoLink: "https://meesho.com/black-golden-metal-hanging-light/p/b4ugey?_ms=1.2",
    flipkartLink: "https://www.flipkart.com/nyara-luxe-metal-black-golden-hanging-modern-style-chandelier-pendant-lights-ceiling-lamp/p/itm4299ca998be1b?pid=CILHJU8GUMVDPZBH&lid=LSTCILHJU8GUMVDPZBH6VH2BC&marketplace=FLIPKART&sattr[]=color&sattr[]=dimension&st=color",
    media: []
  },
  {
    id: "GL_001_C_3pc",
    category: "garden-lights",
    name: "Metal black golden Cylindrical Pendant light (Set of 3)",
    price: 1983,
    description: "Modern Cylindrical Pendant Design – This elegant metal hanging light features a sleek cylindrical silhouette with a nature-inspired cut pattern and a rich golden green finish, adding a refined contemporary touch to any space.\n\nKey Features:\n• Decorative Light & Shadow Play: The precision-cut metal shade allows light to diffuse beautifully, creating artistic shadow patterns and a warm ambient glow\n• Focused Single-Light Illumination: Designed with a single lamp holder, this pendant provides balanced lighting ideal for accent and mood illumination\n• Adjustable Ceiling Mount: Comes with complete ceiling mounting accessories and an adjustable hanging cord for customized height placement\n• Ideal for Multiple Settings: Perfect for balconies, gardens, dining areas, living rooms, bedrooms, offices, cafés, and restaurants\n\nDimensions: Shade diameter 15 cm; adjustable cord length up to 85 cm\nColor Variants: bulb - golden, blue, green, red, pink",
    sku: "GL_001_C_3pc",
    amazonLink: "https://amzn.to/3NRRAw4",
    meeshoLink: "",
    flipkartLink: "https://www.flipkart.com/nyara-luxe-metal-black-golden-hanging-modern-style-chandelier-pendant-lights-ceiling-lamp/p/itme48e9b9c4f6ed?pid=CILHJX5UPPGG9SP7",
    media: []
  },
  {
    id: "GL_001_H",
    category: "garden-lights",
    name: "Metal black golden Hexagon Pendant light (Set of 1)",
    price: 661,
    description: "Stylish Hexagon Pendant Lamp – Designed with a modern hexagonal metal frame and nature-inspired cut detailing, finished in an elegant golden green tone for a premium look.\n\nKey Features:\n• Artistic Lighting Effect: The geometric open-cut design allows light to flow freely, creating eye-catching shadow patterns and a cozy ambience\n• Single Light Source Design: Ideal for focused lighting while enhancing the decorative appeal of the room\n• Height Adjustable Hanging System: Supplied with ceiling mount accessories and a customizable hanging cord for perfect placement\n• Perfect for Various Spaces: Enhances dining areas, living rooms, bedrooms, balconies, gardens, cafés, and restaurants\n\nDimensions: Approx. 15 cm diameter; adjustable cord length up to 85 cm\nColor Variants: bulb - golden, blue, green, red, pink",
    sku: "GL_001_H",
    amazonLink: "https://amzn.to/4jJKN3L",
    meeshoLink: "",
    flipkartLink: "https://www.flipkart.com/nyara-luxe-metal-black-golden-hanging-modern-style-chandelier-pendant-lights-ceiling-lamp/p/itm2f38733b6dd65?pid=CILHJU8SGJVYMD8V",
    media: []
  },
  {
    id: "GL_001_H_3pc",
    category: "garden-lights",
    name: "Metal black golden Hexagon Pendant light (Set of 3)",
    price: 1983,
    description: "Stylish Hexagon Pendant Lamp – Designed with a modern hexagonal metal frame and nature-inspired cut detailing, finished in an elegant golden green tone for a premium look.\n\nKey Features:\n• Artistic Lighting Effect: The geometric open-cut design allows light to flow freely, creating eye-catching shadow patterns and a cozy ambience\n• Single Light Source Design: Ideal for focused lighting while enhancing the decorative appeal of the room\n• Height Adjustable Hanging System: Supplied with ceiling mount accessories and a customizable hanging cord for perfect placement\n• Perfect for Various Spaces: Enhances dining areas, living rooms, bedrooms, balconies, gardens, cafés, and restaurants\n\nDimensions: Approx. 15 cm diameter; adjustable cord length up to 85 cm\nColor Variants: bulb - golden, blue, green, red, pink",
    sku: "GL_001_H_3pc",
    amazonLink: "https://amzn.to/4jMBgIX",
    meeshoLink: "",
    flipkartLink: "https://www.flipkart.com/nyara-luxe-metal-black-golden-hanging-modern-style-chandelier-pendant-lights-ceiling-lamp/p/itm62df591f82344?pid=CILHJX5BQ9NQDPSU",
    media: []
  },
  {
    id: "GL_002",
    category: "garden-lights",
    name: "Golden Grass Ceiling Chandelier",
    price: 543,
    description: "Artistic Pendant Light Design – This decorative metal hanging lamp showcases a nature-inspired grass pattern with a refined golden green finish, adding elegance and visual interest to any interior or semi-outdoor space.\n\nKey Features:\n• Decorative Light & Shadow Effect: The intricately cut metal shade allows light to project stunning shadow patterns, creating a warm, inviting, and artistic ambience\n• Single Light Source Fixture: Designed to hold one bulb, this pendant lamp delivers focused illumination while enhancing the décor appeal of your space\n• Adjustable Hanging Installation: Includes ceiling mounting accessories and a height-adjustable cord, allowing you to customize the drop length to suit different ceiling heights and layouts\n• Ideal for Multiple Spaces: Suitable for gardens, balconies, dining rooms, living areas, bedrooms, offices, cafés, and restaurants\n\nDimensions: Lamp shade diameter 20 cm; adjustable hanging cord length up to 85 cm\nColor Variants: bulb - golden, blue, green, red, pink",
    sku: "GL_002",
    amazonLink: "https://amzn.to/3NmXPrP",
    meeshoLink: "https://meesho.com/golden-green-grass-ceiling-light/p/b4ugeo?_ms=1.2",
    flipkartLink: "",
    media: []
  },
  {
    id: "GL_003",
    category: "garden-lights",
    name: "Large Balloon Pattern Pendant Light",
    price: 873,
    description: "Teardrop big Pendant Light – Designed with a stylish black metal frame and precision cutwork, this hanging light adds a modern, minimalist appeal to any interior décor.\n\nKey Features:\n• Soft Ambient Glow: The geometric open-metal pattern allows light to flow beautifully, creating a warm and artistic lighting effect that elevates the atmosphere of your space\n• Premium Metal Construction: Made from high-quality metal with a smooth matte black coating, ensuring durability, corrosion resistance, and long-term performance\n• Multi-Purpose Hanging Light: Ideal for living rooms, dining spaces, kitchen islands, bedrooms, balconies, corridors, cafés, restaurants, bars, and commercial interiors\n• E27 Bulb Compatibility: Equipped with a standard E27 lamp holder; supports LED, CFL, and incandescent bulbs (bulb included) for flexible lighting options\n\nColor Variants: bulb - golden, blue, green, red, pink",
    sku: "GL_003",
    amazonLink: "https://amzn.to/4qZAwm7",
    meeshoLink: "",
    flipkartLink: "https://www.flipkart.com/nyara-luxe-balloon-shape-hanging-small-laser-cut-patterns-chandelier-ceiling-lamp/p/itmab9838380d60d?pid=CILHJX6NBED9KS88",
    media: []
  },
  {
    id: "GL_003_3pc",
    category: "garden-lights",
    name: "Large Balloon Pattern Pendant Light (Set of 3)",
    price: 2619,
    description: "Teardrop big Pendant Light – Designed with a stylish black metal frame and precision cutwork, this hanging light adds a modern, minimalist appeal to any interior décor.\n\nKey Features:\n• Soft Ambient Glow: The geometric open-metal pattern allows light to flow beautifully, creating a warm and artistic lighting effect that elevates the atmosphere of your space\n• Premium Metal Construction: Made from high-quality metal with a smooth matte black coating, ensuring durability, corrosion resistance, and long-term performance\n• Multi-Purpose Hanging Light: Ideal for living rooms, dining spaces, kitchen islands, bedrooms, balconies, corridors, cafés, restaurants, bars, and commercial interiors\n• E27 Bulb Compatibility: Equipped with a standard E27 lamp holder; supports LED, CFL, and incandescent bulbs (bulb included) for flexible lighting options\n\nColor Variants: bulb - golden, blue, green, red, pink",
    sku: "GL_003_3pc",
    amazonLink: "https://amzn.to/49sGciN",
    meeshoLink: "",
    flipkartLink: "https://www.flipkart.com/nyara-luxe-balloon-shape-hanging-small-laser-cut-patterns-chandelier-ceiling-lamp/p/itmddf8d28503b82?pid=CILHJX6NNC9XBENP&lid=LSTCILHJX6NNC9XBENPJQCZ0F&marketplace=FLIPKART&sattr[]=number_of_bulbs&sattr[]=color&sattr[]=dimension&sattr[]=number_of_contents_in_sales_package&st=color",
    media: []
  },
  {
    id: "GL_004",
    category: "garden-lights",
    name: "Light Balloon Pattern Pendant",
    price: 732,
    description: "Contemporary Teardrop Pendant Light – Designed with a stylish black metal frame and precision hexagon cutwork, this hanging light adds a modern, minimalist appeal to any interior décor.\n\nKey Features:\n• Soft Ambient Glow: The geometric open-metal pattern allows light to flow beautifully, creating a warm and artistic lighting effect that elevates the atmosphere of your space\n• Premium Metal Construction: Made from high-quality metal with a smooth matte black coating, ensuring durability, corrosion resistance, and long-term performance\n• Multi-Purpose Hanging Light: Ideal for living rooms, dining spaces, kitchen islands, bedrooms, balconies, corridors, cafés, restaurants, bars, and commercial interiors\n• E27 Bulb Compatibility: Equipped with a standard E27 lamp holder; supports LED, CFL, and incandescent bulbs (bulb included) for flexible lighting options\n\nColor Variants: bulb - golden, blue, green, red, pink",
    sku: "GL_004",
    amazonLink: "https://amzn.to/3LSZg0y",
    meeshoLink: "",
    flipkartLink: "https://www.flipkart.com/nyara-luxe-metal-light-balloon-shape-hanging-laser-cut-pattern-chandelier-ceiling-lamp/p/itmc082e58c8caf3?pid=CILHJX76AVGTFJAE",
    media: []
  },
  {
    id: "GL_004_3pc",
    category: "garden-lights",
    name: "Light Balloon Pattern Pendant (Set of 3)",
    price: 2196,
    description: "Contemporary Teardrop Pendant Light – Designed with a stylish black metal frame and precision hexagon cutwork, this hanging light adds a modern, minimalist appeal to any interior décor.\n\nKey Features:\n• Soft Ambient Glow: The geometric open-metal pattern allows light to flow beautifully, creating a warm and artistic lighting effect that elevates the atmosphere of your space\n• Premium Metal Construction: Made from high-quality metal with a smooth matte black coating, ensuring durability, corrosion resistance, and long-term performance\n• Multi-Purpose Hanging Light: Ideal for living rooms, dining spaces, kitchen islands, bedrooms, balconies, corridors, cafés, restaurants, bars, and commercial interiors\n• E27 Bulb Compatibility: Equipped with a standard E27 lamp holder; supports LED, CFL, and incandescent bulbs (bulb included) for flexible lighting options\n\nColor Variants: bulb - golden, blue, green, red, pink",
    sku: "GL_004_3pc",
    amazonLink: "https://amzn.to/4r1spWp",
    meeshoLink: "",
    flipkartLink: "https://www.flipkart.com/nyara-luxe-metal-light-balloon-shape-hanging-laser-cut-pattern-chandelier-ceiling-lamp/p/itm863933830d687?pid=CILHJX76Z6CZV4WN",
    media: []
  },
  {
    id: "GL_005",
    category: "garden-lights",
    name: "Wooden Pendant Light with Frosted Glass",
    price: 755,
    description: "Modern Wood & Glass Pendant Design – This stylish hanging ceiling light features a frosted cylindrical glass shade enclosed within a beautifully crafted wooden frame, blending natural warmth with modern elegance.\n\nKey Features:\n• Soft & Comfortable Illumination: The frosted glass diffuser provides even, glare-free lighting, creating a cozy and welcoming ambience for both residential and commercial interiors\n• Premium Material Construction: Made with a sturdy wooden outer structure and high-quality glass shade, offering durability, visual appeal, and long-lasting performance\n• Adjustable Hanging Installation: Comes with ceiling mounting hardware and an adjustable suspension cord, allowing you to set the height according to your space and ceiling level\n• Versatile Indoor Lighting Solution: Ideal for living rooms, dining areas, bedrooms, kitchen islands, hallways, cafés, restaurants, hotels, and modern home décor setups\n• Bulb Compatibility: Supports standard E27 bulbs (LED / CFL / incandescent). LED Bulb is included",
    sku: "GL_005",
    amazonLink: "https://amzn.to/3LA4ZZc",
    meeshoLink: "https://meesho.com/nyara-luxe-modern-wooden-pendant-light-with-frosted-glass-shade--cylindrical-hanging-ceiling-lamp-with-decorative-wood-frame--adjustable-cord-indoor-hanging-light-for-living-room-dining-area-bedroom-cafe-restaurant-home-decor--holder-and-led-bulb-included/p/b4hs43?_ms=1.2",
    flipkartLink: "https://www.flipkart.com/nyara-luxe-modern-wooden-pendant-light-frosted-glass-shade-chandelier-ceiling-lamp/p/itm8746408dba359?pid=CILHJX7DZKMZPB52&lid=LSTCILHJX7DZKMZPB52CW3LQO&marketplace=FLIPKART&sattr[]=number_of_bulbs&sattr[]=dimension&sattr[]=number_of_contents_in_sales_package&st=number_of_contents_in_sales_package",
    media: []
  },
  {
    id: "GL_005_3pc",
    category: "garden-lights",
    name: "Wooden Pendant Light with Frosted Glass (Set of 3)",
    price: 2265,
    description: "Modern Wood & Glass Pendant Design – This stylish hanging ceiling light features a frosted cylindrical glass shade enclosed within a beautifully crafted wooden frame, blending natural warmth with modern elegance.\n\nKey Features:\n• Soft & Comfortable Illumination: The frosted glass diffuser provides even, glare-free lighting, creating a cozy and welcoming ambience for both residential and commercial interiors\n• Premium Material Construction: Made with a sturdy wooden outer structure and high-quality glass shade, offering durability, visual appeal, and long-lasting performance\n• Adjustable Hanging Installation: Comes with ceiling mounting hardware and an adjustable suspension cord, allowing you to set the height according to your space and ceiling level\n• Versatile Indoor Lighting Solution: Ideal for living rooms, dining areas, bedrooms, kitchen islands, hallways, cafés, restaurants, hotels, and modern home décor setups\n• Bulb Compatibility: Supports standard E27 bulbs (LED / CFL / incandescent). LED Bulb is included",
    sku: "GL_005_3pc",
    amazonLink: "https://amzn.to/4pOHqdh",
    meeshoLink: "",
    flipkartLink: "https://www.flipkart.com/nyara-luxe-modern-wooden-pendant-light-frosted-glass-shade-chandelier-ceiling-lamp/p/itmf2517863888c1?pid=CILHJX7DKQJEX6CJ&lid=LSTCILHJX7DKQJEX6CJ25J9DM&marketplace=FLIPKART&sattr[]=number_of_bulbs&sattr[]=dimension&sattr[]=number_of_contents_in_sales_package&st=number_of_contents_in_sales_package",
    media: []
  },
  {
    id: "WL_002_OL",
    category: "wall-lights",
    name: "Gold Crystal Large Oval LED Wall Light",
    price: 708,
    description: "Elegant Crystal Oval Wall Light Design – This modern LED wall light features a stunning oval-shaped crystal acrylic frame with a luxurious gold-finish metal base, adding a refined and contemporary touch to any interior décor.\n\nKey Features:\n• Beautiful Ambient Lighting Effect: The textured crystal design diffuses light evenly to create a soft, warm, and elegant glow that enhances walls while avoiding harsh glare\n• Inbuilt LED Light Source: Comes with an energy-efficient integrated LED, eliminating the need for separate bulbs and ensuring long-lasting, consistent illumination\n• 3 Color Changing Function: Features Warm White, Natural White, and Cool White lighting modes, easily changeable using a simple ON/OFF switch for customizable ambience\n• Ideal for Multiple Spaces: Perfect for living rooms, bedrooms, staircases, hallways, balconies, dining areas, offices, hotels, cafés, restaurants, and bars\n• Durable Premium Construction: Made from high-quality acrylic crystal and sturdy metal for long-term durability, stability, and a premium finish",
    sku: "WL_002_OL",
    amazonLink: "https://amzn.to/3NsIgPc",
    meeshoLink: "https://www.meesho.com/nyara-luxe-oval-led-decorative-wall-light-with-3-light-modes-for-living-room-bedroom/p/b5d0ih",
    flipkartLink: "https://www.flipkart.com/nyara-luxe-wallchiere-wall-lamp-bulb/p/itmbe2c08792263c?pid=WLMHJRN4SGJQXYYZ",
    media: []
  },
  {
    id: "WL_002_OS",
    category: "wall-lights",
    name: "Gold Crystal Small Oval LED Wall Light",
    price: 708,
    description: "Stunning Oval Silhouette – A unique, 15x12 cm elongated oval design that adds a contemporary architectural touch to your walls.\n\nKey Features:\n• Intelligent Tri-Color Lighting: Switch effortlessly between Warm White, Cool White, and Natural Day Light to set the perfect ambiance\n• Diamond-Cut Acrylic Crystal: Features a high-quality textured crystal shade that creates a beautiful shimmering effect when lit\n• Modern Gold Accents: The premium gold-plated base provides a rust-resistant, sophisticated finish that complements modern Indian interiors\n• Energy Efficient & Durable: Built with long-lasting LED technology that saves power while providing bright, flicker-free illumination",
    sku: "WL_002_OS",
    amazonLink: "https://amzn.to/4pJ1ygw",
    meeshoLink: "https://www.meesho.com/nyara-luxe-small-oval-led-decorative-wall-light-with-3-light-modes-for-home-decor/p/b5d0ii",
    flipkartLink: "https://www.flipkart.com/nyara-luxe-wallchiere-wall-lamp-bulb/p/itm02094342743a0?pid=WLMHJRN67CXB2DNQ",
    media: []
  },
  {
    id: "WL_003",
    category: "wall-lights",
    name: "Golden Bird LED Wall Lamp",
    price: 826,
    description: "The Golden Bird Wall Lamp offers three light shades: Warm White (3000K) for cozy rooms, Neutral White (4000K) for daily use, and Cool White (6000K) for a bright, clean look.\n\nKey Features:\n• Adjustable Light Colors: Three light shades to match any mood and room setting\n• Power-Saving LED Light: Built with LED lighting that uses less electricity while giving smooth and comfortable brightness for indoor spaces\n• Quick Wall Installation: Designed for easy wall mounting. All fitting accessories are included, making installation simple and hassle-free\n• Strong Material with Elegant Look: Made from sturdy metal and acrylic with a shiny gold finish that stays beautiful over time\n• Well-Crafted & Long-Lasting: The Golden Bird Wall Lamp is carefully made with quality materials to ensure durability, reliable performance, and a premium decorative touch",
    sku: "WL_003",
    amazonLink: "https://amzn.to/45k5qgV",
    meeshoLink: "https://meesho.com/nyara-luxe-golden-bird-led-decorative-wall-light-with-3-colour-modes-for-indoor-use/p/b5d0ig?_ms=1.2",
    flipkartLink: "https://www.flipkart.com/nyara-luxe-wallchiere-wall-lamp-bulb/p/itm16c83cf94ce3a?pid=WLMHJRNDXPH7C98Y",
    media: []
  },
  {
    id: "WL_004",
    category: "wall-lights",
    name: "Golden Butterfly LED Wall Lamp",
    price: 920,
    description: "Elegant Butterfly Design – Butterfly-shaped wall lamp that adds a soft and decorative look to your space.\n\nKey Features:\n• 3 Light Mode Options: Switch easily between Warm White (3000K) for a cozy feel, Neutral White (4000K) for daily lighting, and Cool White (6000K) for bright illumination\n• Energy-Saving LED Light: Provides bright light while using less electricity, suitable for long-term use\n• Strong & Stylish Build: Made with high-quality metal and acrylic with a smooth golden finish for durability and style\n• Easy Wall Installation: Wall-mounted design suitable for bedroom, living room, hallway, staircase, and indoor spaces",
    sku: "WL_004",
    amazonLink: "https://amzn.to/4b5u3S5",
    meeshoLink: "https://meesho.com/nyara-luxe-golden-bird-led-decorative-wall-light-with-3-colour-modes-for-indoor-use/p/b5d0ij?_ms=1.2",
    flipkartLink: "https://www.flipkart.com/nyara-luxe-wallchiere-wall-lamp-bulb/p/itm27971863cc9f5?pid=WLMHJRNHUZAD3HRF",
    media: []
  },
  {
    id: "WL_006",
    category: "wall-lights",
    name: "Crystal Double Ring LED Wall Lamp",
    price: 755,
    description: "Modern Crystal Ring Design – Features concentric crystal-encrusted rings with a sleek black metal accent, creating a luxurious and contemporary statement on any wall.\n\nKey Features:\n• 4 Color Tone Options: Easily switch between Warm White (3000K) for a cozy, relaxing ambiance, Neutral White (4000K) for balanced everyday lighting, Cool White (6000K) for bright, crisp illumination, and Multicolor for party vibes\n• Energy-Efficient LED Lighting: Delivers bright illumination while consuming less power, making it ideal for long-term daily use\n• Premium Materials & Finish: Made from high-quality metal and crystal acrylic, offering durability, elegance, and a refined modern look\n• Easy Wall Installation: Wall-mounted design suitable for bedrooms, living rooms, hallways, staircases, lounges, and hotel interiors",
    sku: "WL_006",
    amazonLink: "https://amzn.to/4b1lPKM",
    meeshoLink: "https://www.meesho.com/nyara-luxe-crystal-ring-wall-lamp--modern-led-decorative-wall-light-with-4-color-tones--elegant-acrylic--metal-wall-sconce-for-bedroom-living-room--hallway/p/b5dmlh?_ms=1.2",
    flipkartLink: "https://www.flipkart.com/nyara-luxe-wallchiere-wall-lamp-bulb/p/itm7951350fb98d6?pid=WLMHJRNUMYKR2FZR",
    media: []
  },
  {
    id: "WL_007_C",
    category: "wall-lights",
    name: "Modern Round shape LED Wall Light",
    price: 637,
    description: "Enhance your home interiors with this modern round LED decorative wall light, designed to create a soft and elegant ambience. The circular halo design combined with a stylish central stem gives this lamp a premium and contemporary look.\n\nKey Features:\n• 3 Lighting Modes: Warm White, Natural White, and Cool White, allowing you to switch the light according to your mood and space requirement\n• Energy-efficient LED technology: Provides bright illumination while consuming minimal power\n• Perfect for: Living rooms, bedrooms, hallways, staircases, balconies, hotels, and cafés\n• Adds both functionality and aesthetic appeal to any indoor setting",
    sku: "WL_007_C",
    amazonLink: "https://amzn.to/4qRJbqW",
    meeshoLink: "https://www.meesho.com/nyara-luxe-golden-bird-led-decorative-wall-light-with-3-colour-modes-for-indoor-use/p/b5d0in",
    flipkartLink: "https://www.flipkart.com/nyara-luxe-wallchiere-wall-lamp-bulb/p/itm4d93776f517c6?pid=WLMHJRZYKFHZX2GZ",
    media: []
  },
  {
    id: "WL_007_T",
    category: "wall-lights",
    name: "Modern Tree shape LED Wall Light",
    price: 637,
    description: "Add a touch of elegance to your space with this modern LED decorative wall light, designed to enhance the ambience of any room. Featuring a stylish floral-inspired design, this wall lamp blends contemporary aesthetics with functional lighting.\n\nKey Features:\n• 3 Adjustable Lighting Modes: Warm White, Natural White, and Cool White, allowing you to choose the perfect mood for relaxation, work, or decoration\n• High-quality LED components: Offers bright illumination with low power consumption and long life\n• Ideal for: Living rooms, bedrooms, hallways, balconies, staircases, hotels, and cafés\n• Easy to install and instantly upgrades your interior décor",
    sku: "WL_007_T",
    amazonLink: "https://amzn.to/49GeSwj",
    meeshoLink: "https://www.meesho.com/nyara-luxe-golden-bird-led-decorative-wall-light-with-3-colour-modes-for-indoor-use/p/b5d0im",
    flipkartLink: "https://www.flipkart.com/nyara-luxe-wallchiere-wall-lamp-bulb/p/itm1c45226416049?pid=WLMHJRZ57GFYHSZN",
    media: []
  },
  {
    id: "WL_009_GB",
    category: "wall-lights",
    name: "Curvy Golden patch LED Wall Light",
    price: 897,
    description: "The Curvy Golden Wall Light is a modern and stylish LED wall lamp designed to enhance indoor spaces with soft and elegant lighting. Its unique curvy acrylic design spreads light evenly on the wall, creating a warm and attractive look.\n\nKey Features:\n• Three Light Colour Options: Warm White, Neutral White, and Cool White – allowing you to choose the right lighting for relaxation or daily use\n• 10W LED Power: Provides good brightness while saving energy\n• Golden Metal Finish: Adds a premium touch, making it perfect for living rooms, bedrooms, bathrooms, staircases, and hallways\n• Durable Construction: Made with strong metal and acrylic materials, easy to maintain, and suitable for modern interiors",
    sku: "WL_009_GB",
    amazonLink: "https://amzn.to/4qzjawW",
    meeshoLink: "https://www.meesho.com/nyara-luxe-curvy-golden-wall-light-golden-work-modern-led-indoor-wall-lamp-with-3-light-colours-warm-light-neutral-white-and-cool-white-acrylic-decorative-wall-light-for-living-room-bathroom-staircase/p/bc83l9",
    flipkartLink: "https://www.flipkart.com/nyara-luxe-wallchiere-wall-lamp-bulb/p/itmd634ca927856e?pid=WLMHJRZCUYGAYBPT&lid=LSTWLMHJRZCUYGAYBPTZEEJM1&marketplace=FLIPKART&sattr[]=dimension&sattr[]=number_of_contents_in_sales_package&st=number_of_contents_in_sales_package",
    media: []
  },
  {
    id: "WL_009_WC",
    category: "wall-lights",
    name: "Curvy White Check Design LED Wall Light",
    price: 897,
    description: "The Curvy Golden Wall Light is a modern and stylish LED wall lamp designed to enhance indoor spaces with soft and elegant lighting. Its unique curvy acrylic design spreads light evenly on the wall, creating a warm and attractive look.\n\nKey Features:\n• Three Light Colour Options: Warm White, Neutral White, and Cool White – allowing you to choose the right lighting for relaxation or daily use\n• 10W LED Power: Provides good brightness while saving energy\n• Golden Metal Finish: Adds a premium touch, making it perfect for living rooms, bedrooms, bathrooms, staircases, and hallways\n• Durable Construction: Made with strong metal and acrylic materials, easy to maintain, and suitable for modern interiors",
    sku: "WL_009_WC",
    amazonLink: "https://amzn.to/4sI1pwV",
    meeshoLink: "https://www.meesho.com/nyara-luxe-curvy-golden-wall-light-white-checks-work-modern-led-indoor-wall-lamp-with-3-light-colours-warm-light-neutral-white-and-cool-white-acrylic-decorative-wall-light-for-living-room-bathroom-staircase/p/bc83l8",
    flipkartLink: "https://www.flipkart.com/nyara-luxe-wallchiere-wall-lamp-bulb/p/itm360796d67c698?pid=WLMHJRZE8UB2YAEG",
    media: []
  },
  {
    id: "WL_009_WL",
    category: "wall-lights",
    name: "Curvy White Line Design LED Wall Light",
    price: 897,
    description: "The Curvy Golden Wall Light is a modern and stylish LED wall lamp designed to enhance indoor spaces with soft and elegant lighting. Its unique curvy acrylic design spreads light evenly on the wall, creating a warm and attractive look.\n\nKey Features:\n• Three Light Colour Options: Warm White, Neutral White, and Cool White – allowing you to choose the right lighting for relaxation or daily use\n• 10W LED Power: Provides good brightness while saving energy\n• Golden Metal Finish: Adds a premium touch, making it perfect for living rooms, bedrooms, bathrooms, staircases, and hallways\n• Durable Construction: Made with strong metal and acrylic materials, easy to maintain, and suitable for modern interiors",
    sku: "WL_009_WL",
    amazonLink: "https://amzn.to/4sM5L5T",
    meeshoLink: "https://www.meesho.com/nyara-luxe-curvy-golden-wall-light-white-line-work-modern-led-indoor-wall-lamp-with-3-light-colours-warm-light-neutral-white-and-cool-white-acrylic-decorative-wall-light-for-living-room-bathroom-staircase/p/bc83l7",
    flipkartLink: "https://www.flipkart.com/nyara-luxe-wallchiere-wall-lamp-bulb/p/itmf0157fa4f141d?pid=WLMHJRZHYJFVMGBQ",
    media: []
  },
  {
    id: "CHN_001",
    category: "chandelier",
    name: "Twin Bird Gold Chandelier",
    price: 3186,
    description: "DESIGN: Twin Bird Pendant Hanging Lights For Living Room Lights: Double Delight showcases a unique dual-bird design crafted in a luxurious gold finish with elegant glass bird-shaped shades, creating a refined artistic statement.\n\nKey Features:\n• DOUBLE LIGHT APPEAL: The twin pendant structure offers balanced illumination and visual harmony, making it a perfect centerpiece for modern and luxury interiors\n• 3-in-1 Colour Changing LED: Switch effortlessly between Warm light, Natural White, and Cool White using a standard wall switch to match every mood and occasion\n• SOFT AMBIENT GLOW: The glass bird shades gently diffuse light to create a warm, soothing ambience that enhances comfort and elegance in your space\n• PREMIUM MATERIALS: Constructed with high-quality metal framing and refined glass elements, ensuring durability, stability, and long-lasting aesthetic appeal\n• VERSATILE PLACEMENT: Ideal for living rooms, bedrooms, dining areas, lounges, cafés, hotels, and designer residential or commercial interiors\n• INSTALLATION: Hanging pendant design with ceiling mounting hardware for secure and seamless installation",
    sku: "CHN_001",
    amazonLink: "https://amzn.to/4qUGWD3",
    meeshoLink: "",
    flipkartLink: "https://www.flipkart.com/nyara-luxe-twin-bird-gold-pendant-light-luxury-glass-hanging-lamp-3-in-1-colour-changing-chandelier-ceiling/p/itm874a709eec76e?pid=CILHJPFD94YQMHT8",
    media: []
  },
  {
    id: "CHN_002",
    category: "chandelier",
    name: "Single Bird Ring Chandelier",
    price: 1652,
    description: "DESIGN: Elegant single bird pendant light featuring a sleek circular metal ring with a delicately crafted glass bird shade, creating a minimal yet artistic lighting statement.\n\nKey Features:\n• 3-in-1 Colour Changing LED: Switch effortlessly between Warm light, Natural White, and Cool White using a standard wall switch to match every mood and occasion\n• MATERIAL: Made from premium-quality metal with a polished gold finish, combined with a refined glass bird-shaped shade for durability, stability, and a luxurious appearance\n• ARTISTIC APPEAL: The suspended bird within the circular frame adds a sense of balance, movement, and modern elegance, making it a perfect décor accent\n• SOFT AMBIENT ILLUMINATION: The glass bird shade gently diffuses light, producing a warm and calming glow suitable for relaxed and stylish interiors\n• VERSATILE PLACEMENT: Ideal for living rooms, bedrooms, dining spaces, bedside areas, lounges, cafés, studios, and designer interiors\n• INSTALLATION: Hanging pendant design with ceiling mounting hardware for secure and seamless installation",
    sku: "CHN_002",
    amazonLink: "https://amzn.to/3Np9XZi",
    meeshoLink: "https://meesho.com/single-bird-circular-pendant-light/p/b4ugf3?_ms=1.2",
    flipkartLink: "https://www.flipkart.com/nyara-luxe-ring-hanging-lamp-glass-bird-shade-3-in-1-colour-changing-ceiling-light-chandelier/p/itma4fda85af16fa?pid=CILHJPFRZVYZGZJR",
    media: []
  },
  {
    id: "CHN_003",
    category: "chandelier",
    name: "Infinity Loop LED Chandelier",
    price: 1770,
    description: "DESIGN: Contemporary infinity-loop chandelier featuring an elegant intertwined circular form with a luxurious gold finish, creating a modern sculptural centerpiece for your ceiling.\n\nKey Features:\n• 3-in-1 Colour Changing LED: Switch effortlessly between Warm light, Natural White, and Cool White using a standard wall switch to match every mood and occasion\n• MODERN LED ILLUMINATION: Integrated LED light source emits a soft warm glow, providing comfortable ambient lighting while enhancing the artistic shape of the chandelier\n• PREMIUM MATERIAL: Crafted from high-quality metal with a polished gold finish and integrated LED light strip for durability, stability, and long-lasting performance\n• MINIMAL & ELEGANT STYLE: The flowing loop design adds a modern, minimalist aesthetic that complements contemporary, luxury, and designer interior décor themes\n• VERSATILE APPLICATION: Ideal for living rooms, bedrooms, dining areas, lounges, staircases, cafés, hotels, and modern residential or commercial spaces\n• INSTALLATION: Hanging ceiling light supplied with mounting hardware and adjustable suspension wire for customized height placement",
    sku: "CHN_003",
    amazonLink: "https://amzn.to/3LJ9uR3",
    meeshoLink: "",
    flipkartLink: "https://www.flipkart.com/nyara-luxe-infinity-loop-led-chandelier-modern-gold-spiral-hanging-light-ceiling-lamp/p/itm146e56734d375?pid=CILHJPFYQQDVKT2Q",
    media: []
  },
  {
    id: "CHN_004",
    category: "chandelier",
    name: "Gold Oval Ring Crystal Chandelier",
    price: 4248,
    description: "Material: Metal & Acrylic\n\nKey Features:\n• Elegant Oval Pendant Design: Features four premium oval-shaped crystal acrylic pendants suspended from a sleek golden LED ring, creating a luxurious statement lighting piece\n• 3-in-1 Colour Changing LED: Switch effortlessly between Warm light, Natural White, and Cool White using a standard wall switch to match every mood and occasion\n• Premium Gold Electroplated Finish: High-quality electroplated metal body delivers a rich gold shine that enhances modern and luxury interiors\n• Soft, Bright & Glare-Free Illumination: Integrated LED lighting provides uniform brightness without eye strain, ideal for everyday living spaces\n• Modern Luxury for Multiple Spaces: Perfect for living rooms, halls, bedrooms, dining areas, offices, hotels, and showrooms\n• Durable & Long-Lasting Build: Crafted with sturdy metal and high-grade acrylic for excellent heat dissipation, durability, and fade resistance",
    sku: "CHN_004",
    amazonLink: "https://amzn.to/3YL6zuc",
    meeshoLink: "",
    flipkartLink: "https://www.flipkart.com/nyara-luxe-gold-oval-ring-crystal-chandelier-4-pendant-jhoomer-ceiling-light-lamp/p/itmfb3b2a242179e?pid=CILHJPG3TRGRGGQX",
    media: []
  },
  {
    id: "CHN_005",
    category: "chandelier",
    name: "Black Gold 4-Tier Crystal Chandelier",
    price: 4366,
    description: "DESIGN: Premium round crystal chandelier featuring an elegant black and gold metal frame with cascading crystal drops, combining luxury lighting with modern smart functionality.\n\nKey Features:\n• SMART BLUETOOTH SPEAKER: Built-in high-quality Bluetooth speaker allows you to wirelessly stream music directly from your smartphone or tablet, creating an immersive audio-visual experience\n• REMOTE-CONTROLLED ROTATION: Equipped with a smooth rotating mechanism that can be operated using the included remote control, adding dynamic motion and enhancing the decorative impact\n• 3-in-1 Colour Changing LED: Switch effortlessly between Warm light, Natural White, and Cool White using a standard wall switch to match every mood and occasion\n• CONSTRUCTION: Crafted with a durable metal structure and multiple tiers of precision-cut crystal elements arranged in a circular formation for superior light reflection and long-lasting performance\n• STYLE VERSATILITY: The black and gold finish paired with crystal detailing complements luxury, modern, glam, and contemporary interior décor styles\n• LIGHTING EFFECT: Crystal prisms refract light beautifully, producing sparkling reflections and ambient illumination suitable for both warm and cool lighting moods\n• INSTALLATION: Includes ceiling mounting accessories and an adjustable hanging chain for customized height adjustment\n• APPLICATION: Ideal for living rooms, dining areas, bedrooms, lounges, home theaters, cafés, restaurants, and premium interiors",
    sku: "CHN_005",
    amazonLink: "https://amzn.to/3Nj8zrd",
    meeshoLink: "",
    flipkartLink: "https://www.flipkart.com/nyara-luxe-black-gold-4-tier-20-inch-crystal-chandelier-bluetooth-speaker-ceiling-lamp/p/itm49ec0d4ef48dd?pid=CILHJPGB7UH9AFCF",
    media: []
  },
  {
    id: "CHN_006",
    category: "chandelier",
    name: "Black Gold 5-Tier Crystal Chandelier",
    price: 4956,
    description: "DESIGN: Elegant 5-tier round crystal chandelier featuring a sophisticated black and gold metal frame paired with cascading premium crystal drops for a luxurious visual appeal.\n\nKey Features:\n• 3-in-1 Colour Changing LED: Switch effortlessly between Warm light, Natural White, and Cool White using a standard wall switch to match every mood and occasion\n• SIZE & PRESENCE: Large 24-inch diameter chandelier designed to make a bold statement while evenly complementing spacious interiors such as living rooms, dining halls, and entryways\n• CONSTRUCTION: Built with a sturdy metal structure and multiple layers of precision-cut crystal elements arranged in a circular tiered formation to maximize brilliance and light reflection\n• STYLE VERSATILITY: A refined blend of modern and luxury aesthetics that pairs beautifully with contemporary, glam, and upscale interior décor themes\n• LIGHTING EFFECT: Crystal drops refract light gracefully, creating a warm, elegant ambience and visually striking illumination\n• INSTALLATION: Supplied with ceiling mounting hardware and an adjustable hanging chain for flexible height adjustment\n• APPLICATION: Ideal for living rooms, dining areas, bedrooms, lounges, hotels, banquet spaces, cafés, and premium residential interiors",
    sku: "CHN_006",
    amazonLink: "https://amzn.to/3Lp1ftw",
    meeshoLink: "",
    flipkartLink: "https://www.flipkart.com/nyara-luxe-black-gold-5-tier-24-inch-crystal-chandelier-luxury-hanging-ceiling-light-lamp/p/itm561088a6ab3ea?pid=CILHJPGGZBGB2YZE",
    media: []
  }
];

// Categories to create
const categories = [
  { name: 'table-lamp', displayName: 'Table Lamps', icon: 'fa-lightbulb' },
  { name: 'garden-lights', displayName: 'Garden & Pendant Lights', icon: 'fa-sun' },
  { name: 'wall-lights', displayName: 'Wall Lights', icon: 'fa-bolt' },
  { name: 'chandelier', displayName: 'Chandeliers', icon: 'fa-star' }
];

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Delete all existing products
    console.log('Deleting all existing products...');
    const deleteResult = await Product.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} products`);

    // Delete and recreate categories
    console.log('Updating categories...');
    await Category.deleteMany({});
    await Category.insertMany(categories);
    console.log('Categories updated');

    // Insert new products
    console.log('Inserting new products...');
    for (const product of products) {
      try {
        await Product.create(product);
        console.log(`Added: ${product.name}`);
      } catch (err) {
        console.error(`Error adding ${product.name}:`, err.message);
      }
    }

    console.log(`\nTotal products added: ${products.length}`);
    console.log('Database seeding complete!');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

seedDatabase();
