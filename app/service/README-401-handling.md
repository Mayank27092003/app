# 401 Error Handling Documentation

## Overview
The application now has global 401 (Unauthorized) error handling that automatically logs out users when their session expires.

## How It Works

### 1. Automatic Logout on 401
When any API call returns a 401 status code, the HTTP service will:
- Clear the authentication token
- Dispatch the logout action
- Redirect the user to the login screen

### 2. Global Implementation
The 401 handling is implemented in `app/service/http-service.tsx` using Axios response interceptors. This means:
- **No need to handle 401 errors in individual components**
- **Automatic logout happens for all API calls**
- **Consistent behavior across the entire app**

### 3. Error Response Format
When a 401 error occurs, the interceptor returns a standardized error object:
```javascript
{
  message: "Session expired. Please login again.",
  status: 401,
  isUnauthorized: true
}
```

## Usage in Components

### Basic Error Handling
```javascript
import { httpRequest, isUnauthorizedError } from '@app/service/http-service';

try {
  const response = await httpRequest.get('/api/data');
  // Handle success
} catch (error) {
  if (isUnauthorizedError(error)) {
    // This will rarely be reached since logout happens automatically
    console.log('User was logged out due to session expiry');
  } else {
    // Handle other errors
    console.error('API Error:', error.message);
  }
}
```

### Advanced Error Handling
```javascript
import { httpRequest, isSessionExpiredError } from '@app/service/http-service';

try {
  const response = await httpRequest.post('/api/update');
} catch (error) {
  if (isSessionExpiredError(error)) {
    // Show a specific message for session expiry
    showMessage({
      message: "Your session has expired. Please login again.",
      type: "warning"
    });
  } else {
    // Handle other errors normally
    showMessage({
      message: error.message,
      type: "danger"
    });
  }
}
```

## Benefits

1. **Automatic Session Management**: Users are automatically logged out when their session expires
2. **Consistent UX**: All 401 errors are handled uniformly across the app
3. **Security**: Prevents unauthorized access with expired tokens
4. **Developer Friendly**: No need to manually handle 401 errors in every component
5. **Centralized Logic**: All logout logic is in one place

## Testing

To test the 401 handling:
1. Make an API call with an expired token
2. The user should be automatically logged out
3. The user should be redirected to the login screen
4. Check console logs for "🚨 401 Unauthorized error detected" and "✅ User logged out due to 401 error"

## Notes

- The 401 handling is **global** and **automatic**
- Components don't need to handle 401 errors manually
- The logout function clears tokens and dispatches Redux actions
- Error messages are standardized for consistency
