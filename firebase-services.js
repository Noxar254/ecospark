import {
  db,
  realtimeDb,
  auth,
  storage,
  collection,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
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
  deleteObject,
  listAll
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

  // Find customer by phone number
  async findCustomerByPhone(phone) {
    try {
      if (!phone) return { success: false, error: 'Phone number required' };
      // Normalize phone number
      const normalizedPhone = phone.replace(/\s/g, '').replace(/^\+/, '').replace(/^0/, '254');
      const q = query(collection(db, 'customers'));
      const querySnapshot = await getDocs(q);
      let foundCustomer = null;
      querySnapshot.forEach((doc) => {
        const customer = { id: doc.id, ...doc.data() };
        const customerPhone = (customer.phone || '').replace(/\s/g, '').replace(/^\+/, '').replace(/^0/, '254');
        if (customerPhone === normalizedPhone || customer.phone === phone) {
          foundCustomer = customer;
        }
      });
      if (foundCustomer) {
        return { success: true, data: foundCustomer };
      }
      return { success: false, error: 'Customer not found' };
    } catch (error) {
      console.error('Error finding customer by phone:', error);
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
  },

  // Award loyalty points for a visit (called automatically from intake)
  async awardVisitPoints(customerId, vehiclePlate = null) {
    try {
      // Get loyalty settings first
      const settingsResult = await loyaltySettingsService.getSettings();
      const settings = settingsResult.success ? settingsResult.data : { pointsPerVisit: 1, enabled: true };
      
      if (!settings.enabled) {
        console.log('Loyalty program disabled, skipping points');
        return { success: true, pointsAwarded: 0 };
      }

      const customerRef = doc(db, 'customers', customerId);
      const customerSnap = await getDoc(customerRef);
      
      if (!customerSnap.exists()) {
        return { success: false, error: 'Customer not found' };
      }
      
      const customer = customerSnap.data();
      const pointsToAward = settings.pointsPerVisit || 1;
      const currentPoints = customer.loyaltyPoints || 0;
      const currentVisits = customer.totalVisits || 0;
      const newPoints = currentPoints + pointsToAward;
      const newVisits = currentVisits + 1;
      
      // Update customer with new points and visit count
      await updateDoc(customerRef, {
        loyaltyPoints: newPoints,
        totalVisits: newVisits,
        lastVisit: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      console.log(`🎯 Awarded ${pointsToAward} points to customer ${customerId}. New total: ${newPoints} points, ${newVisits} visits`);
      
      // Check if customer now qualifies for reward
      const rewardThreshold = settings.rewardThreshold || 20;
      const qualifiesForReward = newPoints >= rewardThreshold && !customer.pendingReward;
      
      return { 
        success: true, 
        pointsAwarded: pointsToAward,
        newPointsTotal: newPoints,
        newVisitsTotal: newVisits,
        qualifiesForReward,
        rewardThreshold
      };
    } catch (error) {
      console.error('Error awarding visit points:', error);
      return { success: false, error: error.message };
    }
  },

  // Find customer by phone or plate and award points
  async findAndAwardPoints(phoneNumber, plateNumber) {
    try {
      let customer = null;
      
      // Try to find by phone first
      if (phoneNumber) {
        const phoneResult = await this.findCustomerByPhone(phoneNumber);
        if (phoneResult.success && phoneResult.data) {
          customer = phoneResult.data;
        }
      }
      
      // If not found by phone, try by plate number
      if (!customer && plateNumber) {
        const plateResult = await this.findByPlateNumber(plateNumber);
        if (plateResult.success && plateResult.data) {
          customer = plateResult.data;
        }
      }
      
      if (!customer) {
        console.log('No customer found for phone:', phoneNumber, 'or plate:', plateNumber);
        return { success: false, customerFound: false };
      }
      
      // Award points to found customer
      const result = await this.awardVisitPoints(customer.id, plateNumber);
      return {
        ...result,
        customerFound: true,
        customerId: customer.id,
        customerName: customer.name
      };
    } catch (error) {
      console.error('Error in findAndAwardPoints:', error);
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
          enabled: true,
          rewardThreshold: 20,
          rewardType: 'Free Basic Wash',
          rewardMessage: 'Congratulations! You have earned {points} points and qualify for a FREE wash! Present this message at our car wash to redeem your reward.',
          rewardEnabled: true
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
            enabled: true,
            rewardThreshold: 20,
            rewardType: 'Free Basic Wash',
            rewardMessage: 'Congratulations! You have earned {points} points and qualify for a FREE wash! Present this message at our car wash to redeem your reward.',
            rewardEnabled: true
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
  // Create invoice from garage or wash service
  async createInvoice(invoiceData) {
    try {
      const invoiceNumber = 'INV-' + Date.now().toString(36).toUpperCase();
      const docRef = await addDoc(collection(db, 'invoices'), {
        ...invoiceData,
        invoiceNumber,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: invoiceData.status || 'pending',
        paymentStatus: invoiceData.paymentStatus || 'unpaid',
        paymentMethod: invoiceData.paymentMethod || null,
        paidAt: null,
        paidAmount: 0
      });
      return { success: true, id: docRef.id, invoiceNumber };
    } catch (error) {
      console.error('Error creating invoice:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all invoices
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
  },

  // Subscribe to invoices (real-time)
  subscribeToInvoices(callback, onError) {
    // Try with ordering first, fallback to unordered if it fails
    try {
      const q = query(collection(db, 'invoices'), orderBy('createdAt', 'desc'));
      return onSnapshot(q, (snapshot) => {
        const invoices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(invoices);
      }, (error) => {
        console.error('Invoice subscription error with orderBy, trying without:', error);
        // Fallback: subscribe without ordering
        return onSnapshot(collection(db, 'invoices'), (snapshot) => {
          const invoices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          // Sort client-side
          invoices.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
          callback(invoices);
        }, (fallbackError) => {
          console.error('Invoice subscription fallback error:', fallbackError);
          if (onError) onError(fallbackError);
        });
      });
    } catch (error) {
      console.error('Invoice subscription setup error:', error);
      // Direct fallback without ordering
      return onSnapshot(collection(db, 'invoices'), (snapshot) => {
        const invoices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        invoices.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        callback(invoices);
      }, (fallbackError) => {
        console.error('Invoice subscription fallback error:', fallbackError);
        if (onError) onError(fallbackError);
      });
    }
  },

  // Subscribe to pending invoices only
  subscribeToPendingInvoices(callback, onError) {
    // This requires a composite index. If it fails, the main subscription handles pending via client-side filter
    try {
      const q = query(
        collection(db, 'invoices'), 
        where('paymentStatus', '==', 'unpaid'),
        orderBy('createdAt', 'desc')
      );
      return onSnapshot(q, (snapshot) => {
        const invoices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(invoices);
      }, (error) => {
        console.error('Pending invoice subscription error:', error);
        if (onError) onError(error);
      });
    } catch (error) {
      console.error('Pending invoice subscription setup error:', error);
      if (onError) onError(error);
      return () => {}; // Return empty unsubscribe function
    }
  },

  // Get invoice by ID
  async getInvoice(invoiceId) {
    try {
      const docRef = doc(db, 'invoices', invoiceId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
      }
      return { success: false, error: 'Invoice not found' };
    } catch (error) {
      console.error('Error getting invoice:', error);
      return { success: false, error: error.message };
    }
  },

  // Update invoice
  async updateInvoice(invoiceId, updates) {
    try {
      const docRef = doc(db, 'invoices', invoiceId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating invoice:', error);
      return { success: false, error: error.message };
    }
  },

  // Mark invoice as paid
  async markAsPaid(invoiceId, paymentData) {
    try {
      // First get the invoice to find the linked record
      const invoiceRef = doc(db, 'invoices', invoiceId);
      const invoiceSnap = await getDoc(invoiceRef);
      const invoiceData = invoiceSnap.exists() ? invoiceSnap.data() : null;
      
      // Update the invoice as paid
      await updateDoc(invoiceRef, {
        paymentStatus: 'paid',
        paymentMethod: paymentData.method || 'cash',
        paidAt: new Date().toISOString(),
        paidAmount: paymentData.amount,
        mpesaCode: paymentData.mpesaCode || null,
        mpesaPhone: paymentData.mpesaPhone || null,
        cardLastFour: paymentData.cardLastFour || null,
        transactionRef: paymentData.transactionRef || null,
        updatedAt: new Date().toISOString()
      });
      
      // Auto-update Vehicle Intake record status to 'completed' upon payment
      let intakeRecordData = null;
      if (invoiceData) {
        const recordId = invoiceData.washRecordId || invoiceData.garageRecordId || invoiceData.recordId;
        
        if (recordId) {
          // Get and update the intake record directly
          try {
            const recordRef = doc(db, 'vehicleIntake', recordId);
            const recordSnap = await getDoc(recordRef);
            if (recordSnap.exists()) {
              intakeRecordData = { id: recordSnap.id, ...recordSnap.data() };
            }
            await updateDoc(recordRef, {
              status: 'completed',
              paymentStatus: 'paid',
              paidAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
            console.log('Auto-updated intake record to completed:', recordId);
          } catch (recordErr) {
            console.warn('Could not auto-update intake record:', recordErr);
          }
        } else if (invoiceData.plateNumber) {
          // Try to find and update by plate number if no direct recordId
          try {
            const q = query(
              collection(db, 'vehicleIntake'),
              where('plateNumber', '==', invoiceData.plateNumber),
              where('status', '!=', 'completed')
            );
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
              // Update the most recent matching record
              const recordDoc = snapshot.docs[0];
              intakeRecordData = { id: recordDoc.id, ...recordDoc.data() };
              await updateDoc(recordDoc.ref, {
                status: 'completed',
                paymentStatus: 'paid',
                paidAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
              console.log('Auto-updated intake record by plate:', invoiceData.plateNumber);
            }
          } catch (plateErr) {
            console.warn('Could not find intake record by plate:', plateErr);
          }
        }
        
        // Record visit in vehicle history upon payment
        // Only record if not already recorded for this intake record
        if (invoiceData.plateNumber && (invoiceData.source === 'wash' || invoiceData.source === 'garage')) {
          try {
            const normalizedPlate = invoiceData.plateNumber.toUpperCase().replace(/\s+/g, ' ').trim();
            
            // Get or create vehicle profile
            const profileQuery = query(collection(db, 'vehicleProfiles'), where('plateNumber', '==', normalizedPlate));
            const profileSnapshot = await getDocs(profileQuery);
            
            let profileRef;
            let existingProfile = null;
            let isNewProfile = false;
            
            if (!profileSnapshot.empty) {
              profileRef = profileSnapshot.docs[0].ref;
              existingProfile = profileSnapshot.docs[0].data();
              
              // Check if visit for this record/invoice already exists (prevent duplicates)
              const existingVisits = existingProfile.visitHistory || [];
              const recordId = invoiceData.washRecordId || invoiceData.garageRecordId || invoiceData.recordId;
              const alreadyRecorded = existingVisits.some(v => 
                v.invoiceId === invoiceId || 
                (recordId && v.recordId === recordId)
              );
              
              if (alreadyRecorded) {
                console.log('⏭️ Visit already recorded for this invoice/record, skipping');
              } else {
                // Record the visit
                const visit = {
                  id: `visit-${Date.now()}`,
                  date: new Date().toISOString(),
                  service: invoiceData.services?.[0] || { name: invoiceData.source === 'wash' ? 'Car Wash' : 'Garage Service' },
                  amount: invoiceData.totalAmount || paymentData.amount || 0,
                  vehicleType: invoiceData.vehicleType || intakeRecordData?.vehicleType || null,
                  category: intakeRecordData?.category || 'vehicle',
                  status: 'completed',
                  bay: intakeRecordData?.assignedBay || invoiceData.bayName || null,
                  timeIn: intakeRecordData?.timeIn || invoiceData.startTime || null,
                  timeOut: new Date().toISOString(),
                  customerName: invoiceData.customerName || intakeRecordData?.customerName || null,
                  customerPhone: invoiceData.customerPhone || intakeRecordData?.customerPhone || null,
                  recordId: recordId || intakeRecordData?.id || null,
                  invoiceId: invoiceId,
                  paymentMethod: paymentData.method || 'cash'
                };
                
                existingVisits.unshift(visit);
                
                await updateDoc(profileRef, {
                  totalVisits: (existingProfile.totalVisits || 0) + 1,
                  totalSpent: (existingProfile.totalSpent || 0) + (visit.amount || 0),
                  visitHistory: existingVisits,
                  lastVisit: new Date().toISOString(),
                  lastService: visit.service?.name || null,
                  vehicleType: invoiceData.vehicleType || existingProfile.vehicleType,
                  customerName: invoiceData.customerName || existingProfile.customerName,
                  customerPhone: invoiceData.customerPhone || existingProfile.customerPhone,
                  updatedAt: new Date().toISOString()
                });
                
                console.log('✅ Visit recorded upon payment for:', normalizedPlate, 'Total visits:', (existingProfile.totalVisits || 0) + 1);
              }
            } else {
              // Create new profile with the first visit
              isNewProfile = true;
              const visit = {
                id: `visit-${Date.now()}`,
                date: new Date().toISOString(),
                service: invoiceData.services?.[0] || { name: invoiceData.source === 'wash' ? 'Car Wash' : 'Garage Service' },
                amount: invoiceData.totalAmount || paymentData.amount || 0,
                vehicleType: invoiceData.vehicleType || intakeRecordData?.vehicleType || null,
                category: intakeRecordData?.category || 'vehicle',
                status: 'completed',
                bay: intakeRecordData?.assignedBay || invoiceData.bayName || null,
                timeIn: intakeRecordData?.timeIn || invoiceData.startTime || null,
                timeOut: new Date().toISOString(),
                customerName: invoiceData.customerName || intakeRecordData?.customerName || null,
                customerPhone: invoiceData.customerPhone || intakeRecordData?.customerPhone || null,
                recordId: invoiceData.washRecordId || invoiceData.garageRecordId || invoiceData.recordId || intakeRecordData?.id || null,
                invoiceId: invoiceId,
                paymentMethod: paymentData.method || 'cash'
              };
              
              await addDoc(collection(db, 'vehicleProfiles'), {
                plateNumber: normalizedPlate,
                totalVisits: 1,
                totalSpent: visit.amount || 0,
                visitHistory: [visit],
                lastVisit: new Date().toISOString(),
                lastService: visit.service?.name || null,
                vehicleType: visit.vehicleType,
                customerName: visit.customerName,
                customerPhone: visit.customerPhone,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
              
              console.log('✅ New profile created with first visit for:', normalizedPlate);
            }
          } catch (visitErr) {
            console.warn('Could not record visit on payment:', visitErr);
          }
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      return { success: false, error: error.message };
    }
  },

  // Initiate M-Pesa payment (placeholder for future integration)
  async initiateMpesaPayment(invoiceId, phoneNumber, amount) {
    try {
      // Create M-Pesa payment request record
      const paymentRef = await addDoc(collection(db, 'mpesa_payments'), {
        invoiceId,
        phoneNumber,
        amount,
        status: 'pending',
        initiatedAt: new Date().toISOString(),
        checkoutRequestId: null,
        mpesaReceiptNumber: null,
        resultCode: null,
        resultDesc: null
      });
      
      // TODO: Integrate with actual M-Pesa API
      // For now, return the payment request ID for tracking
      return { 
        success: true, 
        paymentId: paymentRef.id,
        message: 'M-Pesa STK push will be sent to ' + phoneNumber
      };
    } catch (error) {
      console.error('Error initiating M-Pesa payment:', error);
      return { success: false, error: error.message };
    }
  },

  // Subscribe to M-Pesa payments for an invoice
  subscribeToMpesaPayment(paymentId, callback) {
    const docRef = doc(db, 'mpesa_payments', paymentId);
    return onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.id, ...snapshot.data() });
      }
    });
  },

  // Get M-Pesa payments for an invoice
  async getMpesaPayments(invoiceId) {
    try {
      const q = query(
        collection(db, 'mpesa_payments'),
        where('invoiceId', '==', invoiceId),
        orderBy('initiatedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const payments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { success: true, data: payments };
    } catch (error) {
      console.error('Error getting M-Pesa payments:', error);
      return { success: false, error: error.message };
    }
  },

  // Simulate M-Pesa callback (for testing)
  async simulateMpesaCallback(paymentId, success = true) {
    try {
      const paymentRef = doc(db, 'mpesa_payments', paymentId);
      const paymentSnap = await getDoc(paymentRef);
      
      if (!paymentSnap.exists()) {
        return { success: false, error: 'Payment not found' };
      }
      
      const paymentData = paymentSnap.data();
      
      if (success) {
        // Simulate successful payment
        const mpesaReceiptNumber = 'SIM' + Date.now().toString(36).toUpperCase();
        await updateDoc(paymentRef, {
          status: 'completed',
          mpesaReceiptNumber,
          resultCode: 0,
          resultDesc: 'The service request is processed successfully.',
          completedAt: new Date().toISOString()
        });
        
        // Mark invoice as paid
        await this.markAsPaid(paymentData.invoiceId, {
          method: 'mpesa',
          amount: paymentData.amount,
          mpesaCode: mpesaReceiptNumber,
          mpesaPhone: paymentData.phoneNumber
        });
        
        return { success: true, mpesaReceiptNumber };
      } else {
        // Simulate failed payment
        await updateDoc(paymentRef, {
          status: 'failed',
          resultCode: 1,
          resultDesc: 'The balance is insufficient for the transaction.',
          completedAt: new Date().toISOString()
        });
        return { success: false, error: 'Payment failed' };
      }
    } catch (error) {
      console.error('Error simulating M-Pesa callback:', error);
      return { success: false, error: error.message };
    }
  },

  // Get billing statistics
  async getBillingStats() {
    try {
      const invoicesSnap = await getDocs(collection(db, 'invoices'));
      const invoices = invoicesSnap.docs.map(doc => doc.data());
      
      const today = new Date().toISOString().split('T')[0];
      const todayInvoices = invoices.filter(inv => inv.createdAt?.startsWith(today));
      
      return {
        success: true,
        data: {
          totalInvoices: invoices.length,
          pendingPayments: invoices.filter(inv => inv.paymentStatus === 'unpaid').length,
          paidToday: todayInvoices.filter(inv => inv.paymentStatus === 'paid').reduce((sum, inv) => sum + (inv.totalAmount || 0), 0),
          totalPending: invoices.filter(inv => inv.paymentStatus === 'unpaid').reduce((sum, inv) => sum + (inv.totalAmount || 0), 0),
          totalCollected: invoices.filter(inv => inv.paymentStatus === 'paid').reduce((sum, inv) => sum + (inv.paidAmount || 0), 0),
          todayInvoiceCount: todayInvoices.length,
          mpesaPayments: invoices.filter(inv => inv.paymentMethod === 'mpesa' || inv.paymentMethod === 'm-pesa').length,
          cashPayments: invoices.filter(inv => inv.paymentMethod === 'cash').length,
          cardPayments: invoices.filter(inv => inv.paymentMethod === 'card').length
        }
      };
    } catch (error) {
      console.error('Error getting billing stats:', error);
      return { success: false, error: error.message };
    }
  },

  // Revert invoice to unpaid
  async revertToUnpaid(invoiceId) {
    try {
      const docRef = doc(db, 'invoices', invoiceId);
      await updateDoc(docRef, {
        paymentStatus: 'unpaid',
        paymentMethod: null,
        paidAt: null,
        paidAmount: 0,
        mpesaCode: null,
        mpesaPhone: null,
        cardLastFour: null,
        transactionRef: null,
        updatedAt: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      console.error('Error reverting invoice:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete invoice
  async deleteInvoice(invoiceId) {
    try {
      await deleteDoc(doc(db, 'invoices', invoiceId));
      return { success: true };
    } catch (error) {
      console.error('Error deleting invoice:', error);
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

// ==================== WASH BAY SERVICE (REAL-TIME) ====================
// Stable version - defensive coding for long-term use

// Default wash bays configuration (4 bays)
const DEFAULT_WASH_BAYS = {
  bay1: { id: 'bay1', name: 'Bay 1', status: 'available', type: 'standard', currentVehicle: null, startTime: null, createdAt: new Date().toISOString() },
  bay2: { id: 'bay2', name: 'Bay 2', status: 'available', type: 'standard', currentVehicle: null, startTime: null, createdAt: new Date().toISOString() },
  bay3: { id: 'bay3', name: 'Bay 3', status: 'available', type: 'premium', currentVehicle: null, startTime: null, createdAt: new Date().toISOString() },
  bay4: { id: 'bay4', name: 'Bay 4', status: 'available', type: 'express', currentVehicle: null, startTime: null, createdAt: new Date().toISOString() }
};

// Helper: Sanitize data for Firebase (removes undefined values)
const sanitizeForFirebase = (obj) => {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForFirebase);
  
  const result = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (value !== undefined) {
        result[key] = sanitizeForFirebase(value);
      }
    }
  }
  return result;
};

// Helper: Safe string - handles objects by extracting name property
const safeStr = (val, fallback = '') => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'object') {
    // If it's a service object, extract the name
    if (val.name !== undefined) return String(val.name);
    // Otherwise try to stringify or return fallback
    return fallback;
  }
  return String(val);
};

// Helper: Safe number extraction
const safeNum = (val, fallback = 0) => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'object' && val.price !== undefined) return Number(val.price) || fallback;
  const num = Number(val);
  return isNaN(num) ? fallback : num;
};

export const washBayService = {
  // Initialize default bays if none exist (or force reset)
  async initializeBays(forceReset = false) {
    try {
      const baysRef = ref(realtimeDb, 'washBays');
      const snapshot = await get(baysRef);
      
      if (!snapshot.exists() || forceReset) {
        await set(baysRef, sanitizeForFirebase(DEFAULT_WASH_BAYS));
        return { success: true, initialized: true, baysCount: Object.keys(DEFAULT_WASH_BAYS).length };
      }
      
      const existingBays = snapshot.val() || {};
      return { success: true, initialized: false, baysCount: Object.keys(existingBays).length };
    } catch (error) {
      console.error('Error initializing bays:', error);
      return { success: false, error: String(error.message || error) };
    }
  },

  // Reset to default bays (deletes all existing and creates defaults)
  async resetToDefaultBays() {
    try {
      const baysRef = ref(realtimeDb, 'washBays');
      await remove(baysRef);
      
      const freshDefaults = {
        bay1: { id: 'bay1', name: 'Bay 1', status: 'available', type: 'standard', currentVehicle: null, startTime: null, createdAt: new Date().toISOString() },
        bay2: { id: 'bay2', name: 'Bay 2', status: 'available', type: 'standard', currentVehicle: null, startTime: null, createdAt: new Date().toISOString() },
        bay3: { id: 'bay3', name: 'Bay 3', status: 'available', type: 'premium', currentVehicle: null, startTime: null, createdAt: new Date().toISOString() },
        bay4: { id: 'bay4', name: 'Bay 4', status: 'available', type: 'express', currentVehicle: null, startTime: null, createdAt: new Date().toISOString() }
      };
      
      await set(baysRef, sanitizeForFirebase(freshDefaults));
      return { success: true, baysCount: 4 };
    } catch (error) {
      console.error('Error resetting bays:', error);
      return { success: false, error: String(error.message || error) };
    }
  },

  // Add a new bay
  async addBay(bayData) {
    try {
      if (!bayData || !bayData.name) {
        return { success: false, error: 'Bay name is required' };
      }
      const bayId = 'bay' + Date.now();
      const bayRef = ref(realtimeDb, 'washBays/' + bayId);
      const newBay = sanitizeForFirebase({
        id: bayId,
        name: safeStr(bayData.name, 'New Bay'),
        type: safeStr(bayData.type, 'standard'),
        status: 'available',
        currentVehicle: null,
        startTime: null,
        createdAt: new Date().toISOString()
      });
      await set(bayRef, newBay);
      return { success: true, id: bayId };
    } catch (error) {
      console.error('Error adding bay:', error);
      return { success: false, error: String(error.message || error) };
    }
  },

  // Update bay details
  async updateBay(bayId, updates) {
    try {
      if (!bayId) return { success: false, error: 'Bay ID is required' };
      const bayRef = ref(realtimeDb, 'washBays/' + bayId);
      const safeUpdates = sanitizeForFirebase({
        ...updates,
        updatedAt: new Date().toISOString()
      });
      await update(bayRef, safeUpdates);
      return { success: true };
    } catch (error) {
      console.error('Error updating bay:', error);
      return { success: false, error: String(error.message || error) };
    }
  },

  // Delete a bay
  async deleteBay(bayId) {
    try {
      if (!bayId) return { success: false, error: 'Bay ID is required' };
      const bayRef = ref(realtimeDb, 'washBays/' + bayId);
      await remove(bayRef);
      return { success: true };
    } catch (error) {
      console.error('Error deleting bay:', error);
      return { success: false, error: String(error.message || error) };
    }
  },

  // Update bay status
  async updateBayStatus(bayId, status) {
    try {
      if (!bayId) return { success: false, error: 'Bay ID is required' };
      const validStatuses = ['available', 'occupied', 'maintenance'];
      const safeStatus = validStatuses.includes(status) ? status : 'available';
      const bayRef = ref(realtimeDb, 'washBays/' + bayId);
      await update(bayRef, {
        status: safeStatus,
        lastUpdated: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating bay status:', error);
      return { success: false, error: String(error.message || error) };
    }
  },

  // Assign vehicle to bay
  async assignVehicle(bayId, vehicleData) {
    try {
      if (!bayId) return { success: false, error: 'Bay ID is required' };
      if (!vehicleData) return { success: false, error: 'Vehicle data is required' };
      
      const bayRef = ref(realtimeDb, 'washBays/' + bayId);
      const vehicleRecord = sanitizeForFirebase({
        plateNumber: safeStr(vehicleData.plateNumber, 'Unknown'),
        customerName: safeStr(vehicleData.customerName, ''),
        vehicleType: safeStr(vehicleData.vehicleType, ''),
        service: vehicleData.service || 'Basic Wash',
        servicePrice: vehicleData.servicePrice || 0,
        recordId: safeStr(vehicleData.recordId, ''),
        queueId: safeStr(vehicleData.queueId, ''),
        assignedBy: safeStr(vehicleData.assignedBy, ''),
        washedBy: safeStr(vehicleData.washedBy, ''),
        assignedStaffId: safeStr(vehicleData.assignedStaffId, '')
      });
      
      await update(bayRef, {
        status: 'occupied',
        currentVehicle: vehicleRecord,
        startTime: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error assigning vehicle:', error);
      return { success: false, error: String(error.message || error) };
    }
  },

  // Complete wash and release bay - logs to wash history
  async completeWash(bayId, completionData) {
    try {
      if (!bayId) return { success: false, error: 'Bay ID is required' };
      
      const cData = completionData || {};
      const bayRef = ref(realtimeDb, 'washBays/' + bayId);
      const snapshot = await get(bayRef);
      const bayData = snapshot.exists() ? snapshot.val() : null;
      
      // Calculate timing
      const now = new Date();
      const endTimeStr = now.toISOString();
      const startTimeStr = (bayData && bayData.startTime) ? bayData.startTime : endTimeStr;
      let durationMins = 0;
      try {
        if (bayData && bayData.startTime) {
          durationMins = Math.max(0, Math.round((now.getTime() - new Date(bayData.startTime).getTime()) / 60000));
        }
      } catch (e) {
        durationMins = 0;
      }
      
      // Extract vehicle info safely
      const vehicle = (bayData && bayData.currentVehicle) ? bayData.currentVehicle : {};
      
      // Extract service info properly - handle both object and string formats
      const rawService = vehicle.service || cData.service;
      const serviceName = safeStr(rawService, 'Car Wash');
      const servicePrice = safeNum(rawService, vehicle.servicePrice || cData.servicePrice || 0);
      
      // Build history record - all fields guaranteed to have values
      const historyRecord = sanitizeForFirebase({
        bayId: safeStr(bayId, 'unknown'),
        bayName: (bayData && bayData.name) ? safeStr(bayData.name) : ('Bay ' + bayId),
        action: 'completed',
        vehicle: {
          plateNumber: safeStr(vehicle.plateNumber || cData.plateNumber, 'Unknown'),
          customerName: safeStr(vehicle.customerName || cData.customerName, 'Walk-in'),
          vehicleType: safeStr(vehicle.vehicleType || cData.vehicleType, 'Vehicle'),
          service: serviceName,
          servicePrice: servicePrice,
          assignedBy: safeStr(vehicle.assignedBy || cData.assignedBy, ''),
          washedBy: safeStr(vehicle.washedBy || cData.washedBy, ''),
          recordId: safeStr(vehicle.recordId || cData.recordId, '')
        },
        startTime: startTimeStr,
        endTime: endTimeStr,
        duration: durationMins,
        notes: safeStr(cData.notes, ''),
        completedBy: safeStr(cData.completedBy, ''),
        timestamp: endTimeStr
      });
      
      // Save to wash history
      const historyRef = ref(realtimeDb, 'washHistory/' + now.getTime());
      await set(historyRef, historyRecord);
      
      // Clear the bay
      await update(bayRef, {
        status: 'available',
        currentVehicle: null,
        startTime: null,
        lastUpdated: endTimeStr
      });
      
      return { success: true, duration: durationMins };
    } catch (error) {
      console.error('Error completing wash:', error);
      return { success: false, error: String(error.message || error) };
    }
  },

  // Release bay without logging to history (for cancellations)
  async releaseBay(bayId) {
    try {
      if (!bayId) return { success: false, error: 'Bay ID is required' };
      const bayRef = ref(realtimeDb, 'washBays/' + bayId);
      await update(bayRef, {
        status: 'available',
        currentVehicle: null,
        startTime: null,
        lastUpdated: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      console.error('Error releasing bay:', error);
      return { success: false, error: String(error.message || error) };
    }
  },

  // Set bay to maintenance mode
  async setMaintenance(bayId, maintenanceData) {
    try {
      if (!bayId) return { success: false, error: 'Bay ID is required' };
      const mData = maintenanceData || {};
      const bayRef = ref(realtimeDb, 'washBays/' + bayId);
      await update(bayRef, sanitizeForFirebase({
        status: 'maintenance',
        currentVehicle: null,
        startTime: null,
        maintenanceNote: safeStr(mData.note, ''),
        maintenanceBy: safeStr(mData.by, ''),
        lastUpdated: new Date().toISOString()
      }));
      return { success: true };
    } catch (error) {
      console.error('Error setting maintenance:', error);
      return { success: false, error: String(error.message || error) };
    }
  },

  // Subscribe to all bays (real-time) - with error handling
  subscribeToBays(callback, onError) {
    try {
      const baysRef = ref(realtimeDb, 'washBays');
      return onValue(baysRef, (snapshot) => {
        try {
          const data = snapshot.val();
          if (data && typeof data === 'object') {
            const baysArray = Object.values(data).filter(b => b && b.id);
            callback(baysArray);
          } else {
            callback([]);
          }
        } catch (err) {
          console.error('Error processing bays data:', err);
          callback([]);
        }
      }, (error) => {
        console.error('Bays subscription error:', error);
        if (onError) onError(error);
        callback([]);
      });
    } catch (error) {
      console.error('Error setting up bays subscription:', error);
      if (onError) onError(error);
      return () => {};
    }
  },

  // Subscribe to wash history (real-time) - with error handling
  subscribeToHistory(callback, limitCount) {
    try {
      const limit = limitCount || 10000;
      const historyRef = ref(realtimeDb, 'washHistory');
      return onValue(historyRef, (snapshot) => {
        try {
          const data = snapshot.val();
          if (data && typeof data === 'object') {
            const historyArray = Object.entries(data)
              .map(function(entry) { 
                return { id: entry[0], ...entry[1] }; 
              })
              .filter(function(record) { 
                return record && record.action === 'completed'; 
              })
              .sort(function(a, b) { 
                var timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
                var timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
                return timeB - timeA; 
              })
              .slice(0, limit);
            callback(historyArray);
          } else {
            callback([]);
          }
        } catch (err) {
          console.error('Error processing history data:', err);
          callback([]);
        }
      }, (error) => {
        console.error('History subscription error:', error);
        callback([]);
      });
    } catch (error) {
      console.error('Error setting up history subscription:', error);
      return () => {};
    }
  },

  // Get today's stats
  async getTodayStats() {
    try {
      const historyRef = ref(realtimeDb, 'washHistory');
      const snapshot = await get(historyRef);
      const data = snapshot.val();
      
      if (!data) return { success: true, data: { completed: 0, totalMinutes: 0 } };
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let completed = 0;
      let totalMinutes = 0;
      
      Object.values(data).forEach(record => {
        if (record.action === 'completed') {
          const recordDate = new Date(record.timestamp);
          recordDate.setHours(0, 0, 0, 0);
          if (recordDate.getTime() === today.getTime()) {
            completed++;
            totalMinutes += record.duration || 0;
          }
        }
      });
      
      return { 
        success: true, 
        data: { 
          completed, 
          totalMinutes,
          avgTime: completed > 0 ? Math.round(totalMinutes / completed) : 0
        } 
      };
    } catch (error) {
      console.error('Error getting today stats:', error);
      return { success: false, error: error.message };
    }
  }
};

// ==================== STAFF SERVICE ====================
export const staffService = {
  // Add new staff member
  async addStaff(staffData) {
    try {
      const staffId = Date.now().toString();
      const staffRef = ref(realtimeDb, `staff/${staffId}`);
      await set(staffRef, {
        id: staffId,
        name: staffData.name,
        role: staffData.role || 'Washer',
        phone: staffData.phone || '',
        email: staffData.email || '',
        department: staffData.department || 'Operations',
        hireDate: staffData.hireDate || new Date().toISOString().split('T')[0],
        hourlyRate: staffData.hourlyRate || 0,
        // HR Payment Fields
        paymentType: staffData.paymentType || 'monthly', // monthly, weekly, daily, commission
        salary: staffData.salary || 0,
        commissionRate: staffData.commissionRate || 0, // percentage for commission-based
        emergencyContact: staffData.emergencyContact || '',
        notes: staffData.notes || '',
        status: 'active',
        createdAt: new Date().toISOString()
      });
      return { success: true, id: staffId };
    } catch (error) {
      console.error('Error adding staff:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all staff members
  async getStaff() {
    try {
      const staffRef = ref(realtimeDb, 'staff');
      const snapshot = await get(staffRef);
      const data = snapshot.val();
      if (data) {
        return { success: true, data: Object.values(data) };
      }
      return { success: true, data: [] };
    } catch (error) {
      console.error('Error getting staff:', error);
      return { success: false, error: error.message };
    }
  },

  // Subscribe to staff (real-time)
  subscribeToStaff(callback) {
    const staffRef = ref(realtimeDb, 'staff');
    return onValue(staffRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const staffArray = Object.values(data).filter(s => s.status === 'active');
        callback(staffArray);
      } else {
        callback([]);
      }
    });
  },

  // Update staff member
  async updateStaff(staffId, updateData) {
    try {
      const staffRef = ref(realtimeDb, `staff/${staffId}`);
      await update(staffRef, {
        ...updateData,
        updatedAt: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating staff:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete (deactivate) staff member
  async deleteStaff(staffId) {
    try {
      const staffRef = ref(realtimeDb, `staff/${staffId}`);
      await update(staffRef, { status: 'inactive' });
      return { success: true };
    } catch (error) {
      console.error('Error deleting staff:', error);
      return { success: false, error: error.message };
    }
  },

  // Reactivate staff member
  async reactivateStaff(staffId) {
    try {
      const staffRef = ref(realtimeDb, `staff/${staffId}`);
      await update(staffRef, { status: 'active', updatedAt: new Date().toISOString() });
      return { success: true };
    } catch (error) {
      console.error('Error reactivating staff:', error);
      return { success: false, error: error.message };
    }
  },

  // Permanently delete staff member
  async permanentDeleteStaff(staffId) {
    try {
      const staffRef = ref(realtimeDb, `staff/${staffId}`);
      await remove(staffRef);
      return { success: true };
    } catch (error) {
      console.error('Error permanently deleting staff:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all staff including inactive (for management view)
  async getAllStaffIncludingInactive() {
    try {
      const staffRef = ref(realtimeDb, 'staff');
      const snapshot = await get(staffRef);
      const data = snapshot.val();
      if (data) {
        return { success: true, data: Object.values(data) };
      }
      return { success: true, data: [] };
    } catch (error) {
      console.error('Error getting all staff:', error);
      return { success: false, error: error.message };
    }
  },

  // Subscribe to all staff including inactive
  subscribeToAllStaff(callback) {
    const staffRef = ref(realtimeDb, 'staff');
    return onValue(staffRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        callback(Object.values(data));
      } else {
        callback([]);
      }
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

  async uploadProfileImage(userId, file) {
    try {
      const path = `profile-images/${userId}/${Date.now()}_${file.name}`;
      const fileRef = storageRef(storage, path);
      const snapshot = await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return { success: true, url: downloadURL, path };
    } catch (error) {
      console.error('Error uploading profile image:', error);
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
  // Add vehicle to records (when assigned from queue) - Only for NEW vehicles
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

  // Find existing record by plate number (for returning vehicles)
  async findByPlateNumber(plateNumber) {
    try {
      const normalizedPlate = plateNumber.toUpperCase().replace(/\s+/g, ' ').trim();
      
      // Simple query without orderBy to avoid index issues
      const q = query(
        collection(db, 'vehicleIntake'),
        where('plateNumber', '==', normalizedPlate)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log('🔍 No existing record found for plate:', normalizedPlate);
        return { success: true, data: null, exists: false };
      }
      
      // Find the most recent record (sort manually)
      let mostRecent = null;
      let mostRecentTime = null;
      
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const createdAt = data.createdAt ? new Date(data.createdAt) : new Date(0);
        if (!mostRecentTime || createdAt > mostRecentTime) {
          mostRecentTime = createdAt;
          mostRecent = { id: docSnap.id, ...data };
        }
      });
      
      console.log('🔍 Found existing record for plate:', normalizedPlate, 'ID:', mostRecent?.id);
      return { success: true, data: mostRecent, exists: true };
    } catch (error) {
      console.error('Error finding record by plate:', error);
      return { success: false, error: error.message };
    }
  },

  // Add or Update record - MAIN METHOD for handling returning vehicles
  // Flow: When vehicle returns, previous visit goes to history, record shows LATEST service only
  async addOrUpdateRecord(plateNumber, vehicleData, visitHistory = null) {
    try {
      const normalizedPlate = plateNumber.toUpperCase().replace(/\s+/g, ' ').trim();
      
      // Check if record already exists for this plate
      const existingResult = await this.findByPlateNumber(normalizedPlate);
      
      if (existingResult.success && existingResult.exists && existingResult.data) {
        // RETURNING VEHICLE - Update existing record with NEW service, archive previous to history
        const existingRecord = existingResult.data;
        const currentVisitNumber = existingRecord.visitNumber || 1;
        const newVisitNumber = currentVisitNumber + 1;
        
        // Ensure visitHistoryLog is an array (handle old records)
        const existingHistory = Array.isArray(existingRecord.visitHistoryLog) 
          ? [...existingRecord.visitHistoryLog] 
          : [];
        
        // Archive the PREVIOUS visit with ALL its details before updating
        const previousVisit = {
          visitNumber: currentVisitNumber,
          // Service details from previous visit
          service: existingRecord.service,
          serviceName: existingRecord.service?.name || 'Unknown Service',
          price: existingRecord.service?.price || 0,
          // Status and timing
          status: existingRecord.status || 'completed',
          timeIn: existingRecord.timeIn,
          timeOut: existingRecord.timeOut || new Date().toISOString(),
          // Bay info
          assignedBay: existingRecord.assignedBay,
          assignedBayId: existingRecord.assignedBayId,
          // Customer info at time of visit
          customerName: existingRecord.customerName,
          customerPhone: existingRecord.customerPhone,
          // Vehicle info
          itemType: existingRecord.itemType || existingRecord.vehicleType,
          priority: existingRecord.priority,
          // Payment
          paymentStatus: existingRecord.paymentStatus || 'pending',
          // Timestamps
          completedAt: existingRecord.timeOut || existingRecord.updatedAt || new Date().toISOString(),
          archivedAt: new Date().toISOString()
        };
        
        existingHistory.push(previousVisit);
        
        console.log('📜 Visit History for', normalizedPlate, ':', existingHistory.length, 'previous visits archived');
        
        // Update record with NEW visit info - previous visit is now in history
        // The table will show ONLY the latest service (this new one)
        const updateData = {
          // Preserve original record identity
          plateNumber: normalizedPlate,
          category: vehicleData.category || existingRecord.category || 'vehicle',
          createdAt: existingRecord.createdAt, // Keep original first visit date
          
          // NEW service/visit data (this is what shows in intake table)
          service: vehicleData.service, // NEW SERVICE for this visit
          itemType: vehicleData.itemType || vehicleData.vehicleType || existingRecord.itemType,
          vehicleType: vehicleData.itemType || vehicleData.vehicleType || existingRecord.vehicleType,
          priority: vehicleData.priority || 'normal',
          
          // Customer info (use new if provided, else keep existing)
          customerName: vehicleData.customerName || existingRecord.customerName,
          customerPhone: vehicleData.customerPhone || existingRecord.customerPhone,
          
          // New visit status and bay - ALWAYS reset to in-progress for returning vehicles
          status: 'in-progress', // Force in-progress when assigned (completed only after payment)
          assignedBay: vehicleData.assignedBay || null,
          assignedBayId: vehicleData.assignedBayId || null,
          assignedTime: vehicleData.assignedTime || new Date().toISOString(),
          timeIn: vehicleData.timeIn || new Date().toISOString(),
          
          // Reset for new visit - payment starts as pending (shows as 'Waiting')
          timeOut: null,
          paymentStatus: 'pending',
          
          // Visit tracking - THIS IS KEY
          visitNumber: newVisitNumber, // 2nd visit = 2, 3rd = 3, etc.
          isReturningVehicle: true, // Show RETURNING tag
          visitHistoryLog: existingHistory, // All previous visits stored here
          previousVisits: existingHistory.length, // Count of completed visits
          
          // Queue reference if any
          queueId: vehicleData.queueId || null,
          
          // Timestamps
          updatedAt: new Date().toISOString()
        };
        
        await this.updateRecord(existingRecord.id, updateData);
        console.log('✅ RETURNING: Visit #' + newVisitNumber + ' - Record updated with NEW service, Visit #' + currentVisitNumber + ' archived to history');
        
        // AUTO-AWARD LOYALTY POINTS for returning customer
        let loyaltyResult = null;
        const customerPhone = vehicleData.customerPhone || existingRecord.customerPhone;
        if (customerPhone || normalizedPlate) {
          console.log('🎯 Attempting to award loyalty points for returning customer...');
          loyaltyResult = await customerService.findAndAwardPoints(customerPhone, normalizedPlate);
          if (loyaltyResult.success && loyaltyResult.customerFound) {
            console.log(`✅ Loyalty points awarded to ${loyaltyResult.customerName}: +${loyaltyResult.pointsAwarded} pts (Total: ${loyaltyResult.newPointsTotal})`);
            if (loyaltyResult.qualifiesForReward) {
              console.log(`🎁 Customer ${loyaltyResult.customerName} now qualifies for a reward! (${loyaltyResult.newPointsTotal} >= ${loyaltyResult.rewardThreshold})`);
            }
          } else {
            console.log('ℹ️ No matching customer found in loyalty program for this vehicle');
          }
        }
        
        return { 
          success: true, 
          id: existingRecord.id, 
          isReturning: true, 
          visitNumber: newVisitNumber,
          previousVisits: currentVisitNumber,
          loyaltyPointsAwarded: loyaltyResult?.success ? loyaltyResult.pointsAwarded : 0,
          customerFound: loyaltyResult?.customerFound || false,
          qualifiesForReward: loyaltyResult?.qualifiesForReward || false
        };
      } else {
        // NEW VEHICLE - Create first record (Visit #1, no RETURNING tag)
        const now = new Date().toISOString();
        const newRecord = {
          // Identity
          plateNumber: normalizedPlate,
          category: vehicleData.category || 'vehicle',
          
          // Service for this visit (shown in table)
          service: vehicleData.service,
          itemType: vehicleData.itemType || vehicleData.vehicleType,
          vehicleType: vehicleData.itemType || vehicleData.vehicleType,
          priority: vehicleData.priority || 'normal',
          
          // Customer info
          customerName: vehicleData.customerName || null,
          customerPhone: vehicleData.customerPhone || null,
          
          // Status and bay - ALWAYS start as in-progress with pending payment
          status: 'in-progress',
          assignedBay: vehicleData.assignedBay || null,
          assignedBayId: vehicleData.assignedBayId || null,
          assignedTime: vehicleData.assignedTime || now,
          timeIn: vehicleData.timeIn || now,
          timeOut: null,
          paymentStatus: 'pending',
          
          // Visit tracking - First visit
          visitNumber: 1, // First visit is always 1
          isReturningVehicle: false, // No RETURNING tag for first visit
          visitHistoryLog: [], // Empty - no previous visits yet
          previousVisits: 0,
          
          // Queue reference
          queueId: vehicleData.queueId || null,
          
          // Timestamps
          createdAt: now, // First visit date - never changes
          updatedAt: now
        };
        
        const docRef = await addDoc(collection(db, 'vehicleIntake'), newRecord);
        console.log('✅ NEW VEHICLE: Visit #1 created -', normalizedPlate);
        
        // For first-time vehicles, also check if customer exists and award first visit points
        let loyaltyResult = null;
        const customerPhone = vehicleData.customerPhone;
        if (customerPhone || normalizedPlate) {
          console.log('🎯 Checking if new vehicle belongs to existing customer...');
          loyaltyResult = await customerService.findAndAwardPoints(customerPhone, normalizedPlate);
          if (loyaltyResult.success && loyaltyResult.customerFound) {
            console.log(`✅ First visit points awarded to ${loyaltyResult.customerName}: +${loyaltyResult.pointsAwarded} pts`);
          }
        }
        
        return { 
          success: true, 
          id: docRef.id, 
          isReturning: false, 
          visitNumber: 1,
          previousVisits: 0,
          loyaltyPointsAwarded: loyaltyResult?.success ? loyaltyResult.pointsAwarded : 0,
          customerFound: loyaltyResult?.customerFound || false
        };
      }
    } catch (error) {
      console.error('Error in addOrUpdateRecord:', error);
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

  // Search intake records by plate number (partial match)
  async searchByPlate(searchTerm) {
    try {
      if (!searchTerm || searchTerm.length < 2) return { success: true, data: [] };
      
      const normalizedSearch = searchTerm.toUpperCase().trim();
      const q = query(collection(db, 'vehicleIntake'));
      const querySnapshot = await getDocs(q);
      
      const matches = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.plateNumber && data.plateNumber.toUpperCase().includes(normalizedSearch)) {
          matches.push({ id: docSnap.id, ...data });
        }
      });
      
      // Sort by most recent first and remove duplicates (keep only one record per plate)
      const uniquePlates = {};
      matches.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      matches.forEach(record => {
        if (!uniquePlates[record.plateNumber]) {
          uniquePlates[record.plateNumber] = record;
        }
      });
      
      return { success: true, data: Object.values(uniquePlates) };
    } catch (error) {
      console.error('Error searching records by plate:', error);
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
        // Ensure visitNumber is always set (default to 1 for old records)
        const vehicleData = { 
          ...data, 
          id: docSnap.id,
          visitNumber: data.visitNumber || 1 
        };
        records.push(vehicleData);
        
        // Debug log for all vehicles (remove after testing)
        console.log(`📊 ${data.plateNumber}: Visit #${data.visitNumber || 1}`);
      });
      callback(records);
    }, (error) => {
      console.error('Records subscription error:', error);
      if (onError) onError(error);
    });
    return unsubscribe;
  },

  // Subscribe to fleet wash history - realtime updates for specific plate numbers
  // Uses invoice matching for payment status (like Wash Bay History)
  subscribeToFleetWashHistory(plateNumbers, vehiclesMap, callback, onError) {
    if (!plateNumbers || plateNumbers.length === 0) {
      callback([]);
      return () => {};
    }

    console.log('📋 Setting up fleet wash history for plates:', plateNumbers);
    
    let intakeRecords = [];
    let invoices = [];
    let unsubIntake = null;
    let unsubInvoices = null;
    
    // Helper to process and return combined data
    const processAndCallback = () => {
      const allHistory = [];
      
      intakeRecords.forEach((data) => {
        const recordPlate = (data.plateNumber || '').toUpperCase().replace(/\s+/g, ' ').trim();
        
        // Check if this plate belongs to the fleet
        if (plateNumbers.includes(recordPlate)) {
          const vehicle = vehiclesMap[recordPlate];
          
          // Find matching invoice for payment status detection
          const findMatchingInvoice = (recordId, plate, bayId, timestamp) => {
            return invoices.find(inv => {
              // Match by washRecordId or recordId (most reliable)
              if (inv.washRecordId && recordId) {
                return inv.washRecordId === recordId;
              }
              if (inv.recordId && recordId) {
                return inv.recordId === recordId;
              }
              // Match by plateNumber (for fleet invoices)
              if (inv.plateNumber === plate) {
                // If bay and time match within 5 minutes
                if (inv.bayId === bayId && timestamp) {
                  const timeDiff = Math.abs(new Date(inv.createdAt) - new Date(timestamp));
                  if (timeDiff < 300000) return true;
                }
                // Or just plate match with close time
                if (timestamp) {
                  const timeDiff = Math.abs(new Date(inv.createdAt) - new Date(timestamp));
                  if (timeDiff < 600000) return true; // 10 min window for fleet
                }
              }
              return false;
            });
          };
          
          // Add current/latest visit
          if (data.service || data.status) {
            const matchingInvoice = findMatchingInvoice(
              data.id, 
              recordPlate, 
              data.assignedBay, 
              data.timeOut || data.timeIn
            );
            const isPaid = matchingInvoice?.paymentStatus === 'paid' || data.paymentStatus === 'paid';
            
            allHistory.push({
              id: data.id,
              plateNumber: recordPlate,
              vehicleInfo: vehicle ? `${vehicle.make || ''} ${vehicle.model || ''}`.trim() : '',
              driverName: data.driverName || vehicle?.driverName || '-',
              service: data.service?.name || 'Car Wash',
              price: data.totalServicePrice || data.service?.price || 0,
              status: data.status || 'unknown',
              paymentStatus: isPaid ? 'paid' : 'pending',
              date: data.timeIn || data.createdAt || data.assignedTime,
              bay: data.assignedBay || '-',
              washedBy: data.washedBy || '-',
              visitNumber: data.visitNumber || 1,
              additionalServices: data.additionalServices || [],
              invoiceId: matchingInvoice?.id || null
            });
          }
          
          // Add visit history entries
          if (data.visitHistoryLog && Array.isArray(data.visitHistoryLog)) {
            data.visitHistoryLog.forEach((visit, idx) => {
              const visitInvoice = findMatchingInvoice(
                visit.recordId || `${data.id}_history_${idx}`,
                recordPlate,
                visit.assignedBay,
                visit.completedAt || visit.archivedAt
              );
              const visitPaid = visitInvoice?.paymentStatus === 'paid' || visit.paymentStatus === 'paid';
              
              allHistory.push({
                id: `${data.id}_history_${idx}`,
                plateNumber: recordPlate,
                vehicleInfo: vehicle ? `${vehicle.make || ''} ${vehicle.model || ''}`.trim() : '',
                driverName: visit.driverName || vehicle?.driverName || '-',
                service: visit.serviceName || visit.service?.name || 'Car Wash',
                price: visit.price || visit.service?.price || 0,
                status: visit.status || 'completed',
                paymentStatus: visitPaid ? 'paid' : 'pending',
                date: visit.timeIn || visit.completedAt || visit.archivedAt,
                bay: visit.assignedBay || '-',
                washedBy: visit.washedBy || '-',
                visitNumber: visit.visitNumber || idx + 1,
                additionalServices: visit.additionalServices || [],
                invoiceId: visitInvoice?.id || null
              });
            });
          }
        }
      });
      
      // Sort by date (newest first)
      allHistory.sort((a, b) => {
        const dateA = a.date ? new Date(a.date) : new Date(0);
        const dateB = b.date ? new Date(b.date) : new Date(0);
        return dateB - dateA;
      });
      
      console.log('📋 Fleet wash history loaded:', allHistory.length, 'records');
      callback(allHistory);
    };
    
    // Subscribe to intake records
    const intakeQuery = query(
      collection(db, 'vehicleIntake'),
      orderBy('createdAt', 'desc')
    );
    
    unsubIntake = onSnapshot(intakeQuery, (querySnapshot) => {
      intakeRecords = [];
      querySnapshot.forEach((docSnap) => {
        intakeRecords.push({ id: docSnap.id, ...docSnap.data() });
      });
      processAndCallback();
    }, (error) => {
      console.error('Fleet intake records subscription error:', error);
      if (onError) onError(error);
    });
    
    // Subscribe to invoices for payment status matching
    const invoicesQuery = query(
      collection(db, 'invoices'),
      orderBy('createdAt', 'desc')
    );
    
    unsubInvoices = onSnapshot(invoicesQuery, (querySnapshot) => {
      invoices = [];
      querySnapshot.forEach((docSnap) => {
        invoices.push({ id: docSnap.id, ...docSnap.data() });
      });
      processAndCallback();
    }, (error) => {
      console.error('Fleet invoices subscription error:', error);
      // Don't fail completely, just work without invoice matching
      invoices = [];
      processAndCallback();
    });
    
    // Return cleanup function that unsubscribes from both
    return () => {
      if (unsubIntake) try { unsubIntake(); } catch(e) {}
      if (unsubInvoices) try { unsubInvoices(); } catch(e) {}
    };
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
      // Simple query without orderBy to avoid index requirements
      const q = query(collection(db, 'servicePackages'));
      const querySnapshot = await getDocs(q);
      const packages = [];
      querySnapshot.forEach((doc) => {
        packages.push({ id: doc.id, ...doc.data() });
      });
      // Sort client-side by createdAt
      packages.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateA - dateB;
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
    // Simple query without orderBy to avoid index requirements
    const q = query(collection(db, 'servicePackages'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const packages = [];
      querySnapshot.forEach((doc) => {
        packages.push({ ...doc.data(), id: doc.id });
      });
      // Sort client-side by createdAt
      packages.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateA - dateB;
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

/**
 * Vehicle History Service - Firestore
 * For tracking vehicle visit history and visit counts
 */
export const vehicleHistoryService = {
  // Get or create vehicle profile by plate number
  async getOrCreateVehicleProfile(plateNumber) {
    try {
      const normalizedPlate = plateNumber.toUpperCase().replace(/\s+/g, ' ').trim();
      const q = query(collection(db, 'vehicleProfiles'), where('plateNumber', '==', normalizedPlate));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { success: true, data: { id: doc.id, ...doc.data() }, exists: true };
      }
      
      // Create new vehicle profile
      const docRef = await addDoc(collection(db, 'vehicleProfiles'), {
        plateNumber: normalizedPlate,
        totalVisits: 0,
        totalSpent: 0,
        visitHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      return { 
        success: true, 
        data: { 
          id: docRef.id, 
          plateNumber: normalizedPlate, 
          totalVisits: 0, 
          totalSpent: 0, 
          visitHistory: [] 
        }, 
        exists: false 
      };
    } catch (error) {
      console.error('Error getting/creating vehicle profile:', error);
      return { success: false, error: error.message };
    }
  },

  // Search vehicles by plate number
  async searchVehiclesByPlate(searchTerm) {
    try {
      if (!searchTerm || searchTerm.length < 2) return { success: true, data: [] };
      
      const normalizedSearch = searchTerm.toUpperCase().trim();
      const q = query(collection(db, 'vehicleProfiles'), orderBy('plateNumber'));
      const querySnapshot = await getDocs(q);
      
      const matches = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.plateNumber && data.plateNumber.includes(normalizedSearch)) {
          matches.push({ id: doc.id, ...data });
        }
      });
      
      return { success: true, data: matches };
    } catch (error) {
      console.error('Error searching vehicles:', error);
      return { success: false, error: error.message };
    }
  },

  // Record a visit for a vehicle
  async recordVehicleVisit(plateNumber, visitData) {
    try {
      const normalizedPlate = plateNumber.toUpperCase().replace(/\s+/g, ' ').trim();
      
      // Get or create vehicle profile
      const profileResult = await this.getOrCreateVehicleProfile(normalizedPlate);
      if (!profileResult.success) throw new Error(profileResult.error);
      
      const profile = profileResult.data;
      const visitHistory = profile.visitHistory || [];
      
      // Check for duplicate visit (same recordId or same day + same service price)
      const recordId = visitData.recordId;
      const today = new Date().toISOString().split('T')[0];
      const isDuplicate = visitHistory.some(v => {
        // Check by recordId if available
        if (recordId && v.recordId === recordId) return true;
        // Check by invoiceId if available
        if (visitData.invoiceId && v.invoiceId === visitData.invoiceId) return true;
        return false;
      });
      
      if (isDuplicate) {
        console.log('⏭️ Visit already recorded for this record, skipping duplicate');
        return { success: true, totalVisits: profile.totalVisits || 0, skipped: true };
      }
      
      // Create visit record
      const visit = {
        id: `visit-${Date.now()}`,
        date: new Date().toISOString(),
        service: visitData.service || null,
        amount: visitData.amount || 0,
        vehicleType: visitData.vehicleType || null,
        category: visitData.category || 'vehicle',
        status: visitData.status || 'completed',
        bay: visitData.assignedBay || null,
        timeIn: visitData.timeIn || new Date().toISOString(),
        timeOut: visitData.timeOut || null,
        customerName: visitData.customerName || null,
        customerPhone: visitData.customerPhone || null,
        recordId: visitData.recordId || null,
        invoiceId: visitData.invoiceId || null
      };
      
      visitHistory.unshift(visit); // Add to beginning (most recent first)
      
      // Update profile
      const profileRef = doc(db, 'vehicleProfiles', profile.id);
      await updateDoc(profileRef, {
        totalVisits: (profile.totalVisits || 0) + 1,
        totalSpent: (profile.totalSpent || 0) + (visitData.amount || 0),
        visitHistory: visitHistory,
        lastVisit: new Date().toISOString(),
        lastService: visitData.service?.name || null,
        vehicleType: visitData.vehicleType || profile.vehicleType,
        customerName: visitData.customerName || profile.customerName,
        customerPhone: visitData.customerPhone || profile.customerPhone,
        updatedAt: new Date().toISOString()
      });
      
      console.log('✅ Visit recorded for:', normalizedPlate, 'Total visits:', (profile.totalVisits || 0) + 1);
      return { success: true, totalVisits: (profile.totalVisits || 0) + 1 };
    } catch (error) {
      console.error('Error recording vehicle visit:', error);
      return { success: false, error: error.message };
    }
  },

  // Get vehicle visit history - reads from vehicleIntake record's visitHistoryLog
  async getVehicleHistory(plateNumber) {
    try {
      const normalizedPlate = plateNumber.toUpperCase().replace(/\s+/g, ' ').trim();
      
      // First try to get from vehicleIntake (where visitHistoryLog is stored)
      const intakeResult = await intakeRecordsService.findByPlateNumber(normalizedPlate);
      
      if (intakeResult.success && intakeResult.exists && intakeResult.data) {
        const record = intakeResult.data;
        const visitHistoryLog = Array.isArray(record.visitHistoryLog) ? record.visitHistoryLog : [];
        
        // Calculate total spent from history + current visit
        let totalSpent = 0;
        const visitHistory = visitHistoryLog.map((visit, index) => {
          const amount = visit.price || visit.service?.price || 0;
          totalSpent += amount;
          return {
            id: `visit-${index + 1}`,
            visitNumber: visit.visitNumber || index + 1,
            date: visit.timeIn || visit.completedAt,
            timeIn: visit.timeIn,
            timeOut: visit.timeOut,
            service: visit.service,
            serviceName: visit.serviceName || visit.service?.name,
            amount: amount,
            bay: visit.assignedBay,
            status: visit.status || 'completed',
            customerName: visit.customerName,
            customerPhone: visit.customerPhone
          };
        });
        
        // Add current/ongoing visit amount
        totalSpent += record.service?.price || 0;
        
        return { 
          success: true, 
          data: {
            id: record.id,
            plateNumber: normalizedPlate,
            vehicleType: record.itemType || record.vehicleType,
            customerName: record.customerName,
            customerPhone: record.customerPhone,
            totalVisits: record.visitNumber || 1,
            previousVisits: visitHistoryLog.length,
            totalSpent: totalSpent,
            lastVisit: record.updatedAt || record.timeIn,
            firstVisit: record.createdAt,
            currentService: record.service,
            currentStatus: record.status,
            visitHistory: visitHistory.reverse() // Most recent first
          }
        };
      }
      
      // Fallback: try vehicleProfiles collection
      const q = query(collection(db, 'vehicleProfiles'), where('plateNumber', '==', normalizedPlate));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return { success: true, data: null };
      }
      
      const doc = querySnapshot.docs[0];
      return { success: true, data: { id: doc.id, ...doc.data() } };
    } catch (error) {
      console.error('Error getting vehicle history:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all vehicle profiles
  async getAllVehicleProfiles() {
    try {
      const q = query(collection(db, 'vehicleProfiles'), orderBy('lastVisit', 'desc'));
      const querySnapshot = await getDocs(q);
      const profiles = [];
      querySnapshot.forEach((doc) => {
        profiles.push({ id: doc.id, ...doc.data() });
      });
      return { success: true, data: profiles };
    } catch (error) {
      console.error('Error getting all vehicle profiles:', error);
      return { success: false, error: error.message };
    }
  },

  // Subscribe to vehicle profiles (real-time)
  subscribeToVehicleProfiles(callback, onError) {
    const q = query(collection(db, 'vehicleProfiles'), orderBy('lastVisit', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const profiles = [];
      querySnapshot.forEach((doc) => {
        profiles.push({ id: doc.id, ...doc.data() });
      });
      callback(profiles);
    }, (error) => {
      console.error('Vehicle profiles subscription error:', error);
      if (onError) onError(error);
    });
    return unsubscribe;
  },

  // Update vehicle profile
  async updateVehicleProfile(profileId, updateData) {
    try {
      const profileRef = doc(db, 'vehicleProfiles', profileId);
      await updateDoc(profileRef, {
        ...updateData,
        updatedAt: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating vehicle profile:', error);
      return { success: false, error: error.message };
    }
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
    modules: ['dashboard', 'vehicle-intake', 'service-packages', 'garage-management', 'wash-bays', 'equipment', 'customers', 'fleet', 'staff', 'hr', 'expenses', 'billing', 'inventory', 'reports', 'activities', 'marketing', 'settings', 'users'],
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
    modules: ['dashboard', 'vehicle-intake', 'service-packages', 'garage-management', 'wash-bays', 'equipment', 'customers', 'fleet', 'staff', 'hr', 'expenses', 'billing', 'inventory', 'reports', 'activities'],
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
    modules: ['dashboard', 'vehicle-intake', 'billing', 'customers', 'expenses'],
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
    modules: ['dashboard', 'vehicle-intake', 'customers'],
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

  // Subscribe to a single user profile for real-time updates
  subscribeToUserProfile(userId, callback) {
    const userRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() });
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('User profile subscription error:', error);
    });
    return unsubscribe;
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

  // Super Admin email - has access to ALL features
  SUPER_ADMIN_EMAIL: 'admin@ecospark.com',

  // Check if user is super admin
  isSuperAdmin(userEmail) {
    return userEmail?.toLowerCase() === this.SUPER_ADMIN_EMAIL.toLowerCase();
  },

  // Check if user has access to a module
  hasModuleAccess(userRole, moduleId, userPermissions = null, userEmail = null) {
    // Super admin has access to everything
    if (this.isSuperAdmin(userEmail)) {
      return true;
    }
    // If user has custom permissions, check those first
    if (userPermissions && userPermissions[moduleId]) {
      return userPermissions[moduleId].view === true;
    }
    // Fall back to role-based access
    const role = DEFAULT_ROLES[userRole];
    if (!role) return false;
    return role.modules.includes(moduleId);
  },

  // Check if user has a specific permission for a module
  hasPermission(userRole, moduleId, action, userPermissions = null, userEmail = null) {
    // Super admin has ALL permissions
    if (this.isSuperAdmin(userEmail)) {
      return true;
    }
    // If user has custom permissions, check those first
    if (userPermissions && userPermissions[moduleId]) {
      return userPermissions[moduleId][action] === true;
    }
    // Fall back to role-based permissions
    const role = DEFAULT_ROLES[userRole];
    if (!role) return false;
    // For legacy permission keys like 'canManageStaff', check permissions object
    if (typeof action === 'string' && role.permissions[action] !== undefined) {
      return role.permissions[action] === true;
    }
    // Default to view access if module is in allowed list
    return role.modules.includes(moduleId);
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
      
      // Check if admin@ecospark.com exists and reactivate if deactivated
      if (email === 'admin@ecospark.com') {
        const existingAdmin = usersQuery.docs.find(doc => doc.data().email === 'admin@ecospark.com');
        if (existingAdmin && !existingAdmin.data().isActive) {
          // Reactivate the admin account
          await this.updateUserProfile(existingAdmin.id, { 
            isActive: true, 
            role: 'admin',
            updatedAt: new Date().toISOString()
          });
          console.log('✅ Admin user reactivated');
          return { success: true, isFirstUser: false, reactivated: true };
        }
      }
      
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
  },

  // Force reactivate admin by email
  async reactivateAdminByEmail(email = 'admin@ecospark.com') {
    try {
      const usersQuery = await getDocs(collection(db, 'users'));
      const adminDoc = usersQuery.docs.find(doc => doc.data().email === email);
      
      if (adminDoc) {
        await this.updateUserProfile(adminDoc.id, { 
          isActive: true, 
          role: 'admin',
          updatedAt: new Date().toISOString()
        });
        console.log('✅ Admin reactivated:', email);
        return { success: true };
      }
      return { success: false, error: 'Admin user not found' };
    } catch (error) {
      console.error('Error reactivating admin:', error);
      return { success: false, error: error.message };
    }
  }
};

// ==================== AUDIT TRAIL SERVICE ====================

export const auditService = {
  // Get current geolocation
  async getCurrentLocation() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ latitude: null, longitude: null, locationError: 'Geolocation not supported' });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            locationError: null
          });
        },
        (error) => {
          resolve({
            latitude: null,
            longitude: null,
            locationError: error.message
          });
        },
        { timeout: 5000, maximumAge: 60000 }
      );
    });
  },

  // Get device info
  getDeviceInfo() {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    let browser = 'Unknown';
    let os = 'Unknown';
    let device = 'Desktop';

    // Detect browser
    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Edg')) browser = 'Edge';
    else if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';

    // Detect OS
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

    // Detect device type
    if (ua.includes('Mobile') || ua.includes('Android')) device = 'Mobile';
    else if (ua.includes('Tablet') || ua.includes('iPad')) device = 'Tablet';

    return { browser, os, device, userAgent: ua };
  },

  // Log an action with comprehensive data
  async logAction(action) {
    try {
      const auditRef = ref(realtimeDb, 'audit_logs');
      const newLogRef = push(auditRef);
      
      // Get location data
      const locationData = await this.getCurrentLocation();
      const deviceInfo = this.getDeviceInfo();
      
      const logEntry = {
        id: newLogRef.key,
        timestamp: new Date().toISOString(),
        userId: action.userId || 'system',
        userEmail: action.userEmail || 'system',
        userName: action.userName || 'System',
        action: action.action, // 'login', 'logout', 'create', 'update', 'delete', 'view'
        module: action.module || 'system',
        target: action.target || null, // e.g., 'customer', 'vehicle', 'staff'
        targetId: action.targetId || null,
        targetName: action.targetName || null,
        details: action.details || null,
        // Enhanced data
        changes: action.changes || null, // For edit operations: { field: { old: x, new: y } }
        previousValue: action.previousValue || null, // Snapshot before edit/delete
        ipAddress: action.ipAddress || null,
        // Geolocation
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        locationAccuracy: locationData.accuracy || null,
        locationError: locationData.locationError,
        // Device info
        browser: deviceInfo.browser,
        operatingSystem: deviceInfo.os,
        deviceType: deviceInfo.device,
        userAgent: deviceInfo.userAgent,
        // Status
        success: action.success !== false
      };
      await set(newLogRef, logEntry);
      return { success: true, logId: newLogRef.key };
    } catch (error) {
      console.error('Error logging action:', error);
      return { success: false, error: error.message };
    }
  },

  // Log user login with location
  async logLogin(user, success = true, errorMessage = null) {
    return this.logAction({
      userId: user?.uid || 'unknown',
      userEmail: user?.email || 'unknown',
      userName: user?.displayName || user?.email?.split('@')[0] || 'Unknown',
      action: 'login',
      module: 'auth',
      target: 'session',
      details: success ? 'User logged in successfully' : `Login failed: ${errorMessage}`,
      success
    });
  },

  // Log user logout
  async logLogout(user) {
    return this.logAction({
      userId: user?.uid || 'unknown',
      userEmail: user?.email || 'unknown',
      userName: user?.displayName || user?.email?.split('@')[0] || 'Unknown',
      action: 'logout',
      module: 'auth',
      target: 'session',
      details: 'User logged out'
    });
  },

  // Log CRUD operations with change tracking
  async logCRUD(user, operation, module, target, targetId, targetName, details = null, changes = null, previousValue = null) {
    return this.logAction({
      userId: user?.uid || 'unknown',
      userEmail: user?.email || 'unknown',
      userName: user?.displayName || user?.email?.split('@')[0] || 'Unknown',
      action: operation, // 'create', 'update', 'delete', 'view'
      module,
      target,
      targetId,
      targetName,
      details,
      changes,
      previousValue
    });
  },

  // Get audit logs with filters
  async getAuditLogs(filters = {}) {
    try {
      const auditRef = ref(realtimeDb, 'audit_logs');
      const snapshot = await get(auditRef);
      const data = snapshot.val();
      
      if (!data) return { success: true, data: [] };
      
      let logs = Object.values(data).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // Apply filters
      if (filters.userId) logs = logs.filter(l => l.userId === filters.userId);
      if (filters.action) logs = logs.filter(l => l.action === filters.action);
      if (filters.module) logs = logs.filter(l => l.module === filters.module);
      if (filters.startDate) logs = logs.filter(l => new Date(l.timestamp) >= new Date(filters.startDate));
      if (filters.endDate) logs = logs.filter(l => new Date(l.timestamp) <= new Date(filters.endDate));
      if (filters.limit) logs = logs.slice(0, filters.limit);
      
      return { success: true, data: logs };
    } catch (error) {
      console.error('Error getting audit logs:', error);
      return { success: false, error: error.message };
    }
  },

  // Subscribe to audit logs (real-time)
  subscribeToAuditLogs(callback, limit = 100) {
    const auditRef = ref(realtimeDb, 'audit_logs');
    return onValue(auditRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const logs = Object.values(data)
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, limit);
        callback(logs);
      } else {
        callback([]);
      }
    });
  },

  // Get user activity summary
  async getUserActivitySummary(userId) {
    try {
      const result = await this.getAuditLogs({ userId });
      if (!result.success) return result;
      
      const logs = result.data;
      const summary = {
        totalActions: logs.length,
        lastLogin: logs.find(l => l.action === 'login')?.timestamp || null,
        lastActivity: logs[0]?.timestamp || null,
        actionBreakdown: {}
      };
      
      logs.forEach(log => {
        summary.actionBreakdown[log.action] = (summary.actionBreakdown[log.action] || 0) + 1;
      });
      
      return { success: true, data: summary };
    } catch (error) {
      console.error('Error getting user activity:', error);
      return { success: false, error: error.message };
    }
  },

  // Track active sessions with geolocation
  async startSession(user) {
    try {
      const sessionRef = ref(realtimeDb, 'active_sessions/' + user.uid);
      const locationData = await this.getCurrentLocation();
      const deviceInfo = this.getDeviceInfo();
      
      const sessionData = {
        odId: user.uid,
        email: user.email || 'unknown',
        displayName: user.displayName || user.email?.split('@')[0] || 'Unknown',
        loginTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        status: 'active',
        // Geolocation
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        locationAccuracy: locationData.accuracy || null,
        // Device info
        browser: deviceInfo.browser,
        operatingSystem: deviceInfo.os,
        deviceType: deviceInfo.device,
        userAgent: deviceInfo.userAgent
      };
      await set(sessionRef, sessionData);
      return { success: true };
    } catch (error) {
      console.error('Error starting session:', error);
      return { success: false, error: error.message };
    }
  },

  // Update session activity (heartbeat) with location
  async updateSessionActivity(userId) {
    try {
      const sessionRef = ref(realtimeDb, 'active_sessions/' + userId);
      const locationData = await this.getCurrentLocation();
      await update(sessionRef, {
        lastActivity: new Date().toISOString(),
        status: 'active',
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        locationAccuracy: locationData.accuracy || null
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // End session (logout)
  async endSession(userId) {
    try {
      const sessionRef = ref(realtimeDb, 'active_sessions/' + userId);
      await remove(sessionRef);
      return { success: true };
    } catch (error) {
      console.error('Error ending session:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all active sessions
  async getActiveSessions() {
    try {
      const sessionsRef = ref(realtimeDb, 'active_sessions');
      const snapshot = await get(sessionsRef);
      const data = snapshot.val();
      if (!data) return { success: true, data: [] };
      
      const sessions = Object.entries(data).map(([id, session]) => ({
        odId: id,
        ...session
      }));
      return { success: true, data: sessions };
    } catch (error) {
      console.error('Error getting active sessions:', error);
      return { success: false, error: error.message };
    }
  },

  // Subscribe to active sessions
  subscribeToActiveSessions(callback) {
    const sessionsRef = ref(realtimeDb, 'active_sessions');
    return onValue(sessionsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const sessions = Object.entries(data).map(([id, session]) => ({
          odId: id,
          ...session
        }));
        callback(sessions);
      } else {
        callback([]);
      }
    });
  },

  // Check if user is currently active
  isUserActive(activeSessions, userId) {
    return activeSessions.some(s => s.odId === userId && s.status === 'active');
  },

  // Get user's last login info
  async getUserLastLogin(userId) {
    try {
      const result = await this.getAuditLogs({ userId, action: 'login', limit: 1 });
      if (result.success && result.data.length > 0) {
        return { success: true, data: result.data[0] };
      }
      return { success: true, data: null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get user's last logout info
  async getUserLastLogout(userId) {
    try {
      const result = await this.getAuditLogs({ userId, action: 'logout', limit: 1 });
      if (result.success && result.data.length > 0) {
        return { success: true, data: result.data[0] };
      }
      return { success: true, data: null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

// ==================== INVENTORY SERVICE ====================

const inventoryService = {
  // Get all inventory items
  async getAll() {
    try {
      const snapshot = await getDocs(collection(db, 'inventory'));
      return {
        success: true,
        data: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      };
    } catch (error) {
      console.error('Error fetching inventory:', error);
      return { success: false, error: error.message };
    }
  },

  // Get single item
  async getById(id) {
    try {
      const docRef = doc(db, 'inventory', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
      }
      return { success: false, error: 'Item not found' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Add new item
  async add(itemData) {
    try {
      const data = {
        ...itemData,
        quantity: Number(itemData.quantity) || 0,
        minStock: Number(itemData.minStock) || 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'inventory'), data);
      return { success: true, id: docRef.id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Update item
  async update(id, updates) {
    try {
      const docRef = doc(db, 'inventory', id);
      await updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Delete item
  async delete(id) {
    try {
      await deleteDoc(doc(db, 'inventory', id));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Adjust stock (add or remove)
  async adjustStock(id, adjustment, reason = '') {
    try {
      const docRef = doc(db, 'inventory', id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return { success: false, error: 'Item not found' };
      
      const currentQty = docSnap.data().quantity || 0;
      const newQty = Math.max(0, currentQty + adjustment);
      
      await updateDoc(docRef, { 
        quantity: newQty, 
        updatedAt: new Date().toISOString(),
        lastAdjustment: { amount: adjustment, reason, timestamp: new Date().toISOString() }
      });
      
      return { success: true, newQuantity: newQty };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Record usage (for consumables)
  async recordUsage(id, amount, notes = '') {
    try {
      const docRef = doc(db, 'inventory', id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return { success: false, error: 'Item not found' };
      
      const data = docSnap.data();
      const currentQty = data.quantity || 0;
      const usageAmount = Math.abs(Number(amount));
      const newQty = Math.max(0, currentQty - usageAmount);
      
      // Get existing usage history or create new
      const usageHistory = data.usageHistory || [];
      usageHistory.push({
        amount: usageAmount,
        date: new Date().toISOString(),
        notes,
        remainingQty: newQty
      });
      
      // Keep only last 30 records
      const trimmedHistory = usageHistory.slice(-30);
      
      // Calculate daily usage rate (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentUsage = trimmedHistory.filter(u => new Date(u.date) >= sevenDaysAgo);
      const totalRecentUsage = recentUsage.reduce((sum, u) => sum + u.amount, 0);
      const dailyUsageRate = recentUsage.length > 0 ? totalRecentUsage / 7 : 0;
      
      await updateDoc(docRef, { 
        quantity: newQty,
        usageHistory: trimmedHistory,
        dailyUsageRate: Math.round(dailyUsageRate * 100) / 100,
        lastUsage: { amount: usageAmount, date: new Date().toISOString(), notes },
        updatedAt: new Date().toISOString()
      });
      
      return { success: true, newQuantity: newQty, dailyUsageRate };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get usage alert status
  getUsageAlert(item) {
    const dailyRate = item.dailyUsageRate || 0;
    const quantity = item.quantity || 0;
    const alertThreshold = item.usageAlertDays || 7; // Default: alert if less than 7 days supply
    
    if (dailyRate === 0) return null;
    
    const daysRemaining = Math.floor(quantity / dailyRate);
    
    if (daysRemaining <= 3) return { level: 'critical', days: daysRemaining, message: `Only ${daysRemaining} days supply left!` };
    if (daysRemaining <= alertThreshold) return { level: 'warning', days: daysRemaining, message: `${daysRemaining} days supply remaining` };
    return { level: 'ok', days: daysRemaining, message: `${daysRemaining} days supply` };
  },

  // Get stock status
  getStockStatus(quantity, minStock) {
    if (quantity === 0) return 'out-of-stock';
    if (quantity <= minStock) return 'low-stock';
    return 'in-stock';
  },

  // Subscribe to inventory items with realtime updates
  subscribeToItems(callback) {
    const inventoryRef = collection(db, 'inventory');
    return onSnapshot(inventoryRef, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(items);
    }, (error) => {
      console.error('Error subscribing to inventory:', error);
      callback([]);
    });
  }
};

// ==================== FLEET ACCOUNTS SERVICE ====================

const fleetService = {
  // Subscribe to fleet accounts with realtime updates
  subscribeToAccounts(callback) {
    const fleetRef = collection(db, 'fleetAccounts');
    const q = query(fleetRef, orderBy('companyName', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const accounts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(accounts);
    }, (error) => {
      console.error('Error subscribing to fleet accounts:', error);
      callback([]);
    });
  },

  // Get single fleet account
  async getAccount(id) {
    try {
      const docRef = doc(db, 'fleetAccounts', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
      }
      return { success: false, error: 'Account not found' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Add new fleet account
  async addAccount(accountData) {
    try {
      const data = {
        ...accountData,
        accountNumber: `FLT-${Date.now().toString(36).toUpperCase()}`,
        balance: Number(accountData.balance) || 0,
        creditLimit: Number(accountData.creditLimit) || 0,
        discount: Number(accountData.discount) || 0,
        status: accountData.status || 'active',
        totalSpent: 0,
        totalServices: 0,
        vehicles: [],
        authorizedContacts: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'fleetAccounts'), data);
      return { success: true, id: docRef.id, accountNumber: data.accountNumber };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Update fleet account
  async updateAccount(id, updates) {
    try {
      const docRef = doc(db, 'fleetAccounts', id);
      await updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Delete fleet account
  async deleteAccount(id) {
    try {
      await deleteDoc(doc(db, 'fleetAccounts', id));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Add vehicle to fleet account
  async addVehicle(accountId, vehicleData) {
    try {
      const docRef = doc(db, 'fleetAccounts', accountId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return { success: false, error: 'Account not found' };
      
      const vehicles = docSnap.data().vehicles || [];
      const newVehicle = {
        id: `VEH-${Date.now().toString(36).toUpperCase()}`,
        ...vehicleData,
        totalServices: 0,
        totalSpent: 0,
        lastService: null,
        addedAt: new Date().toISOString()
      };
      vehicles.push(newVehicle);
      await updateDoc(docRef, { vehicles, updatedAt: new Date().toISOString() });
      return { success: true, vehicleId: newVehicle.id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Update vehicle in fleet account
  async updateVehicle(accountId, vehicleId, updates) {
    try {
      const docRef = doc(db, 'fleetAccounts', accountId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return { success: false, error: 'Account not found' };
      
      const vehicles = docSnap.data().vehicles || [];
      const idx = vehicles.findIndex(v => v.id === vehicleId);
      if (idx === -1) return { success: false, error: 'Vehicle not found' };
      
      vehicles[idx] = { ...vehicles[idx], ...updates };
      await updateDoc(docRef, { vehicles, updatedAt: new Date().toISOString() });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Remove vehicle from fleet account
  async removeVehicle(accountId, vehicleId) {
    try {
      const docRef = doc(db, 'fleetAccounts', accountId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return { success: false, error: 'Account not found' };
      
      const vehicles = (docSnap.data().vehicles || []).filter(v => v.id !== vehicleId);
      await updateDoc(docRef, { vehicles, updatedAt: new Date().toISOString() });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Add authorized contact
  async addContact(accountId, contactData) {
    try {
      const docRef = doc(db, 'fleetAccounts', accountId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return { success: false, error: 'Account not found' };
      
      const contacts = docSnap.data().authorizedContacts || [];
      const newContact = {
        id: `CON-${Date.now().toString(36).toUpperCase()}`,
        ...contactData,
        addedAt: new Date().toISOString()
      };
      contacts.push(newContact);
      await updateDoc(docRef, { authorizedContacts: contacts, updatedAt: new Date().toISOString() });
      return { success: true, contactId: newContact.id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Remove authorized contact
  async removeContact(accountId, contactId) {
    try {
      const docRef = doc(db, 'fleetAccounts', accountId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return { success: false, error: 'Account not found' };
      
      const contacts = (docSnap.data().authorizedContacts || []).filter(c => c.id !== contactId);
      await updateDoc(docRef, { authorizedContacts: contacts, updatedAt: new Date().toISOString() });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Add balance (top-up)
  async addBalance(accountId, amount, note = '') {
    try {
      const docRef = doc(db, 'fleetAccounts', accountId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return { success: false, error: 'Account not found' };
      
      const currentBalance = docSnap.data().balance || 0;
      const transactions = docSnap.data().transactions || [];
      transactions.unshift({
        id: `TXN-${Date.now().toString(36).toUpperCase()}`,
        type: 'credit',
        amount: Number(amount),
        note,
        balanceAfter: currentBalance + Number(amount),
        date: new Date().toISOString()
      });
      
      await updateDoc(docRef, {
        balance: currentBalance + Number(amount),
        transactions: transactions.slice(0, 100), // Keep last 100 transactions
        updatedAt: new Date().toISOString()
      });
      return { success: true, newBalance: currentBalance + Number(amount) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Deduct balance (charge)
  async chargeAccount(accountId, amount, serviceDetails) {
    try {
      const docRef = doc(db, 'fleetAccounts', accountId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return { success: false, error: 'Account not found' };
      
      const data = docSnap.data();
      const currentBalance = data.balance || 0;
      const creditLimit = data.creditLimit || 0;
      
      if (currentBalance + creditLimit < Number(amount)) {
        return { success: false, error: 'Insufficient balance and credit' };
      }
      
      const transactions = data.transactions || [];
      transactions.unshift({
        id: `TXN-${Date.now().toString(36).toUpperCase()}`,
        type: 'debit',
        amount: Number(amount),
        serviceDetails,
        balanceAfter: currentBalance - Number(amount),
        date: new Date().toISOString()
      });
      
      // Update vehicle stats if provided
      let vehicles = data.vehicles || [];
      if (serviceDetails?.plateNumber) {
        const vIdx = vehicles.findIndex(v => v.plateNumber === serviceDetails.plateNumber);
        if (vIdx !== -1) {
          vehicles[vIdx].totalServices = (vehicles[vIdx].totalServices || 0) + 1;
          vehicles[vIdx].totalSpent = (vehicles[vIdx].totalSpent || 0) + Number(amount);
          vehicles[vIdx].lastService = new Date().toISOString();
        }
      }
      
      await updateDoc(docRef, {
        balance: currentBalance - Number(amount),
        totalSpent: (data.totalSpent || 0) + Number(amount),
        totalServices: (data.totalServices || 0) + 1,
        vehicles,
        transactions: transactions.slice(0, 100),
        updatedAt: new Date().toISOString()
      });
      return { success: true, newBalance: currentBalance - Number(amount) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Subscribe to service history for fleet account
  subscribeToServiceHistory(accountId, callback) {
    const historyRef = collection(db, 'fleetAccounts', accountId, 'serviceHistory');
    const q = query(historyRef, orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(history);
    }, (error) => {
      console.error('Error subscribing to service history:', error);
      callback([]);
    });
  },

  // Add service record to fleet account
  async addServiceRecord(accountId, serviceData) {
    try {
      const historyRef = collection(db, 'fleetAccounts', accountId, 'serviceHistory');
      const data = {
        ...serviceData,
        date: new Date().toISOString()
      };
      await addDoc(historyRef, data);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get fleet statistics
  getStats(accounts) {
    const active = accounts.filter(a => a.status === 'active').length;
    const suspended = accounts.filter(a => a.status === 'suspended').length;
    const totalVehicles = accounts.reduce((sum, a) => sum + (a.vehicles?.length || 0), 0);
    const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
    const totalSpent = accounts.reduce((sum, a) => sum + (a.totalSpent || 0), 0);
    const totalServices = accounts.reduce((sum, a) => sum + (a.totalServices || 0), 0);
    const totalExpenditures = accounts.reduce((sum, a) => sum + (a.totalExpenditures || 0), 0);
    
    return { total: accounts.length, active, suspended, totalVehicles, totalBalance, totalSpent, totalServices, totalExpenditures };
  },

  // Add expenditure to fleet account
  async addExpenditure(accountId, expenditureData) {
    try {
      const docRef = doc(db, 'fleetAccounts', accountId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return { success: false, error: 'Account not found' };
      
      const data = docSnap.data();
      const expenditures = data.expenditures || [];
      const newExpenditure = {
        id: `EXP-${Date.now().toString(36).toUpperCase()}`,
        description: expenditureData.description,
        category: expenditureData.category || 'General',
        amount: Number(expenditureData.amount) || 0,
        date: expenditureData.date || new Date().toISOString().split('T')[0],
        note: expenditureData.note || '',
        vehicle: expenditureData.vehicle || null,
        createdAt: new Date().toISOString()
      };
      expenditures.unshift(newExpenditure);
      
      const totalExpenditures = (data.totalExpenditures || 0) + Number(expenditureData.amount);
      
      await updateDoc(docRef, {
        expenditures: expenditures.slice(0, 200), // Keep last 200 expenditures
        totalExpenditures,
        updatedAt: new Date().toISOString()
      });
      return { success: true, expenditureId: newExpenditure.id, totalExpenditures };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Update expenditure
  async updateExpenditure(accountId, expenditureId, updates) {
    try {
      const docRef = doc(db, 'fleetAccounts', accountId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return { success: false, error: 'Account not found' };
      
      const data = docSnap.data();
      const expenditures = data.expenditures || [];
      const idx = expenditures.findIndex(e => e.id === expenditureId);
      if (idx === -1) return { success: false, error: 'Expenditure not found' };
      
      const oldAmount = expenditures[idx].amount || 0;
      const newAmount = Number(updates.amount) || 0;
      const amountDiff = newAmount - oldAmount;
      
      expenditures[idx] = { 
        ...expenditures[idx], 
        ...updates, 
        amount: newAmount,
        updatedAt: new Date().toISOString() 
      };
      
      const totalExpenditures = (data.totalExpenditures || 0) + amountDiff;
      
      await updateDoc(docRef, {
        expenditures,
        totalExpenditures,
        updatedAt: new Date().toISOString()
      });
      return { success: true, totalExpenditures };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Delete expenditure
  async deleteExpenditure(accountId, expenditureId) {
    try {
      const docRef = doc(db, 'fleetAccounts', accountId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return { success: false, error: 'Account not found' };
      
      const data = docSnap.data();
      const expenditures = data.expenditures || [];
      const exp = expenditures.find(e => e.id === expenditureId);
      if (!exp) return { success: false, error: 'Expenditure not found' };
      
      const totalExpenditures = Math.max(0, (data.totalExpenditures || 0) - (exp.amount || 0));
      const filteredExpenditures = expenditures.filter(e => e.id !== expenditureId);
      
      await updateDoc(docRef, {
        expenditures: filteredExpenditures,
        totalExpenditures,
        updatedAt: new Date().toISOString()
      });
      return { success: true, totalExpenditures };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

// ==================== EXPENSES SERVICE ====================

const expensesService = {
  // Get all expenses with realtime updates
  subscribeToExpenses(callback) {
    const expensesRef = collection(db, 'expenses');
    const q = query(expensesRef, orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const expenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(expenses);
    }, (error) => {
      console.error('Error subscribing to expenses:', error);
      callback([]);
    });
  },

  // Add new expense
  async add(expenseData) {
    try {
      const data = {
        ...expenseData,
        amount: Number(expenseData.amount) || 0,
        date: expenseData.date || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'expenses'), data);
      return { success: true, id: docRef.id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Update expense
  async update(id, updates) {
    try {
      const docRef = doc(db, 'expenses', id);
      await updateDoc(docRef, { ...updates, amount: Number(updates.amount) || 0, updatedAt: new Date().toISOString() });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Delete expense
  async delete(id) {
    try {
      await deleteDoc(doc(db, 'expenses', id));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get expenses summary
  getSummary(expenses) {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = today.slice(0, 7);
    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - 7);
    
    return {
      total: expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
      today: expenses.filter(e => e.date === today).reduce((sum, e) => sum + (e.amount || 0), 0),
      thisWeek: expenses.filter(e => new Date(e.date) >= thisWeekStart).reduce((sum, e) => sum + (e.amount || 0), 0),
      thisMonth: expenses.filter(e => e.date?.startsWith(thisMonth)).reduce((sum, e) => sum + (e.amount || 0), 0),
      count: expenses.length
    };
  }
};

// ==================== HR SERVICE ====================
export const hrService = {
  // Assign staff to a job/wash
  async assignStaffToJob(jobData) {
    try {
      const assignmentId = Date.now().toString();
      const assignmentRef = ref(realtimeDb, `hrAssignments/${assignmentId}`);
      await set(assignmentRef, {
        id: assignmentId,
        staffId: jobData.staffId,
        staffName: jobData.staffName,
        jobType: jobData.jobType || 'wash', // wash, garage, detail, other
        vehiclePlate: jobData.vehiclePlate || '',
        customerName: jobData.customerName || '',
        serviceId: jobData.serviceId || '',
        serviceName: jobData.serviceName || '',
        servicePrice: jobData.servicePrice || 0,
        commissionRate: jobData.commissionRate || 0,
        commissionAmount: jobData.commissionAmount || 0,
        status: 'completed',
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });
      return { success: true, id: assignmentId };
    } catch (error) {
      console.error('Error assigning staff to job:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all staff assignments/work history
  async getStaffAssignments(staffId = null) {
    try {
      const assignmentsRef = ref(realtimeDb, 'hrAssignments');
      const snapshot = await get(assignmentsRef);
      const data = snapshot.val();
      if (data) {
        let assignments = Object.values(data);
        if (staffId) {
          assignments = assignments.filter(a => a.staffId === staffId);
        }
        assignments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return { success: true, data: assignments };
      }
      return { success: true, data: [] };
    } catch (error) {
      console.error('Error getting staff assignments:', error);
      return { success: false, error: error.message };
    }
  },

  // Subscribe to staff assignments (real-time)
  subscribeToAssignments(callback, staffId = null) {
    const assignmentsRef = ref(realtimeDb, 'hrAssignments');
    return onValue(assignmentsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        let assignments = Object.values(data);
        if (staffId) {
          assignments = assignments.filter(a => a.staffId === staffId);
        }
        assignments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        callback(assignments);
      } else {
        callback([]);
      }
    });
  },

  // Record a payment to staff
  async recordPayment(paymentData) {
    try {
      const paymentId = Date.now().toString();
      const paymentRef = ref(realtimeDb, `hrPayments/${paymentId}`);
      await set(paymentRef, {
        id: paymentId,
        staffId: paymentData.staffId,
        staffName: paymentData.staffName,
        paymentType: paymentData.paymentType, // salary, commission, bonus
        grossAmount: paymentData.grossAmount || paymentData.amount,
        amount: paymentData.amount,
        periodStart: paymentData.periodStart || '',
        periodEnd: paymentData.periodEnd || '',
        jobsCount: paymentData.jobsCount || 0,
        totalCommission: paymentData.totalCommission || 0,
        baseSalary: paymentData.baseSalary || 0,
        paye: paymentData.paye || 0,
        nhif: paymentData.nhif || 0,
        nssf: paymentData.nssf || 0,
        otherDeductions: paymentData.otherDeductions || 0,
        totalDeductions: paymentData.totalDeductions || 0,
        deductions: paymentData.deductions || 0,
        notes: paymentData.notes || '',
        status: 'paid',
        paidAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });
      return { success: true, id: paymentId };
    } catch (error) {
      console.error('Error recording payment:', error);
      return { success: false, error: error.message };
    }
  },

  // Update a payment (for cancel/status change)
  async updatePayment(paymentId, updateData) {
    try {
      const paymentRef = ref(realtimeDb, `hrPayments/${paymentId}`);
      const snapshot = await get(paymentRef);
      if (!snapshot.exists()) {
        return { success: false, error: 'Payment not found' };
      }
      const currentData = snapshot.val();
      await set(paymentRef, {
        ...currentData,
        ...updateData,
        updatedAt: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating payment:', error);
      return { success: false, error: error.message };
    }
  },

  // Get payment history
  async getPayments(staffId = null) {
    try {
      const paymentsRef = ref(realtimeDb, 'hrPayments');
      const snapshot = await get(paymentsRef);
      const data = snapshot.val();
      if (data) {
        let payments = Object.values(data);
        if (staffId) {
          payments = payments.filter(p => p.staffId === staffId);
        }
        payments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return { success: true, data: payments };
      }
      return { success: true, data: [] };
    } catch (error) {
      console.error('Error getting payments:', error);
      return { success: false, error: error.message };
    }
  },

  // Subscribe to payments (real-time)
  subscribeToPayments(callback, staffId = null) {
    const paymentsRef = ref(realtimeDb, 'hrPayments');
    return onValue(paymentsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        let payments = Object.values(data);
        if (staffId) {
          payments = payments.filter(p => p.staffId === staffId);
        }
        payments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        callback(payments);
      } else {
        callback([]);
      }
    });
  },

  // Get staff statistics (jobs count, earnings, etc.)
  async getStaffStats(staffId, periodStart = null, periodEnd = null) {
    try {
      const assignmentsResult = await this.getStaffAssignments(staffId);
      const paymentsResult = await this.getPayments(staffId);
      
      let assignments = assignmentsResult.data || [];
      let payments = paymentsResult.data || [];
      
      // Filter by period if provided
      if (periodStart && periodEnd) {
        const start = new Date(periodStart);
        const end = new Date(periodEnd);
        end.setHours(23, 59, 59, 999);
        
        assignments = assignments.filter(a => {
          const date = new Date(a.createdAt);
          return date >= start && date <= end;
        });
        
        payments = payments.filter(p => {
          const date = new Date(p.createdAt);
          return date >= start && date <= end;
        });
      }
      
      const totalJobs = assignments.length;
      const totalCommission = assignments.reduce((sum, a) => sum + (parseFloat(a.commissionAmount) || 0), 0);
      const totalPaid = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
      
      return {
        success: true,
        data: {
          totalJobs,
          totalCommission,
          totalPaid,
          pendingCommission: totalCommission - totalPaid,
          assignments,
          payments
        }
      };
    } catch (error) {
      console.error('Error getting staff stats:', error);
      return { success: false, error: error.message };
    }
  }
};

// ==================== FACTORY RESET SERVICE ====================

export const factoryResetService = {
  // All Firestore collections to delete
  FIRESTORE_COLLECTIONS: [
    'vehicles',
    'customers',
    'settings',
    'invoices',
    'vehicleIntake',
    'vehicleProfiles',
    'mpesa_payments',
    'activities',
    'servicePackages',
    'equipment',
    'garageJobs',
    'garageServices',
    'inventory',
    'fleetAccounts',
    'expenses'
  ],

  // Realtime Database paths to delete
  REALTIME_PATHS: [
    'stats',
    'washBays',
    'washHistory',
    'staff',
    'vehicleIntake',
    'garage',
    'audit_logs'
  ],

  // Storage folders to delete
  STORAGE_FOLDERS: [
    'uploads',
    'images',
    'documents',
    'receipts',
    'vehicle-images'
  ],

  // Get counts of documents in each Firestore collection
  async getFirestoreCounts() {
    const counts = {};
    let total = 0;
    for (const collName of this.FIRESTORE_COLLECTIONS) {
      try {
        const snapshot = await getDocs(collection(db, collName));
        counts[collName] = snapshot.size;
        total += snapshot.size;
      } catch (err) {
        counts[collName] = 0;
      }
    }
    return { counts, total };
  },

  // Get counts for Realtime Database paths
  async getRealtimeCounts() {
    const counts = {};
    let total = 0;
    for (const path of this.REALTIME_PATHS) {
      try {
        const snapshot = await get(ref(realtimeDb, path));
        if (snapshot.exists()) {
          const data = snapshot.val();
          const count = typeof data === 'object' ? Object.keys(data).length : 1;
          counts[path] = count;
          total += count;
        } else {
          counts[path] = 0;
        }
      } catch (err) {
        counts[path] = 0;
      }
    }
    return { counts, total };
  },

  // Get Storage file counts
  async getStorageCounts() {
    const counts = {};
    let total = 0;
    for (const folder of this.STORAGE_FOLDERS) {
      try {
        const folderRef = storageRef(storage, folder);
        const result = await listAll(folderRef);
        counts[folder] = result.items.length;
        total += result.items.length;
      } catch (err) {
        counts[folder] = 0;
      }
    }
    return { counts, total };
  },

  // Delete all documents in a Firestore collection
  async deleteFirestoreCollection(collName) {
    try {
      const snapshot = await getDocs(collection(db, collName));
      // Skip if no documents found
      if (snapshot.empty || snapshot.size === 0) {
        return { success: true, deleted: 0 };
      }
      const deletePromises = snapshot.docs.map(docSnap => deleteDoc(doc(db, collName, docSnap.id)));
      await Promise.all(deletePromises);
      return { success: true, deleted: snapshot.size };
    } catch (err) {
      console.error(`Error deleting collection ${collName}:`, err);
      return { success: false, error: err.message };
    }
  },

  // Delete a Realtime Database path
  async deleteRealtimePath(path) {
    try {
      const snapshot = await get(ref(realtimeDb, path));
      // Skip if path doesn't exist
      if (!snapshot.exists()) {
        return { success: true };
      }
      await remove(ref(realtimeDb, path));
      return { success: true };
    } catch (err) {
      console.error(`Error deleting realtime path ${path}:`, err);
      return { success: false, error: err.message };
    }
  },

  // Delete all files in a Storage folder
  async deleteStorageFolder(folder) {
    try {
      const folderRef = storageRef(storage, folder);
      const result = await listAll(folderRef);
      // Skip if no files found
      if (!result.items || result.items.length === 0) {
        return { success: true, deleted: 0 };
      }
      const deletePromises = result.items.map(item => deleteObject(item));
      await Promise.all(deletePromises);
      return { success: true, deleted: result.items.length };
    } catch (err) {
      // If folder doesn't exist or is empty, just pass
      if (err.code === 'storage/object-not-found' || err.code === 'storage/unknown') {
        return { success: true, deleted: 0 };
      }
      console.error(`Error deleting storage folder ${folder}:`, err);
      return { success: false, error: err.message };
    }
  },

  // Full factory reset - deletes everything except auth
  async performFullReset(progressCallback) {
    const results = {
      firestore: { success: true, deleted: 0, errors: [] },
      realtime: { success: true, deleted: 0, errors: [] },
      storage: { success: true, deleted: 0, errors: [] }
    };

    // Delete Firestore collections
    for (let i = 0; i < this.FIRESTORE_COLLECTIONS.length; i++) {
      const collName = this.FIRESTORE_COLLECTIONS[i];
      progressCallback?.({ phase: 'firestore', current: i + 1, total: this.FIRESTORE_COLLECTIONS.length, item: collName });
      const result = await this.deleteFirestoreCollection(collName);
      if (result.success) {
        results.firestore.deleted += result.deleted || 0;
      } else {
        results.firestore.errors.push({ collection: collName, error: result.error });
      }
    }

    // Delete Realtime Database paths
    for (let i = 0; i < this.REALTIME_PATHS.length; i++) {
      const path = this.REALTIME_PATHS[i];
      progressCallback?.({ phase: 'realtime', current: i + 1, total: this.REALTIME_PATHS.length, item: path });
      const result = await this.deleteRealtimePath(path);
      if (result.success) {
        results.realtime.deleted++;
      } else {
        results.realtime.errors.push({ path, error: result.error });
      }
    }

    // Delete Storage folders
    for (let i = 0; i < this.STORAGE_FOLDERS.length; i++) {
      const folder = this.STORAGE_FOLDERS[i];
      progressCallback?.({ phase: 'storage', current: i + 1, total: this.STORAGE_FOLDERS.length, item: folder });
      const result = await this.deleteStorageFolder(folder);
      if (result.success) {
        results.storage.deleted += result.deleted || 0;
      } else {
        results.storage.errors.push({ folder, error: result.error });
      }
    }

    results.firestore.success = results.firestore.errors.length === 0;
    results.realtime.success = results.realtime.errors.length === 0;
    results.storage.success = results.storage.errors.length === 0;

    return results;
  }
};

// ==================== TEAM CHAT SERVICE ====================
export const teamChatService = {
  // Send a message (to specific user or broadcast to all)
  async sendMessage(messageData) {
    try {
      const messageId = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
      const messageRef = ref(realtimeDb, `teamChat/messages/${messageId}`);
      await set(messageRef, {
        id: messageId,
        senderId: messageData.senderId,
        senderName: messageData.senderName,
        senderRole: messageData.senderRole || 'User',
        recipientId: messageData.recipientId || 'all', // 'all' for broadcast
        recipientName: messageData.recipientName || 'All Users',
        message: messageData.message,
        type: messageData.recipientId === 'all' ? 'broadcast' : 'direct',
        timestamp: new Date().toISOString(),
        status: 'sent', // sent, delivered, read
        readBy: { [messageData.senderId]: true },
        deliveredTo: { [messageData.senderId]: true }
      });
      return { success: true, id: messageId };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }
  },

  // Get messages for a user (includes broadcasts and direct messages to/from them)
  async getMessages(userId, limitCount = 50) {
    try {
      const messagesRef = ref(realtimeDb, 'teamChat/messages');
      const snapshot = await get(messagesRef);
      const data = snapshot.val();
      if (data) {
        const messages = Object.values(data)
          .filter(m => 
            m.recipientId === 'all' || 
            m.senderId === userId || 
            m.recipientId === userId
          )
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, limitCount);
        return { success: true, data: messages };
      }
      return { success: true, data: [] };
    } catch (error) {
      console.error('Error getting messages:', error);
      return { success: false, error: error.message };
    }
  },

  // Subscribe to messages (real-time)
  subscribeToMessages(userId, callback) {
    const messagesRef = ref(realtimeDb, 'teamChat/messages');
    return onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messages = Object.values(data)
          .filter(m => 
            m.recipientId === 'all' || 
            m.senderId === userId || 
            m.recipientId === userId
          )
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)); // oldest first for display
        callback(messages);
      } else {
        callback([]);
      }
    });
  },

  // Mark message as read
  async markAsRead(messageId, userId) {
    try {
      const readRef = ref(realtimeDb, `teamChat/messages/${messageId}/readBy/${userId}`);
      await set(readRef, true);
      // Update message status to 'read' if all recipients have read
      const statusRef = ref(realtimeDb, `teamChat/messages/${messageId}/status`);
      await set(statusRef, 'read');
      return { success: true };
    } catch (error) {
      console.error('Error marking message as read:', error);
      return { success: false, error: error.message };
    }
  },

  // Mark message as delivered
  async markAsDelivered(messageId, userId) {
    try {
      const deliveredRef = ref(realtimeDb, `teamChat/messages/${messageId}/deliveredTo/${userId}`);
      await set(deliveredRef, true);
      // Update status to delivered if not already read
      const msgRef = ref(realtimeDb, `teamChat/messages/${messageId}`);
      const snapshot = await get(msgRef);
      const msg = snapshot.val();
      if (msg && msg.status === 'sent') {
        const statusRef = ref(realtimeDb, `teamChat/messages/${messageId}/status`);
        await set(statusRef, 'delivered');
      }
      return { success: true };
    } catch (error) {
      console.error('Error marking message as delivered:', error);
      return { success: false, error: error.message };
    }
  },

  // Get unread count for a user
  getUnreadCount(messages, userId) {
    return messages.filter(m => 
      m.senderId !== userId && 
      (!m.readBy || !m.readBy[userId])
    ).length;
  },

  // Delete a message (only sender can delete)
  async deleteMessage(messageId, userId) {
    try {
      const messageRef = ref(realtimeDb, `teamChat/messages/${messageId}`);
      const snapshot = await get(messageRef);
      const message = snapshot.val();
      if (message && message.senderId === userId) {
        await remove(messageRef);
        return { success: true };
      }
      return { success: false, error: 'Not authorized to delete this message' };
    } catch (error) {
      console.error('Error deleting message:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all logged-in users (from Firestore users collection)
  async getLoggedInUsers() {
    try {
      const usersSnapshot = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
      const users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter(u => u.isActive !== false);
      return { success: true, data: users };
    } catch (error) {
      console.error('Error getting users:', error);
      return { success: false, error: error.message };
    }
  },

  // Subscribe to users for real-time list
  subscribeToUsers(callback) {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter(u => u.isActive !== false);
      callback(users);
    });
  },

  // Clear all chat messages
  async clearAllMessages() {
    try {
      const messagesRef = ref(realtimeDb, 'teamChat/messages');
      await remove(messagesRef);
      return { success: true };
    } catch (error) {
      console.error('Error clearing messages:', error);
      return { success: false, error: error.message };
    }
  }
};

// ==================== BRANDING SERVICE ====================
export const brandingService = {
  // Default branding configuration
  getDefaultBranding() {
    return {
      // Company Identity
      companyName: 'EcoSpark',
      tagline: 'Car Wash Management System',
      shortName: 'ES',
      
      // Contact Information
      address: '',
      city: '',
      phone: '',
      email: '',
      website: '',
      
      // Legal Information
      taxPin: '',
      businessReg: '',
      
      // Brand Colors
      primaryColor: '#3b82f6',
      secondaryColor: '#10b981',
      accentColor: '#f59e0b',
      
      // Receipt Settings
      receiptHeader: 'OFFICIAL RECEIPT',
      receiptFooter: 'Thank you for choosing us!',
      invoiceFooter: 'Payment due within 30 days',
      termsAndConditions: '',
      
      // Logo (Base64 or URL)
      logoUrl: '',
      logoType: 'icon', // 'icon', 'text', 'image'
      
      // Social Media
      facebook: '',
      instagram: '',
      twitter: '',
      
      // Additional Settings
      currency: 'KES',
      currencySymbol: 'KSh',
      timezone: 'Africa/Nairobi',
      dateFormat: 'DD/MM/YYYY',
      
      // Metadata
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  },

  // Save branding configuration
  async saveBranding(brandingData) {
    try {
      const brandingRef = doc(db, 'settings', 'branding');
      await setDoc(brandingRef, {
        ...brandingData,
        updatedAt: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      console.error('Error saving branding:', error);
      return { success: false, error: error.message };
    }
  },

  // Get branding configuration
  async getBranding() {
    try {
      const brandingRef = doc(db, 'settings', 'branding');
      const snapshot = await getDoc(brandingRef);
      if (snapshot.exists()) {
        // Merge with defaults to ensure all fields exist
        const defaults = this.getDefaultBranding();
        return { success: true, data: { ...defaults, ...snapshot.data() } };
      }
      return { success: true, data: this.getDefaultBranding() };
    } catch (error) {
      console.error('Error getting branding:', error);
      return { success: false, error: error.message, data: this.getDefaultBranding() };
    }
  },

  // Subscribe to branding changes (real-time updates)
  subscribeToBranding(callback) {
    const brandingRef = doc(db, 'settings', 'branding');
    return onSnapshot(brandingRef, (snapshot) => {
      if (snapshot.exists()) {
        const defaults = this.getDefaultBranding();
        callback({ ...defaults, ...snapshot.data() });
      } else {
        callback(this.getDefaultBranding());
      }
    }, (error) => {
      console.error('Branding subscription error:', error);
      callback(this.getDefaultBranding());
    });
  },

  // Upload logo image
  async uploadLogo(file) {
    try {
      // Convert to base64 for simplicity (works without storage setup)
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({ success: true, url: reader.result });
        };
        reader.onerror = () => {
          reject({ success: false, error: 'Failed to read file' });
        };
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      return { success: false, error: error.message };
    }
  }
};

// ==================== SETTINGS SERVICE ====================
export const settingsService = {
  // Save support contacts
  async saveSupportContacts(contacts) {
    try {
      const contactsRef = doc(db, 'settings', 'supportContacts');
      await setDoc(contactsRef, {
        email: contacts.email || '',
        phone: contacts.phone || '',
        whatsapp: contacts.whatsapp || '',
        updatedAt: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      console.error('Error saving support contacts:', error);
      return { success: false, error: error.message };
    }
  },

  // Get support contacts
  async getSupportContacts() {
    try {
      const contactsRef = doc(db, 'settings', 'supportContacts');
      const snapshot = await getDoc(contactsRef);
      if (snapshot.exists()) {
        return { success: true, data: snapshot.data() };
      }
      return { success: true, data: null };
    } catch (error) {
      console.error('Error getting support contacts:', error);
      return { success: false, error: error.message };
    }
  }
};

// ==================== MAKE SERVICES GLOBALLY AVAILABLE ====================

// Attach to window for use in non-module scripts (React via Babel)
if (typeof window !== 'undefined') {
  window.FirebaseServices = {
    inventoryService,
    expensesService,
    fleetService,
    // Vehicle Intake Services
    intakeQueueService,
    intakeRecordsService,
    intakeBaysService,
    intakeStatsService,
    // Vehicle History Service
    vehicleHistoryService,
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
    // Staff Management
    staffService,
    // HR Service
    hrService,
    // Team Chat
    teamChatService,
    // Settings
    settingsService,
    // Branding
    brandingService,
    // Audit Trail
    auditService,
    // Original Services
    vehicleService,
    billingService,
    activityService,
    realtimeStatsService,
    washBayService,
    authService,
    storageService,
    factoryResetService
  };
  console.log('✅ FirebaseServices attached to window');
}
