const { connectDB, disconnectDB } = require('../src/config/database');
const Amenity = require('../src/models/amenity.model');
const logger = require('../src/config/logger');

const standardPlans = [
  {
    planId: 'PER_DAY',
    name: 'Per Day Pass',
    durationDays: 1,
    priceInPaise: 2500, // ₹25
    isActive: true
  },
  {
    planId: 'PER_WEEK',
    name: 'Weekly Access',
    durationDays: 7,
    priceInPaise: 12400, // ₹124
    isActive: true
  },
  {
    planId: 'PER_MONTH',
    name: 'Monthly Membership',
    durationDays: 30,
    priceInPaise: 40000, // ₹400
    isActive: true
  },
  {
    planId: 'THREE_MONTHS',
    name: 'Quarterly Membership (3 Months)',
    durationDays: 90,
    priceInPaise: 100000, // ₹1,000
    isActive: true
  }
];

const seedAmenities = async () => {
  try {
    await connectDB();

    const initialAmenities = [
      {
        name: 'Society Gym & Fitness Club',
        slug: 'gym',
        description: 'Fully equipped modern gymnasium with cardio, free weights, and cross-fit equipment.',
        openingTime: '06:00',
        closingTime: '22:00',
        rules: [
          'Proper gym attire and clean indoor sports shoes mandatory.',
          'Wipe down equipment after every set.',
          'Access strictly permitted only for valid digital card holders.'
        ],
        plans: standardPlans,
        isActive: true
      },
      {
        name: 'Clubhouse Games Room',
        slug: 'games-room',
        description: 'Recreation games room featuring table tennis, pool tables, foosball, and board games.',
        openingTime: '08:00',
        closingTime: '23:00',
        rules: [
          'Handle pool cues and TT racquets with care.',
          'Maximum 45 minutes playtime during peak hours if other members are waiting.',
          'Food and open drinks not allowed near the equipment.'
        ],
        plans: standardPlans,
        isActive: true
      }
    ];

    for (const item of initialAmenities) {
      const existing = await Amenity.findOne({ slug: item.slug });
      if (!existing) {
        await Amenity.create(item);
        logger.info(`Seeded amenity: ${item.name}`);
      } else {
        logger.info(`Amenity already exists: ${item.name}`);
      }
    }

    logger.info('Amenity catalog seeding completed successfully');
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to seed amenities');
    await disconnectDB();
    process.exit(1);
  }
};

seedAmenities();
