export interface CityLocationPreset {
  city: string;
  popularLocalities: string[];
}

export const POPULAR_INDIAN_CITIES: CityLocationPreset[] = [
  {
    city: 'Bengaluru',
    popularLocalities: ['Koramangala', 'Indiranagar', 'HSR Layout', 'Whitefield', 'Jayanagar', 'JP Nagar', 'Electronic City', 'Malleshwaram']
  },
  {
    city: 'Mumbai',
    popularLocalities: ['Bandra West', 'Andheri West', 'Juhu', 'Powai', 'Borivali West', 'Dadar', 'Colaba', 'Thane West', 'Navi Mumbai']
  },
  {
    city: 'Delhi NCR',
    popularLocalities: ['Connaught Place', 'South Extension', 'Dwarka', 'Rohini', 'Lajpat Nagar', 'Noida Sector 18', 'Gurugram Sector 29', 'Cyber City']
  },
  {
    city: 'Hyderabad',
    popularLocalities: ['Banjara Hills', 'Jubilee Hills', 'Gachibowli', 'Madhapur', 'Kukatpally', 'Secunderabad', 'Hitec City', 'Ameerpet']
  },
  {
    city: 'Chennai',
    popularLocalities: ['Anna Nagar', 'T. Nagar', 'Adyar', 'Velachery', 'Mylapore', 'Nungambakkam', 'OMR', 'Porur']
  },
  {
    city: 'Pune',
    popularLocalities: ['Kothrud', 'Baner', 'Aundh', 'Viman Nagar', 'Kalyani Nagar', 'Hinjewadi', 'Wakad', 'Camp']
  },
  {
    city: 'Kolkata',
    popularLocalities: ['Salt Lake', 'Park Street', 'Ballygunge', 'New Town', 'Alipore', 'Gariahat', 'Behala', 'Howrah']
  },
  {
    city: 'Ahmedabad',
    popularLocalities: ['Bodakdev', 'Satellite', 'Vastrapur', 'Navrangpura', 'Prahlad Nagar', 'Thaltej', 'Maninagar', 'SG Highway']
  },
  {
    city: 'Jaipur',
    popularLocalities: ['Malviya Nagar', 'Vaishali Nagar', 'C-Scheme', 'Mansarovar', 'Raja Park', 'Tonk Road', 'Jagatpura']
  },
  {
    city: 'Lucknow',
    popularLocalities: ['Gomti Nagar', 'Hazratganj', 'Aliganj', 'Indira Nagar', 'Mahanagar', 'Ashiyana', 'Vikas Nagar']
  },
  {
    city: 'Chandigarh',
    popularLocalities: ['Sector 17', 'Sector 35', 'Sector 22', 'Sector 8', 'Panchkula Sector 7', 'Mohali Phase 7', 'Zirakpur']
  },
  {
    city: 'Indore',
    popularLocalities: ['Vijay Nagar', 'Palasia', 'New Palasia', 'Saket', 'Geeta Bhawan', 'Bhawarkua', 'Rau']
  },
  {
    city: 'Belagavi',
    popularLocalities: ['Tilakwadi', 'Camp', 'Hindwadi', 'Shahapur', 'Bhagya Nagar', 'RPD Cross', 'Angol', 'Vadgaon']
  },
  {
    city: 'Hubli',
    popularLocalities: ['Vidyanagar', 'Keshwapur', 'Gokul Road', 'Shirur Park', 'Deshpande Nagar', 'Akshay Park', 'Unkal', 'Navanagar']
  }
];
