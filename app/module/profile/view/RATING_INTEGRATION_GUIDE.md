# Rating Screen Integration Guide

## How to Navigate to Rating Screen from Profile

Add this code to your profile screen where you want to show the rating button:

```tsx
import { Routes } from "@app/navigator";

// Inside your component:
<TouchableOpacity
  style={styles.ratingButton}
  onPress={() => navigation.navigate(Routes.RatingScreen as never)}
>
  <Star size={20} color={Colors.primary} />
  <Text style={styles.ratingText}>View Ratings & Reviews</Text>
  <Text style={styles.ratingCount}>4.7 ★ (3 reviews)</Text>
</TouchableOpacity>
```

## Viewing Another User's Ratings

To view another user's rating profile:

```tsx
navigation.navigate(Routes.RatingScreen as never, {
  userId: otherUserId
} as never);
```

## API Endpoints to Implement

Update your `endPoints.tsx` file with these endpoints:

```tsx
// In app/service/endpoints.tsx
getUserRatings: (userId: number) => `/users/${userId}/ratings`,
submitReview: "/reviews",
```

## API Integration Points

Replace the mock data in `RatingScreen.tsx`:

### 1. Fetch Ratings (line ~67):
```tsx
const response = await httpRequest.get(endPoints.getUserRatings(targetUserId));
setReviews(response.data.reviews);
setRatingStats(response.data.stats);
```

### 2. Submit Review (line ~135):
```tsx
const response = await httpRequest.post(endPoints.submitReview, {
  userId: targetUserId,
  rating: newRating,
  comment: newComment,
});
```

## Expected API Response Format

### Get Ratings Response:
```json
{
  "success": true,
  "data": {
    "stats": {
      "averageRating": 4.7,
      "totalReviews": 3,
      "ratingDistribution": {
        "5": 2,
        "4": 1,
        "3": 0,
        "2": 0,
        "1": 0
      }
    },
    "reviews": [
      {
        "id": 1,
        "rating": 5,
        "comment": "Excellent service!",
        "reviewerName": "John Doe",
        "reviewerImage": "https://...",
        "createdAt": "2025-01-15T10:30:00Z",
        "jobTitle": "New York to Boston"
      }
    ]
  }
}
```

## Features Included

✅ Overall rating display with star visualization
✅ Rating distribution bar charts
✅ List of all reviews with reviewer info
✅ Write review functionality (for viewing other profiles)
✅ Dark theme support
✅ Interactive star rating input
✅ Form validation
✅ Loading states
✅ Empty states
✅ Mock data for testing

