import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient({
  log: ['error', 'warn'],
  errorFormat: 'minimal'
});

// Enhanced seeding order based on foreign key dependencies
const SEEDING_ORDER = [
  "fishTypes",
  "harbors", 
  "drivers",
  "trucks",
  "users",
  "harborInventory",
  "fishPricing",
  "dailyPricePredictions",
  "weatherForecasts",
  "marineForecasts",
  "blogPosts",
  "orders",
  "orderItems",
  "deliveryRoutes",
  "routeOrderSequence",
  "orderStatusHistory"
] as const;

// Map file names to Prisma model names
const FILE_TO_MODEL_MAP = {
  "fishTypes.json": "fishType",
  "harbors.json": "harbor",
  "drivers.json": "driver", 
  "trucks.json": "truck",
  "users.json": "user",
  "harborInventory.json": "harborInventory",
  "fishPricing.json": "fishPricing",
  "dailyPricePredictions.json": "dailyPricePrediction",
  "weatherForecasts.json": "weatherForecast",
  "marineForecasts.json": "marineForecast",
  "blogPosts.json": "blogPost",
  "orders.json": "order",
  "orderItems.json": "orderItem",
  "deliveryRoutes.json": "deliveryRoute",
  "routeOrderSequence.json": "routeOrderSequence",
  "orderStatusHistory.json": "orderStatusHistory"
} as const;

// ID mapping for transforming string IDs to integers
interface IdMapping {
  [oldId: string]: number;
}

const idMappings: { [modelName: string]: IdMapping } = {};

type ModelKey = keyof typeof FILE_TO_MODEL_MAP;
type ModelName = (typeof FILE_TO_MODEL_MAP)[ModelKey];

/**
 * Delete all data from tables in reverse dependency order
 */
async function deleteAllData(): Promise<void> {
  console.log("Clearing existing data...");
  
  try {
    const deletionOrder = [...SEEDING_ORDER].reverse();
    
    for (const modelName of deletionOrder) {
      const modelKey = `${modelName}.json` as ModelKey;
      const prismaModelName = FILE_TO_MODEL_MAP[modelKey];
      const model = (prisma as any)[prismaModelName];
      
      if (!model) {
        console.warn(`Model ${modelName} not found, skipping...`);
        continue;
      }
      
      try {
        const deleteResult = await model.deleteMany({});
        console.log(`Cleared ${deleteResult.count} records from ${modelName}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error clearing ${modelName}:`, errorMessage);
      }
    }
    
    // Reset ID mappings
    Object.keys(idMappings).forEach(key => delete idMappings[key]);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error during data deletion:", errorMessage);
    throw error;
  }
}

/**
 * Generate sample data for new tables
 */
