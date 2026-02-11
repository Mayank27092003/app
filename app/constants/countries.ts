/**
 * Country data constants
 * Contains country information including country codes, calling codes, flags, and names
 */

export interface Country {
  cca2: string;
  callingCode: string[];
  emoji: string;
  name: string;
}

export const COUNTRIES: Country[] = [
  { cca2: "US", callingCode: ["1"], emoji: "🇺🇸", name: "United States" },
  { cca2: "GB", callingCode: ["44"], emoji: "🇬🇧", name: "United Kingdom" },
  { cca2: "IN", callingCode: ["91"], emoji: "🇮🇳", name: "India" },
  { cca2: "FR", callingCode: ["33"], emoji: "🇫🇷", name: "France" },
  { cca2: "DE", callingCode: ["49"], emoji: "🇩🇪", name: "Germany" },
  { cca2: "CN", callingCode: ["86"], emoji: "🇨🇳", name: "China" },
  { cca2: "JP", callingCode: ["81"], emoji: "🇯🇵", name: "Japan" },
  { cca2: "KR", callingCode: ["82"], emoji: "🇰🇷", name: "South Korea" },
  { cca2: "AU", callingCode: ["61"], emoji: "🇦🇺", name: "Australia" },
  { cca2: "BR", callingCode: ["55"], emoji: "🇧🇷", name: "Brazil" },
  { cca2: "MX", callingCode: ["52"], emoji: "🇲🇽", name: "Mexico" },
  { cca2: "IT", callingCode: ["39"], emoji: "🇮🇹", name: "Italy" },
  { cca2: "ES", callingCode: ["34"], emoji: "🇪🇸", name: "Spain" },
  { cca2: "RU", callingCode: ["7"], emoji: "🇷🇺", name: "Russia" },
  { cca2: "SA", callingCode: ["966"], emoji: "🇸🇦", name: "Saudi Arabia" },
  { cca2: "AE", callingCode: ["971"], emoji: "🇦🇪", name: "United Arab Emirates" },
  { cca2: "CA", callingCode: ["1"], emoji: "🇨🇦", name: "Canada" },
  { cca2: "NL", callingCode: ["31"], emoji: "🇳🇱", name: "Netherlands" },
  { cca2: "CH", callingCode: ["41"], emoji: "🇨🇭", name: "Switzerland" },
  { cca2: "SE", callingCode: ["46"], emoji: "🇸🇪", name: "Sweden" },
  { cca2: "NO", callingCode: ["47"], emoji: "🇳🇴", name: "Norway" },
  { cca2: "DK", callingCode: ["45"], emoji: "🇩🇰", name: "Denmark" },
  { cca2: "FI", callingCode: ["358"], emoji: "🇫🇮", name: "Finland" },
  { cca2: "BE", callingCode: ["32"], emoji: "🇧🇪", name: "Belgium" },
  { cca2: "PT", callingCode: ["351"], emoji: "🇵🇹", name: "Portugal" },
  { cca2: "GR", callingCode: ["30"], emoji: "🇬🇷", name: "Greece" },
  { cca2: "TR", callingCode: ["90"], emoji: "🇹🇷", name: "Turkey" },
  { cca2: "EG", callingCode: ["20"], emoji: "🇪🇬", name: "Egypt" },
  { cca2: "ZA", callingCode: ["27"], emoji: "🇿🇦", name: "South Africa" },
  { cca2: "NG", callingCode: ["234"], emoji: "🇳🇬", name: "Nigeria" },
  { cca2: "AR", callingCode: ["54"], emoji: "🇦🇷", name: "Argentina" },
  { cca2: "CL", callingCode: ["56"], emoji: "🇨🇱", name: "Chile" },
  { cca2: "CO", callingCode: ["57"], emoji: "🇨🇴", name: "Colombia" },
  { cca2: "PE", callingCode: ["51"], emoji: "🇵🇪", name: "Peru" },
  { cca2: "VE", callingCode: ["58"], emoji: "🇻🇪", name: "Venezuela" },
  { cca2: "NZ", callingCode: ["64"], emoji: "🇳🇿", name: "New Zealand" },
  { cca2: "SG", callingCode: ["65"], emoji: "🇸🇬", name: "Singapore" },
  { cca2: "MY", callingCode: ["60"], emoji: "🇲🇾", name: "Malaysia" },
  { cca2: "TH", callingCode: ["66"], emoji: "🇹🇭", name: "Thailand" },
  { cca2: "ID", callingCode: ["62"], emoji: "🇮🇩", name: "Indonesia" },
  { cca2: "PH", callingCode: ["63"], emoji: "🇵🇭", name: "Philippines" },
  { cca2: "VN", callingCode: ["84"], emoji: "🇻🇳", name: "Vietnam" },
  { cca2: "DZ", callingCode: ["213"], emoji: "🇩🇿", name: "Algeria" },
  { cca2: "AL", callingCode: ["355"], emoji: "🇦🇱", name: "Albania" },
  { cca2: "AF", callingCode: ["93"], emoji: "🇦🇫", name: "Afghanistan" },
  { cca2: "BD", callingCode: ["880"], emoji: "🇧🇩", name: "Bangladesh" },
  { cca2: "PK", callingCode: ["92"], emoji: "🇵🇰", name: "Pakistan" },
  { cca2: "LK", callingCode: ["94"], emoji: "🇱🇰", name: "Sri Lanka" },
  { cca2: "NP", callingCode: ["977"], emoji: "🇳🇵", name: "Nepal" },
  { cca2: "BT", callingCode: ["975"], emoji: "🇧🇹", name: "Bhutan" },
  { cca2: "MV", callingCode: ["960"], emoji: "🇲🇻", name: "Maldives" },
  { cca2: "MM", callingCode: ["95"], emoji: "🇲🇲", name: "Myanmar" },
  { cca2: "KH", callingCode: ["855"], emoji: "🇰🇭", name: "Cambodia" },
  { cca2: "LA", callingCode: ["856"], emoji: "🇱🇦", name: "Laos" },
  { cca2: "BN", callingCode: ["673"], emoji: "🇧🇳", name: "Brunei" },
  { cca2: "TL", callingCode: ["670"], emoji: "🇹🇱", name: "East Timor" },
  { cca2: "MN", callingCode: ["976"], emoji: "🇲🇳", name: "Mongolia" },
  { cca2: "KZ", callingCode: ["7"], emoji: "🇰🇿", name: "Kazakhstan" },
  { cca2: "UZ", callingCode: ["998"], emoji: "🇺🇿", name: "Uzbekistan" },
  { cca2: "KG", callingCode: ["996"], emoji: "🇰🇬", name: "Kyrgyzstan" },
  { cca2: "TJ", callingCode: ["992"], emoji: "🇹🇯", name: "Tajikistan" },
  { cca2: "TM", callingCode: ["993"], emoji: "🇹🇲", name: "Turkmenistan" },
  { cca2: "AZ", callingCode: ["994"], emoji: "🇦🇿", name: "Azerbaijan" },
  { cca2: "AM", callingCode: ["374"], emoji: "🇦🇲", name: "Armenia" },
  { cca2: "GE", callingCode: ["995"], emoji: "🇬🇪", name: "Georgia" },
  { cca2: "IQ", callingCode: ["964"], emoji: "🇮🇶", name: "Iraq" },
  { cca2: "IR", callingCode: ["98"], emoji: "🇮🇷", name: "Iran" },
  { cca2: "IL", callingCode: ["972"], emoji: "🇮🇱", name: "Israel" },
  { cca2: "JO", callingCode: ["962"], emoji: "🇯🇴", name: "Jordan" },
  { cca2: "LB", callingCode: ["961"], emoji: "🇱🇧", name: "Lebanon" },
  { cca2: "SY", callingCode: ["963"], emoji: "🇸🇾", name: "Syria" },
  { cca2: "KW", callingCode: ["965"], emoji: "🇰🇼", name: "Kuwait" },
  { cca2: "QA", callingCode: ["974"], emoji: "🇶🇦", name: "Qatar" },
  { cca2: "BH", callingCode: ["973"], emoji: "🇧🇭", name: "Bahrain" },
  { cca2: "OM", callingCode: ["968"], emoji: "🇴🇲", name: "Oman" },
  { cca2: "YE", callingCode: ["967"], emoji: "🇾🇪", name: "Yemen" },
  { cca2: "LY", callingCode: ["218"], emoji: "🇱🇾", name: "Libya" },
  { cca2: "TN", callingCode: ["216"], emoji: "🇹🇳", name: "Tunisia" },
  { cca2: "MA", callingCode: ["212"], emoji: "🇲🇦", name: "Morocco" },
  { cca2: "SD", callingCode: ["249"], emoji: "🇸🇩", name: "Sudan" },
  { cca2: "ET", callingCode: ["251"], emoji: "🇪🇹", name: "Ethiopia" },
  { cca2: "KE", callingCode: ["254"], emoji: "🇰🇪", name: "Kenya" },
  { cca2: "UG", callingCode: ["256"], emoji: "🇺🇬", name: "Uganda" },
  { cca2: "TZ", callingCode: ["255"], emoji: "🇹🇿", name: "Tanzania" },
  { cca2: "RW", callingCode: ["250"], emoji: "🇷🇼", name: "Rwanda" },
  { cca2: "BI", callingCode: ["257"], emoji: "🇧🇮", name: "Burundi" },
  { cca2: "DJ", callingCode: ["253"], emoji: "🇩🇯", name: "Djibouti" },
  { cca2: "SO", callingCode: ["252"], emoji: "🇸🇴", name: "Somalia" },
  { cca2: "ER", callingCode: ["291"], emoji: "🇪🇷", name: "Eritrea" },
  { cca2: "SS", callingCode: ["211"], emoji: "🇸🇸", name: "South Sudan" },
  { cca2: "CF", callingCode: ["236"], emoji: "🇨🇫", name: "Central African Republic" },
  { cca2: "TD", callingCode: ["235"], emoji: "🇹🇩", name: "Chad" },
  { cca2: "CM", callingCode: ["237"], emoji: "🇨🇲", name: "Cameroon" },
  { cca2: "GQ", callingCode: ["240"], emoji: "🇬🇶", name: "Equatorial Guinea" },
  { cca2: "GA", callingCode: ["241"], emoji: "🇬🇦", name: "Gabon" },
  { cca2: "CG", callingCode: ["242"], emoji: "🇨🇬", name: "Republic of the Congo" },
  { cca2: "CD", callingCode: ["243"], emoji: "🇨🇩", name: "Democratic Republic of the Congo" },
  { cca2: "AO", callingCode: ["244"], emoji: "🇦🇴", name: "Angola" },
  { cca2: "ZM", callingCode: ["260"], emoji: "🇿🇲", name: "Zambia" },
  { cca2: "ZW", callingCode: ["263"], emoji: "🇿🇼", name: "Zimbabwe" },
  { cca2: "BW", callingCode: ["267"], emoji: "🇧🇼", name: "Botswana" },
  { cca2: "NA", callingCode: ["264"], emoji: "🇳🇦", name: "Namibia" },
  { cca2: "SZ", callingCode: ["268"], emoji: "🇸🇿", name: "Eswatini" },
  { cca2: "LS", callingCode: ["266"], emoji: "🇱🇸", name: "Lesotho" },
  { cca2: "MG", callingCode: ["261"], emoji: "🇲🇬", name: "Madagascar" },
  { cca2: "MU", callingCode: ["230"], emoji: "🇲🇺", name: "Mauritius" },
  { cca2: "SC", callingCode: ["248"], emoji: "🇸🇨", name: "Seychelles" },
  { cca2: "KM", callingCode: ["269"], emoji: "🇰🇲", name: "Comoros" },
  { cca2: "YT", callingCode: ["262"], emoji: "🇾🇹", name: "Mayotte" },
  { cca2: "RE", callingCode: ["262"], emoji: "🇷🇪", name: "Réunion" },
  { cca2: "CV", callingCode: ["238"], emoji: "🇨🇻", name: "Cape Verde" },
  { cca2: "ST", callingCode: ["239"], emoji: "🇸🇹", name: "São Tomé and Príncipe" },
  { cca2: "GW", callingCode: ["245"], emoji: "🇬🇼", name: "Guinea-Bissau" },
  { cca2: "GN", callingCode: ["224"], emoji: "🇬🇳", name: "Guinea" },
  { cca2: "SL", callingCode: ["232"], emoji: "🇸🇱", name: "Sierra Leone" },
  { cca2: "LR", callingCode: ["231"], emoji: "🇱🇷", name: "Liberia" },
  { cca2: "CI", callingCode: ["225"], emoji: "🇨🇮", name: "Ivory Coast" },
  { cca2: "GH", callingCode: ["233"], emoji: "🇬🇭", name: "Ghana" },
  { cca2: "TG", callingCode: ["228"], emoji: "🇹🇬", name: "Togo" },
  { cca2: "BJ", callingCode: ["229"], emoji: "🇧🇯", name: "Benin" },
  { cca2: "NE", callingCode: ["227"], emoji: "🇳🇪", name: "Niger" },
  { cca2: "BF", callingCode: ["226"], emoji: "🇧🇫", name: "Burkina Faso" },
  { cca2: "ML", callingCode: ["223"], emoji: "🇲🇱", name: "Mali" },
  { cca2: "SN", callingCode: ["221"], emoji: "🇸🇳", name: "Senegal" },
  { cca2: "GM", callingCode: ["220"], emoji: "🇬🇲", name: "Gambia" },
  { cca2: "GN", callingCode: ["224"], emoji: "🇬🇳", name: "Guinea" },
  { cca2: "MR", callingCode: ["222"], emoji: "🇲🇷", name: "Mauritania" },
];

/**
 * Helper function to find a country by calling code
 */
export const findCountryByCallingCode = (callingCode: string): Country | undefined => {
  const code = callingCode.replace("+", "");
  return COUNTRIES.find(country => country.callingCode[0] === code);
};

/**
 * Helper function to find a country by country code (cca2)
 */
export const findCountryByCode = (countryCode: string): Country | undefined => {
  return COUNTRIES.find(country => country.cca2 === countryCode);
};

/**
 * Helper function to filter countries by search query
 */
export const filterCountries = (query: string): Country[] => {
  const lowercaseQuery = query.toLowerCase();
  return COUNTRIES.filter(country => 
    country.name.toLowerCase().includes(lowercaseQuery) ||
    country.cca2.toLowerCase().includes(lowercaseQuery) ||
    country.callingCode[0].includes(query)
  );
};
