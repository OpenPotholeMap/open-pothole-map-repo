import mongoose from 'mongoose';
import { PotholeModel } from '@/models/index.js';
import { MONGO_URI } from '@/config/envs.js';

// Sample pothole data for San Francisco Bay Area
const samplePotholes = [
  // San Francisco Downtown
  {
    latitude: 37.7849,
    longitude: -122.4094,
    confidenceScore: 0.92,
    imageUrl: 'sample_pothole_1.jpg',
    verified: true,
    detectionCount: 5,
    detectedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  },
  {
    latitude: 37.7749,
    longitude: -122.4194,
    confidenceScore: 0.87,
    imageUrl: 'sample_pothole_2.jpg',
    verified: true,
    detectionCount: 3,
    detectedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
  },
  {
    latitude: 37.7849,
    longitude: -122.4074,
    confidenceScore: 0.78,
    imageUrl: 'sample_pothole_3.jpg',
    verified: false,
    detectionCount: 2,
    detectedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
  },

  // Mission District
  {
    latitude: 37.7599,
    longitude: -122.4148,
    confidenceScore: 0.95,
    imageUrl: 'sample_pothole_4.jpg',
    verified: true,
    detectionCount: 8,
    detectedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
  },
  {
    latitude: 37.7699,
    longitude: -122.4169,
    confidenceScore: 0.83,
    imageUrl: 'sample_pothole_5.jpg',
    verified: false,
    detectionCount: 1,
    detectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },

  // Castro District
  {
    latitude: 37.7609,
    longitude: -122.4350,
    confidenceScore: 0.71,
    imageUrl: 'sample_pothole_6.jpg',
    verified: false,
    detectionCount: 4,
    detectedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
  },

  // Haight-Ashbury
  {
    latitude: 37.7699,
    longitude: -122.4479,
    confidenceScore: 0.89,
    imageUrl: 'sample_pothole_7.jpg',
    verified: true,
    detectionCount: 6,
    detectedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
  },
  {
    latitude: 37.7719,
    longitude: -122.4489,
    confidenceScore: 0.76,
    imageUrl: 'sample_pothole_8.jpg',
    verified: false,
    detectionCount: 2,
    detectedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
  },

  // Financial District
  {
    latitude: 37.7946,
    longitude: -122.4020,
    confidenceScore: 0.88,
    imageUrl: 'sample_pothole_9.jpg',
    verified: true,
    detectionCount: 7,
    detectedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
  },
  {
    latitude: 37.7956,
    longitude: -122.4040,
    confidenceScore: 0.65,
    imageUrl: 'sample_pothole_10.jpg',
    verified: false,
    detectionCount: 1,
    detectedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
  },

  // SOMA (South of Market)
  {
    latitude: 37.7749,
    longitude: -122.3994,
    confidenceScore: 0.91,
    imageUrl: 'sample_pothole_11.jpg',
    verified: true,
    detectionCount: 9,
    detectedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
  },
  {
    latitude: 37.7789,
    longitude: -122.4020,
    confidenceScore: 0.74,
    imageUrl: 'sample_pothole_12.jpg',
    verified: false,
    detectionCount: 3,
    detectedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
  },

  // Richmond District
  {
    latitude: 37.7799,
    longitude: -122.4699,
    confidenceScore: 0.82,
    imageUrl: 'sample_pothole_13.jpg',
    verified: true,
    detectionCount: 5,
    detectedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
  },

  // Sunset District
  {
    latitude: 37.7549,
    longitude: -122.4649,
    confidenceScore: 0.79,
    imageUrl: 'sample_pothole_14.jpg',
    verified: false,
    detectionCount: 2,
    detectedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
  },

  // Oakland (Bay Area)
  {
    latitude: 37.8044,
    longitude: -122.2708,
    confidenceScore: 0.86,
    imageUrl: 'sample_pothole_15.jpg',
    verified: true,
    detectionCount: 4,
    detectedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
  },
];

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB successfully');

    // Clear existing potholes
    console.log('Clearing existing potholes...');
    await PotholeModel.deleteMany({});
    console.log('Existing potholes cleared');

    // Insert sample potholes
    console.log('Inserting sample potholes...');
    const insertedPotholes = await PotholeModel.insertMany(samplePotholes);
    console.log(`Successfully inserted ${insertedPotholes.length} sample potholes`);

    // Display summary
    console.log('\n--- Seeding Summary ---');
    console.log(`Total potholes: ${insertedPotholes.length}`);
    console.log(`Verified potholes: ${insertedPotholes.filter(p => p.verified).length}`);
    console.log(`Unverified potholes: ${insertedPotholes.filter(p => !p.verified).length}`);
    console.log(`Average confidence: ${(insertedPotholes.reduce((sum, p) => sum + p.confidenceScore, 0) / insertedPotholes.length * 100).toFixed(1)}%`);
    console.log(`Total detection count: ${insertedPotholes.reduce((sum, p) => sum + p.detectionCount, 0)}`);

    console.log('\nSample pothole locations:');
    insertedPotholes.slice(0, 5).forEach((pothole, index) => {
      console.log(`  ${index + 1}. ${pothole.latitude.toFixed(6)}, ${pothole.longitude.toFixed(6)} (${pothole.verified ? 'Verified' : 'Unverified'})`);
    });

    console.log('\n🎉 Database seeded successfully!');
    console.log('You can now view the potholes on the map frontend.');

  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the seed script
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}

export default seedDatabase;