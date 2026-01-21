/**
 * Comprehensive list of ALL Indian States, UTs, and Towns
 * Tier 1-5 classification for SEO optimization
 * Every town gets a page for every service = God Level SEO
 */

export interface City {
  name: string;
  slug: string;
  state: string;
  stateCode: string;
  tier: 1 | 2 | 3 | 4 | 5;
  population?: number;
  keywords: string[];
  priority: number; // 1-10, 10 being highest for SEO
}

// All Indian States and Union Territories
export const INDIAN_STATES = [
  { name: 'Andhra Pradesh', code: 'AP' },
  { name: 'Arunachal Pradesh', code: 'AR' },
  { name: 'Assam', code: 'AS' },
  { name: 'Bihar', code: 'BR' },
  { name: 'Chhattisgarh', code: 'CT' },
  { name: 'Goa', code: 'GA' },
  { name: 'Gujarat', code: 'GJ' },
  { name: 'Haryana', code: 'HR' },
  { name: 'Himachal Pradesh', code: 'HP' },
  { name: 'Jharkhand', code: 'JH' },
  { name: 'Karnataka', code: 'KA' },
  { name: 'Kerala', code: 'KL' },
  { name: 'Madhya Pradesh', code: 'MP' },
  { name: 'Maharashtra', code: 'MH' },
  { name: 'Manipur', code: 'MN' },
  { name: 'Meghalaya', code: 'ML' },
  { name: 'Mizoram', code: 'MZ' },
  { name: 'Nagaland', code: 'NL' },
  { name: 'Odisha', code: 'OR' },
  { name: 'Punjab', code: 'PB' },
  { name: 'Rajasthan', code: 'RJ' },
  { name: 'Sikkim', code: 'SK' },
  { name: 'Tamil Nadu', code: 'TN' },
  { name: 'Telangana', code: 'TS' },
  { name: 'Tripura', code: 'TR' },
  { name: 'Uttar Pradesh', code: 'UP' },
  { name: 'Uttarakhand', code: 'UK' },
  { name: 'West Bengal', code: 'WB' },
  // Union Territories
  { name: 'Andaman and Nicobar Islands', code: 'AN' },
  { name: 'Chandigarh', code: 'CH' },
  { name: 'Dadra and Nagar Haveli and Daman and Diu', code: 'DD' },
  { name: 'Delhi', code: 'DL' },
  { name: 'Jammu and Kashmir', code: 'JK' },
  { name: 'Ladakh', code: 'LA' },
  { name: 'Lakshadweep', code: 'LD' },
  { name: 'Puducherry', code: 'PY' },
];

// ============================================
// TIER 1 - Metro Cities (Top 8)
// ============================================
export const TIER_1_CITIES: City[] = [
  { name: 'Mumbai', slug: 'mumbai', state: 'Maharashtra', stateCode: 'MH', tier: 1, population: 20411000, keywords: ['mumbai', 'bombay'], priority: 10 },
  { name: 'Delhi', slug: 'delhi', state: 'Delhi', stateCode: 'DL', tier: 1, population: 16787941, keywords: ['delhi', 'new delhi', 'ncr'], priority: 10 },
  { name: 'Bangalore', slug: 'bangalore', state: 'Karnataka', stateCode: 'KA', tier: 1, population: 12765000, keywords: ['bangalore', 'bengaluru'], priority: 10 },
  { name: 'Hyderabad', slug: 'hyderabad', state: 'Telangana', stateCode: 'TS', tier: 1, population: 10004000, keywords: ['hyderabad', 'secunderabad'], priority: 10 },
  { name: 'Chennai', slug: 'chennai', state: 'Tamil Nadu', stateCode: 'TN', tier: 1, population: 10971108, keywords: ['chennai', 'madras'], priority: 10 },
  { name: 'Kolkata', slug: 'kolkata', state: 'West Bengal', stateCode: 'WB', tier: 1, population: 14850066, keywords: ['kolkata', 'calcutta'], priority: 10 },
  { name: 'Ahmedabad', slug: 'ahmedabad', state: 'Gujarat', stateCode: 'GJ', tier: 1, population: 8450228, keywords: ['ahmedabad', 'amdavad'], priority: 10 },
  { name: 'Pune', slug: 'pune', state: 'Maharashtra', stateCode: 'MH', tier: 1, population: 7276000, keywords: ['pune'], priority: 10 },
];

// ============================================
// TIER 2 - Major Cities (50+ lakh population or state capitals)
// ============================================
export const TIER_2_CITIES: City[] = [
  // Maharashtra
  { name: 'Thane', slug: 'thane', state: 'Maharashtra', stateCode: 'MH', tier: 2, keywords: ['thane'], priority: 9 },
  { name: 'Navi Mumbai', slug: 'navi-mumbai', state: 'Maharashtra', stateCode: 'MH', tier: 2, keywords: ['navi mumbai'], priority: 9 },
  { name: 'Nagpur', slug: 'nagpur', state: 'Maharashtra', stateCode: 'MH', tier: 2, keywords: ['nagpur'], priority: 9 },
  // Gujarat
  { name: 'Surat', slug: 'surat', state: 'Gujarat', stateCode: 'GJ', tier: 2, keywords: ['surat'], priority: 9 },
  { name: 'Vadodara', slug: 'vadodara', state: 'Gujarat', stateCode: 'GJ', tier: 2, keywords: ['vadodara', 'baroda'], priority: 9 },
  { name: 'Rajkot', slug: 'rajkot', state: 'Gujarat', stateCode: 'GJ', tier: 2, keywords: ['rajkot'], priority: 9 },
  // Rajasthan
  { name: 'Jaipur', slug: 'jaipur', state: 'Rajasthan', stateCode: 'RJ', tier: 2, keywords: ['jaipur', 'pink city'], priority: 9 },
  { name: 'Jodhpur', slug: 'jodhpur', state: 'Rajasthan', stateCode: 'RJ', tier: 2, keywords: ['jodhpur', 'blue city'], priority: 9 },
  // Uttar Pradesh
  { name: 'Lucknow', slug: 'lucknow', state: 'Uttar Pradesh', stateCode: 'UP', tier: 2, keywords: ['lucknow'], priority: 9 },
  { name: 'Kanpur', slug: 'kanpur', state: 'Uttar Pradesh', stateCode: 'UP', tier: 2, keywords: ['kanpur'], priority: 9 },
  { name: 'Ghaziabad', slug: 'ghaziabad', state: 'Uttar Pradesh', stateCode: 'UP', tier: 2, keywords: ['ghaziabad'], priority: 9 },
  { name: 'Noida', slug: 'noida', state: 'Uttar Pradesh', stateCode: 'UP', tier: 2, keywords: ['noida'], priority: 9 },
  { name: 'Agra', slug: 'agra', state: 'Uttar Pradesh', stateCode: 'UP', tier: 2, keywords: ['agra', 'taj city'], priority: 9 },
  { name: 'Varanasi', slug: 'varanasi', state: 'Uttar Pradesh', stateCode: 'UP', tier: 2, keywords: ['varanasi', 'banaras', 'kashi'], priority: 9 },
  // Madhya Pradesh
  { name: 'Indore', slug: 'indore', state: 'Madhya Pradesh', stateCode: 'MP', tier: 2, keywords: ['indore'], priority: 9 },
  { name: 'Bhopal', slug: 'bhopal', state: 'Madhya Pradesh', stateCode: 'MP', tier: 2, keywords: ['bhopal'], priority: 9 },
  // Bihar
  { name: 'Patna', slug: 'patna', state: 'Bihar', stateCode: 'BR', tier: 2, keywords: ['patna'], priority: 9 },
  // Haryana
  { name: 'Gurgaon', slug: 'gurgaon', state: 'Haryana', stateCode: 'HR', tier: 2, keywords: ['gurgaon', 'gurugram'], priority: 9 },
  { name: 'Faridabad', slug: 'faridabad', state: 'Haryana', stateCode: 'HR', tier: 2, keywords: ['faridabad'], priority: 9 },
  // Andhra Pradesh
  { name: 'Visakhapatnam', slug: 'visakhapatnam', state: 'Andhra Pradesh', stateCode: 'AP', tier: 2, keywords: ['visakhapatnam', 'vizag'], priority: 9 },
  { name: 'Vijayawada', slug: 'vijayawada', state: 'Andhra Pradesh', stateCode: 'AP', tier: 2, keywords: ['vijayawada'], priority: 9 },
  // Tamil Nadu
  { name: 'Coimbatore', slug: 'coimbatore', state: 'Tamil Nadu', stateCode: 'TN', tier: 2, keywords: ['coimbatore'], priority: 9 },
  { name: 'Madurai', slug: 'madurai', state: 'Tamil Nadu', stateCode: 'TN', tier: 2, keywords: ['madurai'], priority: 9 },
  // Kerala
  { name: 'Kochi', slug: 'kochi', state: 'Kerala', stateCode: 'KL', tier: 2, keywords: ['kochi', 'cochin'], priority: 9 },
  { name: 'Thiruvananthapuram', slug: 'thiruvananthapuram', state: 'Kerala', stateCode: 'KL', tier: 2, keywords: ['thiruvananthapuram', 'trivandrum'], priority: 9 },
  // Karnataka
  { name: 'Mysore', slug: 'mysore', state: 'Karnataka', stateCode: 'KA', tier: 2, keywords: ['mysore', 'mysuru'], priority: 9 },
  { name: 'Mangalore', slug: 'mangalore', state: 'Karnataka', stateCode: 'KA', tier: 2, keywords: ['mangalore', 'mangaluru'], priority: 9 },
  // Punjab
  { name: 'Ludhiana', slug: 'ludhiana', state: 'Punjab', stateCode: 'PB', tier: 2, keywords: ['ludhiana'], priority: 9 },
  { name: 'Amritsar', slug: 'amritsar', state: 'Punjab', stateCode: 'PB', tier: 2, keywords: ['amritsar', 'golden temple'], priority: 9 },
  // Chandigarh
  { name: 'Chandigarh', slug: 'chandigarh', state: 'Chandigarh', stateCode: 'CH', tier: 2, keywords: ['chandigarh'], priority: 9 },
  // Jharkhand
  { name: 'Ranchi', slug: 'ranchi', state: 'Jharkhand', stateCode: 'JH', tier: 2, keywords: ['ranchi'], priority: 9 },
  { name: 'Jamshedpur', slug: 'jamshedpur', state: 'Jharkhand', stateCode: 'JH', tier: 2, keywords: ['jamshedpur'], priority: 9 },
  // Chhattisgarh
  { name: 'Raipur', slug: 'raipur', state: 'Chhattisgarh', stateCode: 'CT', tier: 2, keywords: ['raipur'], priority: 9 },
  // Odisha
  { name: 'Bhubaneswar', slug: 'bhubaneswar', state: 'Odisha', stateCode: 'OR', tier: 2, keywords: ['bhubaneswar'], priority: 9 },
  // Assam
  { name: 'Guwahati', slug: 'guwahati', state: 'Assam', stateCode: 'AS', tier: 2, keywords: ['guwahati'], priority: 9 },
  // Uttarakhand
  { name: 'Dehradun', slug: 'dehradun', state: 'Uttarakhand', stateCode: 'UK', tier: 2, keywords: ['dehradun'], priority: 9 },
  // J&K
  { name: 'Srinagar', slug: 'srinagar', state: 'Jammu and Kashmir', stateCode: 'JK', tier: 2, keywords: ['srinagar'], priority: 9 },
  { name: 'Jammu', slug: 'jammu', state: 'Jammu and Kashmir', stateCode: 'JK', tier: 2, keywords: ['jammu'], priority: 9 },
  // Goa
  { name: 'Goa', slug: 'goa', state: 'Goa', stateCode: 'GA', tier: 2, keywords: ['goa', 'panaji'], priority: 10 },
];

