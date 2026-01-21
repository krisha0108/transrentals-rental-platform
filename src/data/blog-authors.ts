import { Author } from '@/types/blog';

export const blogAuthors: Author[] = [
  {
    id: '1',
    name: 'Priya Sharma',
    slug: 'priya-sharma',
    bio: 'Travel enthusiast and automotive expert with 8+ years of experience in the Indian car rental industry. Passionate about helping travelers discover the best road trip routes across India.',
    avatar: '/images/authors/priya-sharma.jpg',
    role: 'Senior Travel Writer',
    socialLinks: {
      twitter: 'https://twitter.com/priyasharma',
      linkedin: 'https://linkedin.com/in/priyasharma',
      instagram: 'https://instagram.com/priya.travels',
    },
    postCount: 45,
  },
  {
    id: '2',
    name: 'Rajesh Kumar',
    slug: 'rajesh-kumar',
    bio: 'Adventure travel specialist and bike enthusiast. Has explored every corner of India on two wheels. Expert in bike rentals, Leh Ladakh trips, and motorcycle maintenance.',
    avatar: '/images/authors/rajesh-kumar.jpg',
    role: 'Adventure Travel Expert',
    socialLinks: {
      instagram: 'https://instagram.com/rajesh.rides',
      facebook: 'https://facebook.com/rajeshkumar',
    },
    postCount: 38,
  },
  {
    id: '3',
    name: 'Sneha Patel',
    slug: 'sneha-patel',
    bio: 'Destination expert specializing in South India travel. Former corporate travel manager turned travel blogger. Helps families and groups plan perfect vacations.',
    avatar: '/images/authors/sneha-patel.jpg',
    role: 'Destination Specialist',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/snehapatel',
      twitter: 'https://twitter.com/snehapatel',
    },
    postCount: 32,
  },
  {
    id: '4',
    name: 'Amit Verma',
    slug: 'amit-verma',
    bio: 'Wedding and events specialist with expertise in luxury car rentals. Helps couples choose the perfect vehicles for their special day. 10+ years in event transportation.',
    avatar: '/images/authors/amit-verma.jpg',
    role: 'Wedding & Events Expert',
    socialLinks: {
      instagram: 'https://instagram.com/amit.events',
      facebook: 'https://facebook.com/amitverma',
    },
    postCount: 28,
  },
  {
    id: '5',
    name: 'Kavita Singh',
    slug: 'kavita-singh',
    bio: 'Budget travel expert and corporate travel consultant. Specializes in finding the best deals on car and bike rentals across India. Passionate about making travel affordable for everyone.',
    avatar: '/images/authors/kavita-singh.jpg',
    role: 'Budget Travel Consultant',
    socialLinks: {
      twitter: 'https://twitter.com/kavitasingh',
      linkedin: 'https://linkedin.com/in/kavitasingh',
    },
    postCount: 24,
  },
  {
    id: '6',
    name: 'Arjun Mehta',
    slug: 'arjun-mehta',
    bio: 'Luxury travel and exotic car specialist. Expert in sports car rentals, vintage cars, and premium travel experiences across India. Former automotive journalist.',
    avatar: '/images/authors/arjun-mehta.jpg',
    role: 'Luxury Travel Expert',
    socialLinks: {
      instagram: 'https://instagram.com/arjun.luxury',
      linkedin: 'https://linkedin.com/in/arjunmehta',
    },
    postCount: 20,
  },
];

export const getAuthorBySlug = (slug: string): Author | undefined => {
  return blogAuthors.find((author) => author.slug === slug);
};

export const getAuthorById = (id: string): Author | undefined => {
  return blogAuthors.find((author) => author.id === id);
};
