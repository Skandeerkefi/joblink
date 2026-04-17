require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Job = require('./models/Job');
const Application = require('./models/Application');

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    await User.deleteMany({});
    await Job.deleteMany({});
    await Application.deleteMany({});
    console.log('Cleared existing data');

    const candidate = await User.create({
      name: 'Test Candidate',
      email: 'test@candidate.com',
      password: 'password123',
      role: 'candidate',
      emailVerified: true,
    });

    const recruiter = await User.create({
      name: 'Test Recruiter',
      email: 'test@recruiter.com',
      password: 'password123',
      role: 'recruiter',
      emailVerified: true,
    });

    const admin = await User.create({
      name: 'Test Admin',
      email: 'test@admin.com',
      password: 'password123',
      role: 'admin',
      emailVerified: true,
    });

    console.log(`Created users: ${candidate.email}, ${recruiter.email}, ${admin.email}`);

    const jobs = await Job.insertMany([
      {
        recruiter: recruiter._id,
        title: 'Senior Software Engineer',
        description: 'We are looking for a Senior Software Engineer to join our growing team. You will be responsible for designing, developing, and maintaining scalable web applications.',
        location: 'San Francisco, CA',
        jobType: 'FULL_TIME',
        category: 'SOFTWARE_ENGINEERING',
        skills: ['Node.js', 'React', 'MongoDB', 'AWS'],
      },
      {
        recruiter: recruiter._id,
        title: 'Data Scientist',
        description: 'Join our data team to build ML models and derive insights from large datasets. Experience with Python and ML frameworks required.',
        location: 'New York, NY',
        jobType: 'FULL_TIME',
        category: 'DATA',
        skills: ['Python', 'TensorFlow', 'SQL', 'Tableau'],
      },
      {
        recruiter: recruiter._id,
        title: 'UX Designer',
        description: 'Create beautiful, user-centered designs for our products. You will work closely with product and engineering teams.',
        location: 'Remote',
        jobType: 'REMOTE',
        category: 'UI_UX',
        skills: ['Figma', 'Adobe XD', 'User Research', 'Prototyping'],
      },
      {
        recruiter: recruiter._id,
        title: 'Product Manager',
        description: 'Lead product development from ideation to launch. You will define product strategy and work with cross-functional teams.',
        location: 'Austin, TX',
        jobType: 'FULL_TIME',
        category: 'PRODUCT',
        skills: ['Product Strategy', 'Agile', 'Roadmapping', 'Analytics'],
      },
      {
        recruiter: recruiter._id,
        title: 'Cybersecurity Analyst',
        description: 'Protect our systems and networks from cyber threats. Monitor, detect, and respond to security incidents.',
        location: 'Washington, DC',
        jobType: 'CONTRACT',
        category: 'CYBERSECURITY',
        skills: ['SIEM', 'Penetration Testing', 'Incident Response', 'NIST'],
      },
    ]);

    console.log(`Created ${jobs.length} jobs`);
    console.log('Seeding completed successfully!');
    console.log('\nTest accounts:');
    console.log('  Candidate: test@candidate.com / password123');
    console.log('  Recruiter: test@recruiter.com / password123');
    console.log('  Admin: test@admin.com / password123');
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

seedDB();