// ============================================
// TIER 3 - District HQs & Major Towns (All States)
// ============================================
export const TIER_3_CITIES: City[] = [
  // ANDHRA PRADESH
  { name: 'Tirupati', slug: 'tirupati', state: 'Andhra Pradesh', stateCode: 'AP', tier: 3, keywords: ['tirupati'], priority: 8 },
  { name: 'Guntur', slug: 'guntur', state: 'Andhra Pradesh', stateCode: 'AP', tier: 3, keywords: ['guntur'], priority: 8 },
  { name: 'Nellore', slug: 'nellore', state: 'Andhra Pradesh', stateCode: 'AP', tier: 3, keywords: ['nellore'], priority: 8 },
  { name: 'Kurnool', slug: 'kurnool', state: 'Andhra Pradesh', stateCode: 'AP', tier: 3, keywords: ['kurnool'], priority: 7 },
  { name: 'Rajahmundry', slug: 'rajahmundry', state: 'Andhra Pradesh', stateCode: 'AP', tier: 3, keywords: ['rajahmundry'], priority: 7 },
  { name: 'Kakinada', slug: 'kakinada', state: 'Andhra Pradesh', stateCode: 'AP', tier: 3, keywords: ['kakinada'], priority: 7 },
  { name: 'Kadapa', slug: 'kadapa', state: 'Andhra Pradesh', stateCode: 'AP', tier: 3, keywords: ['kadapa', 'cuddapah'], priority: 7 },
  { name: 'Anantapur', slug: 'anantapur', state: 'Andhra Pradesh', stateCode: 'AP', tier: 3, keywords: ['anantapur'], priority: 7 },
  { name: 'Eluru', slug: 'eluru', state: 'Andhra Pradesh', stateCode: 'AP', tier: 3, keywords: ['eluru'], priority: 7 },
  { name: 'Ongole', slug: 'ongole', state: 'Andhra Pradesh', stateCode: 'AP', tier: 3, keywords: ['ongole'], priority: 7 },
  { name: 'Srikakulam', slug: 'srikakulam', state: 'Andhra Pradesh', stateCode: 'AP', tier: 3, keywords: ['srikakulam'], priority: 7 },
  { name: 'Chittoor', slug: 'chittoor', state: 'Andhra Pradesh', stateCode: 'AP', tier: 3, keywords: ['chittoor'], priority: 7 },
  { name: 'Machilipatnam', slug: 'machilipatnam', state: 'Andhra Pradesh', stateCode: 'AP', tier: 3, keywords: ['machilipatnam'], priority: 6 },
  { name: 'Tenali', slug: 'tenali', state: 'Andhra Pradesh', stateCode: 'AP', tier: 3, keywords: ['tenali'], priority: 6 },
  { name: 'Proddatur', slug: 'proddatur', state: 'Andhra Pradesh', stateCode: 'AP', tier: 3, keywords: ['proddatur'], priority: 6 },
  { name: 'Nandyal', slug: 'nandyal', state: 'Andhra Pradesh', stateCode: 'AP', tier: 3, keywords: ['nandyal'], priority: 6 },
  { name: 'Amaravati', slug: 'amaravati', state: 'Andhra Pradesh', stateCode: 'AP', tier: 3, keywords: ['amaravati'], priority: 8 },

  // ARUNACHAL PRADESH
  { name: 'Itanagar', slug: 'itanagar', state: 'Arunachal Pradesh', stateCode: 'AR', tier: 3, keywords: ['itanagar'], priority: 7 },
  { name: 'Naharlagun', slug: 'naharlagun', state: 'Arunachal Pradesh', stateCode: 'AR', tier: 3, keywords: ['naharlagun'], priority: 6 },
  { name: 'Pasighat', slug: 'pasighat', state: 'Arunachal Pradesh', stateCode: 'AR', tier: 3, keywords: ['pasighat'], priority: 6 },
  { name: 'Tawang', slug: 'tawang', state: 'Arunachal Pradesh', stateCode: 'AR', tier: 3, keywords: ['tawang'], priority: 7 },
  { name: 'Ziro', slug: 'ziro', state: 'Arunachal Pradesh', stateCode: 'AR', tier: 3, keywords: ['ziro'], priority: 7 },
  { name: 'Bomdila', slug: 'bomdila', state: 'Arunachal Pradesh', stateCode: 'AR', tier: 3, keywords: ['bomdila'], priority: 6 },
  { name: 'Along', slug: 'along', state: 'Arunachal Pradesh', stateCode: 'AR', tier: 3, keywords: ['along'], priority: 6 },
  { name: 'Tezu', slug: 'tezu', state: 'Arunachal Pradesh', stateCode: 'AR', tier: 3, keywords: ['tezu'], priority: 6 },

  // ASSAM
  { name: 'Dibrugarh', slug: 'dibrugarh', state: 'Assam', stateCode: 'AS', tier: 3, keywords: ['dibrugarh'], priority: 7 },
  { name: 'Silchar', slug: 'silchar', state: 'Assam', stateCode: 'AS', tier: 3, keywords: ['silchar'], priority: 7 },
  { name: 'Jorhat', slug: 'jorhat', state: 'Assam', stateCode: 'AS', tier: 3, keywords: ['jorhat'], priority: 7 },
  { name: 'Nagaon', slug: 'nagaon', state: 'Assam', stateCode: 'AS', tier: 3, keywords: ['nagaon'], priority: 7 },
  { name: 'Tinsukia', slug: 'tinsukia', state: 'Assam', stateCode: 'AS', tier: 3, keywords: ['tinsukia'], priority: 7 },
  { name: 'Tezpur', slug: 'tezpur', state: 'Assam', stateCode: 'AS', tier: 3, keywords: ['tezpur'], priority: 7 },
  { name: 'Bongaigaon', slug: 'bongaigaon', state: 'Assam', stateCode: 'AS', tier: 3, keywords: ['bongaigaon'], priority: 6 },
  { name: 'Karimganj', slug: 'karimganj', state: 'Assam', stateCode: 'AS', tier: 3, keywords: ['karimganj'], priority: 6 },
  { name: 'Sivasagar', slug: 'sivasagar', state: 'Assam', stateCode: 'AS', tier: 3, keywords: ['sivasagar'], priority: 6 },
  { name: 'Goalpara', slug: 'goalpara', state: 'Assam', stateCode: 'AS', tier: 3, keywords: ['goalpara'], priority: 6 },
  { name: 'Diphu', slug: 'diphu', state: 'Assam', stateCode: 'AS', tier: 3, keywords: ['diphu'], priority: 6 },
  { name: 'North Lakhimpur', slug: 'north-lakhimpur', state: 'Assam', stateCode: 'AS', tier: 3, keywords: ['north lakhimpur'], priority: 6 },
  { name: 'Dhubri', slug: 'dhubri', state: 'Assam', stateCode: 'AS', tier: 3, keywords: ['dhubri'], priority: 6 },
  { name: 'Kaziranga', slug: 'kaziranga', state: 'Assam', stateCode: 'AS', tier: 3, keywords: ['kaziranga'], priority: 8 },
  { name: 'Majuli', slug: 'majuli', state: 'Assam', stateCode: 'AS', tier: 3, keywords: ['majuli'], priority: 7 },

  // BIHAR
  { name: 'Gaya', slug: 'gaya', state: 'Bihar', stateCode: 'BR', tier: 3, keywords: ['gaya', 'bodh gaya'], priority: 8 },
  { name: 'Bhagalpur', slug: 'bhagalpur', state: 'Bihar', stateCode: 'BR', tier: 3, keywords: ['bhagalpur'], priority: 7 },
  { name: 'Muzaffarpur', slug: 'muzaffarpur', state: 'Bihar', stateCode: 'BR', tier: 3, keywords: ['muzaffarpur'], priority: 7 },
  { name: 'Purnia', slug: 'purnia', state: 'Bihar', stateCode: 'BR', tier: 3, keywords: ['purnia'], priority: 7 },
  { name: 'Darbhanga', slug: 'darbhanga', state: 'Bihar', stateCode: 'BR', tier: 3, keywords: ['darbhanga'], priority: 7 },
  { name: 'Bihar Sharif', slug: 'bihar-sharif', state: 'Bihar', stateCode: 'BR', tier: 3, keywords: ['bihar sharif'], priority: 6 },
  { name: 'Arrah', slug: 'arrah', state: 'Bihar', stateCode: 'BR', tier: 3, keywords: ['arrah'], priority: 6 },
  { name: 'Begusarai', slug: 'begusarai', state: 'Bihar', stateCode: 'BR', tier: 3, keywords: ['begusarai'], priority: 6 },
  { name: 'Katihar', slug: 'katihar', state: 'Bihar', stateCode: 'BR', tier: 3, keywords: ['katihar'], priority: 6 },
  { name: 'Munger', slug: 'munger', state: 'Bihar', stateCode: 'BR', tier: 3, keywords: ['munger'], priority: 6 },
  { name: 'Chhapra', slug: 'chhapra', state: 'Bihar', stateCode: 'BR', tier: 3, keywords: ['chhapra'], priority: 6 },
  { name: 'Samastipur', slug: 'samastipur', state: 'Bihar', stateCode: 'BR', tier: 3, keywords: ['samastipur'], priority: 6 },
  { name: 'Hajipur', slug: 'hajipur', state: 'Bihar', stateCode: 'BR', tier: 3, keywords: ['hajipur'], priority: 6 },
  { name: 'Sasaram', slug: 'sasaram', state: 'Bihar', stateCode: 'BR', tier: 3, keywords: ['sasaram'], priority: 6 },
  { name: 'Dehri', slug: 'dehri', state: 'Bihar', stateCode: 'BR', tier: 3, keywords: ['dehri'], priority: 6 },
  { name: 'Siwan', slug: 'siwan', state: 'Bihar', stateCode: 'BR', tier: 3, keywords: ['siwan'], priority: 6 },
  { name: 'Motihari', slug: 'motihari', state: 'Bihar', stateCode: 'BR', tier: 3, keywords: ['motihari'], priority: 6 },
  { name: 'Nawada', slug: 'nawada', state: 'Bihar', stateCode: 'BR', tier: 3, keywords: ['nawada'], priority: 6 },
  { name: 'Bodh Gaya', slug: 'bodh-gaya', state: 'Bihar', stateCode: 'BR', tier: 3, keywords: ['bodh gaya', 'bodhgaya'], priority: 8 },
  { name: 'Rajgir', slug: 'rajgir', state: 'Bihar', stateCode: 'BR', tier: 3, keywords: ['rajgir'], priority: 7 },
  { name: 'Nalanda', slug: 'nalanda', state: 'Bihar', stateCode: 'BR', tier: 3, keywords: ['nalanda'], priority: 7 },
  { name: 'Vaishali', slug: 'vaishali', state: 'Bihar', stateCode: 'BR', tier: 3, keywords: ['vaishali'], priority: 7 },

  // CHHATTISGARH
  { name: 'Bhilai', slug: 'bhilai', state: 'Chhattisgarh', stateCode: 'CT', tier: 3, keywords: ['bhilai'], priority: 7 },
  { name: 'Bilaspur', slug: 'bilaspur-cg', state: 'Chhattisgarh', stateCode: 'CT', tier: 3, keywords: ['bilaspur'], priority: 7 },
  { name: 'Korba', slug: 'korba', state: 'Chhattisgarh', stateCode: 'CT', tier: 3, keywords: ['korba'], priority: 7 },
  { name: 'Durg', slug: 'durg', state: 'Chhattisgarh', stateCode: 'CT', tier: 3, keywords: ['durg'], priority: 7 },
  { name: 'Rajnandgaon', slug: 'rajnandgaon', state: 'Chhattisgarh', stateCode: 'CT', tier: 3, keywords: ['rajnandgaon'], priority: 6 },
  { name: 'Jagdalpur', slug: 'jagdalpur', state: 'Chhattisgarh', stateCode: 'CT', tier: 3, keywords: ['jagdalpur'], priority: 7 },
  { name: 'Raigarh', slug: 'raigarh', state: 'Chhattisgarh', stateCode: 'CT', tier: 3, keywords: ['raigarh'], priority: 6 },
  { name: 'Ambikapur', slug: 'ambikapur', state: 'Chhattisgarh', stateCode: 'CT', tier: 3, keywords: ['ambikapur'], priority: 6 },
  { name: 'Dhamtari', slug: 'dhamtari', state: 'Chhattisgarh', stateCode: 'CT', tier: 3, keywords: ['dhamtari'], priority: 6 },
  { name: 'Mahasamund', slug: 'mahasamund', state: 'Chhattisgarh', stateCode: 'CT', tier: 3, keywords: ['mahasamund'], priority: 6 },
  { name: 'Chitrakote', slug: 'chitrakote', state: 'Chhattisgarh', stateCode: 'CT', tier: 3, keywords: ['chitrakote', 'chitrakoot falls'], priority: 7 },

  // GOA
  { name: 'Panaji', slug: 'panaji', state: 'Goa', stateCode: 'GA', tier: 3, keywords: ['panaji', 'panjim'], priority: 8 },
  { name: 'Margao', slug: 'margao', state: 'Goa', stateCode: 'GA', tier: 3, keywords: ['margao', 'madgaon'], priority: 8 },
  { name: 'Vasco da Gama', slug: 'vasco', state: 'Goa', stateCode: 'GA', tier: 3, keywords: ['vasco', 'vasco da gama'], priority: 8 },
  { name: 'Mapusa', slug: 'mapusa', state: 'Goa', stateCode: 'GA', tier: 3, keywords: ['mapusa'], priority: 7 },
  { name: 'Ponda', slug: 'ponda', state: 'Goa', stateCode: 'GA', tier: 3, keywords: ['ponda'], priority: 7 },
  { name: 'Calangute', slug: 'calangute', state: 'Goa', stateCode: 'GA', tier: 3, keywords: ['calangute'], priority: 9 },
  { name: 'Baga', slug: 'baga', state: 'Goa', stateCode: 'GA', tier: 3, keywords: ['baga'], priority: 9 },
  { name: 'Anjuna', slug: 'anjuna', state: 'Goa', stateCode: 'GA', tier: 3, keywords: ['anjuna'], priority: 8 },
  { name: 'Candolim', slug: 'candolim', state: 'Goa', stateCode: 'GA', tier: 3, keywords: ['candolim'], priority: 8 },
  { name: 'Vagator', slug: 'vagator', state: 'Goa', stateCode: 'GA', tier: 3, keywords: ['vagator'], priority: 8 },
  { name: 'Arambol', slug: 'arambol', state: 'Goa', stateCode: 'GA', tier: 3, keywords: ['arambol'], priority: 7 },
  { name: 'Morjim', slug: 'morjim', state: 'Goa', stateCode: 'GA', tier: 3, keywords: ['morjim'], priority: 7 },
  { name: 'Palolem', slug: 'palolem', state: 'Goa', stateCode: 'GA', tier: 3, keywords: ['palolem'], priority: 8 },
  { name: 'Colva', slug: 'colva', state: 'Goa', stateCode: 'GA', tier: 3, keywords: ['colva'], priority: 8 },
  { name: 'Benaulim', slug: 'benaulim', state: 'Goa', stateCode: 'GA', tier: 3, keywords: ['benaulim'], priority: 7 },
  { name: 'Old Goa', slug: 'old-goa', state: 'Goa', stateCode: 'GA', tier: 3, keywords: ['old goa'], priority: 8 },
  { name: 'Dudhsagar', slug: 'dudhsagar', state: 'Goa', stateCode: 'GA', tier: 3, keywords: ['dudhsagar'], priority: 8 },

  // GUJARAT
  { name: 'Gandhinagar', slug: 'gandhinagar', state: 'Gujarat', stateCode: 'GJ', tier: 3, keywords: ['gandhinagar'], priority: 8 },
  { name: 'Bhavnagar', slug: 'bhavnagar', state: 'Gujarat', stateCode: 'GJ', tier: 3, keywords: ['bhavnagar'], priority: 7 },
  { name: 'Jamnagar', slug: 'jamnagar', state: 'Gujarat', stateCode: 'GJ', tier: 3, keywords: ['jamnagar'], priority: 7 },
  { name: 'Junagadh', slug: 'junagadh', state: 'Gujarat', stateCode: 'GJ', tier: 3, keywords: ['junagadh'], priority: 7 },
  { name: 'Anand', slug: 'anand', state: 'Gujarat', stateCode: 'GJ', tier: 3, keywords: ['anand'], priority: 7 },
  { name: 'Bharuch', slug: 'bharuch', state: 'Gujarat', stateCode: 'GJ', tier: 3, keywords: ['bharuch'], priority: 7 },
  { name: 'Navsari', slug: 'navsari', state: 'Gujarat', stateCode: 'GJ', tier: 3, keywords: ['navsari'], priority: 7 },
  { name: 'Valsad', slug: 'valsad', state: 'Gujarat', stateCode: 'GJ', tier: 3, keywords: ['valsad'], priority: 7 },
  { name: 'Porbandar', slug: 'porbandar', state: 'Gujarat', stateCode: 'GJ', tier: 3, keywords: ['porbandar'], priority: 7 },
  { name: 'Morbi', slug: 'morbi', state: 'Gujarat', stateCode: 'GJ', tier: 3, keywords: ['morbi'], priority: 6 },
  { name: 'Mehsana', slug: 'mehsana', state: 'Gujarat', stateCode: 'GJ', tier: 3, keywords: ['mehsana'], priority: 6 },
  { name: 'Nadiad', slug: 'nadiad', state: 'Gujarat', stateCode: 'GJ', tier: 3, keywords: ['nadiad'], priority: 6 },
  { name: 'Surendranagar', slug: 'surendranagar', state: 'Gujarat', stateCode: 'GJ', tier: 3, keywords: ['surendranagar'], priority: 6 },
  { name: 'Palanpur', slug: 'palanpur', state: 'Gujarat', stateCode: 'GJ', tier: 3, keywords: ['palanpur'], priority: 6 },
  { name: 'Veraval', slug: 'veraval', state: 'Gujarat', stateCode: 'GJ', tier: 3, keywords: ['veraval'], priority: 7 },
  { name: 'Somnath', slug: 'somnath', state: 'Gujarat', stateCode: 'GJ', tier: 3, keywords: ['somnath'], priority: 8 },
  { name: 'Dwarka', slug: 'dwarka', state: 'Gujarat', stateCode: 'GJ', tier: 3, keywords: ['dwarka'], priority: 8 },
  { name: 'Gir', slug: 'gir', state: 'Gujarat', stateCode: 'GJ', tier: 3, keywords: ['gir', 'gir forest'], priority: 8 },
  { name: 'Kutch', slug: 'kutch', state: 'Gujarat', stateCode: 'GJ', tier: 3, keywords: ['kutch', 'rann of kutch'], priority: 8 },
  { name: 'Bhuj', slug: 'bhuj', state: 'Gujarat', stateCode: 'GJ', tier: 3, keywords: ['bhuj'], priority: 7 },
  { name: 'Diu', slug: 'diu', state: 'Gujarat', stateCode: 'GJ', tier: 3, keywords: ['diu'], priority: 7 },
  { name: 'Saputara', slug: 'saputara', state: 'Gujarat', stateCode: 'GJ', tier: 3, keywords: ['saputara'], priority: 7 },
  { name: 'Statue of Unity', slug: 'statue-of-unity', state: 'Gujarat', stateCode: 'GJ', tier: 3, keywords: ['statue of unity', 'kevadia'], priority: 8 },

  // HARYANA
  { name: 'Ambala', slug: 'ambala', state: 'Haryana', stateCode: 'HR', tier: 3, keywords: ['ambala'], priority: 7 },
  { name: 'Panipat', slug: 'panipat', state: 'Haryana', stateCode: 'HR', tier: 3, keywords: ['panipat'], priority: 7 },
  { name: 'Karnal', slug: 'karnal', state: 'Haryana', stateCode: 'HR', tier: 3, keywords: ['karnal'], priority: 7 },
  { name: 'Rohtak', slug: 'rohtak', state: 'Haryana', stateCode: 'HR', tier: 3, keywords: ['rohtak'], priority: 7 },
  { name: 'Hisar', slug: 'hisar', state: 'Haryana', stateCode: 'HR', tier: 3, keywords: ['hisar'], priority: 7 },
  { name: 'Sonipat', slug: 'sonipat', state: 'Haryana', stateCode: 'HR', tier: 3, keywords: ['sonipat'], priority: 7 },
  { name: 'Yamunanagar', slug: 'yamunanagar', state: 'Haryana', stateCode: 'HR', tier: 3, keywords: ['yamunanagar'], priority: 6 },
  { name: 'Panchkula', slug: 'panchkula', state: 'Haryana', stateCode: 'HR', tier: 3, keywords: ['panchkula'], priority: 7 },
  { name: 'Bhiwani', slug: 'bhiwani', state: 'Haryana', stateCode: 'HR', tier: 3, keywords: ['bhiwani'], priority: 6 },
  { name: 'Sirsa', slug: 'sirsa', state: 'Haryana', stateCode: 'HR', tier: 3, keywords: ['sirsa'], priority: 6 },
  { name: 'Rewari', slug: 'rewari', state: 'Haryana', stateCode: 'HR', tier: 3, keywords: ['rewari'], priority: 6 },
  { name: 'Jind', slug: 'jind', state: 'Haryana', stateCode: 'HR', tier: 3, keywords: ['jind'], priority: 6 },
  { name: 'Kaithal', slug: 'kaithal', state: 'Haryana', stateCode: 'HR', tier: 3, keywords: ['kaithal'], priority: 6 },
  { name: 'Kurukshetra', slug: 'kurukshetra', state: 'Haryana', stateCode: 'HR', tier: 3, keywords: ['kurukshetra'], priority: 7 },
  { name: 'Bahadurgarh', slug: 'bahadurgarh', state: 'Haryana', stateCode: 'HR', tier: 3, keywords: ['bahadurgarh'], priority: 6 },
  { name: 'Manesar', slug: 'manesar', state: 'Haryana', stateCode: 'HR', tier: 3, keywords: ['manesar'], priority: 7 },

  // HIMACHAL PRADESH
  { name: 'Shimla', slug: 'shimla', state: 'Himachal Pradesh', stateCode: 'HP', tier: 3, keywords: ['shimla'], priority: 9 },
  { name: 'Manali', slug: 'manali', state: 'Himachal Pradesh', stateCode: 'HP', tier: 3, keywords: ['manali'], priority: 10 },
  { name: 'Dharamshala', slug: 'dharamshala', state: 'Himachal Pradesh', stateCode: 'HP', tier: 3, keywords: ['dharamshala'], priority: 8 },
  { name: 'Kullu', slug: 'kullu', state: 'Himachal Pradesh', stateCode: 'HP', tier: 3, keywords: ['kullu'], priority: 8 },
  { name: 'Dalhousie', slug: 'dalhousie', state: 'Himachal Pradesh', stateCode: 'HP', tier: 3, keywords: ['dalhousie'], priority: 8 },
  { name: 'McLeodganj', slug: 'mcleodganj', state: 'Himachal Pradesh', stateCode: 'HP', tier: 3, keywords: ['mcleodganj'], priority: 8 },
  { name: 'Kasol', slug: 'kasol', state: 'Himachal Pradesh', stateCode: 'HP', tier: 3, keywords: ['kasol'], priority: 8 },
  { name: 'Kasauli', slug: 'kasauli', state: 'Himachal Pradesh', stateCode: 'HP', tier: 3, keywords: ['kasauli'], priority: 7 },
  { name: 'Mandi', slug: 'mandi', state: 'Himachal Pradesh', stateCode: 'HP', tier: 3, keywords: ['mandi'], priority: 7 },
  { name: 'Solan', slug: 'solan', state: 'Himachal Pradesh', stateCode: 'HP', tier: 3, keywords: ['solan'], priority: 7 },
  { name: 'Una', slug: 'una', state: 'Himachal Pradesh', stateCode: 'HP', tier: 3, keywords: ['una'], priority: 6 },
  { name: 'Chamba', slug: 'chamba', state: 'Himachal Pradesh', stateCode: 'HP', tier: 3, keywords: ['chamba'], priority: 7 },
  { name: 'Kangra', slug: 'kangra', state: 'Himachal Pradesh', stateCode: 'HP', tier: 3, keywords: ['kangra'], priority: 7 },
  { name: 'Palampur', slug: 'palampur', state: 'Himachal Pradesh', stateCode: 'HP', tier: 3, keywords: ['palampur'], priority: 7 },
  { name: 'Spiti Valley', slug: 'spiti', state: 'Himachal Pradesh', stateCode: 'HP', tier: 3, keywords: ['spiti', 'spiti valley'], priority: 8 },
  { name: 'Kinnaur', slug: 'kinnaur', state: 'Himachal Pradesh', stateCode: 'HP', tier: 3, keywords: ['kinnaur'], priority: 7 },
  { name: 'Lahaul', slug: 'lahaul', state: 'Himachal Pradesh', stateCode: 'HP', tier: 3, keywords: ['lahaul'], priority: 7 },
  { name: 'Bir Billing', slug: 'bir-billing', state: 'Himachal Pradesh', stateCode: 'HP', tier: 3, keywords: ['bir billing', 'bir'], priority: 8 },
  { name: 'Kufri', slug: 'kufri', state: 'Himachal Pradesh', stateCode: 'HP', tier: 3, keywords: ['kufri'], priority: 7 },
  { name: 'Chail', slug: 'chail', state: 'Himachal Pradesh', stateCode: 'HP', tier: 3, keywords: ['chail'], priority: 7 },
  { name: 'Khajjiar', slug: 'khajjiar', state: 'Himachal Pradesh', stateCode: 'HP', tier: 3, keywords: ['khajjiar'], priority: 7 },
  { name: 'Narkanda', slug: 'narkanda', state: 'Himachal Pradesh', stateCode: 'HP', tier: 3, keywords: ['narkanda'], priority: 6 },
  { name: 'Manikaran', slug: 'manikaran', state: 'Himachal Pradesh', stateCode: 'HP', tier: 3, keywords: ['manikaran'], priority: 7 },
  { name: 'Rohtang Pass', slug: 'rohtang', state: 'Himachal Pradesh', stateCode: 'HP', tier: 3, keywords: ['rohtang', 'rohtang pass'], priority: 8 },
  { name: 'Solang Valley', slug: 'solang', state: 'Himachal Pradesh', stateCode: 'HP', tier: 3, keywords: ['solang', 'solang valley'], priority: 8 },

  // JHARKHAND
  { name: 'Dhanbad', slug: 'dhanbad', state: 'Jharkhand', stateCode: 'JH', tier: 3, keywords: ['dhanbad'], priority: 7 },
  { name: 'Bokaro', slug: 'bokaro', state: 'Jharkhand', stateCode: 'JH', tier: 3, keywords: ['bokaro'], priority: 7 },
  { name: 'Hazaribagh', slug: 'hazaribagh', state: 'Jharkhand', stateCode: 'JH', tier: 3, keywords: ['hazaribagh'], priority: 6 },
  { name: 'Deoghar', slug: 'deoghar', state: 'Jharkhand', stateCode: 'JH', tier: 3, keywords: ['deoghar'], priority: 7 },
  { name: 'Giridih', slug: 'giridih', state: 'Jharkhand', stateCode: 'JH', tier: 3, keywords: ['giridih'], priority: 6 },
  { name: 'Ramgarh', slug: 'ramgarh', state: 'Jharkhand', stateCode: 'JH', tier: 3, keywords: ['ramgarh'], priority: 6 },
  { name: 'Chaibasa', slug: 'chaibasa', state: 'Jharkhand', stateCode: 'JH', tier: 3, keywords: ['chaibasa'], priority: 6 },
  { name: 'Dumka', slug: 'dumka', state: 'Jharkhand', stateCode: 'JH', tier: 3, keywords: ['dumka'], priority: 6 },
  { name: 'Netarhat', slug: 'netarhat', state: 'Jharkhand', stateCode: 'JH', tier: 3, keywords: ['netarhat'], priority: 7 },
  { name: 'Betla', slug: 'betla', state: 'Jharkhand', stateCode: 'JH', tier: 3, keywords: ['betla'], priority: 6 },

  // KARNATAKA
  { name: 'Hubli-Dharwad', slug: 'hubli', state: 'Karnataka', stateCode: 'KA', tier: 3, keywords: ['hubli', 'dharwad'], priority: 7 },
  { name: 'Belgaum', slug: 'belgaum', state: 'Karnataka', stateCode: 'KA', tier: 3, keywords: ['belgaum', 'belagavi'], priority: 7 },
  { name: 'Gulbarga', slug: 'gulbarga', state: 'Karnataka', stateCode: 'KA', tier: 3, keywords: ['gulbarga', 'kalaburagi'], priority: 7 },
  { name: 'Davangere', slug: 'davangere', state: 'Karnataka', stateCode: 'KA', tier: 3, keywords: ['davangere'], priority: 6 },
  { name: 'Bellary', slug: 'bellary', state: 'Karnataka', stateCode: 'KA', tier: 3, keywords: ['bellary', 'ballari'], priority: 6 },
  { name: 'Bijapur', slug: 'bijapur', state: 'Karnataka', stateCode: 'KA', tier: 3, keywords: ['bijapur', 'vijayapura'], priority: 7 },
  { name: 'Shimoga', slug: 'shimoga', state: 'Karnataka', stateCode: 'KA', tier: 3, keywords: ['shimoga', 'shivamogga'], priority: 6 },
  { name: 'Tumkur', slug: 'tumkur', state: 'Karnataka', stateCode: 'KA', tier: 3, keywords: ['tumkur'], priority: 6 },
  { name: 'Raichur', slug: 'raichur', state: 'Karnataka', stateCode: 'KA', tier: 3, keywords: ['raichur'], priority: 6 },
  { name: 'Bidar', slug: 'bidar', state: 'Karnataka', stateCode: 'KA', tier: 3, keywords: ['bidar'], priority: 6 },
  { name: 'Hospet', slug: 'hospet', state: 'Karnataka', stateCode: 'KA', tier: 3, keywords: ['hospet'], priority: 7 },
  { name: 'Hassan', slug: 'hassan', state: 'Karnataka', stateCode: 'KA', tier: 3, keywords: ['hassan'], priority: 6 },
  { name: 'Udupi', slug: 'udupi', state: 'Karnataka', stateCode: 'KA', tier: 3, keywords: ['udupi'], priority: 7 },
  { name: 'Chikmagalur', slug: 'chikmagalur', state: 'Karnataka', stateCode: 'KA', tier: 3, keywords: ['chikmagalur'], priority: 8 },
  { name: 'Coorg', slug: 'coorg', state: 'Karnataka', stateCode: 'KA', tier: 3, keywords: ['coorg', 'kodagu', 'madikeri'], priority: 8 },
  { name: 'Hampi', slug: 'hampi', state: 'Karnataka', stateCode: 'KA', tier: 3, keywords: ['hampi'], priority: 8 },
  { name: 'Gokarna', slug: 'gokarna', state: 'Karnataka', stateCode: 'KA', tier: 3, keywords: ['gokarna'], priority: 8 },
  { name: 'Badami', slug: 'badami', state: 'Karnataka', stateCode: 'KA', tier: 3, keywords: ['badami'], priority: 7 },
  { name: 'Aihole', slug: 'aihole', state: 'Karnataka', stateCode: 'KA', tier: 3, keywords: ['aihole'], priority: 6 },
  { name: 'Pattadakal', slug: 'pattadakal', state: 'Karnataka', stateCode: 'KA', tier: 3, keywords: ['pattadakal'], priority: 6 },
  { name: 'Sravanabelagola', slug: 'sravanabelagola', state: 'Karnataka', stateCode: 'KA', tier: 3, keywords: ['sravanabelagola'], priority: 7 },
  { name: 'Belur', slug: 'belur', state: 'Karnataka', stateCode: 'KA', tier: 3, keywords: ['belur'], priority: 6 },
  { name: 'Halebidu', slug: 'halebidu', state: 'Karnataka', stateCode: 'KA', tier: 3, keywords: ['halebidu'], priority: 6 },
  { name: 'Bandipur', slug: 'bandipur', state: 'Karnataka', stateCode: 'KA', tier: 3, keywords: ['bandipur'], priority: 7 },
  { name: 'Nagarhole', slug: 'nagarhole', state: 'Karnataka', stateCode: 'KA', tier: 3, keywords: ['nagarhole'], priority: 7 },
  { name: 'Karwar', slug: 'karwar', state: 'Karnataka', stateCode: 'KA', tier: 3, keywords: ['karwar'], priority: 6 },
  { name: 'Murudeshwar', slug: 'murudeshwar', state: 'Karnataka', stateCode: 'KA', tier: 3, keywords: ['murudeshwar'], priority: 7 },

  // KERALA
  { name: 'Kozhikode', slug: 'kozhikode', state: 'Kerala', stateCode: 'KL', tier: 3, keywords: ['kozhikode', 'calicut'], priority: 7 },
  { name: 'Thrissur', slug: 'thrissur', state: 'Kerala', stateCode: 'KL', tier: 3, keywords: ['thrissur'], priority: 7 },
  { name: 'Kollam', slug: 'kollam', state: 'Kerala', stateCode: 'KL', tier: 3, keywords: ['kollam'], priority: 7 },
  { name: 'Kannur', slug: 'kannur', state: 'Kerala', stateCode: 'KL', tier: 3, keywords: ['kannur'], priority: 7 },
  { name: 'Palakkad', slug: 'palakkad', state: 'Kerala', stateCode: 'KL', tier: 3, keywords: ['palakkad', 'palghat'], priority: 6 },
  { name: 'Alappuzha', slug: 'alappuzha', state: 'Kerala', stateCode: 'KL', tier: 3, keywords: ['alappuzha', 'alleppey'], priority: 8 },
  { name: 'Kottayam', slug: 'kottayam', state: 'Kerala', stateCode: 'KL', tier: 3, keywords: ['kottayam'], priority: 7 },
  { name: 'Munnar', slug: 'munnar', state: 'Kerala', stateCode: 'KL', tier: 3, keywords: ['munnar'], priority: 9 },
  { name: 'Wayanad', slug: 'wayanad', state: 'Kerala', stateCode: 'KL', tier: 3, keywords: ['wayanad'], priority: 8 },
  { name: 'Thekkady', slug: 'thekkady', state: 'Kerala', stateCode: 'KL', tier: 3, keywords: ['thekkady', 'periyar'], priority: 8 },
  { name: 'Kovalam', slug: 'kovalam', state: 'Kerala', stateCode: 'KL', tier: 3, keywords: ['kovalam'], priority: 8 },
  { name: 'Varkala', slug: 'varkala', state: 'Kerala', stateCode: 'KL', tier: 3, keywords: ['varkala'], priority: 8 },
  { name: 'Kumarakom', slug: 'kumarakom', state: 'Kerala', stateCode: 'KL', tier: 3, keywords: ['kumarakom'], priority: 8 },
  { name: 'Guruvayur', slug: 'guruvayur', state: 'Kerala', stateCode: 'KL', tier: 3, keywords: ['guruvayur'], priority: 7 },
  { name: 'Fort Kochi', slug: 'fort-kochi', state: 'Kerala', stateCode: 'KL', tier: 3, keywords: ['fort kochi', 'fort cochin'], priority: 8 },
  { name: 'Athirapally', slug: 'athirapally', state: 'Kerala', stateCode: 'KL', tier: 3, keywords: ['athirapally'], priority: 7 },
  { name: 'Bekal', slug: 'bekal', state: 'Kerala', stateCode: 'KL', tier: 3, keywords: ['bekal'], priority: 6 },
  { name: 'Idukki', slug: 'idukki', state: 'Kerala', stateCode: 'KL', tier: 3, keywords: ['idukki'], priority: 6 },
  { name: 'Vagamon', slug: 'vagamon', state: 'Kerala', stateCode: 'KL', tier: 3, keywords: ['vagamon'], priority: 7 },

  // Continue with remaining states...
];

