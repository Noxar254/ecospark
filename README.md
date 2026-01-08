# Ecospark - Car Wash Management System

A modern, clean car wash management system built with React and Firebase.

## Firebase Integration

### Services Setup

The application uses the following Firebase services:

1. **Firestore Database** - Main data storage for:
   - Vehicles
   - Customers
   - Invoices/Billing
   - Activities
   - Service Packages
   - Fleet Accounts
   - Staff Management
   - Inventory

2. **Realtime Database** - Real-time updates for:
   - Dashboard statistics
   - Wash bay status
   - Live activity feed
   - Equipment status

3. **Authentication** - User management
4. **Storage** - File uploads (documents, images)
5. **Analytics** - Usage tracking

### Firebase Configuration

The Firebase configuration is located in `firebase-config.js` with the following structure:

```javascript
{
  apiKey: "AIzaSyA5f0Ej_QiMKxugLejamESRgN0MOO3-Iwo",
  authDomain: "ecospark-cfa7a.firebaseapp.com",
  projectId: "ecospark-cfa7a",
  storageBucket: "ecospark-cfa7a.firebasestorage.app",
  messagingSenderId: "654848550106",
  appId: "1:654848550106:web:6eccfb1e0bb1d98daeb1e3",
  measurementId: "G-WCBCB7J5XT",
  databaseURL: "https://ecospark-cfa7a-default-rtdb.firebaseio.com"
}
```

### Available Services

All Firebase services are available through `firebase-services.js`:

- `vehicleService` - Vehicle management
- `customerService` - Customer operations
- `billingService` - Invoice and payment handling
- `activityService` - Activity logging and tracking
- `realtimeStatsService` - Dashboard statistics
- `washBayService` - Wash bay status management
- `authService` - User authentication
- `storageService` - File upload/download

### Usage Example

```javascript
import { vehicleService, activityService } from './firebase-services.js';

// Add a new vehicle
const result = await vehicleService.addVehicle({
  plateNumber: 'KAA 123X',
  model: 'Toyota Camry',
  owner: 'John Doe'
});

// Log activity
await activityService.logActivity({
  action: 'Vehicle Added',
  user: 'Admin',
  details: 'New vehicle registered'
});
```

### Running the Application

1. Open `index.html` in a modern web browser
2. The Firebase SDK will automatically initialize
3. All services are ready to use

### Security Notes

- Ensure Firebase security rules are properly configured
- Enable authentication for production use
- Set up proper access controls in Firebase Console
