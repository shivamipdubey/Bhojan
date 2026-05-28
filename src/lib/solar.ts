export interface SolarTimes {
  sunrise: Date
  sunset: Date
  fajr: Date // Dawn (approx 90 minutes before sunrise)
  maghrib: Date // Dusk (approx 10 minutes after sunset)
}

/**
 * A robust, lightweight offline solar calculator using standard simplified
 * orbital mechanics and timezone correction.
 */
export function getSolarTimes(date: Date, latitude: number, longitude: number): SolarTimes {
  // 1. Day of the year
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date.getTime() - start.getTime()
  const oneDay = 1000 * 60 * 60 * 24
  const day = Math.floor(diff / oneDay)

  // 2. Solar declination angle approximation
  // Dec = 23.44 * sin( 360/365 * (d - 80) )
  const decRad = 23.44 * Math.sin((360 / 365) * (day - 80) * Math.PI / 180) * Math.PI / 180

  // 3. Latitude in radians
  const latRad = latitude * Math.PI / 180

  // 4. Hour angle (H) for Sunrise/Sunset
  // cos(H) = (sin(-0.83) - sin(lat)*sin(dec)) / (cos(lat)*cos(dec))
  // -0.83 degrees is the standard atmospheric refraction correction
  const sinDec = Math.sin(decRad)
  const cosDec = Math.cos(decRad)
  const sinLat = Math.sin(latRad)
  const cosLat = Math.cos(latRad)

  const cosH = (Math.sin(-0.83 * Math.PI / 180) - sinLat * sinDec) / (cosLat * cosDec)

  let hourAngle = 6 * 15 // Default to 6 hours if cosH is out of bounds (polar winter/summer)
  if (cosH >= -1 && cosH <= 1) {
    hourAngle = Math.acos(cosH) * 180 / Math.PI
  }

  // 5. Equations of time correction (simple solar transit approximation)
  // Standard solar transit is 12:00 local solar time
  // Convert longitude degrees to decimal hours difference from transit
  const transitUTC = 12 - longitude / 15

  const sunriseUTC = transitUTC - hourAngle / 15
  const sunsetUTC = transitUTC + hourAngle / 15

  // 6. timezone-corrected Date generator
  const createLocalDate = (utcDecimalHours: number) => {
    const tzOffsetHours = -date.getTimezoneOffset() / 60
    let localHours = (utcDecimalHours + tzOffsetHours) % 24
    if (localHours < 0) localHours += 24

    const targetDate = new Date(date)
    const hours = Math.floor(localHours)
    const minutes = Math.floor((localHours - hours) * 60)
    targetDate.setHours(hours, minutes, 0, 0)
    return targetDate
  }

  const sunrise = createLocalDate(sunriseUTC)
  const sunset = createLocalDate(sunsetUTC)

  // Dawn (Fajr): standard fast boundary (18 degrees solar declination, roughly 90 mins before sunrise)
  const fajr = new Date(sunrise.getTime() - 90 * 60 * 1000)
  
  // Dusk (Maghrib): eating window boundary (usually at or immediately after sunset)
  const maghrib = new Date(sunset.getTime() + 10 * 60 * 1000)

  return { sunrise, sunset, fajr, maghrib }
}
