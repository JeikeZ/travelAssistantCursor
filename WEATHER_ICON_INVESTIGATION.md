# Weather Icon "?" and "Unknown" Type Investigation

## Issue Summary
When generating a packing list for Chicago, the weather forecast displays "?" as the icon and "Unknown" as the weather type for certain days.

## Root Cause
The application's `WEATHER_CODE_MAP` in `/src/lib/constants.ts` is **incomplete** and missing several WMO (World Meteorological Organization) weather codes that are returned by the Open-Meteo API.

## Investigation Details

### Current Chicago Weather Data
When querying the Open-Meteo API for Chicago's 7-day forecast (as of 2025-11-06), the following weather codes were returned:
```
Weather Codes: [3, 63, 81, 85, 0, 51, 3]
```

Breakdown:
- **Code 3**: Overcast ✅ (mapped)
- **Code 63**: Moderate rain ✅ (mapped)
- **Code 81**: Moderate rain showers ✅ (mapped)
- **Code 85**: Snow showers (slight) ❌ **NOT MAPPED** - This is the culprit!
- **Code 0**: Clear sky ✅ (mapped)
- **Code 51**: Light drizzle ✅ (mapped)
- **Code 3**: Overcast ✅ (mapped)

### Code Mapping Logic
In `/src/app/api/weather/route.ts` (lines 114-115):
```typescript
description: WEATHER_CODE_MAP[weatherData.daily.weather_code[index]]?.description || 'Unknown',
icon: WEATHER_CODE_MAP[weatherData.daily.weather_code[index]]?.icon || '❓',
```

When a weather code is not found in the `WEATHER_CODE_MAP`, it defaults to:
- Description: "Unknown"
- Icon: "❓"

### Currently Mapped Weather Codes
The application currently maps these WMO codes:
```
0, 1, 2, 3           - Clear to overcast conditions
45, 48               - Fog conditions
51, 53, 55           - Drizzle (light, moderate, dense)
61, 63, 65           - Rain (slight, moderate, heavy)
71, 73, 75           - Snow fall (slight, moderate, heavy)
80, 81, 82           - Rain showers (slight, moderate, violent)
95, 96, 99           - Thunderstorm and thunderstorm with hail
```

### Missing WMO Weather Codes
According to the WMO standard codes used by Open-Meteo, the following codes are **MISSING** from the map:

#### Missing Codes:
1. **56, 57** - Freezing drizzle (light, dense)
2. **66, 67** - Freezing rain (light, heavy)
3. **77** - Snow grains
4. **85, 86** - Snow showers (slight, heavy) ⚠️ **Code 85 is causing the current issue**

### Why This Matters
These missing codes represent legitimate weather conditions that can occur in various locations:
- **Snow showers (85, 86)**: Common in winter weather, especially in cities like Chicago
- **Freezing rain (66, 67)**: Occurs in cold climates during transitional temperatures
- **Freezing drizzle (56, 57)**: Common in winter conditions
- **Snow grains (77)**: Less common but valid winter precipitation

## Test Coverage
The test file `/workspace/__tests__/api/weather.test.ts` includes a test case for unknown weather codes (line 346-374):
```typescript
it('should handle unknown weather codes', async () => {
  const weatherWithUnknownCode = {
    daily: {
      time: ['2024-01-01'],
      temperature_2m_max: [15],
      temperature_2m_min: [8],
      weather_code: [999], // Unknown code
      precipitation_probability_max: [0]
    }
  }
  // ...
  expect(data.forecast[0].description).toBe('Unknown')
  expect(data.forecast[0].icon).toBe('❓')
})
```

This test confirms the fallback behavior is working as designed, but the issue is that **legitimate WMO codes** are being treated as unknown.

## Impact
- Users see "?" icons and "Unknown" weather types for valid weather conditions
- The application appears broken or incomplete when these conditions occur
- Particularly affects users in locations with winter weather (snow showers, freezing conditions)
- Chicago is experiencing code 85 (slight snow showers) in the current forecast

## Recommended Solution
Add the missing WMO weather codes to the `WEATHER_CODE_MAP` in `/src/lib/constants.ts`:

```typescript
56: { description: 'Light freezing drizzle', icon: '🌧️' },
57: { description: 'Dense freezing drizzle', icon: '🌧️' },
66: { description: 'Light freezing rain', icon: '🌧️' },
67: { description: 'Heavy freezing rain', icon: '🌧️' },
77: { description: 'Snow grains', icon: '🌨️' },
85: { description: 'Slight snow showers', icon: '🌨️' },  // Current issue
86: { description: 'Heavy snow showers', icon: '❄️' },
```

## References
- Open-Meteo API Documentation: https://open-meteo.com/en/docs
- Weather codes are based on WMO standards
- API response includes: `"weather_code": "wmo code"` in the units section

## Files Involved
1. `/src/lib/constants.ts` - Contains the `WEATHER_CODE_MAP` (lines 75-97)
2. `/src/app/api/weather/route.ts` - Uses the map for weather code lookup (lines 114-115)
3. `/src/components/ui/WeatherForecast.tsx` - Displays the weather icons and descriptions
4. `/__tests__/api/weather.test.ts` - Tests the weather code mapping behavior