// ============================================
// TIER 4 - Taluka/Tehsil HQs & Tourist Towns
// ============================================
export const TIER_4_CITIES: City[] = [
  // MADHYA PRADESH
  { name: 'Jabalpur', slug: 'jabalpur', state: 'Madhya Pradesh', stateCode: 'MP', tier: 4, keywords: ['jabalpur'], priority: 7 },
  { name: 'Gwalior', slug: 'gwalior', state: 'Madhya Pradesh', stateCode: 'MP', tier: 4, keywords: ['gwalior'], priority: 7 },
  { name: 'Ujjain', slug: 'ujjain', state: 'Madhya Pradesh', stateCode: 'MP', tier: 4, keywords: ['ujjain'], priority: 8 },
  { name: 'Sagar', slug: 'sagar', state: 'Madhya Pradesh', stateCode: 'MP', tier: 4, keywords: ['sagar'], priority: 6 },
  { name: 'Dewas', slug: 'dewas', state: 'Madhya Pradesh', stateCode: 'MP', tier: 4, keywords: ['dewas'], priority: 6 },
  { name: 'Satna', slug: 'satna', state: 'Madhya Pradesh', stateCode: 'MP', tier: 4, keywords: ['satna'], priority: 6 },
  { name: 'Ratlam', slug: 'ratlam', state: 'Madhya Pradesh', stateCode: 'MP', tier: 4, keywords: ['ratlam'], priority: 6 },
  { name: 'Rewa', slug: 'rewa', state: 'Madhya Pradesh', stateCode: 'MP', tier: 4, keywords: ['rewa'], priority: 6 },
  { name: 'Murwara', slug: 'murwara', state: 'Madhya Pradesh', stateCode: 'MP', tier: 4, keywords: ['murwara', 'katni'], priority: 6 },
  { name: 'Singrauli', slug: 'singrauli', state: 'Madhya Pradesh', stateCode: 'MP', tier: 4, keywords: ['singrauli'], priority: 6 },
  { name: 'Khajuraho', slug: 'khajuraho', state: 'Madhya Pradesh', stateCode: 'MP', tier: 4, keywords: ['khajuraho'], priority: 8 },
  { name: 'Sanchi', slug: 'sanchi', state: 'Madhya Pradesh', stateCode: 'MP', tier: 4, keywords: ['sanchi'], priority: 7 },
  { name: 'Orchha', slug: 'orchha', state: 'Madhya Pradesh', stateCode: 'MP', tier: 4, keywords: ['orchha'], priority: 7 },
  { name: 'Pachmarhi', slug: 'pachmarhi', state: 'Madhya Pradesh', stateCode: 'MP', tier: 4, keywords: ['pachmarhi'], priority: 8 },
  { name: 'Kanha', slug: 'kanha', state: 'Madhya Pradesh', stateCode: 'MP', tier: 4, keywords: ['kanha'], priority: 8 },
  { name: 'Bandhavgarh', slug: 'bandhavgarh', state: 'Madhya Pradesh', stateCode: 'MP', tier: 4, keywords: ['bandhavgarh'], priority: 8 },
  { name: 'Pench', slug: 'pench', state: 'Madhya Pradesh', stateCode: 'MP', tier: 4, keywords: ['pench'], priority: 7 },
  { name: 'Omkareshwar', slug: 'omkareshwar', state: 'Madhya Pradesh', stateCode: 'MP', tier: 4, keywords: ['omkareshwar'], priority: 7 },
  { name: 'Maheshwar', slug: 'maheshwar', state: 'Madhya Pradesh', stateCode: 'MP', tier: 4, keywords: ['maheshwar'], priority: 6 },
  { name: 'Mandu', slug: 'mandu', state: 'Madhya Pradesh', stateCode: 'MP', tier: 4, keywords: ['mandu'], priority: 7 },

  // MAHARASHTRA
  { name: 'Nashik', slug: 'nashik', state: 'Maharashtra', stateCode: 'MH', tier: 4, keywords: ['nashik'], priority: 8 },
  { name: 'Aurangabad', slug: 'aurangabad', state: 'Maharashtra', stateCode: 'MH', tier: 4, keywords: ['aurangabad'], priority: 8 },
  { name: 'Solapur', slug: 'solapur', state: 'Maharashtra', stateCode: 'MH', tier: 4, keywords: ['solapur'], priority: 7 },
  { name: 'Kolhapur', slug: 'kolhapur', state: 'Maharashtra', stateCode: 'MH', tier: 4, keywords: ['kolhapur'], priority: 7 },
  { name: 'Sangli', slug: 'sangli', state: 'Maharashtra', stateCode: 'MH', tier: 4, keywords: ['sangli'], priority: 6 },
  { name: 'Satara', slug: 'satara', state: 'Maharashtra', stateCode: 'MH', tier: 4, keywords: ['satara'], priority: 6 },
  { name: 'Ahmednagar', slug: 'ahmednagar', state: 'Maharashtra', stateCode: 'MH', tier: 4, keywords: ['ahmednagar'], priority: 6 },
  { name: 'Latur', slug: 'latur', state: 'Maharashtra', stateCode: 'MH', tier: 4, keywords: ['latur'], priority: 6 },
  { name: 'Dhule', slug: 'dhule', state: 'Maharashtra', stateCode: 'MH', tier: 4, keywords: ['dhule'], priority: 6 },
  { name: 'Akola', slug: 'akola', state: 'Maharashtra', stateCode: 'MH', tier: 4, keywords: ['akola'], priority: 6 },
  { name: 'Amravati', slug: 'amravati', state: 'Maharashtra', stateCode: 'MH', tier: 4, keywords: ['amravati'], priority: 6 },
  { name: 'Chandrapur', slug: 'chandrapur', state: 'Maharashtra', stateCode: 'MH', tier: 4, keywords: ['chandrapur'], priority: 6 },
  { name: 'Parbhani', slug: 'parbhani', state: 'Maharashtra', stateCode: 'MH', tier: 4, keywords: ['parbhani'], priority: 6 },
  { name: 'Nanded', slug: 'nanded', state: 'Maharashtra', stateCode: 'MH', tier: 4, keywords: ['nanded'], priority: 6 },
  { name: 'Jalgaon', slug: 'jalgaon', state: 'Maharashtra', stateCode: 'MH', tier: 4, keywords: ['jalgaon'], priority: 6 },
  { name: 'Beed', slug: 'beed', state: 'Maharashtra', stateCode: 'MH', tier: 4, keywords: ['beed'], priority: 6 },
  { name: 'Osmanabad', slug: 'osmanabad', state: 'Maharashtra', stateCode: 'MH', tier: 4, keywords: ['osmanabad'], priority: 6 },
  { name: 'Lonavala', slug: 'lonavala', state: 'Maharashtra', stateCode: 'MH', tier: 4, keywords: ['lonavala'], priority: 8 },
  { name: 'Mahabaleshwar', slug: 'mahabaleshwar', state: 'Maharashtra', stateCode: 'MH', tier: 4, keywords: ['mahabaleshwar'], priority: 8 },
  { name: 'Panchgani', slug: 'panchgani', state: 'Maharashtra', stateCode: 'MH', tier: 4, keywords: ['panchgani'], priority: 7 },
  { name: 'Matheran', slug: 'matheran', state: 'Maharashtra', stateCode: 'MH', tier: 4, keywords: ['matheran'], priority: 7 },
  { name: 'Alibaug', slug: 'alibaug', state: 'Maharashtra', stateCode: 'MH', tier: 4, keywords: ['alibaug', 'alibag'], priority: 8 },
  { name: 'Lavasa', slug: 'lavasa', state: 'Maharashtra', stateCode: 'MH', tier: 4, keywords: ['lavasa'], priority: 7 },
  { name: 'Igatpuri', slug: 'igatpuri', state: 'Maharashtra', stateCode: 'MH', tier: 4, keywords: ['igatpuri'], priority: 6 },
  { name: 'Shirdi', slug: 'shirdi', state: 'Maharashtra', stateCode: 'MH', tier: 4, keywords: ['shirdi'], priority: 9 },
  { name: 'Ajanta', slug: 'ajanta', state: 'Maharashtra', stateCode: 'MH', tier: 4, keywords: ['ajanta'], priority: 8 },
  { name: 'Ellora', slug: 'ellora', state: 'Maharashtra', stateCode: 'MH', tier: 4, keywords: ['ellora'], priority: 8 },
  { name: 'Trimbakeshwar', slug: 'trimbakeshwar', state: 'Maharashtra', stateCode: 'MH', tier: 4, keywords: ['trimbakeshwar'], priority: 7 },
  { name: 'Bhimashankar', slug: 'bhimashankar', state: 'Maharashtra', stateCode: 'MH', tier: 4, keywords: ['bhimashankar'], priority: 7 },
  { name: 'Ratnagiri', slug: 'ratnagiri', state: 'Maharashtra', stateCode: 'MH', tier: 4, keywords: ['ratnagiri'], priority: 7 },
  { name: 'Sindhudurg', slug: 'sindhudurg', state: 'Maharashtra', stateCode: 'MH', tier: 4, keywords: ['sindhudurg'], priority: 7 },
  { name: 'Tarkarli', slug: 'tarkarli', state: 'Maharashtra', stateCode: 'MH', tier: 4, keywords: ['tarkarli'], priority: 7 },
  { name: 'Ganpatipule', slug: 'ganpatipule', state: 'Maharashtra', stateCode: 'MH', tier: 4, keywords: ['ganpatipule'], priority: 7 },
  { name: 'Tadoba', slug: 'tadoba', state: 'Maharashtra', stateCode: 'MH', tier: 4, keywords: ['tadoba'], priority: 7 },
  { name: 'Pench', slug: 'pench-mh', state: 'Maharashtra', stateCode: 'MH', tier: 4, keywords: ['pench maharashtra'], priority: 6 },

  // MANIPUR
  { name: 'Imphal', slug: 'imphal', state: 'Manipur', stateCode: 'MN', tier: 4, keywords: ['imphal'], priority: 7 },
  { name: 'Thoubal', slug: 'thoubal', state: 'Manipur', stateCode: 'MN', tier: 4, keywords: ['thoubal'], priority: 6 },
  { name: 'Churachandpur', slug: 'churachandpur', state: 'Manipur', stateCode: 'MN', tier: 4, keywords: ['churachandpur'], priority: 6 },
  { name: 'Bishnupur', slug: 'bishnupur-mn', state: 'Manipur', stateCode: 'MN', tier: 4, keywords: ['bishnupur'], priority: 6 },
  { name: 'Ukhrul', slug: 'ukhrul', state: 'Manipur', stateCode: 'MN', tier: 4, keywords: ['ukhrul'], priority: 6 },
  { name: 'Loktak Lake', slug: 'loktak', state: 'Manipur', stateCode: 'MN', tier: 4, keywords: ['loktak lake'], priority: 7 },

  // MEGHALAYA
  { name: 'Shillong', slug: 'shillong', state: 'Meghalaya', stateCode: 'ML', tier: 4, keywords: ['shillong'], priority: 8 },
  { name: 'Cherrapunji', slug: 'cherrapunji', state: 'Meghalaya', stateCode: 'ML', tier: 4, keywords: ['cherrapunji', 'sohra'], priority: 8 },
  { name: 'Mawsynram', slug: 'mawsynram', state: 'Meghalaya', stateCode: 'ML', tier: 4, keywords: ['mawsynram'], priority: 7 },
  { name: 'Dawki', slug: 'dawki', state: 'Meghalaya', stateCode: 'ML', tier: 4, keywords: ['dawki'], priority: 8 },
  { name: 'Tura', slug: 'tura', state: 'Meghalaya', stateCode: 'ML', tier: 4, keywords: ['tura'], priority: 6 },
  { name: 'Jowai', slug: 'jowai', state: 'Meghalaya', stateCode: 'ML', tier: 4, keywords: ['jowai'], priority: 6 },
  { name: 'Mawlynnong', slug: 'mawlynnong', state: 'Meghalaya', stateCode: 'ML', tier: 4, keywords: ['mawlynnong'], priority: 7 },
  { name: 'Living Root Bridge', slug: 'living-root-bridge', state: 'Meghalaya', stateCode: 'ML', tier: 4, keywords: ['living root bridge'], priority: 8 },

  // MIZORAM
  { name: 'Aizawl', slug: 'aizawl', state: 'Mizoram', stateCode: 'MZ', tier: 4, keywords: ['aizawl'], priority: 7 },
  { name: 'Lunglei', slug: 'lunglei', state: 'Mizoram', stateCode: 'MZ', tier: 4, keywords: ['lunglei'], priority: 6 },
  { name: 'Champhai', slug: 'champhai', state: 'Mizoram', stateCode: 'MZ', tier: 4, keywords: ['champhai'], priority: 6 },
  { name: 'Serchhip', slug: 'serchhip', state: 'Mizoram', stateCode: 'MZ', tier: 4, keywords: ['serchhip'], priority: 6 },
  { name: 'Kolasib', slug: 'kolasib', state: 'Mizoram', stateCode: 'MZ', tier: 4, keywords: ['kolasib'], priority: 6 },

  // NAGALAND
  { name: 'Kohima', slug: 'kohima', state: 'Nagaland', stateCode: 'NL', tier: 4, keywords: ['kohima'], priority: 7 },
  { name: 'Dimapur', slug: 'dimapur', state: 'Nagaland', stateCode: 'NL', tier: 4, keywords: ['dimapur'], priority: 7 },
  { name: 'Mokokchung', slug: 'mokokchung', state: 'Nagaland', stateCode: 'NL', tier: 4, keywords: ['mokokchung'], priority: 6 },
  { name: 'Tuensang', slug: 'tuensang', state: 'Nagaland', stateCode: 'NL', tier: 4, keywords: ['tuensang'], priority: 6 },
  { name: 'Wokha', slug: 'wokha', state: 'Nagaland', stateCode: 'NL', tier: 4, keywords: ['wokha'], priority: 6 },
  { name: 'Mon', slug: 'mon', state: 'Nagaland', stateCode: 'NL', tier: 4, keywords: ['mon'], priority: 6 },
  { name: 'Hornbill Festival', slug: 'hornbill-festival', state: 'Nagaland', stateCode: 'NL', tier: 4, keywords: ['hornbill festival', 'kisama'], priority: 8 },

  // ODISHA
  { name: 'Cuttack', slug: 'cuttack', state: 'Odisha', stateCode: 'OR', tier: 4, keywords: ['cuttack'], priority: 7 },
  { name: 'Rourkela', slug: 'rourkela', state: 'Odisha', stateCode: 'OR', tier: 4, keywords: ['rourkela'], priority: 7 },
  { name: 'Berhampur', slug: 'berhampur', state: 'Odisha', stateCode: 'OR', tier: 4, keywords: ['berhampur', 'brahmapur'], priority: 6 },
  { name: 'Sambalpur', slug: 'sambalpur', state: 'Odisha', stateCode: 'OR', tier: 4, keywords: ['sambalpur'], priority: 6 },
  { name: 'Balasore', slug: 'balasore', state: 'Odisha', stateCode: 'OR', tier: 4, keywords: ['balasore'], priority: 6 },
  { name: 'Baripada', slug: 'baripada', state: 'Odisha', stateCode: 'OR', tier: 4, keywords: ['baripada'], priority: 6 },
  { name: 'Bhadrak', slug: 'bhadrak', state: 'Odisha', stateCode: 'OR', tier: 4, keywords: ['bhadrak'], priority: 6 },
  { name: 'Puri', slug: 'puri', state: 'Odisha', stateCode: 'OR', tier: 4, keywords: ['puri'], priority: 9 },
  { name: 'Konark', slug: 'konark', state: 'Odisha', stateCode: 'OR', tier: 4, keywords: ['konark'], priority: 8 },
  { name: 'Chilika', slug: 'chilika', state: 'Odisha', stateCode: 'OR', tier: 4, keywords: ['chilika'], priority: 8 },
  { name: 'Gopalpur', slug: 'gopalpur', state: 'Odisha', stateCode: 'OR', tier: 4, keywords: ['gopalpur'], priority: 7 },
  { name: 'Chandipur', slug: 'chandipur', state: 'Odisha', stateCode: 'OR', tier: 4, keywords: ['chandipur'], priority: 6 },
  { name: 'Simlipal', slug: 'simlipal', state: 'Odisha', stateCode: 'OR', tier: 4, keywords: ['simlipal'], priority: 7 },
  { name: 'Bhitarkanika', slug: 'bhitarkanika', state: 'Odisha', stateCode: 'OR', tier: 4, keywords: ['bhitarkanika'], priority: 7 },

  // PUNJAB
  { name: 'Jalandhar', slug: 'jalandhar', state: 'Punjab', stateCode: 'PB', tier: 4, keywords: ['jalandhar'], priority: 7 },
  { name: 'Patiala', slug: 'patiala', state: 'Punjab', stateCode: 'PB', tier: 4, keywords: ['patiala'], priority: 7 },
  { name: 'Bathinda', slug: 'bathinda', state: 'Punjab', stateCode: 'PB', tier: 4, keywords: ['bathinda'], priority: 7 },
  { name: 'Pathankot', slug: 'pathankot', state: 'Punjab', stateCode: 'PB', tier: 4, keywords: ['pathankot'], priority: 7 },
  { name: 'Hoshiarpur', slug: 'hoshiarpur', state: 'Punjab', stateCode: 'PB', tier: 4, keywords: ['hoshiarpur'], priority: 6 },
  { name: 'Batala', slug: 'batala', state: 'Punjab', stateCode: 'PB', tier: 4, keywords: ['batala'], priority: 6 },
  { name: 'Moga', slug: 'moga', state: 'Punjab', stateCode: 'PB', tier: 4, keywords: ['moga'], priority: 6 },
  { name: 'Malerkotla', slug: 'malerkotla', state: 'Punjab', stateCode: 'PB', tier: 4, keywords: ['malerkotla'], priority: 6 },
  { name: 'Khanna', slug: 'khanna', state: 'Punjab', stateCode: 'PB', tier: 4, keywords: ['khanna'], priority: 6 },
  { name: 'Phagwara', slug: 'phagwara', state: 'Punjab', stateCode: 'PB', tier: 4, keywords: ['phagwara'], priority: 6 },
  { name: 'Muktsar', slug: 'muktsar', state: 'Punjab', stateCode: 'PB', tier: 4, keywords: ['muktsar'], priority: 6 },
  { name: 'Rajpura', slug: 'rajpura', state: 'Punjab', stateCode: 'PB', tier: 4, keywords: ['rajpura'], priority: 6 },
  { name: 'Mohali', slug: 'mohali', state: 'Punjab', stateCode: 'PB', tier: 4, keywords: ['mohali'], priority: 7 },
  { name: 'Zirakpur', slug: 'zirakpur', state: 'Punjab', stateCode: 'PB', tier: 4, keywords: ['zirakpur'], priority: 7 },
  { name: 'Wagah Border', slug: 'wagah', state: 'Punjab', stateCode: 'PB', tier: 4, keywords: ['wagah', 'wagah border'], priority: 8 },

  // Continue with RAJASTHAN, SIKKIM, TAMIL NADU, TELANGANA, TRIPURA, UP, UTTARAKHAND, WEST BENGAL, UTs...
];

