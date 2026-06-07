// Middle East / Arab region countries with cities. Used by registration,
// profile editing, and the "Find Doctors Near You" filter.
export const countries = [
  { name: 'Jordan', code: 'JO', cities: ['Amman', 'Irbid', 'Zarqa', 'Aqaba', 'Petra'] },
  { name: 'Saudi Arabia', code: 'SA', cities: ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam'] },
  { name: 'UAE', code: 'AE', cities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman'] },
  { name: 'Kuwait', code: 'KW', cities: ['Kuwait City', 'Hawalli', 'Salmiya'] },
  { name: 'Qatar', code: 'QA', cities: ['Doha', 'Al Wakrah', 'Al Khor'] },
  { name: 'Bahrain', code: 'BH', cities: ['Manama', 'Riffa', 'Muharraq'] },
  { name: 'Oman', code: 'OM', cities: ['Muscat', 'Salalah', 'Nizwa'] },
  { name: 'Egypt', code: 'EG', cities: ['Cairo', 'Alexandria', 'Giza', 'Luxor'] },
  { name: 'Lebanon', code: 'LB', cities: ['Beirut', 'Tripoli', 'Sidon'] },
  { name: 'Syria', code: 'SY', cities: ['Damascus', 'Aleppo', 'Homs', 'Latakia'] },
  { name: 'Iraq', code: 'IQ', cities: ['Baghdad', 'Basra', 'Mosul', 'Erbil'] },
  { name: 'Palestine', code: 'PS', cities: ['Ramallah', 'Gaza', 'Nablus', 'Hebron'] },
  { name: 'Yemen', code: 'YE', cities: ['Sanaa', 'Aden', 'Taiz'] },
  { name: 'Libya', code: 'LY', cities: ['Tripoli', 'Benghazi', 'Misrata'] },
  { name: 'Tunisia', code: 'TN', cities: ['Tunis', 'Sfax', 'Sousse'] },
  { name: 'Morocco', code: 'MA', cities: ['Casablanca', 'Rabat', 'Marrakesh', 'Fez'] },
  { name: 'Algeria', code: 'DZ', cities: ['Algiers', 'Oran', 'Constantine'] },
]

export const citiesFor = (countryName) =>
  countries.find((c) => c.name === countryName)?.cities ?? []

// Prefer exact coordinates when the doctor pinned them; otherwise fall back to a text search.
export const openInMaps = (query, lat, lng) => {
  let url
  if (lat != null && lng != null) {
    // Direct pin at exact coordinates
    url = `https://www.google.com/maps?q=${lat},${lng}`
  } else if (query) {
    url = `https://www.google.com/maps/search/${encodeURIComponent(query)}`
  } else {
    return
  }
  window.open(url, '_blank')
}

export const mapEmbedSrc = (query, lat, lng) => {
  const target = (lat != null && lng != null) ? `${lat},${lng}` : query
  return `https://maps.google.com/maps?q=${encodeURIComponent(target)}&z=15&output=embed`
}