async function generateSampleData(): Promise<void> {
  console.log("Generating sample data for new tables...");

  // Generate sample blog posts
  const sampleBlogPosts = [
    {
      title: "Climate Change Impact on Sri Lankan Fisheries",
      slug: "climate-change-impact-sri-lankan-fisheries",
      content: "Climate change poses significant challenges to Sri Lankan fisheries. Rising sea temperatures affect fish migration patterns, while changing weather patterns impact fishing seasons. This comprehensive analysis explores the current situation and potential adaptation strategies.",
      excerpt: "Understanding how climate change affects Sri Lankan fisheries and what can be done about it.",
      category: "climate_change",
      tags: ["climate", "fisheries", "sri lanka", "adaptation"],
      author: "Dr. Marine Researcher",
      isPublished: true,
      publishedAt: new Date("2024-01-15"),
      readCount: 245
    },
    {
      title: "Policy Recommendations for Sustainable Fishing",
      slug: "policy-recommendations-sustainable-fishing",
      content: "Sustainable fishing practices require comprehensive policy frameworks. This article outlines key policy recommendations including quotas, seasonal restrictions, and community-based management approaches.",
      excerpt: "Key policy recommendations to ensure sustainable fishing practices in Sri Lanka.",
      category: "policy",
      tags: ["policy", "sustainability", "management", "governance"],
      author: "Policy Expert",
      isPublished: true,
      publishedAt: new Date("2024-02-10"),
      readCount: 189
    },
    {
      title: "Combating Overfishing in Coastal Waters",
      slug: "combating-overfishing-coastal-waters",
      content: "Overfishing threatens marine ecosystems and livelihoods. This article examines current overfishing trends, their impacts, and evidence-based solutions for coastal water management.",
      excerpt: "Strategies to combat overfishing and protect marine ecosystems.",
      category: "overfishing",
      tags: ["overfishing", "conservation", "marine", "ecosystem"],
      author: "Marine Biologist",
      isPublished: true,
      publishedAt: new Date("2024-03-05"),
      readCount: 312
    },
    {
      title: "Understanding IUU Fishing: Challenges and Solutions",
      slug: "understanding-iuu-fishing-challenges-solutions",
      content: "Illegal, Unreported and Unregulated (IUU) fishing undermines conservation efforts and economic sustainability. This comprehensive guide explores detection methods, enforcement challenges, and international cooperation frameworks.",
      excerpt: "A comprehensive overview of IUU fishing and how to address it.",
      category: "iuu_fishing",
      tags: ["IUU", "illegal fishing", "enforcement", "monitoring"],
      author: "Fisheries Inspector",
      isPublished: true,
      publishedAt: new Date("2024-03-20"),
      readCount: 156
    }
  ];

  try {
    for (const blogPost of sampleBlogPosts) {
      await prisma.blogPost.create({ data: blogPost });
    }
    console.log(`Created ${sampleBlogPosts.length} sample blog posts`);
  } catch (error) {
    console.error("Error creating sample blog posts:", error);
  }

  // Generate sample weather forecasts for the next 7 days
  const locations = [
    { name: "Colombo", lat: 6.9271, lng: 79.8612 },
    { name: "Negombo", lat: 7.2084, lng: 79.8358 },
    { name: "Galle", lat: 6.0535, lng: 80.2210 },
    { name: "Trincomalee", lat: 8.5874, lng: 81.2152 },
    { name: "Jaffna", lat: 9.6615, lng: 80.0255 }
  ];

  try {
    const startDate = new Date();
    for (let i = 0; i < 7; i++) {
      const forecastDate = new Date(startDate);
      forecastDate.setDate(startDate.getDate() + i);

      for (const location of locations) {
        // Generate realistic weather data for Sri Lanka
        const weatherData = {
          forecastDate,
          location: location.name,
          latitude: location.lat,
          longitude: location.lng,
          temperature2mMean: 25 + Math.random() * 8, // 25-33°C
          windSpeed10mMax: 10 + Math.random() * 20, // 10-30 km/h
          windGusts10mMax: 20 + Math.random() * 30, // 20-50 km/h
          cloudCoverMean: Math.random() * 100, // 0-100%
          precipitationSum: Math.random() * 15, // 0-15mm
          relativeHumidity2mMean: 70 + Math.random() * 25 // 70-95%
        };

        await prisma.weatherForecast.create({ data: weatherData });

        // Generate marine forecast for coastal locations
        if (["Colombo", "Negombo", "Galle", "Trincomalee"].includes(location.name)) {
          const marineData = {
            forecastDate,
            latitude: location.lat,
            longitude: location.lng,
            waveHeightMax: 0.5 + Math.random() * 2.5, // 0.5-3m
            windWaveHeightMax: 0.2 + Math.random() * 1, // 0.2-1.2m
            swellWaveHeightMax: 0.5 + Math.random() * 1.5, // 0.5-2m
            wavePeriodMax: 6 + Math.random() * 8, // 6-14 seconds
            waveDirectionDominant: 180 + Math.random() * 180 // 180-360 degrees (S to N)
          };

          await prisma.marineForecast.create({ data: marineData });
        }
      }
    }
    console.log(`Created weather and marine forecasts for ${locations.length} locations over 7 days`);
  } catch (error) {
    console.error("Error creating sample forecasts:", error);
  }
}

