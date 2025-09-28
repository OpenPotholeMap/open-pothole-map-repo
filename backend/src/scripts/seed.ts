import mongoose from 'mongoose';
import { PotholeModel, UserModel } from '@/models/index.js';
import { MONGO_URI } from '@/config/envs.js';
import bcrypt from 'bcrypt';

// Sample pothole data for San Francisco Bay Area
const samplePotholes = [
  // San Francisco Downtown
  {
    latitude: 37.7849,
    longitude: -122.4094,
    confidenceScore: 0.92,
    images: [
      'https://images.unsplash.com/photo-1545147986-a9d91dae4d83?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1541746972996-4e0b0f93e586?w=400&h=400&fit=crop'
    ],
    verified: true,
    detectionCount: 5,
    detectedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  },
  {
    latitude: 37.7749,
    longitude: -122.4194,
    confidenceScore: 0.87,
    images: [
      'https://images.unsplash.com/photo-1560707303-4e980ce876ad?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop'
    ],
    verified: true,
    detectionCount: 3,
    detectedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
  },
  {
    latitude: 37.7849,
    longitude: -122.4074,
    confidenceScore: 0.78,
    images: [
      'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1589840491270-b9c7b9bb6ead?w=400&h=400&fit=crop'
    ],
    verified: false,
    detectionCount: 2,
    detectedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
  },

  // Mission District
  {
    latitude: 37.7599,
    longitude: -122.4148,
    confidenceScore: 0.95,
    images: [
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1562813733-b31f71025d54?w=400&h=400&fit=crop'
    ],
    verified: true,
    detectionCount: 8,
    detectedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
  },
  {
    latitude: 37.7699,
    longitude: -122.4169,
    confidenceScore: 0.83,
    images: [
      'https://images.unsplash.com/photo-1565024275156-5d6c24b91e52?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1548802673-380ab8ebc7b7?w=400&h=400&fit=crop'
    ],
    verified: false,
    detectionCount: 1,
    detectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },

  // Castro District
  {
    latitude: 37.7609,
    longitude: -122.4350,
    confidenceScore: 0.71,
    images: [
      'https://images.unsplash.com/photo-1562813733-cbb6a4a50bb9?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1552083375-1447ce886485?w=400&h=400&fit=crop'
    ],
    verified: false,
    detectionCount: 4,
    detectedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
  },

  // Haight-Ashbury
  {
    latitude: 37.7699,
    longitude: -122.4479,
    confidenceScore: 0.89,
    images: [
      'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop'
    ],
    verified: true,
    detectionCount: 6,
    detectedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
  },
  {
    latitude: 37.7719,
    longitude: -122.4489,
    confidenceScore: 0.76,
    images: [
      'https://images.unsplash.com/photo-1556909114-5bb81b2a5b9c?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1563298723-dcfebaa392e3?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop'
    ],
    verified: false,
    detectionCount: 2,
    detectedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
  },

  // Financial District
  {
    latitude: 37.7946,
    longitude: -122.4020,
    confidenceScore: 0.88,
    images: [
      'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&h=400&fit=crop'
    ],
    verified: true,
    detectionCount: 7,
    detectedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
  },
  {
    latitude: 37.7956,
    longitude: -122.4040,
    confidenceScore: 0.65,
    images: [
      'https://images.unsplash.com/photo-1512362172647-6e8da3ed2bce?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=400&fit=crop'
    ],
    verified: false,
    detectionCount: 1,
    detectedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
  },

  // SOMA (South of Market)
  {
    latitude: 37.7749,
    longitude: -122.3994,
    confidenceScore: 0.91,
    images: [
      'https://images.unsplash.com/photo-1544966503-7cc5ac882d5a?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1571677217382-0821a9b0f89f?w=400&h=400&fit=crop'
    ],
    verified: true,
    detectionCount: 9,
    detectedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
  },
  {
    latitude: 37.7789,
    longitude: -122.4020,
    confidenceScore: 0.74,
    images: [
      'https://images.unsplash.com/photo-1611095973484-d6c2849e80dd?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=400&h=400&fit=crop'
    ],
    verified: false,
    detectionCount: 3,
    detectedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
  },

  // Richmond District
  {
    latitude: 37.7799,
    longitude: -122.4699,
    confidenceScore: 0.82,
    images: [
      'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1578409168668-5eff7d7e6e0f?w=400&h=400&fit=crop'
    ],
    verified: true,
    detectionCount: 5,
    detectedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
  },

  // Sunset District
  {
    latitude: 37.7549,
    longitude: -122.4649,
    confidenceScore: 0.79,
    images: [
      'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&h=400&fit=crop'
    ],
    verified: false,
    detectionCount: 2,
    detectedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
  },

  // Oakland (Bay Area)
  {
    latitude: 37.8044,
    longitude: -122.2708,
    confidenceScore: 0.86,
    images: [
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1572737174289-5e3b30b3b93c?w=400&h=400&fit=crop'
    ],
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

    // Clear existing data
    console.log('Clearing existing data...');
    await PotholeModel.deleteMany({});
    await UserModel.deleteMany({});
    console.log('Existing data cleared');

    // Create admin user
    console.log('Creating admin user...');
    const hashedPassword = await bcrypt.hash('Admin@123!', 10);
    const adminUser = new UserModel({
      email: 'admin@potholeapp.com',
      username: 'admin',
      encryptedPassword: hashedPassword,
      role: 'admin'
    });
    await adminUser.save();
    console.log('Admin user created successfully');
    console.log('Admin credentials:');
    console.log('  Email: admin@potholeapp.com');
    console.log('  Password: Admin@123!');

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