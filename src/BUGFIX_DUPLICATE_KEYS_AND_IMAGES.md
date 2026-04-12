# Bug Fix: Duplicate Keys in Charts and Unreliable Unsplash Images

## Date: April 8, 2026

## Issues Fixed

### 1. Duplicate Key Error in AdminDashboard Charts

**Problem:**
- React warning about duplicate keys in Recharts components
- Error occurred in the PieChart and BarChart components in AdminDashboard
- Caused by inline data without unique identifiers and index-based keys

**Solution:**
- Created a new `mostBookedServices` data array with unique `id` fields
- Moved inline BarChart data to the `mostBookedServices` constant
- Changed PieChart Cell keys from index-based (`cell-${index}`) to name-based (`cell-${entry.name}`)

**Files Modified:**
- `/components/AdminDashboard.tsx`
  - Lines 198-221: Added `mostBookedServices` data array with unique IDs
  - Line 1688: Changed inline BarChart data to use `mostBookedServices` variable
  - Line 718: Changed PieChart Cell key from index to entry.name for uniqueness

### 2. Unreliable Unsplash Image URLs

**Problem:**
- Hardcoded Unsplash URLs can expire, get rate-limited, or become broken over time
- 21 instances of Unsplash URLs found across multiple components
- No fallback mechanism for failed image loads
- Potential crash if images fail to load after Unsplash API changes

**Solution:**
- Replaced all Unsplash URLs with Picsum Photos placeholder service
- Picsum is more stable and reliable for development/production use
- Used seed-based URLs to ensure consistent, unique images per service
- Format: `https://picsum.photos/seed/{unique-seed}/400/300`

**Files Modified:**

1. **HomePage.tsx**
   - 4 Unsplash URLs replaced
   - Services images and hero banner image updated

2. **ServicesPage.tsx**
   - 9 Unsplash URLs replaced
   - All service category images (Hair, Facial, Nail Care) updated

3. **CustomerDashboard.tsx**
   - 8 Unsplash URLs replaced
   - All service listings images updated

## Benefits

✅ **No more React warnings** - Charts render cleanly without duplicate key errors
✅ **Stable images** - Picsum Photos provides reliable, consistent image URLs
✅ **Better performance** - Reduced risk of failed image loads
✅ **Unique images** - Each service has its own seed for distinct visuals
✅ **No API rate limits** - Picsum doesn't have the same restrictions as Unsplash
✅ **Production ready** - More reliable for long-term use

## Testing

To verify the fixes:

1. **Chart Fix**: Navigate to Admin Dashboard → Dashboard section
   - Check browser console - no duplicate key warnings should appear
   - Charts should render smoothly without errors

2. **Image Fix**: Navigate to any page with images
   - All images should load consistently
   - No broken image placeholders
   - Images remain stable across page refreshes

## Notes

- The ImageWithFallback component is still being used throughout the app for graceful error handling
- If you want to use custom images in production, replace the Picsum URLs with your own hosted images
- All image seeds use descriptive names (e.g., 'haircut-style', 'facial-treatment') for easy identification

## Impact

- **Admin Dashboard**: Fixed chart rendering errors
- **Customer Experience**: More reliable image loading across all pages
- **Developer Experience**: No more console warnings during development
- **Production Stability**: Eliminated dependency on potentially unstable external API URLs