// ============================================
// TIER 5 - Small Towns & Villages
// ============================================
export const TIER_5_CITIES: City[] = [
  // RAJASTHAN
  { name: 'Udaipur', slug: 'udaipur', state: 'Rajasthan', stateCode: 'RJ', tier: 5, keywords: ['udaipur', 'city of lakes'], priority: 9 },
  { name: 'Jaisalmer', slug: 'jaisalmer', state: 'Rajasthan', stateCode: 'RJ', tier: 5, keywords: ['jaisalmer', 'golden city'], priority: 9 },
  { name: 'Kota', slug: 'kota', state: 'Rajasthan', stateCode: 'RJ', tier: 5, keywords: ['kota'], priority: 7 },
  { name: 'Bikaner', slug: 'bikaner', state: 'Rajasthan', stateCode: 'RJ', tier: 5, keywords: ['bikaner'], priority: 7 },
  { name: 'Ajmer', slug: 'ajmer', state: 'Rajasthan', stateCode: 'RJ', tier: 5, keywords: ['ajmer'], priority: 8 },
  { name: 'Pushkar', slug: 'pushkar', state: 'Rajasthan', stateCode: 'RJ', tier: 5, keywords: ['pushkar'], priority: 8 },
  { name: 'Mount Abu', slug: 'mount-abu', state: 'Rajasthan', stateCode: 'RJ', tier: 5, keywords: ['mount abu'], priority: 8 },
  { name: 'Alwar', slug: 'alwar', state: 'Rajasthan', stateCode: 'RJ', tier: 5, keywords: ['alwar'], priority: 6 },
  { name: 'Bhilwara', slug: 'bhilwara', state: 'Rajasthan', stateCode: 'RJ', tier: 5, keywords: ['bhilwara'], priority: 6 },
  { name: 'Sikar', slug: 'sikar', state: 'Rajasthan', stateCode: 'RJ', tier: 5, keywords: ['sikar'], priority: 6 },
  { name: 'Pali', slug: 'pali', state: 'Rajasthan', stateCode: 'RJ', tier: 5, keywords: ['pali'], priority: 6 },
  { name: 'Sri Ganganagar', slug: 'ganganagar', state: 'Rajasthan', stateCode: 'RJ', tier: 5, keywords: ['sri ganganagar'], priority: 6 },
  { name: 'Hanumangarh', slug: 'hanumangarh', state: 'Rajasthan', stateCode: 'RJ', tier: 5, keywords: ['hanumangarh'], priority: 6 },
  { name: 'Churu', slug: 'churu', state: 'Rajasthan', stateCode: 'RJ', tier: 5, keywords: ['churu'], priority: 6 },
  { name: 'Jhunjhunu', slug: 'jhunjhunu', state: 'Rajasthan', stateCode: 'RJ', tier: 5, keywords: ['jhunjhunu'], priority: 6 },
  { name: 'Nagaur', slug: 'nagaur', state: 'Rajasthan', stateCode: 'RJ', tier: 5, keywords: ['nagaur'], priority: 6 },
  { name: 'Chittorgarh', slug: 'chittorgarh', state: 'Rajasthan', stateCode: 'RJ', tier: 5, keywords: ['chittorgarh'], priority: 7 },
  { name: 'Bundi', slug: 'bundi', state: 'Rajasthan', stateCode: 'RJ', tier: 5, keywords: ['bundi'], priority: 7 },
  { name: 'Ranakpur', slug: 'ranakpur', state: 'Rajasthan', stateCode: 'RJ', tier: 5, keywords: ['ranakpur'], priority: 7 },
  { name: 'Kumbalgarh', slug: 'kumbalgarh', state: 'Rajasthan', stateCode: 'RJ', tier: 5, keywords: ['kumbalgarh'], priority: 7 },
  { name: 'Ranthambore', slug: 'ranthambore', state: 'Rajasthan', stateCode: 'RJ', tier: 5, keywords: ['ranthambore'], priority: 8 },
  { name: 'Sariska', slug: 'sariska', state: 'Rajasthan', stateCode: 'RJ', tier: 5, keywords: ['sariska'], priority: 7 },
  { name: 'Bharatpur', slug: 'bharatpur', state: 'Rajasthan', stateCode: 'RJ', tier: 5, keywords: ['bharatpur'], priority: 7 },
  { name: 'Keoladeo', slug: 'keoladeo', state: 'Rajasthan', stateCode: 'RJ', tier: 5, keywords: ['keoladeo'], priority: 7 },
  { name: 'Mandawa', slug: 'mandawa', state: 'Rajasthan', stateCode: 'RJ', tier: 5, keywords: ['mandawa'], priority: 7 },
  { name: 'Neemrana', slug: 'neemrana', state: 'Rajasthan', stateCode: 'RJ', tier: 5, keywords: ['neemrana'], priority: 7 },
  { name: 'Nathdwara', slug: 'nathdwara', state: 'Rajasthan', stateCode: 'RJ', tier: 5, keywords: ['nathdwara'], priority: 7 },
  { name: 'Jodhpur Desert', slug: 'jodhpur-desert', state: 'Rajasthan', stateCode: 'RJ', tier: 5, keywords: ['thar desert'], priority: 8 },
  { name: 'Sam Sand Dunes', slug: 'sam-sand-dunes', state: 'Rajasthan', stateCode: 'RJ', tier: 5, keywords: ['sam sand dunes'], priority: 8 },

  // SIKKIM
  { name: 'Gangtok', slug: 'gangtok', state: 'Sikkim', stateCode: 'SK', tier: 5, keywords: ['gangtok'], priority: 8 },
  { name: 'Pelling', slug: 'pelling', state: 'Sikkim', stateCode: 'SK', tier: 5, keywords: ['pelling'], priority: 7 },
  { name: 'Lachung', slug: 'lachung', state: 'Sikkim', stateCode: 'SK', tier: 5, keywords: ['lachung'], priority: 7 },
  { name: 'Lachen', slug: 'lachen', state: 'Sikkim', stateCode: 'SK', tier: 5, keywords: ['lachen'], priority: 7 },
  { name: 'Namchi', slug: 'namchi', state: 'Sikkim', stateCode: 'SK', tier: 5, keywords: ['namchi'], priority: 7 },
  { name: 'Ravangla', slug: 'ravangla', state: 'Sikkim', stateCode: 'SK', tier: 5, keywords: ['ravangla'], priority: 7 },
  { name: 'Yuksom', slug: 'yuksom', state: 'Sikkim', stateCode: 'SK', tier: 5, keywords: ['yuksom'], priority: 7 },
  { name: 'Tsomgo Lake', slug: 'tsomgo', state: 'Sikkim', stateCode: 'SK', tier: 5, keywords: ['tsomgo', 'changu lake'], priority: 7 },
  { name: 'Nathula Pass', slug: 'nathula', state: 'Sikkim', stateCode: 'SK', tier: 5, keywords: ['nathula', 'nathula pass'], priority: 8 },
  { name: 'Gurudongmar Lake', slug: 'gurudongmar', state: 'Sikkim', stateCode: 'SK', tier: 5, keywords: ['gurudongmar'], priority: 8 },

  // TAMIL NADU
  { name: 'Tiruchirappalli', slug: 'trichy', state: 'Tamil Nadu', stateCode: 'TN', tier: 5, keywords: ['trichy', 'tiruchirappalli'], priority: 7 },
  { name: 'Salem', slug: 'salem', state: 'Tamil Nadu', stateCode: 'TN', tier: 5, keywords: ['salem'], priority: 7 },
  { name: 'Tirunelveli', slug: 'tirunelveli', state: 'Tamil Nadu', stateCode: 'TN', tier: 5, keywords: ['tirunelveli'], priority: 6 },
  { name: 'Erode', slug: 'erode', state: 'Tamil Nadu', stateCode: 'TN', tier: 5, keywords: ['erode'], priority: 6 },
  { name: 'Vellore', slug: 'vellore', state: 'Tamil Nadu', stateCode: 'TN', tier: 5, keywords: ['vellore'], priority: 7 },
  { name: 'Thanjavur', slug: 'thanjavur', state: 'Tamil Nadu', stateCode: 'TN', tier: 5, keywords: ['thanjavur', 'tanjore'], priority: 7 },
  { name: 'Dindigul', slug: 'dindigul', state: 'Tamil Nadu', stateCode: 'TN', tier: 5, keywords: ['dindigul'], priority: 6 },
  { name: 'Ooty', slug: 'ooty', state: 'Tamil Nadu', stateCode: 'TN', tier: 5, keywords: ['ooty', 'udhagamandalam'], priority: 9 },
  { name: 'Kodaikanal', slug: 'kodaikanal', state: 'Tamil Nadu', stateCode: 'TN', tier: 5, keywords: ['kodaikanal'], priority: 9 },
  { name: 'Mahabalipuram', slug: 'mahabalipuram', state: 'Tamil Nadu', stateCode: 'TN', tier: 5, keywords: ['mahabalipuram', 'mamallapuram'], priority: 8 },
  { name: 'Kanyakumari', slug: 'kanyakumari', state: 'Tamil Nadu', stateCode: 'TN', tier: 5, keywords: ['kanyakumari'], priority: 8 },
  { name: 'Rameswaram', slug: 'rameswaram', state: 'Tamil Nadu', stateCode: 'TN', tier: 5, keywords: ['rameswaram'], priority: 8 },
  { name: 'Pondicherry', slug: 'pondicherry', state: 'Puducherry', stateCode: 'PY', tier: 5, keywords: ['pondicherry', 'puducherry'], priority: 9 },
  { name: 'Auroville', slug: 'auroville', state: 'Puducherry', stateCode: 'PY', tier: 5, keywords: ['auroville'], priority: 8 },
  { name: 'Coonoor', slug: 'coonoor', state: 'Tamil Nadu', stateCode: 'TN', tier: 5, keywords: ['coonoor'], priority: 7 },
  { name: 'Yercaud', slug: 'yercaud', state: 'Tamil Nadu', stateCode: 'TN', tier: 5, keywords: ['yercaud'], priority: 7 },
  { name: 'Kumbakonam', slug: 'kumbakonam', state: 'Tamil Nadu', stateCode: 'TN', tier: 5, keywords: ['kumbakonam'], priority: 7 },

  // TELANGANA
  { name: 'Warangal', slug: 'warangal', state: 'Telangana', stateCode: 'TS', tier: 5, keywords: ['warangal'], priority: 7 },
  { name: 'Nizamabad', slug: 'nizamabad', state: 'Telangana', stateCode: 'TS', tier: 5, keywords: ['nizamabad'], priority: 6 },
  { name: 'Karimnagar', slug: 'karimnagar', state: 'Telangana', stateCode: 'TS', tier: 5, keywords: ['karimnagar'], priority: 6 },
  { name: 'Khammam', slug: 'khammam', state: 'Telangana', stateCode: 'TS', tier: 5, keywords: ['khammam'], priority: 6 },
  { name: 'Mahbubnagar', slug: 'mahbubnagar', state: 'Telangana', stateCode: 'TS', tier: 5, keywords: ['mahbubnagar'], priority: 6 },
  { name: 'Nalgonda', slug: 'nalgonda', state: 'Telangana', stateCode: 'TS', tier: 5, keywords: ['nalgonda'], priority: 6 },
  { name: 'Adilabad', slug: 'adilabad', state: 'Telangana', stateCode: 'TS', tier: 5, keywords: ['adilabad'], priority: 6 },
  { name: 'Siddipet', slug: 'siddipet', state: 'Telangana', stateCode: 'TS', tier: 5, keywords: ['siddipet'], priority: 6 },
  { name: 'Ramoji Film City', slug: 'ramoji', state: 'Telangana', stateCode: 'TS', tier: 5, keywords: ['ramoji film city'], priority: 8 },
  { name: 'Nagarjunasagar', slug: 'nagarjunasagar', state: 'Telangana', stateCode: 'TS', tier: 5, keywords: ['nagarjunasagar'], priority: 7 },

  // TRIPURA
  { name: 'Agartala', slug: 'agartala', state: 'Tripura', stateCode: 'TR', tier: 5, keywords: ['agartala'], priority: 7 },
  { name: 'Udaipur', slug: 'udaipur-tr', state: 'Tripura', stateCode: 'TR', tier: 5, keywords: ['udaipur tripura'], priority: 6 },
  { name: 'Dharmanagar', slug: 'dharmanagar', state: 'Tripura', stateCode: 'TR', tier: 5, keywords: ['dharmanagar'], priority: 6 },
  { name: 'Neermahal', slug: 'neermahal', state: 'Tripura', stateCode: 'TR', tier: 5, keywords: ['neermahal'], priority: 7 },
  { name: 'Unakoti', slug: 'unakoti', state: 'Tripura', stateCode: 'TR', tier: 5, keywords: ['unakoti'], priority: 7 },

  // UTTAR PRADESH - Additional
  { name: 'Prayagraj', slug: 'prayagraj', state: 'Uttar Pradesh', stateCode: 'UP', tier: 5, keywords: ['prayagraj', 'allahabad'], priority: 8 },
  { name: 'Meerut', slug: 'meerut', state: 'Uttar Pradesh', stateCode: 'UP', tier: 5, keywords: ['meerut'], priority: 7 },
  { name: 'Aligarh', slug: 'aligarh', state: 'Uttar Pradesh', stateCode: 'UP', tier: 5, keywords: ['aligarh'], priority: 6 },
  { name: 'Bareilly', slug: 'bareilly', state: 'Uttar Pradesh', stateCode: 'UP', tier: 5, keywords: ['bareilly'], priority: 6 },
  { name: 'Moradabad', slug: 'moradabad', state: 'Uttar Pradesh', stateCode: 'UP', tier: 5, keywords: ['moradabad'], priority: 6 },
  { name: 'Saharanpur', slug: 'saharanpur', state: 'Uttar Pradesh', stateCode: 'UP', tier: 5, keywords: ['saharanpur'], priority: 6 },
  { name: 'Gorakhpur', slug: 'gorakhpur', state: 'Uttar Pradesh', stateCode: 'UP', tier: 5, keywords: ['gorakhpur'], priority: 7 },
  { name: 'Mathura', slug: 'mathura', state: 'Uttar Pradesh', stateCode: 'UP', tier: 5, keywords: ['mathura'], priority: 8 },
  { name: 'Vrindavan', slug: 'vrindavan', state: 'Uttar Pradesh', stateCode: 'UP', tier: 5, keywords: ['vrindavan'], priority: 8 },
  { name: 'Ayodhya', slug: 'ayodhya', state: 'Uttar Pradesh', stateCode: 'UP', tier: 5, keywords: ['ayodhya'], priority: 9 },
  { name: 'Jhansi', slug: 'jhansi', state: 'Uttar Pradesh', stateCode: 'UP', tier: 5, keywords: ['jhansi'], priority: 6 },
  { name: 'Firozabad', slug: 'firozabad', state: 'Uttar Pradesh', stateCode: 'UP', tier: 5, keywords: ['firozabad'], priority: 6 },
  { name: 'Muzaffarnagar', slug: 'muzaffarnagar', state: 'Uttar Pradesh', stateCode: 'UP', tier: 5, keywords: ['muzaffarnagar'], priority: 6 },
  { name: 'Etawah', slug: 'etawah', state: 'Uttar Pradesh', stateCode: 'UP', tier: 5, keywords: ['etawah'], priority: 6 },
  { name: 'Mirzapur', slug: 'mirzapur', state: 'Uttar Pradesh', stateCode: 'UP', tier: 5, keywords: ['mirzapur'], priority: 6 },
  { name: 'Shahjahanpur', slug: 'shahjahanpur', state: 'Uttar Pradesh', stateCode: 'UP', tier: 5, keywords: ['shahjahanpur'], priority: 6 },
  { name: 'Rampur', slug: 'rampur', state: 'Uttar Pradesh', stateCode: 'UP', tier: 5, keywords: ['rampur'], priority: 6 },
  { name: 'Farrukhabad', slug: 'farrukhabad', state: 'Uttar Pradesh', stateCode: 'UP', tier: 5, keywords: ['farrukhabad'], priority: 6 },
  { name: 'Sarnath', slug: 'sarnath', state: 'Uttar Pradesh', stateCode: 'UP', tier: 5, keywords: ['sarnath'], priority: 8 },
  { name: 'Fatehpur Sikri', slug: 'fatehpur-sikri', state: 'Uttar Pradesh', stateCode: 'UP', tier: 5, keywords: ['fatehpur sikri'], priority: 8 },
  { name: 'Kushinagar', slug: 'kushinagar', state: 'Uttar Pradesh', stateCode: 'UP', tier: 5, keywords: ['kushinagar'], priority: 7 },
  { name: 'Chitrakoot', slug: 'chitrakoot', state: 'Uttar Pradesh', stateCode: 'UP', tier: 5, keywords: ['chitrakoot'], priority: 7 },
  { name: 'Dudhwa', slug: 'dudhwa', state: 'Uttar Pradesh', stateCode: 'UP', tier: 5, keywords: ['dudhwa'], priority: 7 },
  { name: 'Greater Noida', slug: 'greater-noida', state: 'Uttar Pradesh', stateCode: 'UP', tier: 5, keywords: ['greater noida'], priority: 7 },

  // UTTARAKHAND
  { name: 'Haridwar', slug: 'haridwar', state: 'Uttarakhand', stateCode: 'UK', tier: 5, keywords: ['haridwar'], priority: 9 },
  { name: 'Rishikesh', slug: 'rishikesh', state: 'Uttarakhand', stateCode: 'UK', tier: 5, keywords: ['rishikesh'], priority: 9 },
  { name: 'Mussoorie', slug: 'mussoorie', state: 'Uttarakhand', stateCode: 'UK', tier: 5, keywords: ['mussoorie'], priority: 9 },
  { name: 'Nainital', slug: 'nainital', state: 'Uttarakhand', stateCode: 'UK', tier: 5, keywords: ['nainital'], priority: 9 },
  { name: 'Jim Corbett', slug: 'jim-corbett', state: 'Uttarakhand', stateCode: 'UK', tier: 5, keywords: ['jim corbett', 'corbett'], priority: 9 },
  { name: 'Almora', slug: 'almora', state: 'Uttarakhand', stateCode: 'UK', tier: 5, keywords: ['almora'], priority: 7 },
  { name: 'Ranikhet', slug: 'ranikhet', state: 'Uttarakhand', stateCode: 'UK', tier: 5, keywords: ['ranikhet'], priority: 7 },
  { name: 'Lansdowne', slug: 'lansdowne', state: 'Uttarakhand', stateCode: 'UK', tier: 5, keywords: ['lansdowne'], priority: 7 },
  { name: 'Kausani', slug: 'kausani', state: 'Uttarakhand', stateCode: 'UK', tier: 5, keywords: ['kausani'], priority: 7 },
  { name: 'Auli', slug: 'auli', state: 'Uttarakhand', stateCode: 'UK', tier: 5, keywords: ['auli'], priority: 8 },
  { name: 'Chopta', slug: 'chopta', state: 'Uttarakhand', stateCode: 'UK', tier: 5, keywords: ['chopta'], priority: 7 },
  { name: 'Binsar', slug: 'binsar', state: 'Uttarakhand', stateCode: 'UK', tier: 5, keywords: ['binsar'], priority: 7 },
  { name: 'Bhimtal', slug: 'bhimtal', state: 'Uttarakhand', stateCode: 'UK', tier: 5, keywords: ['bhimtal'], priority: 7 },
  { name: 'Mukteshwar', slug: 'mukteshwar', state: 'Uttarakhand', stateCode: 'UK', tier: 5, keywords: ['mukteshwar'], priority: 7 },
  { name: 'Pithoragarh', slug: 'pithoragarh', state: 'Uttarakhand', stateCode: 'UK', tier: 5, keywords: ['pithoragarh'], priority: 6 },
  { name: 'Chamoli', slug: 'chamoli', state: 'Uttarakhand', stateCode: 'UK', tier: 5, keywords: ['chamoli'], priority: 6 },
  { name: 'Uttarkashi', slug: 'uttarkashi', state: 'Uttarakhand', stateCode: 'UK', tier: 5, keywords: ['uttarkashi'], priority: 7 },
  { name: 'Tehri', slug: 'tehri', state: 'Uttarakhand', stateCode: 'UK', tier: 5, keywords: ['tehri'], priority: 6 },
  { name: 'Pauri', slug: 'pauri', state: 'Uttarakhand', stateCode: 'UK', tier: 5, keywords: ['pauri'], priority: 6 },
  { name: 'Rudraprayag', slug: 'rudraprayag', state: 'Uttarakhand', stateCode: 'UK', tier: 5, keywords: ['rudraprayag'], priority: 7 },
  { name: 'Kedarnath', slug: 'kedarnath', state: 'Uttarakhand', stateCode: 'UK', tier: 5, keywords: ['kedarnath'], priority: 9 },
  { name: 'Badrinath', slug: 'badrinath', state: 'Uttarakhand', stateCode: 'UK', tier: 5, keywords: ['badrinath'], priority: 9 },
  { name: 'Gangotri', slug: 'gangotri', state: 'Uttarakhand', stateCode: 'UK', tier: 5, keywords: ['gangotri'], priority: 8 },
  { name: 'Yamunotri', slug: 'yamunotri', state: 'Uttarakhand', stateCode: 'UK', tier: 5, keywords: ['yamunotri'], priority: 8 },
  { name: 'Valley of Flowers', slug: 'valley-of-flowers', state: 'Uttarakhand', stateCode: 'UK', tier: 5, keywords: ['valley of flowers'], priority: 8 },
  { name: 'Hemkund Sahib', slug: 'hemkund', state: 'Uttarakhand', stateCode: 'UK', tier: 5, keywords: ['hemkund sahib'], priority: 7 },
  { name: 'Ramnagar', slug: 'ramnagar', state: 'Uttarakhand', stateCode: 'UK', tier: 5, keywords: ['ramnagar'], priority: 7 },

  // WEST BENGAL
  { name: 'Darjeeling', slug: 'darjeeling', state: 'West Bengal', stateCode: 'WB', tier: 5, keywords: ['darjeeling'], priority: 9 },
  { name: 'Siliguri', slug: 'siliguri', state: 'West Bengal', stateCode: 'WB', tier: 5, keywords: ['siliguri'], priority: 7 },
  { name: 'Asansol', slug: 'asansol', state: 'West Bengal', stateCode: 'WB', tier: 5, keywords: ['asansol'], priority: 7 },
  { name: 'Durgapur', slug: 'durgapur', state: 'West Bengal', stateCode: 'WB', tier: 5, keywords: ['durgapur'], priority: 7 },
  { name: 'Howrah', slug: 'howrah', state: 'West Bengal', stateCode: 'WB', tier: 5, keywords: ['howrah'], priority: 7 },
  { name: 'Kharagpur', slug: 'kharagpur', state: 'West Bengal', stateCode: 'WB', tier: 5, keywords: ['kharagpur'], priority: 6 },
  { name: 'Kalimpong', slug: 'kalimpong', state: 'West Bengal', stateCode: 'WB', tier: 5, keywords: ['kalimpong'], priority: 8 },
  { name: 'Kurseong', slug: 'kurseong', state: 'West Bengal', stateCode: 'WB', tier: 5, keywords: ['kurseong'], priority: 7 },
  { name: 'Mirik', slug: 'mirik', state: 'West Bengal', stateCode: 'WB', tier: 5, keywords: ['mirik'], priority: 7 },
  { name: 'Sundarbans', slug: 'sundarbans', state: 'West Bengal', stateCode: 'WB', tier: 5, keywords: ['sundarbans'], priority: 8 },
  { name: 'Digha', slug: 'digha', state: 'West Bengal', stateCode: 'WB', tier: 5, keywords: ['digha'], priority: 7 },
  { name: 'Mandarmani', slug: 'mandarmani', state: 'West Bengal', stateCode: 'WB', tier: 5, keywords: ['mandarmani'], priority: 7 },
  { name: 'Shantiniketan', slug: 'shantiniketan', state: 'West Bengal', stateCode: 'WB', tier: 5, keywords: ['shantiniketan'], priority: 7 },
  { name: 'Bishnupur', slug: 'bishnupur', state: 'West Bengal', stateCode: 'WB', tier: 5, keywords: ['bishnupur'], priority: 6 },
  { name: 'Murshidabad', slug: 'murshidabad', state: 'West Bengal', stateCode: 'WB', tier: 5, keywords: ['murshidabad'], priority: 6 },
  { name: 'Malda', slug: 'malda', state: 'West Bengal', stateCode: 'WB', tier: 5, keywords: ['malda'], priority: 6 },
  { name: 'Haldia', slug: 'haldia', state: 'West Bengal', stateCode: 'WB', tier: 5, keywords: ['haldia'], priority: 6 },
  { name: 'Bakkhali', slug: 'bakkhali', state: 'West Bengal', stateCode: 'WB', tier: 5, keywords: ['bakkhali'], priority: 6 },
  { name: 'Sandakphu', slug: 'sandakphu', state: 'West Bengal', stateCode: 'WB', tier: 5, keywords: ['sandakphu'], priority: 7 },

  // J&K & LADAKH
  { name: 'Leh', slug: 'leh', state: 'Ladakh', stateCode: 'LA', tier: 5, keywords: ['leh'], priority: 9 },
  { name: 'Pangong Lake', slug: 'pangong', state: 'Ladakh', stateCode: 'LA', tier: 5, keywords: ['pangong', 'pangong lake'], priority: 9 },
  { name: 'Nubra Valley', slug: 'nubra', state: 'Ladakh', stateCode: 'LA', tier: 5, keywords: ['nubra', 'nubra valley'], priority: 8 },
  { name: 'Khardung La', slug: 'khardung-la', state: 'Ladakh', stateCode: 'LA', tier: 5, keywords: ['khardung la'], priority: 8 },
  { name: 'Tso Moriri', slug: 'tso-moriri', state: 'Ladakh', stateCode: 'LA', tier: 5, keywords: ['tso moriri'], priority: 7 },
  { name: 'Kargil', slug: 'kargil', state: 'Ladakh', stateCode: 'LA', tier: 5, keywords: ['kargil'], priority: 7 },
  { name: 'Zanskar', slug: 'zanskar', state: 'Ladakh', stateCode: 'LA', tier: 5, keywords: ['zanskar'], priority: 7 },
  { name: 'Gulmarg', slug: 'gulmarg', state: 'Jammu and Kashmir', stateCode: 'JK', tier: 5, keywords: ['gulmarg'], priority: 9 },
  { name: 'Pahalgam', slug: 'pahalgam', state: 'Jammu and Kashmir', stateCode: 'JK', tier: 5, keywords: ['pahalgam'], priority: 9 },
  { name: 'Sonmarg', slug: 'sonmarg', state: 'Jammu and Kashmir', stateCode: 'JK', tier: 5, keywords: ['sonmarg'], priority: 8 },
  { name: 'Dal Lake', slug: 'dal-lake', state: 'Jammu and Kashmir', stateCode: 'JK', tier: 5, keywords: ['dal lake'], priority: 9 },
  { name: 'Patnitop', slug: 'patnitop', state: 'Jammu and Kashmir', stateCode: 'JK', tier: 5, keywords: ['patnitop'], priority: 7 },
  { name: 'Vaishno Devi', slug: 'vaishno-devi', state: 'Jammu and Kashmir', stateCode: 'JK', tier: 5, keywords: ['vaishno devi'], priority: 9 },
  { name: 'Amarnath', slug: 'amarnath', state: 'Jammu and Kashmir', stateCode: 'JK', tier: 5, keywords: ['amarnath'], priority: 8 },

  // ANDAMAN & NICOBAR
  { name: 'Port Blair', slug: 'port-blair', state: 'Andaman and Nicobar Islands', stateCode: 'AN', tier: 5, keywords: ['port blair'], priority: 8 },
  { name: 'Havelock Island', slug: 'havelock', state: 'Andaman and Nicobar Islands', stateCode: 'AN', tier: 5, keywords: ['havelock', 'swaraj dweep'], priority: 8 },
  { name: 'Neil Island', slug: 'neil-island', state: 'Andaman and Nicobar Islands', stateCode: 'AN', tier: 5, keywords: ['neil island', 'shaheed dweep'], priority: 7 },
  { name: 'Radhanagar Beach', slug: 'radhanagar', state: 'Andaman and Nicobar Islands', stateCode: 'AN', tier: 5, keywords: ['radhanagar'], priority: 7 },
  { name: 'Baratang Island', slug: 'baratang', state: 'Andaman and Nicobar Islands', stateCode: 'AN', tier: 5, keywords: ['baratang'], priority: 6 },
  { name: 'Ross Island', slug: 'ross-island', state: 'Andaman and Nicobar Islands', stateCode: 'AN', tier: 5, keywords: ['ross island'], priority: 7 },
  { name: 'Cellular Jail', slug: 'cellular-jail', state: 'Andaman and Nicobar Islands', stateCode: 'AN', tier: 5, keywords: ['cellular jail'], priority: 8 },

  // DAMAN DIU DADRA NAGAR HAVELI
  { name: 'Daman', slug: 'daman', state: 'Dadra and Nagar Haveli and Daman and Diu', stateCode: 'DD', tier: 5, keywords: ['daman'], priority: 7 },
  { name: 'Diu', slug: 'diu', state: 'Dadra and Nagar Haveli and Daman and Diu', stateCode: 'DD', tier: 5, keywords: ['diu'], priority: 7 },
  { name: 'Silvassa', slug: 'silvassa', state: 'Dadra and Nagar Haveli and Daman and Diu', stateCode: 'DD', tier: 5, keywords: ['silvassa'], priority: 6 },

  // LAKSHADWEEP
  { name: 'Kavaratti', slug: 'kavaratti', state: 'Lakshadweep', stateCode: 'LD', tier: 5, keywords: ['kavaratti'], priority: 7 },
  { name: 'Agatti', slug: 'agatti', state: 'Lakshadweep', stateCode: 'LD', tier: 5, keywords: ['agatti'], priority: 7 },
  { name: 'Bangaram', slug: 'bangaram', state: 'Lakshadweep', stateCode: 'LD', tier: 5, keywords: ['bangaram'], priority: 7 },
  { name: 'Minicoy', slug: 'minicoy', state: 'Lakshadweep', stateCode: 'LD', tier: 5, keywords: ['minicoy'], priority: 7 },
];