/**
 * Validate JSON data structure
 */
function validateJsonData(data: unknown, fileName: string): data is Record<string, any>[] {
  if (!Array.isArray(data)) {
    console.error(`${fileName}: Data must be an array`);
    return false;
  }
  
  if (data.length === 0) {
    console.warn(`${fileName}: Empty data array`);
    return true;
  }
  
  const invalidItems = data.filter((item, index) => {
    if (typeof item !== 'object' || item === null) {
      console.error(`${fileName}: Invalid item at index ${index} - not an object`);
      return true;
    }
    return false;
  });
  
  return invalidItems.length === 0;
}

/**
 * Safely parse integer with null checks
 */
function safeParseInt(value: string | number | undefined, defaultValue: number = 0): number {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value === 'number') return value;
  const parsed = parseInt(String(value), 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Get next available ID from the mapping or generate new one
 */
function getOrCreateId(oldId: string, modelName: string): number {
  if (!idMappings[modelName]) {
    idMappings[modelName] = {};
  }
  
  if (idMappings[modelName][oldId]) {
    return idMappings[modelName][oldId];
  }
  
  // Generate next available ID
  const existingIds = Object.values(idMappings[modelName]);
  const nextId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
  idMappings[modelName][oldId] = nextId;
  
  return nextId;
}

/**
 * Transform data before insertion (handle date strings, ID mappings, etc.)
 */
function transformData(data: Record<string, any>[], fileName: string, modelName: string): Record<string, any>[] {
  return data.map((item, index) => {
    try {
      const transformed = { ...item };
      
      // Handle ID transformations based on the model
      const idFieldMappings: { [key: string]: string[] } = {
        fishTypes: ['fishTypeId'],
        harbors: ['harborId'],
        drivers: ['driverId'],
        trucks: ['id', 'driverId'],
        users: ['id'],
        harborInventory: ['harborInventoryId', 'harborId', 'fishTypeId'],
        fishPricing: ['fishPriceId', 'fishTypeId'],
        dailyPricePredictions: ['id', 'fishTypeId'],
        weatherForecasts: ['id'],
        marineForecasts: ['id'],
        blogPosts: ['id'],
        orders: ['orderId', 'userId', 'pickupHarborId', 'assignedTruckId'],
        orderItems: ['id', 'orderId', 'fishTypeId'],
        deliveryRoutes: ['routeId', 'truckId', 'startHarborId'],
        routeOrderSequence: ['id', 'routeId', 'orderId'],
        orderStatusHistory: ['id', 'orderId']
      };
      
      const fieldsToTransform = idFieldMappings[modelName] || [];
      
      fieldsToTransform.forEach(field => {
        if (transformed[field] && typeof transformed[field] === 'string') {
          const oldId = transformed[field];
          
          // Determine reference model for foreign keys
          let refModel = '';
          if (field.includes('fishType') || field === 'fishTypeId') refModel = 'fishTypes';
          else if (field.includes('harbor') || field === 'harborId') refModel = 'harbors';
          else if (field.includes('driver') || field === 'driverId') refModel = 'drivers';
          else if (field.includes('truck') || field === 'truckId') refModel = 'trucks';
          else if (field.includes('user') || field === 'userId') refModel = 'users';
          else if (field.includes('order') || field === 'orderId') refModel = 'orders';
          else if (field.includes('route') || field === 'routeId') refModel = 'deliveryRoutes';
          else refModel = modelName;
          
          transformed[field] = getOrCreateId(oldId, refModel);
        }
      });
      
      // Remove old ID fields that don't match the new schema
      if (modelName === 'fishTypes' && transformed.fishTypeId) {
        transformed.id = transformed.fishTypeId;
        delete transformed.fishTypeId;
      } else if (modelName === 'harbors' && transformed.harborId) {
        transformed.id = transformed.harborId;
        delete transformed.harborId;
      } else if (modelName === 'drivers' && transformed.driverId) {
        transformed.id = transformed.driverId;
        delete transformed.driverId;
      } else if (modelName === 'harborInventory' && transformed.harborInventoryId) {
        transformed.id = transformed.harborInventoryId;
        delete transformed.harborInventoryId;
      } else if (modelName === 'fishPricing' && transformed.fishPriceId) {
        transformed.id = transformed.fishPriceId;
        delete transformed.fishPriceId;
      } else if (modelName === 'orders' && transformed.orderId) {
        transformed.id = transformed.orderId;
        delete transformed.orderId;
      } else if (modelName === 'deliveryRoutes' && transformed.routeId) {
        transformed.id = transformed.routeId;
        delete transformed.routeId;
      }
      
      // Convert date strings to Date objects for specific fields
      const dateFields = [
        'priceDate', 'predictionDate', 'generatedAt', 'catchDate', 'expiryDate', 
        'licenseExpiryDate', 'birthDate', 'hireDate', 'registrationDate', 
        'maintenanceDueDate', 'deliveryDate', 'routeDate', 'orderDate', 
        'orderPlaceTime', 'startTime', 'endTime', 'estimatedArrivalTime', 
        'actualArrivalTime', 'statusDate', 'createdAt', 'updatedAt',
        'forecastDate', 'publishedAt'
      ];
      
      dateFields.forEach(field => {
        if (transformed[field] && typeof transformed[field] === 'string') {
          const dateValue = new Date(transformed[field]);
          if (!isNaN(dateValue.getTime())) {
            transformed[field] = dateValue;
          } else {
            console.warn(`${fileName}[${index}]: Invalid date format for field ${field}: ${transformed[field]}`);
          }
        }
      });
      
      // Convert time strings for operating hours (PostgreSQL TIME format)
      const timeFields = ['operatingHoursStart', 'operatingHoursEnd'];
      timeFields.forEach(field => {
        if (transformed[field] && typeof transformed[field] === 'string') {
          const timeMatch = transformed[field].match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
          if (timeMatch && timeMatch[1] && timeMatch[2]) {
            const hours = safeParseInt(timeMatch[1]);
            const minutes = safeParseInt(timeMatch[2]);
            const seconds = safeParseInt(timeMatch[3], 0);
            
            if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59 && seconds >= 0 && seconds <= 59) {
              const date = new Date();
              date.setHours(hours, minutes, seconds, 0);
              transformed[field] = date;
            } else {
              console.warn(`${fileName}[${index}]: Invalid time format for ${field}: ${transformed[field]}`);
              delete transformed[field];
            }
          } else {
            console.warn(`${fileName}[${index}]: Time format doesn't match pattern for ${field}: ${transformed[field]}`);
            delete transformed[field];
          }
        }
      });
      
      // Convert numeric strings to proper numbers for Decimal fields
      const decimalFields = [
        'storageTemperatureMin', 'storageTemperatureMax', 'latitude', 'longitude',
        'availableQuantityKg', 'pricePerKg', 'retailPrice', 'wholesalePrice',
        'costPerKm', 'currentLatitude', 'currentLongitude', 'quantityKg',
        'unitPrice', 'totalAmount', 'deliveryFee', 'deliveryLatitude', 'deliveryLongitude',
        'totalDistanceKm', 'estimatedDurationHours', 'totalFuelCost', 'distanceFromPreviousKm',
        'confidence', 'subtotal', 'temperature2mMean', 'windSpeed10mMax', 'windGusts10mMax',
        'cloudCoverMean', 'precipitationSum', 'relativeHumidity2mMean', 'waveHeightMax',
        'windWaveHeightMax', 'swellWaveHeightMax', 'wavePeriodMax', 'waveDirectionDominant'
      ];
      
      decimalFields.forEach(field => {
        if (transformed[field] !== undefined && transformed[field] !== null) {
          const numValue = Number(transformed[field]);
          if (!isNaN(numValue)) {
            transformed[field] = numValue;
          }
        }
      });
      
      // Convert integer fields
      const integerFields = [
        'averageShelfLifeHours', 'totalCapacityKg', 'currentStockKg', 'supplyAvailability',
        'capacityKg', 'freshnessRequirementHours', 'sequenceNumber', 'readCount'
      ];
      
      integerFields.forEach(field => {
        if (transformed[field] !== undefined && transformed[field] !== null) {
          transformed[field] = safeParseInt(transformed[field]);
        }
      });

      // Handle JSON fields
      const jsonFields = ['weatherData', 'oceanData', 'economicData', 'optimizationData', 'tags'];
      jsonFields.forEach(field => {
        if (transformed[field] && typeof transformed[field] === 'string') {
          try {
            transformed[field] = JSON.parse(transformed[field]);
          } catch (error) {
            console.warn(`${fileName}[${index}]: Invalid JSON for field ${field}, keeping as string`);
          }
        }
      });
      
      return transformed;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error transforming item at index ${index} in ${fileName}:`, errorMessage);
      return item;
    }
  });
}

/**
 * Seed data for a specific model with individual record processing
 */
async function seedModel(fileName: string): Promise<void> {
  const filePath = join(__dirname, "seedData", fileName);
  const modelKey = fileName as ModelKey;
  const prismaModelName = FILE_TO_MODEL_MAP[modelKey];
  const model = (prisma as any)[prismaModelName];
  const modelName = fileName.replace('.json', '');
  
  if (!model) {
    console.error(`Model for ${fileName} not found`);
    return;
  }
  
  if (!existsSync(filePath)) {
    console.warn(`File ${fileName} not found, skipping...`);
    return;
  }
  
  try {
    const rawData = readFileSync(filePath, "utf-8");
    let jsonData: unknown;
    
    try {
      jsonData = JSON.parse(rawData);
    } catch (parseError) {
      const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown error';
      console.error(`Error parsing JSON in ${fileName}:`, errorMessage);
      return;
    }
    
    if (!validateJsonData(jsonData, fileName)) {
      return;
    }
    
    if (jsonData.length === 0) {
      console.log(`${fileName}: No data to seed`);
      return;
    }
    
    const transformedData = transformData(jsonData, fileName, modelName);
    const validData = transformedData.filter(item => item !== null && item !== undefined);
    
    if (validData.length === 0) {
      console.log(`${fileName}: No valid data after transformation`);
      return;
    }
    
    const totalRecords = validData.length;
    let successfulInserts = 0;
    
    console.log(`Seeding ${totalRecords} records for ${prismaModelName}...`);
    
    // Process records individually for better error handling
    for (let i = 0; i < validData.length; i++) {
      const record = validData[i];
      if (!record) {
        console.warn(`Skipped undefined record at index ${i} in ${fileName}`);
        continue;
      }
      
      try {
        const createdRecord = await model.create({ data: record });
        successfulInserts++;
        
        // Store the actual database ID mapping for foreign key references
        if (record.id && typeof record.id === 'number') {
          const oldIdField = getOldIdField(modelName);
          if (oldIdField && jsonData[i] && typeof jsonData[i] === 'object' && jsonData[i] !== null) {
            const originalId = (jsonData[i] as any)[oldIdField];
            if (originalId && typeof originalId === 'string') {
              if (!idMappings[modelName]) {
                idMappings[modelName] = {};
              }
              idMappings[modelName][originalId] = createdRecord.id;
            }
          }
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.warn(`Skipped record ${i + 1} in ${fileName}: ${errorMessage}`);
        console.debug(`Failed record data:`, JSON.stringify(record, null, 2));
      }
    }
    
    console.log(`Successfully seeded ${successfulInserts}/${totalRecords} records for ${prismaModelName}`);
    
    if (successfulInserts < totalRecords) {
      console.warn(`${totalRecords - successfulInserts} records were skipped due to errors`);
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Fatal error seeding ${fileName}:`, errorMessage);
    throw error;
  }
}

/**
 * Get the original ID field name for a model
 */
function getOldIdField(modelName: string): string | null {
  const idFieldMap: { [key: string]: string } = {
    'fishTypes': 'fishTypeId',
    'harbors': 'harborId',
    'drivers': 'driverId',
    'trucks': 'id',
    'users': 'id',
    'harborInventory': 'harborInventoryId',
    'fishPricing': 'fishPriceId',
    'dailyPricePredictions': 'id',
    'weatherForecasts': 'id',
    'marineForecasts': 'id',
    'blogPosts': 'id',
    'orders': 'orderId',
    'orderItems': 'id',
    'deliveryRoutes': 'routeId',
    'routeOrderSequence': 'id',
    'orderStatusHistory': 'id'
  };
  
  return idFieldMap[modelName] || null;
}

/**
 * Display final record counts for verification
 */
async function displayFinalCounts(): Promise<void> {
  console.log("\nFinal record counts:");
  
  const modelConfigs = [
    { name: "Fish Types", key: "fishType" },
    { name: "Fish Pricing", key: "fishPricing" },
    { name: "Daily Price Predictions", key: "dailyPricePrediction" },
    { name: "Harbors", key: "harbor" },
    { name: "Harbor Inventory", key: "harborInventory" },
    { name: "Drivers", key: "driver" },
    { name: "Trucks", key: "truck" },
    { name: "Users", key: "user" },
    { name: "Orders", key: "order" },
    { name: "Order Items", key: "orderItem" },
    { name: "Delivery Routes", key: "deliveryRoute" },
    { name: "Route Sequences", key: "routeOrderSequence" },
    { name: "Status History", key: "orderStatusHistory" },
    { name: "Weather Forecasts", key: "weatherForecast" },
    { name: "Marine Forecasts", key: "marineForecast" },
    { name: "Blog Posts", key: "blogPost" }
  ];
  
  for (const { name, key } of modelConfigs) {
    try {
      const model = (prisma as any)[key];
      if (model && typeof model.count === 'function') {
        const count = await model.count();
        console.log(`  ${name}: ${count}`);
      } else {
        console.log(`  ${name}: Model not found`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`  ${name}: Error getting count - ${errorMessage}`);
    }
  }
}

/**
 * Display ID mappings for verification
 */
function displayIdMappings(): void {
  console.log("\nID Mappings created:");
  Object.entries(idMappings).forEach(([modelName, mapping]) => {
    console.log(`  ${modelName}:`);
    Object.entries(mapping).forEach(([oldId, newId]) => {
      console.log(`    ${oldId} -> ${newId}`);
    });
  });
}

/**
 * Main seeding function
 */
async function main(): Promise<void> {
  const startTime = Date.now();
  console.log("Starting database seeding process...");
  
  try {
    await prisma.$connect();
    console.log("Database connection established");
    
    await deleteAllData();
    console.log("Data clearing completed");
    
    // Generate sample data for new tables
    await generateSampleData();
    
    // Seed in dependency order
    for (const modelName of SEEDING_ORDER) {
      const fileName = `${modelName}.json`;
      console.log(`\nProcessing ${fileName}...`);
      
      try {
        await seedModel(fileName);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Failed to seed ${fileName}: ${errorMessage}`);
        // Continue with next model instead of stopping
      }
    }
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log("\nDatabase seeding completed!");
    console.log(`Total time: ${duration} seconds`);
    
    await displayFinalCounts();
    displayIdMappings();
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : undefined;
    console.error("\nSeeding process failed:", errorMessage);
    if (stack) {
      console.error("Stack trace:", stack);
    }
    process.exit(1);
  }
}

// Handle process termination gracefully
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT, cleaning up...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM, cleaning up...');
  await prisma.$disconnect();
  process.exit(0);
});

// Execute main function
main()
  .catch((error) => {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Unhandled error:", errorMessage);
    process.exit(1);
  })
  .finally(async () => {
    console.log("\nDisconnecting from database...");
    await prisma.$disconnect();
    console.log("Database connection closed");
  });