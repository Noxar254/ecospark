import {
  db,
  realtimeDb,
  auth,
  storage,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  ref,
  set,
  get,
  onValue,
  update,
  remove,
  push,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from './firebase-config.js';

// ==================== FIRESTORE OPERATIONS ====================

// Vehicles
export const vehicleService = {
  // Add new vehicle
  async addVehicle(vehicleData) {
    try {
      const docRef = await addDoc(collection(db, 'vehicles'), {
        ...vehicleData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error adding vehicle:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all vehicles
  async getVehicles() {
    try {
      const q = query(collection(db, 'vehicles'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const vehicles = [];
      querySnapshot.forEach((doc) => {
        vehicles.push({ id: doc.id, ...doc.data() });
      });
      return { success: true, data: vehicles };
    } catch (error) {
      console.error('Error getting vehicles:', error);
      return { success: false, error: error.message };
    }
  },

  // Update vehicle
  async updateVehicle(vehicleId, updateData) {
    try {
      const vehicleRef = doc(db, 'vehicles', vehicleId);
      await updateDoc(vehicleRef, {
        ...updateData,
        updatedAt: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating vehicle:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete vehicle
  async deleteVehicle(vehicleId) {
    try {
      await deleteDoc(doc(db, 'vehicles', vehicleId));
      return { success: true };
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      return { success: false, error: error.message };
    }
  }
};

// Customers - Enhanced with Loyalty Points and Multi-Car Support
export const customerService = {
  // Add new customer
  async addCustomer(customerData) {
    try {
      const docRef = await addDoc(collection(db, 'customers'), {
        name: customerData.name || '',
        phone: customerData.phone || '',
        email: customerData.email || '',
        address: customerData.address || '',
        vehicles: customerData.vehicles || [], // Array of { plateNumber, vehicleType, make, model, color }
        loyaltyPoints: customerData.loyaltyPoints || 0,
        totalVisits: customerData.totalVisits || 0,
        totalSpent: customerData.totalSpent || 0,
        notes: customerData.notes || '',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error adding customer:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all customers
  async getCustomers() {
    try {
      const q = query(collection(db, 'customers'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const customers = [];
      querySnapshot.forEach((doc) => {
        customers.push({ id: doc.id, ...doc.data() });
      });
      return { success: true, data: customers };
    } catch (error) {
      console.error('Error getting customers:', error);
      return { success: false, error: error.message };
    }
  },

  // Subscribe to customers (real-time)
  subscribeToCustomers(onUpdate, onError) {
    const q = query(collection(db, 'customers'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, 
      (snapshot) => {
        const customers = [];
        snapshot.forEach((doc) => {
          customers.push({ id: doc.id, ...doc.data() });
        });
        onUpdate(customers);
      },
      (error) => {
        console.error('Customer subscription error:', error);
        if (onError) onError(error);
      }
    );
  },

  // Update customer
  async updateCustomer(customerId, updateData) {
    try {
      const customerRef = doc(db, 'customers', customerId);
      await updateDoc(customerRef, {
        ...updateData,
        updatedAt: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating customer:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete customer
  async deleteCustomer(customerId) {
    try {
      await deleteDoc(doc(db, 'customers', customerId));
      return { success: true };
    } catch (error) {
      console.error('Error deleting customer:', error);
      return { success: false, error: error.message };
    }
  },

  // Add vehicle to customer
  async addVehicleToCustomer(customerId, vehicleData) {
    try {
      const customerRef = doc(db, 'customers', customerId);
      const customerSnap = await getDocs(query(collection(db, 'customers')));
      let customer = null;
      customerSnap.forEach((d) => {
        if (d.id === customerId) customer = { id: d.id, ...d.data() };
      });
      
      if (!customer) return { success: false, error: 'Customer not found' };
      
      const vehicles = customer.vehicles || [];
      vehicles.push({
        ...vehicleData,
        addedAt: new Date().toISOString()
      });
      
      await updateDoc(customerRef, { vehicles, updatedAt: new Date().toISOString() });
      return { success: true };
    } catch (error) {
      console.error('Error adding vehicle to customer:', error);
      return { success: false, error: error.message };
    }
  },

  // Remove vehicle from customer
  async removeVehicleFromCustomer(customerId, plateNumber) {
    try {
      const customerRef = doc(db, 'customers', customerId);
      const customerSnap = await getDocs(query(collection(db, 'customers')));
      let customer = null;
      customerSnap.forEach((d) => {
        if (d.id === customerId) customer = { id: d.id, ...d.data() };
      });
      
      if (!customer) return { success: false, error: 'Customer not found' };
      
      const vehicles = (customer.vehicles || []).filter(v => v.plateNumber !== plateNumber);
      await updateDoc(customerRef, { vehicles, updatedAt: new Date().toISOString() });
      return { success: true };
    } catch (error) {
      console.error('Error removing vehicle from customer:', error);
      return { success: false, error: error.message };
    }
  },

  // Add loyalty points
  async addLoyaltyPoints(customerId, points, reason = '') {
    try {
      const customerRef = doc(db, 'customers', customerId);
      const customerSnap = await getDocs(query(collection(db, 'customers')));
      let customer = null;
      customerSnap.forEach((d) => {
        if (d.id === customerId) customer = { id: d.id, ...d.data() };
      });
      
      if (!customer) return { success: false, error: 'Customer not found' };
      
      const currentPoints = customer.loyaltyPoints || 0;
      const pointsHistory = customer.pointsHistory || [];
      pointsHistory.push({
        points,
        reason,
        type: 'earned',
        date: new Date().toISOString()
      });
      
      await updateDoc(customerRef, { 
        loyaltyPoints: currentPoints + points,
        pointsHistory,
        updatedAt: new Date().toISOString() 
      });
      return { success: true, newBalance: currentPoints + points };
    } catch (error) {
      console.error('Error adding loyalty points:', error);
      return { success: false, error: error.message };
    }
  },

  // Redeem loyalty points
  async redeemLoyaltyPoints(customerId, points, reason = '') {
    try {
      const customerRef = doc(db, 'customers', customerId);
      const customerSnap = await getDocs(query(collection(db, 'customers')));
      let customer = null;
      customerSnap.forEach((d) => {
        if (d.id === customerId) customer = { id: d.id, ...d.data() };
      });
      
      if (!customer) return { success: false, error: 'Customer not found' };
      
      const currentPoints = customer.loyaltyPoints || 0;
      if (currentPoints < points) return { success: false, error: 'Insufficient points' };
      
      const pointsHistory = customer.pointsHistory || [];
      pointsHistory.push({
        points: -points,
        reason,
        type: 'redeemed',
        date: new Date().toISOString()
      });
      
      await updateDoc(customerRef, { 
        loyaltyPoints: currentPoints - points,
        pointsHistory,
        updatedAt: new Date().toISOString() 
      });
      return { success: true, newBalance: currentPoints - points };
    } catch (error) {
      console.error('Error redeeming loyalty points:', error);
      return { success: false, error: error.message };
    }
  },

  // Record customer visit
  async recordVisit(customerId, visitData) {
    try {
      const customerRef = doc(db, 'customers', customerId);
      const customerSnap = await getDocs(query(collection(db, 'customers')));
      let customer = null;
      customerSnap.forEach((d) => {
        if (d.id === customerId) customer = { id: d.id, ...d.data() };
      });
      
      if (!customer) return { success: false, error: 'Customer not found' };
      
      const totalVisits = (customer.totalVisits || 0) + 1;
      const totalSpent = (customer.totalSpent || 0) + (visitData.amount || 0);
      const visitHistory = customer.visitHistory || [];
      visitHistory.push({
        ...visitData,
        date: new Date().toISOString()
      });
      
      await updateDoc(customerRef, { 
        totalVisits,
        totalSpent,
        visitHistory,
        lastVisit: new Date().toISOString(),
        updatedAt: new Date().toISOString() 
      });
      return { success: true, totalVisits };
    } catch (error) {
      console.error('Error recording visit:', error);
      return { success: false, error: error.message };
    }
  },

  // Find customer by plate number
  async findByPlateNumber(plateNumber) {
    try {
      const q = query(collection(db, 'customers'));
      const querySnapshot = await getDocs(q);
      let foundCustomer = null;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.vehicles && data.vehicles.some(v => v.plateNumber?.toLowerCase() === plateNumber.toLowerCase())) {
          foundCustomer = { id: doc.id, ...data };
        }
      });
      return { success: true, data: foundCustomer };
    } catch (error) {
      console.error('Error finding customer:', error);
      return { success: false, error: error.message };
    }
  }
};

// Loyalty Settings Service
export const loyaltySettingsService = {
  async getSettings() {
    try {
      const settingsRef = doc(db, 'settings', 'loyalty');
      const settingsSnap = await getDocs(query(collection(db, 'settings')));
      let settings = null;
      settingsSnap.forEach((d) => {
        if (d.id === 'loyalty') settings = d.data();
      });
      
      // Default settings
      if (!settings) {
        settings = {
          pointsPerVisit: 1,
          pointsPerRand: 0, // e.g., 1 point per KSh 10 spent
          redeemRate: 10, // Points needed for KSh 1 discount
          welcomeBonus: 5,
          birthdayBonus: 10,
          enabled: true
        };
      }
      return { success: true, data: settings };
    } catch (error) {
      console.error('Error getting loyalty settings:', error);
      return { success: false, error: error.message };
    }
  },

  async updateSettings(settingsData) {
    try {
      const settingsRef = doc(db, 'settings', 'loyalty');
      await setDoc(settingsRef, {
        ...settingsData,
        updatedAt: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating loyalty settings:', error);
      return { success: false, error: error.message };
    }
  },

  subscribeToSettings(onUpdate, onError) {
    const settingsRef = doc(db, 'settings', 'loyalty');
    return onSnapshot(settingsRef, 
      (snapshot) => {
        if (snapshot.exists()) {
          onUpdate(snapshot.data());
        } else {
          // Return defaults
          onUpdate({
            pointsPerVisit: 1,
            pointsPerRand: 0,
            redeemRate: 10,
            welcomeBonus: 5,
            birthdayBonus: 10,
            enabled: true
          });
        }
      },
      (error) => {
        console.error('Loyalty settings subscription error:', error);
        if (onError) onError(error);
      }
    );
  }
};

// Billing
export const billingService = {
  async createInvoice(invoiceData) {
    try {
      const docRef = await addDoc(collection(db, 'invoices'), {
        ...invoiceData,
        createdAt: new Date().toISOString(),
        status: invoiceData.status || 'pending'
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating invoice:', error);
      return { success: false, error: error.message };
    }
  },

  async getInvoices() {
    try {
      const q = query(collection(db, 'invoices'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const invoices = [];
      querySnapshot.forEach((doc) => {
        invoices.push({ id: doc.id, ...doc.data() });
      });
      return { success: true, data: invoices };
    } catch (error) {
      console.error('Error getting invoices:', error);
      return { success: false, error: error.message };
    }
  }
};

// Activities (for recent activities tracking)
export const activityService = {
  async logActivity(activityData) {
    try {
      await addDoc(collection(db, 'activities'), {
        ...activityData,
        timestamp: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      console.error('Error logging activity:', error);
      return { success: false, error: error.message };
    }
  },

  async getRecentActivities(limitCount = 10) {
    try {
      const q = query(
        collection(db, 'activities'),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      const activities = [];
      querySnapshot.forEach((doc) => {
        activities.push({ id: doc.id, ...doc.data() });
      });
      return { success: true, data: activities };
    } catch (error) {
      console.error('Error getting activities:', error);
      return { success: false, error: error.message };
    }
  },

  // Real-time listener for activities
  subscribeToActivities(callback, limitCount = 10) {
    const q = query(
      collection(db, 'activities'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const activities = [];
      querySnapshot.forEach((doc) => {
        activities.push({ id: doc.id, ...doc.data() });
      });
      callback(activities);
    });
  }
};

// ==================== REALTIME DATABASE OPERATIONS ====================

// Real-time stats for dashboard
export const realtimeStatsService = {
  // Update stats
  async updateStats(statsData) {
    try {
      const statsRef = ref(realtimeDb, 'stats');
      await set(statsRef, {
        ...statsData,
        lastUpdated: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating stats:', error);
      return { success: false, error: error.message };
    }
  },

  // Listen to stats changes
  subscribeToStats(callback) {
    const statsRef = ref(realtimeDb, 'stats');
    return onValue(statsRef, (snapshot) => {
      const data = snapshot.val();
      callback(data || {});
    });
  },

  // Update individual stat
  async updateStat(statName, value) {
    try {
      const statRef = ref(realtimeDb, `stats/${statName}`);
      await set(statRef, value);
      return { success: true };
    } catch (error) {
      console.error('Error updating stat:', error);
      return { success: false, error: error.message };
    }
  }
};

// Wash Bay status (real-time)
export const washBayService = {
  async updateBayStatus(bayId, status) {
    try {
      const bayRef = ref(realtimeDb, `washBays/${bayId}`);
      await update(bayRef, {
        status,
        lastUpdated: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating bay status:', error);
      return { success: false, error: error.message };
    }
  },

  subscribeToBayStatus(callback) {
    const baysRef = ref(realtimeDb, 'washBays');
    return onValue(baysRef, (snapshot) => {
      const data = snapshot.val();
      callback(data || {});
    });
  }
};

// ==================== AUTHENTICATION ====================

export const authService = {
  // Sign up
  async signUp(email, password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Error signing up:', error);
      return { success: false, error: error.message };
    }
  },

  // Sign in
  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Error signing in:', error);
      return { success: false, error: error.message };
    }
  },

  // Sign out
  async signOut() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      console.error('Error signing out:', error);
      return { success: false, error: error.message };
    }
  },

  // Listen to auth state
  onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
  },

  // Get current user
  getCurrentUser() {
    return auth.currentUser;
  }
};

// ==================== STORAGE ====================

export const storageService = {
  async uploadFile(file, path) {
    try {
      const fileRef = storageRef(storage, path);
      const snapshot = await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return { success: true, url: downloadURL };
    } catch (error) {
      console.error('Error uploading file:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteFile(path) {
    try {
      const fileRef = storageRef(storage, path);
      await deleteObject(fileRef);
      return { success: true };
    } catch (error) {
      console.error('Error deleting file:', error);
      return { success: false, error: error.message };
    }
  }
};

// ==================== VEHICLE INTAKE MODULE ====================

/**
 * Queue Service - Realtime Database
 * For real-time queue management (live updates across all clients)
 */
export const intakeQueueService = {
  // Add vehicle to queue
  async addToQueue(vehicleData) {
    try {
      const queueRef = ref(realtimeDb, 'vehicleIntake/queue');
      const newVehicleRef = push(queueRef);
      const data = {
        ...vehicleData,
        id: newVehicleRef.key,
        timeIn: new Date().toISOString(),
        status: 'waiting',
        createdAt: new Date().toISOString()
      };
      await set(newVehicleRef, data);
      console.log('Vehicle added to queue:', newVehicleRef.key);
      return { success: true, id: newVehicleRef.key, data };
    } catch (error) {
      console.error('Error adding to queue:', error);
      return { success: false, error: error.message };
    }
  },

  // Remove vehicle from queue
  async removeFromQueue(vehicleId) {
    try {
      const vehicleRef = ref(realtimeDb, `vehicleIntake/queue/${vehicleId}`);
      await remove(vehicleRef);
      console.log('Vehicle removed from queue:', vehicleId);
      return { success: true };
    } catch (error) {
      console.error('Error removing from queue:', error);
      return { success: false, error: error.message };
    }
  },

  // Update vehicle in queue
  async updateQueueItem(vehicleId, updateData) {
    try {
      const vehicleRef = ref(realtimeDb, `vehicleIntake/queue/${vehicleId}`);
      await update(vehicleRef, {
        ...updateData,
        updatedAt: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating queue item:', error);
      return { success: false, error: error.message };
    }
  },

  // Subscribe to queue changes (real-time listener)
  subscribeToQueue(callback, onError) {
    const queueRef = ref(realtimeDb, 'vehicleIntake/queue');
    const unsubscribe = onValue(queueRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const queueArray = Object.keys(data).map(key => ({
          ...data[key],
          id: key
        }));
        // Sort by timeIn (oldest first)
        queueArray.sort((a, b) => new Date(a.timeIn) - new Date(b.timeIn));
        callback(queueArray);
      } else {
        callback([]);
      }
    }, (error) => {
      console.error('Queue subscription error:', error);
      if (onError) onError(error);
    });
    return unsubscribe;
  },

  // Get queue once (no subscription)
  async getQueue() {
    try {
      const queueRef = ref(realtimeDb, 'vehicleIntake/queue');
      const snapshot = await get(queueRef);
      const data = snapshot.val();
      if (data) {
        const queueArray = Object.keys(data).map(key => ({
          ...data[key],
          id: key
        }));
        queueArray.sort((a, b) => new Date(a.timeIn) - new Date(b.timeIn));
        return { success: true, data: queueArray };
      }
      return { success: true, data: [] };
    } catch (error) {
      console.error('Error getting queue:', error);
      return { success: false, error: error.message };
    }
  }
};

/**
 * Vehicle Records Service - Firestore
 * For permanent vehicle records storage
 */
export const intakeRecordsService = {
  // Add vehicle to records (when assigned from queue)
  async addRecord(vehicleData) {
    try {
      const docRef = await addDoc(collection(db, 'vehicleIntake'), {
        ...vehicleData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      console.log('Vehicle record created:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error adding vehicle record:', error);
      return { success: false, error: error.message };
    }
  },

  // Update vehicle record
  async updateRecord(recordId, updateData) {
    try {
      const recordRef = doc(db, 'vehicleIntake', recordId);
      await updateDoc(recordRef, {
        ...updateData,
        updatedAt: new Date().toISOString()
      });
      console.log('Vehicle record updated:', recordId);
      return { success: true };
    } catch (error) {
      console.error('Error updating vehicle record:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete vehicle record
  async deleteRecord(recordId) {
    try {
      await deleteDoc(doc(db, 'vehicleIntake', recordId));
      console.log('Vehicle record deleted:', recordId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting vehicle record:', error);
      return { success: false, error: error.message };
    }
  },

  // Subscribe to vehicle records (real-time from Firestore)
  subscribeToRecords(callback, onError) {
    const q = query(
      collection(db, 'vehicleIntake'),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const records = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        // Always use Firestore doc.id, ignore any 'id' field in the data
        records.push({ ...data, id: docSnap.id });
      });
      callback(records);
    }, (error) => {
      console.error('Records subscription error:', error);
      if (onError) onError(error);
    });
    return unsubscribe;
  },

  // Get records once
  async getRecords() {
    try {
      const q = query(
        collection(db, 'vehicleIntake'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const records = [];
      querySnapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() });
      });
      return { success: true, data: records };
    } catch (error) {
      console.error('Error getting records:', error);
      return { success: false, error: error.message };
    }
  }
};

/**
 * Wash Bays Service - Realtime Database
 * For real-time bay status updates
 */
export const intakeBaysService = {
  // Initialize default bays (run once on setup)
  async initializeBays() {
    try {
      const baysRef = ref(realtimeDb, 'vehicleIntake/bays');
      const snapshot = await get(baysRef);
      if (!snapshot.exists()) {
        const defaultBays = {
          'bay-1': { id: 'bay-1', name: 'Bay 1', status: 'available', currentVehicle: null },
          'bay-2': { id: 'bay-2', name: 'Bay 2', status: 'available', currentVehicle: null },
          'bay-3': { id: 'bay-3', name: 'Bay 3', status: 'available', currentVehicle: null },
          'bay-4': { id: 'bay-4', name: 'Bay 4', status: 'available', currentVehicle: null }
        };
        await set(baysRef, defaultBays);
        console.log('Wash bays initialized');
      }
      return { success: true };
    } catch (error) {
      console.error('Error initializing bays:', error);
      return { success: false, error: error.message };
    }
  },

  // Update bay status
  async updateBay(bayId, status, vehicleInfo = null) {
    try {
      const bayRef = ref(realtimeDb, `vehicleIntake/bays/${bayId}`);
      await update(bayRef, {
        status,
        currentVehicle: vehicleInfo,
        lastUpdated: new Date().toISOString()
      });
      console.log('Bay updated:', bayId, status);
      return { success: true };
    } catch (error) {
      console.error('Error updating bay:', error);
      return { success: false, error: error.message };
    }
  },

  // Subscribe to bays (real-time)
  subscribeToBays(callback, onError) {
    const baysRef = ref(realtimeDb, 'vehicleIntake/bays');
    const unsubscribe = onValue(baysRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const baysArray = Object.keys(data).map(key => ({
          ...data[key],
          id: key
        }));
        // Sort by bay name
        baysArray.sort((a, b) => a.name.localeCompare(b.name));
        callback(baysArray);
      } else {
        callback([]);
      }
    }, (error) => {
      console.error('Bays subscription error:', error);
      if (onError) onError(error);
    });
    return unsubscribe;
  },

  // Get bays once
  async getBays() {
    try {
      const baysRef = ref(realtimeDb, 'vehicleIntake/bays');
      const snapshot = await get(baysRef);
      const data = snapshot.val();
      if (data) {
        const baysArray = Object.keys(data).map(key => ({
          ...data[key],
          id: key
        }));
        baysArray.sort((a, b) => a.name.localeCompare(b.name));
        return { success: true, data: baysArray };
      }
      return { success: true, data: [] };
    } catch (error) {
      console.error('Error getting bays:', error);
      return { success: false, error: error.message };
    }
  }
};

/**
 * Service Packages Service - Firestore
 * For managing service packages (wash types)
 */
export const packagesService = {
  // Add new package
  async addPackage(packageData) {
    try {
      const docRef = await addDoc(collection(db, 'servicePackages'), {
        ...packageData,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error adding package:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all packages
  async getPackages() {
    try {
      const q = query(collection(db, 'servicePackages'), orderBy('createdAt', 'asc'));
      const querySnapshot = await getDocs(q);
      const packages = [];
      querySnapshot.forEach((doc) => {
        packages.push({ id: doc.id, ...doc.data() });
      });
      return { success: true, data: packages };
    } catch (error) {
      console.error('Error getting packages:', error);
      return { success: false, error: error.message };
    }
  },

  // Update package
  async updatePackage(packageId, updateData) {
    try {
      const packageRef = doc(db, 'servicePackages', packageId);
      await updateDoc(packageRef, {
        ...updateData,
        updatedAt: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating package:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete package
  async deletePackage(packageId) {
    try {
      await deleteDoc(doc(db, 'servicePackages', packageId));
      return { success: true };
    } catch (error) {
      console.error('Error deleting package:', error);
      return { success: false, error: error.message };
    }
  },

  // Subscribe to packages (real-time)
  subscribeToPackages(callback, onError) {
    const q = query(collection(db, 'servicePackages'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const packages = [];
      querySnapshot.forEach((doc) => {
        packages.push({ ...doc.data(), id: doc.id });
      });
      callback(packages);
    }, (error) => {
      console.error('Packages subscription error:', error);
      if (onError) onError(error);
    });
    return unsubscribe;
  },

  // Initialize default packages (if none exist)
  async initializeDefaultPackages() {
    try {
      const existing = await this.getPackages();
      if (existing.success && existing.data.length === 0) {
        const defaultPackages = [
          { name: 'Basic Wash', price: 500, description: 'Exterior wash and dry', features: ['Exterior Wash', 'Hand Dry', 'Tire Shine'], category: 'standard' },
          { name: 'Standard Wash', price: 800, description: 'Complete exterior and interior clean', features: ['Exterior Wash', 'Interior Vacuum', 'Dashboard Wipe', 'Hand Dry'], category: 'standard' },
          { name: 'Premium Wash', price: 1200, description: 'Full detail with premium products', features: ['Exterior Wash', 'Interior Vacuum', 'Dashboard Polish', 'Seat Cleaning', 'Air Freshener', 'Tire Dressing'], category: 'premium' },
          { name: 'Full Detail', price: 2500, description: 'Complete professional detailing', features: ['Clay Bar Treatment', 'Polish', 'Wax', 'Interior Deep Clean', 'Leather Conditioning', 'Engine Bay Clean'], category: 'premium' },
          { name: 'Interior Only', price: 600, description: 'Deep interior cleaning', features: ['Interior Vacuum', 'Dashboard Wipe', 'Seat Cleaning', 'Door Panel Clean', 'Air Freshener'], category: 'special' },
          { name: 'Exterior Only', price: 400, description: 'Quick exterior wash', features: ['Exterior Wash', 'Hand Dry', 'Window Clean'], category: 'special' }
        ];
        for (const pkg of defaultPackages) {
          await this.addPackage(pkg);
        }
        console.log('✅ Default packages initialized');
        return { success: true, message: 'Default packages created' };
      }
      return { success: true, message: 'Packages already exist' };
    } catch (error) {
      console.error('Error initializing packages:', error);
      return { success: false, error: error.message };
    }
  }
};

/**
 * Intake Stats Service - Realtime Database
 * For dashboard stats (live updates)
 */
export const intakeStatsService = {
  // Update stats
  async updateStats(stats) {
    try {
      const statsRef = ref(realtimeDb, 'vehicleIntake/stats');
      await set(statsRef, {
        ...stats,
        lastUpdated: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating stats:', error);
      return { success: false, error: error.message };
    }
  },

  // Subscribe to stats
  subscribeToStats(callback, onError) {
    const statsRef = ref(realtimeDb, 'vehicleIntake/stats');
    const unsubscribe = onValue(statsRef, (snapshot) => {
      const data = snapshot.val();
      callback(data || { waiting: 0, inProgress: 0, completed: 0, avgWaitTime: 0 });
    }, (error) => {
      console.error('Stats subscription error:', error);
      if (onError) onError(error);
    });
    return unsubscribe;
  }
};

// ==================== EQUIPMENT MANAGEMENT MODULE ====================

/**
 * Equipment Service - Firestore
 * For managing garage/wash bay equipment
 */
export const equipmentService = {
  // Add new equipment
  async addEquipment(equipmentData) {
    try {
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(db, 'equipment'), {
        ...equipmentData,
        status: equipmentData.status || 'operational',
        transferHistory: equipmentData.location ? [{
          from: null,
          to: equipmentData.location,
          date: now,
          notes: 'Initial location'
        }] : [],
        maintenanceHistory: [],
        createdAt: now,
        updatedAt: now
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error adding equipment:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all equipment
  async getEquipment() {
    try {
      const q = query(collection(db, 'equipment'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const equipment = [];
      querySnapshot.forEach((doc) => {
        equipment.push({ id: doc.id, ...doc.data() });
      });
      return { success: true, data: equipment };
    } catch (error) {
      console.error('Error getting equipment:', error);
      return { success: false, error: error.message };
    }
  },

  // Update equipment
  async updateEquipment(equipmentId, updateData) {
    try {
      const equipmentRef = doc(db, 'equipment', equipmentId);
      await updateDoc(equipmentRef, {
        ...updateData,
        updatedAt: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating equipment:', error);
      return { success: false, error: error.message };
    }
  },

  // Transfer equipment to new location
  async transferEquipment(equipmentId, fromLocation, toLocation, notes = '') {
    try {
      const equipmentRef = doc(db, 'equipment', equipmentId);
      const docSnap = await getDocs(query(collection(db, 'equipment')));
      let currentData = null;
      docSnap.forEach((d) => {
        if (d.id === equipmentId) {
          currentData = d.data();
        }
      });
      
      const transferHistory = currentData?.transferHistory || [];
      transferHistory.push({
        from: fromLocation,
        to: toLocation,
        date: new Date().toISOString(),
        notes: notes
      });

      await updateDoc(equipmentRef, {
        location: toLocation,
        transferHistory: transferHistory,
        updatedAt: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      console.error('Error transferring equipment:', error);
      return { success: false, error: error.message };
    }
  },

  // Log maintenance
  async logMaintenance(equipmentId, maintenanceData) {
    try {
      const equipmentRef = doc(db, 'equipment', equipmentId);
      const docSnap = await getDocs(query(collection(db, 'equipment')));
      let currentData = null;
      docSnap.forEach((d) => {
        if (d.id === equipmentId) {
          currentData = d.data();
        }
      });
      
      const maintenanceHistory = currentData?.maintenanceHistory || [];
      maintenanceHistory.push({
        ...maintenanceData,
        date: new Date().toISOString()
      });

      await updateDoc(equipmentRef, {
        maintenanceHistory: maintenanceHistory,
        lastMaintenance: new Date().toISOString().split('T')[0],
        status: 'operational',
        updatedAt: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      console.error('Error logging maintenance:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete equipment
  async deleteEquipment(equipmentId) {
    try {
      await deleteDoc(doc(db, 'equipment', equipmentId));
      return { success: true };
    } catch (error) {
      console.error('Error deleting equipment:', error);
      return { success: false, error: error.message };
    }
  },

  // Subscribe to equipment (real-time)
  subscribeToEquipment(callback, onError) {
    const q = query(collection(db, 'equipment'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const equipment = [];
      querySnapshot.forEach((doc) => {
        equipment.push({ id: doc.id, ...doc.data() });
      });
      callback(equipment);
    }, (error) => {
      console.error('Equipment subscription error:', error);
      if (onError) onError(error);
    });
    return unsubscribe;
  }
};

// ==================== GARAGE MANAGEMENT SERVICES ====================

/**
 * Garage Queue Service - Realtime Database
 * For managing vehicles waiting for garage services
 */
export const garageQueueService = {
  // Add vehicle to garage queue
  async addToQueue(vehicleData) {
    try {
      const queueRef = ref(realtimeDb, 'garage/queue');
      const newVehicleRef = push(queueRef);
      const data = {
        ...vehicleData,
        id: newVehicleRef.key,
        addedAt: new Date().toISOString(),
        status: 'waiting',
        createdAt: new Date().toISOString()
      };
      await set(newVehicleRef, data);
      console.log('Vehicle added to garage queue:', newVehicleRef.key);
      return { success: true, id: newVehicleRef.key, data };
    } catch (error) {
      console.error('Error adding to garage queue:', error);
      return { success: false, error: error.message };
    }
  },

  // Remove vehicle from queue
  async removeFromQueue(vehicleId) {
    try {
      const vehicleRef = ref(realtimeDb, `garage/queue/${vehicleId}`);
      await remove(vehicleRef);
      console.log('Vehicle removed from garage queue:', vehicleId);
      return { success: true };
    } catch (error) {
      console.error('Error removing from garage queue:', error);
      return { success: false, error: error.message };
    }
  },

  // Update vehicle in queue
  async updateQueueItem(vehicleId, updateData) {
    try {
      const vehicleRef = ref(realtimeDb, `garage/queue/${vehicleId}`);
      await update(vehicleRef, {
        ...updateData,
        updatedAt: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating garage queue item:', error);
      return { success: false, error: error.message };
    }
  },

  // Subscribe to queue changes (real-time listener)
  subscribeToQueue(callback, onError) {
    const queueRef = ref(realtimeDb, 'garage/queue');
    const unsubscribe = onValue(queueRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const queueArray = Object.keys(data).map(key => ({
          ...data[key],
          id: key
        }));
        // Sort by addedAt (oldest first)
        queueArray.sort((a, b) => new Date(a.addedAt) - new Date(b.addedAt));
        callback(queueArray);
      } else {
        callback([]);
      }
    }, (error) => {
      console.error('Garage queue subscription error:', error);
      if (onError) onError(error);
    });
    return unsubscribe;
  }
};

/**
 * Garage Jobs Service - Firestore
 * For managing active garage jobs/work orders
 */
export const garageJobsService = {
  // Create a new garage job from queue
  async createJob(jobData) {
    try {
      // Remove any existing 'id' field to prevent conflicts with Firestore document ID
      const { id, ...cleanJobData } = jobData;
      const docRef = await addDoc(collection(db, 'garageJobs'), {
        ...cleanJobData,
        originalQueueId: id || null,  // Store queue ID separately if needed
        status: 'in-progress',
        startedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      console.log('✅ Garage job created with ID:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating garage job:', error);
      return { success: false, error: error.message };
    }
  },

  // Update job
  async updateJob(jobId, updateData) {
    try {
      const jobRef = doc(db, 'garageJobs', jobId);
      await updateDoc(jobRef, {
        ...updateData,
        updatedAt: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating garage job:', error);
      return { success: false, error: error.message };
    }
  },

  // Complete job
  async completeJob(jobId, completionData = {}) {
    try {
      const jobRef = doc(db, 'garageJobs', jobId);
      await updateDoc(jobRef, {
        ...completionData,
        status: 'completed',
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      console.error('Error completing garage job:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete job
  async deleteJob(jobId) {
    try {
      await deleteDoc(doc(db, 'garageJobs', jobId));
      return { success: true };
    } catch (error) {
      console.error('Error deleting garage job:', error);
      return { success: false, error: error.message };
    }
  },

  // Subscribe to all jobs (real-time)
  subscribeToJobs(callback, onError) {
    const q = query(collection(db, 'garageJobs'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const jobs = [];
      querySnapshot.forEach((docSnapshot) => {
        // Ensure Firestore document ID is used, not any 'id' from the data
        const data = docSnapshot.data();
        jobs.push({ ...data, id: docSnapshot.id });
      });
      callback(jobs);
    }, (error) => {
      console.error('Garage jobs subscription error:', error);
      if (onError) onError(error);
    });
    return unsubscribe;
  },

  // Subscribe to active jobs only
  subscribeToActiveJobs(callback, onError) {
    const q = query(collection(db, 'garageJobs'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const jobs = [];
      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        if (data.status === 'in-progress') {
          // Ensure Firestore document ID is used
          jobs.push({ ...data, id: docSnapshot.id });
        }
      });
      callback(jobs);
    }, (error) => {
      console.error('Garage jobs subscription error:', error);
      if (onError) onError(error);
    });
    return unsubscribe;
  }
};

/**
 * Garage Services Catalog - Firestore
 * For managing available garage services
 */
export const garageServicesService = {
  // Initialize default services
  async initializeDefaultServices() {
    try {
      const servicesRef = collection(db, 'garageServices');
      const snapshot = await getDocs(servicesRef);
      
      if (snapshot.empty) {
        const defaultServices = [
          { name: 'Oil Change', category: 'maintenance', price: 3500, duration: 30, description: 'Full oil change with filter replacement' },
          { name: 'Brake Inspection', category: 'inspection', price: 1500, duration: 20, description: 'Complete brake system inspection' },
          { name: 'Brake Pad Replacement', category: 'repair', price: 8000, duration: 60, description: 'Front or rear brake pad replacement' },
          { name: 'Tire Rotation', category: 'maintenance', price: 2000, duration: 30, description: 'Rotate all four tires' },
          { name: 'Wheel Alignment', category: 'maintenance', price: 4500, duration: 45, description: 'Four-wheel alignment service' },
          { name: 'Battery Replacement', category: 'repair', price: 12000, duration: 20, description: 'Battery replacement with testing' },
          { name: 'Air Filter Replacement', category: 'maintenance', price: 1500, duration: 15, description: 'Engine air filter replacement' },
          { name: 'AC Service', category: 'maintenance', price: 5000, duration: 60, description: 'AC inspection, recharge, and service' },
          { name: 'Engine Diagnostics', category: 'inspection', price: 2500, duration: 30, description: 'Full engine diagnostic scan' },
          { name: 'Suspension Check', category: 'inspection', price: 2000, duration: 30, description: 'Suspension and steering inspection' }
        ];

        for (const service of defaultServices) {
          await addDoc(servicesRef, {
            ...service,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
        console.log('✅ Default garage services initialized');
      }
      return { success: true };
    } catch (error) {
      console.error('Error initializing garage services:', error);
      return { success: false, error: error.message };
    }
  },

  // Add new service
  async addService(serviceData) {
    try {
      const docRef = await addDoc(collection(db, 'garageServices'), {
        ...serviceData,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error adding garage service:', error);
      return { success: false, error: error.message };
    }
  },

  // Update service
  async updateService(serviceId, updateData) {
    try {
      const serviceRef = doc(db, 'garageServices', serviceId);
      await updateDoc(serviceRef, {
        ...updateData,
        updatedAt: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating garage service:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete service
  async deleteService(serviceId) {
    try {
      await deleteDoc(doc(db, 'garageServices', serviceId));
      return { success: true };
    } catch (error) {
      console.error('Error deleting garage service:', error);
      return { success: false, error: error.message };
    }
  },

  // Subscribe to services
  subscribeToServices(callback, onError) {
    const q = query(collection(db, 'garageServices'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const services = [];
      querySnapshot.forEach((doc) => {
        services.push({ id: doc.id, ...doc.data() });
      });
      callback(services);
    }, (error) => {
      console.error('Garage services subscription error:', error);
      if (onError) onError(error);
    });
    return unsubscribe;
  }
};

// ==================== USER & PERMISSIONS SERVICE ====================

/**
 * Default role configurations
 */
const DEFAULT_ROLES = {
  admin: {
    name: 'Administrator',
    description: 'Full access to all modules and features',
    modules: ['dashboard', 'vehicle-intake', 'service-packages', 'garage-management', 'wash-bays', 'equipment', 'customers', 'fleet', 'staff', 'scheduling', 'billing', 'inventory', 'reports', 'marketing', 'settings', 'users'],
    permissions: {
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canExport: true,
      canPrint: true,
      canApprove: true,
      canManageUsers: true,
      canViewReports: true,
      canManageSettings: true
    }
  },
  manager: {
    name: 'Manager',
    description: 'Manage operations and staff',
    modules: ['dashboard', 'vehicle-intake', 'service-packages', 'garage-management', 'wash-bays', 'equipment', 'customers', 'fleet', 'staff', 'scheduling', 'billing', 'inventory', 'reports'],
    permissions: {
      canCreate: true,
      canEdit: true,
      canDelete: false,
      canExport: true,
      canPrint: true,
      canApprove: true,
      canManageUsers: false,
      canViewReports: true,
      canManageSettings: false
    }
  },
  cashier: {
    name: 'Cashier',
    description: 'Handle billing and payments',
    modules: ['dashboard', 'vehicle-intake', 'billing', 'customers'],
    permissions: {
      canCreate: true,
      canEdit: false,
      canDelete: false,
      canExport: false,
      canPrint: true,
      canApprove: false,
      canManageUsers: false,
      canViewReports: false,
      canManageSettings: false
    }
  },
  technician: {
    name: 'Technician',
    description: 'Garage and wash bay operations',
    modules: ['dashboard', 'vehicle-intake', 'garage-management', 'wash-bays', 'equipment'],
    permissions: {
      canCreate: true,
      canEdit: true,
      canDelete: false,
      canExport: false,
      canPrint: false,
      canApprove: false,
      canManageUsers: false,
      canViewReports: false,
      canManageSettings: false
    }
  },
  receptionist: {
    name: 'Receptionist',
    description: 'Vehicle intake and customer management',
    modules: ['dashboard', 'vehicle-intake', 'customers', 'scheduling'],
    permissions: {
      canCreate: true,
      canEdit: true,
      canDelete: false,
      canExport: false,
      canPrint: true,
      canApprove: false,
      canManageUsers: false,
      canViewReports: false,
      canManageSettings: false
    }
  }
};

/**
 * User Service - Manage users and their roles/permissions
 */
export const userService = {
  // Create a new user profile (called after auth signup)
  async createUserProfile(userId, userData) {
    try {
      const userRef = doc(db, 'users', userId);
      const profileData = {
        ...userData,
        role: userData.role || 'receptionist',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(userRef, profileData);
      console.log('User profile created:', userId);
      return { success: true, data: profileData };
    } catch (error) {
      console.error('Error creating user profile:', error);
      return { success: false, error: error.message };
    }
  },

  // Get user profile by ID
  async getUserProfile(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      const docSnap = await getDocs(query(collection(db, 'users')));
      let userData = null;
      docSnap.forEach(doc => {
        if (doc.id === userId) {
          userData = { id: doc.id, ...doc.data() };
        }
      });
      if (userData) {
        return { success: true, data: userData };
      }
      return { success: false, error: 'User not found' };
    } catch (error) {
      console.error('Error getting user profile:', error);
      return { success: false, error: error.message };
    }
  },

  // Update user profile
  async updateUserProfile(userId, updates) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating user profile:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all users
  async getAllUsers() {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, 'users'), orderBy('createdAt', 'desc'))
      );
      const users = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return { success: true, data: users };
    } catch (error) {
      console.error('Error getting users:', error);
      return { success: false, error: error.message };
    }
  },

  // Subscribe to users
  subscribeToUsers(callback, onError) {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(users);
    }, (error) => {
      console.error('Users subscription error:', error);
      if (onError) onError(error);
    });
    return unsubscribe;
  },

  // Delete user profile
  async deleteUserProfile(userId) {
    try {
      await deleteDoc(doc(db, 'users', userId));
      return { success: true };
    } catch (error) {
      console.error('Error deleting user profile:', error);
      return { success: false, error: error.message };
    }
  },

  // Get role configuration
  getRole(roleId) {
    return DEFAULT_ROLES[roleId] || DEFAULT_ROLES.receptionist;
  },

  // Get all roles
  getAllRoles() {
    return DEFAULT_ROLES;
  },

  // Check if user has access to a module
  hasModuleAccess(userRole, moduleId) {
    const role = DEFAULT_ROLES[userRole];
    if (!role) return false;
    return role.modules.includes(moduleId);
  },

  // Check if user has a specific permission
  hasPermission(userRole, permissionKey) {
    const role = DEFAULT_ROLES[userRole];
    if (!role) return false;
    return role.permissions[permissionKey] === true;
  },

  // Get user's accessible modules
  getAccessibleModules(userRole) {
    const role = DEFAULT_ROLES[userRole];
    if (!role) return ['dashboard'];
    return role.modules;
  },

  // Initialize admin user if no users exist
  async initializeAdminUser(userId, email) {
    try {
      const usersQuery = await getDocs(collection(db, 'users'));
      if (usersQuery.empty) {
        // No users exist, create admin
        await this.createUserProfile(userId, {
          email: email,
          displayName: 'Administrator',
          role: 'admin',
          isActive: true
        });
        console.log('✅ Admin user initialized');
        return { success: true, isFirstUser: true };
      }
      return { success: true, isFirstUser: false };
    } catch (error) {
      console.error('Error initializing admin:', error);
      return { success: false, error: error.message };
    }
  }
};

// ==================== MAKE SERVICES GLOBALLY AVAILABLE ====================

// Attach to window for use in non-module scripts (React via Babel)
if (typeof window !== 'undefined') {
  window.FirebaseServices = {
    // Vehicle Intake Services
    intakeQueueService,
    intakeRecordsService,
    intakeBaysService,
    intakeStatsService,
    // Service Packages
    packagesService,
    // Equipment Management
    equipmentService,
    // Customer Management
    customerService,
    loyaltySettingsService,
    // Garage Management
    garageQueueService,
    garageJobsService,
    garageServicesService,
    // User & Permissions
    userService,
    // Original Services
    vehicleService,
    billingService,
    activityService,
    realtimeStatsService,
    washBayService,
    authService,
    storageService
  };
  console.log('✅ FirebaseServices attached to window');
}