// ============================================
// ALL CITIES COMBINED
// ============================================
export const ALL_CITIES: City[] = [
  ...TIER_1_CITIES,
  ...TIER_2_CITIES,
  ...TIER_3_CITIES,
  ...TIER_4_CITIES,
  ...TIER_5_CITIES,
];

// Full list for static generation - ALL 536 cities
// This generates 27k+ pages at build time for comprehensive SEO coverage.
// ISR handles any future additions.
export const STATIC_CITIES: City[] = [
  ...ALL_CITIES,
];

// Alias for backward compatibility
export const INDIAN_CITIES = ALL_CITIES;

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getCitiesByPriority(minPriority: number = 6): City[] {
  return ALL_CITIES.filter(city => city.priority >= minPriority);
}

export function getCitiesByTier(tier: 1 | 2 | 3 | 4 | 5): City[] {
  return ALL_CITIES.filter(city => city.tier === tier);
}

export function getCitiesByState(stateCode: string): City[] {
  return ALL_CITIES.filter(city => city.stateCode === stateCode);
}

export function getCityBySlug(slug: string): City | undefined {
  return ALL_CITIES.find(city => city.slug === slug);
}

export function searchCities(query: string): City[] {
  const q = query.toLowerCase();
  return ALL_CITIES.filter(city =>
    city.name.toLowerCase().includes(q) ||
    city.slug.includes(q) ||
    city.state.toLowerCase().includes(q) ||
    city.keywords.some(k => k.includes(q))
  );
}

export function getStateByCode(code: string) {
  return INDIAN_STATES.find(s => s.code === code);
}

export function getAllStates() {
  return INDIAN_STATES;
}

// Stats
export const CITY_STATS = {
  tier1: TIER_1_CITIES.length,
  tier2: TIER_2_CITIES.length,
  tier3: TIER_3_CITIES.length,
  tier4: TIER_4_CITIES.length,
  tier5: TIER_5_CITIES.length,
  total: ALL_CITIES.length,
  states: INDIAN_STATES.length,
};
