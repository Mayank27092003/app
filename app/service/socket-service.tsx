/**
 * Socket Service
 * @format
 */

import { io, Socket } from 'socket.io-client';
import { store } from '@app/redux';
import { setJobs, setDrivers } from '@app/module/common';
import { showMessage } from 'react-native-flash-message';
import { BASE_URL } from '@app/configs';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private customListeners: { [event: string]: Function[] } = {};
  private newMessageCallback: ((data: any) => void) | null = null;
  private socketUrl: string | null = null;

  /**
   * Initialize socket connection
   */
  connect(token?: string) {
    console.log("connect token", token);
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    try {
      // Extract the base domain from BASE_URL for socket connection
      this.socketUrl = BASE_URL.replace('/api/v1', ''); // Remove /api/v1 for socket

      console.log('🔌 Attempting to connect to:', this.socketUrl);
      console.log('🔌 Original BASE_URL:', BASE_URL);
      console.log('🔌 Token provided:', !!token);
      if (token) {
        console.log('🔌 Token length:', token.length);
        console.log('🔌 Token preview:', token.substring(0, 20) + '...');
      }

      // Try multiple connection strategies
      const connectionOptions = {
        // Send token in headers as requested by backend dev
        extraHeaders: token ? {
          'Authorization': `Bearer ${token}`,
          'token': token
        } : undefined,
        // Try websocket first, fallback to polling if needed
        // This avoids xhr poll errors on initial connection
        transports: ['websocket', 'polling'],
        timeout: 15000, // Increased timeout for better reliability
        forceNew: true,
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: Infinity, // Never give up on reconnecting
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000, // Increased max delay to avoid overwhelming server
        randomizationFactor: 0.5,
        // Additional options to handle namespace issues
        path: '',
        upgrade: true,
        rememberUpgrade: true,
        // Add query parameters if needed
        query: {},
      };

      console.log('🔌 Connection options:', connectionOptions);

      this.socket = io(this.socketUrl, connectionOptions);

      this.setupEventListeners();

      console.log('Socket connection initiated');
    } catch (error) {
      console.error('Socket connection error:', error);
    }
  }

  /**
   * Setup socket event listeners
   */
  private setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('🔌 Socket connected:', this.socket?.id);
      console.log('🔌 Transport:', this.socket?.io.engine.transport.name);
      console.log('🔌 Socket connected successfully');
      console.log('🔌 Connection URL:', this.socketUrl);
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      this.isConnected = false;
      this.emit('disconnect', reason);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔌 Socket reconnected after', attemptNumber, 'attempts');
      this.isConnected = true;
      this.emit('reconnect', attemptNumber);
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('🔌 Socket connection error:', error);
      console.error('🔌 Error message:', error.message);
      console.error('🔌 Error type:', error.type || 'unknown');
      console.error('🔌 Error description:', error.description || error.message);

      // Handle specific error types
      if (error.message?.includes('xhr poll error') || error.message?.includes('polling error')) {
        console.error('🔌 XHR Poll Error - This usually indicates:');
        console.error('   1. Network connectivity issues');
        console.error('   2. Server not responding or unreachable');
        console.error('   3. CORS or firewall blocking the connection');
        console.error('   4. SSL/TLS certificate issues');
        console.error('🔌 Attempting to reconnect with websocket transport...');

        // Try reconnecting with websocket only if polling fails
        setTimeout(() => {
          if (!this.isConnected && this.socket) {
            console.log('🔌 Retrying connection with websocket transport only...');
            this.socket.io.opts.transports = ['websocket'];
            this.socket.connect();
          }
        }, 2000);
      }

      this.isConnected = false;
    });

    this.socket.on('error', (error) => {
      console.error('🔌 Socket error:', error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔌 Socket reconnected after', attemptNumber, 'attempts');
      this.isConnected = true;
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔌 Socket reconnection attempt:', attemptNumber);
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('🔌 Socket reconnection error:', error);
      console.error('🔌 Reconnection error message:', error.message);

      // If polling fails during reconnection, try switching to websocket
      if (error.message?.includes('xhr poll error') || error.message?.includes('polling error')) {
        console.log('🔌 Reconnection: Switching to websocket transport...');
        if (this.socket) {
          this.socket.io.opts.transports = ['websocket'];
        }
      }
    });

    this.socket.on('reconnect_failed', () => {
      console.error('🔌 Socket reconnection failed');
      this.isConnected = false;
    });


    // Job events - Backend confirmed events
    this.socket.on('job:new', (data) => {
      console.log('🆕 job:new event received:', data);
      this.handleNewJob(data);
    });

    this.socket.on('job:created', (data) => {
      console.log('🆕 job:created event received:', data);
      this.handleNewJob(data.job || data);
    });

    this.socket.on('job:assigned', (data) => {
      console.log('✅ job:assigned event received:', data);
      console.log('✅ job:assigned data type:', typeof data);
      console.log('✅ job:assigned data keys:', data ? Object.keys(data) : 'null/undefined');
      this.handleJobAssigned(data);
    });

    // Alternative event names that might be used
    this.socket.on('job:assignment', (data) => {
      console.log('✅ job:assignment event received:', data);
      this.handleJobAssigned(data);
    });

    this.socket.on('driver:assigned', (data) => {
      console.log('✅ driver:assigned event received:', data);
      this.handleJobAssigned(data);
    });

    // Chat events
    this.socket.on('new_message', (data) => {
      console.log('💬 new_message event received:', data);
      this.handleNewMessage(data);
    });

    // Typing events - handled directly in chat component
    this.socket.on('user_typing_start', (data) => {
      console.log('💬 user_typing_start event received:', data);
      // Typing events are now handled directly in the chat component
      // to access participant data for name resolution
    });

    this.socket.on('user_typing_stop', (data) => {
      console.log('💬 user_typing_stop event received:', data);
      // Typing events are now handled directly in the chat component
      // to access participant data for name resolution
    });

    // Location events
    this.socket.on('join_room', (data) => {
      console.log('📍 join_room event received:', data);
      console.log('📍 join_room event details:', {
        rooms: data.rooms,
        userRole: data.userRole,
        userId: data.userId,
        jobId: data.jobId
      });
      this.handleJoinRoom(data);
    });

    this.socket.on('location_update', (data) => {
      console.log('📍 location_update event received:', data);
      console.log('📍 location_update event details:', {
        userId: data.userId,
        location: data.location,
        timestamp: data.timestamp
      });
      this.handleLocationUpdate(data);
    });

    // Log all registered events for debugging
    console.log('🔌 Socket event listeners registered:', [
      'connect', 'disconnect', 'connect_error', 'error',
      'job:new', 'job:created', 'job:assigned', 'job:assignment', 'driver:assigned',
      'driver:available', 'driver:unavailable', 'driver:location',
      'notification:new', 'message:new', 'new_message', 'call:incoming', 'call:ended',
      'online_users_list', 'online_users_updated',
      'user_typing_start', 'user_typing_stop',
      'join_room', 'location_update'
    ]);

    // Driver events
    this.socket.on('driver:available', (data) => {
      console.log('Driver available:', data);
      this.handleDriverAvailable(data);
    });

    this.socket.on('driver:unavailable', (data) => {
      console.log('Driver unavailable:', data);
      this.handleDriverUnavailable(data);
    });

    // Online users events for chat
    this.socket.on('online_users_list', (data) => {
      console.log('👥 online_users_list event received:', data);
      this.handleOnlineUserList(data);
    });

    this.socket.on('online_users_updated', (data) => {
      console.log('👥 online_users_updated event received:', data);
      this.handleOnlineUsersUpdated(data);
    });
  }

  /**
   * Handle new job event
   */
  private handleNewJob(jobData: any) {
    try {
      console.log('🆕 Processing new job:', jobData);

      if (!store) {
        console.error('❌ Store is not available');
        return;
      }

      const currentState = store.getState();
      const currentJobs = currentState.commonReducer.jobs || [];

      // Ensure jobData has required fields
      const processedJob = {
        id: (jobData.id || jobData._id || Date.now()).toString(),
        title: jobData.title || jobData.jobTitle || 'New Job',
        description: jobData.description || jobData.jobDescription || '',
        status: jobData.status || 'active',
        payAmount: jobData.payAmount || jobData.compensation || 0,
        location: jobData.location || jobData.pickupLocation || '',
        createdAt: jobData.createdAt || new Date().toISOString(),
        ...jobData // Include all other fields from backend
      };

      // Check if job already exists to prevent duplicates
      const existingJobIndex = currentJobs.findIndex(job =>
        job.id === processedJob.id ||
        (job._id && job._id === processedJob.id) ||
        (job.id && job.id === processedJob._id)
      );

      let updatedJobs;
      if (existingJobIndex !== -1) {
        // Update existing job
        updatedJobs = [...currentJobs];
        updatedJobs[existingJobIndex] = { ...updatedJobs[existingJobIndex], ...processedJob };
        console.log('🔄 Updated existing job in store');
      } else {
        // Add new job to the beginning of the list
        updatedJobs = [processedJob, ...currentJobs];
        console.log('➕ Added new job to store');
      }

      // Update Redux store
      store.dispatch(setJobs(updatedJobs));

      // Show notification only for new jobs
      if (existingJobIndex === -1) {
        showMessage({
          message: "New Job Available",
          description: `A new job has been posted: ${processedJob.title}`,
          type: "info",
          duration: 4000,
        });
      }

      console.log('✅ Job list updated in store. Total jobs:', updatedJobs.length);
    } catch (error) {
      console.error('❌ Error handling new job:', error);
    }
  }

  /**
   * Handle job assigned event
   */
  private handleJobAssigned(assignmentData: any) {
    try {
      console.log('✅ Processing job assignment:', assignmentData);

      if (!store) {
        console.error('❌ Store is not available');
        return;
      }

      const {
        jobId,
        driverId,
        driverName,
        job_id,
        driver_id,
        driver_name,
        assignedDriverId,
        assignedDriverName,
        job,
        driver
      } = assignmentData;

      // Handle different possible field names from backend
      const actualJobId = jobId || job_id || job?.id || job?._id;
      const actualDriverId = driverId || driver_id || assignedDriverId || driver?.id || driver?._id;
      const actualDriverName = driverName || driver_name || assignedDriverName || driver?.name || driver?.userName || 'Unknown Driver';

      console.log('✅ Job assignment details:', {
        jobId: actualJobId,
        driverId: actualDriverId,
        driverName: actualDriverName
      });

      const currentState = store.getState();
      const currentJobs = currentState.commonReducer.jobs || [];

      // Update the specific job with assignment info
      const updatedJobs = currentJobs.map((jobItem: any) => {
        if (jobItem.id === actualJobId || jobItem._id === actualJobId) {
          const updatedJob = {
            ...jobItem,
            assignedDriverId: actualDriverId,
            assignedDriverName: actualDriverName,
            status: 'assigned',
            assignedAt: new Date().toISOString(),
            // Update contract participants if available
            ...(job?.jobApplications?.[0]?.contracts?.[0]?.contractParticipants && {
              jobApplications: [{
                ...job.jobApplications[0],
                contracts: [{
                  ...job.jobApplications[0].contracts[0],
                  contractParticipants: [
                    ...job.jobApplications[0].contracts[0].contractParticipants,
                    {
                      id: `driver-${actualDriverId}`,
                      userId: actualDriverId,
                      userName: actualDriverName,
                      role: 'driver',
                      status: 'assigned',
                      assignedAt: new Date().toISOString()
                    }
                  ]
                }]
              }]
            })
          };
          console.log('✅ Updated job with assignment:', updatedJob);
          return updatedJob;
        }
        return jobItem;
      });

      // Update Redux store
      store.dispatch(setJobs(updatedJobs));

      // Show notification
      showMessage({
        message: "Job Assigned",
        description: `Job has been assigned to ${actualDriverName}`,
        type: "success",
        duration: 4000,
      });

      console.log('✅ Job assignment updated in store successfully');
    } catch (error) {
      console.error('❌ Error handling job assignment:', error);
    }
  }

  /**
   * Handle driver available event
   */
  private handleDriverAvailable(driverData: any) {
    try {
      const currentState = store.getState();
      const currentDrivers = currentState.commonReducer.drivers || [];

      // Update driver availability
      const updatedDrivers = currentDrivers.map((driver: any) => {
        if (driver.id === driverData.id || driver._id === driverData.id) {
          return {
            ...driver,
            isAvailable: true,
            lastSeen: new Date().toISOString(),
          };
        }
        return driver;
      });

      // If driver not in list, add them
      const driverExists = currentDrivers.some((driver: any) =>
        driver.id === driverData.id || driver._id === driverData.id
      );

      if (!driverExists) {
        updatedDrivers.push({
          ...driverData,
          isAvailable: true,
          lastSeen: new Date().toISOString(),
        });
      }

      // Update Redux store
      store.dispatch(setDrivers(updatedDrivers));

      console.log('Driver availability updated:', driverData);
    } catch (error) {
      console.error('Error handling driver available:', error);
    }
  }

  /**
   * Handle driver unavailable event
   */
  private handleDriverUnavailable(driverData: any) {
    try {
      const currentState = store.getState();
      const currentDrivers = currentState.commonReducer.drivers || [];

      // Update driver availability
      const updatedDrivers = currentDrivers.map((driver: any) => {
        if (driver.id === driverData.id || driver._id === driverData.id) {
          return {
            ...driver,
            isAvailable: false,
            lastSeen: new Date().toISOString(),
          };
        }
        return driver;
      });

      // Update Redux store
      store.dispatch(setDrivers(updatedDrivers));

      console.log('Driver unavailability updated:', driverData);
    } catch (error) {
      console.error('Error handling driver unavailable:', error);
    }
  }

  /**
   * Handle new message event
   */
  private handleNewMessage(messageData: any) {
    try {
      console.log('💬 Processing new message:', messageData);

      if (!store) {
        console.error('❌ Store is not available');
        return;
      }

      // Convert API message format to local message format
      const newMessage = {
        id: (messageData.id || messageData._id || Date.now()).toString(),
        conversationId: (messageData.conversationId || messageData.conversation_id || '').toString(),
        senderId: (messageData.senderId || messageData.sender_id || messageData.senderUserId || '').toString(),
        receiverId: (messageData.receiverId || messageData.receiver_id || messageData.receiverUserId || 'all').toString(),
        type: (messageData.messageType || messageData.type || 'text') as any,
        content: messageData.content || '',
        timestamp: messageData.sentAt || messageData.timestamp || messageData.createdAt || new Date().toISOString(),
        read: false,
        delivered: true,
        status: 'delivered' as const,
        jobId: messageData.jobId || messageData.job_id,
        metadata: messageData.metadata || null,
      };

      console.log('💬 Converted message:', newMessage);

      // Import the chat store dynamically to avoid circular dependencies
      import('@app/store/chatStore').then(({ useChatStore }) => {
        const { sendMessage } = useChatStore.getState();

        // Add the message to the chat store
        sendMessage(newMessage.conversationId, newMessage);

        console.log('✅ New message added to chat store');

        // Emit a custom event for messages screen to listen to
        this.emit('message_for_messages_screen', messageData);
        console.log('📱 Emitted message_for_messages_screen event');

        // Call the callback if set
        if (this.newMessageCallback) {
          this.newMessageCallback(messageData);
          console.log('📱 Called new message callback');
        }
      }).catch((error) => {
        console.error('❌ Error importing chat store:', error);
      });

    } catch (error) {
      console.error('❌ Error handling new message:', error);
    }
  }

  /**
   * Handle user typing start event
   */
  private handleUserTypingStart(data: any) {
    try {
      if (!store) {
        console.error('❌ Store is not available');
        return;
      }

      // Import the chat store dynamically to avoid circular dependencies
      import('@app/store/chatStore').then(({ useChatStore }) => {
        const { setTypingUser, getConversation } = useChatStore.getState();

        const userId = data.userId || data.user_id || data.senderId || data.sender_id;
        const conversationId = data.conversationId || data.conversation_id || data.conversationId;

        if (!userId || !conversationId) {
          console.error('❌ Missing userId or conversationId in typing event:', { userId, conversationId });
          return;
        }

        // Try to get the user name from the data first
        let userName = data.userName || data.user_name || data.name || data.firstName;

        // If no name in data, try to get from conversation participants
        if (!userName) {
          console.log('⌨️ Socket - No userName in data, trying to find from conversation participants');
          const conversation = getConversation(conversationId);
          if (conversation && conversation.participants) {
            const participant = conversation.participants.find(
              (p: any) => String(p.id || p.userId || p.user?.id) === String(userId)
            );
            if (participant) {
              const user = (participant as any).user || participant;
              userName = user.userName || user.firstName || user.name || user.displayName;
              console.log('⌨️ Socket - Found participant name:', userName);
            }
          }
        }

        // If still no name, use fallback
        if (!userName) {
          userName = 'Someone';
          console.log('⌨️ Socket - No name found, using fallback');
        }

        console.log('⌨️ Socket - Setting typing user:', { userId, conversationId, userName });
        setTypingUser(userId, conversationId, true, userName);

      }).catch((error) => {
        console.error('❌ Error importing chat store:', error);
      });

    } catch (error) {
      console.error('❌ Error handling user typing start:', error);
    }
  }

  /**
   * Handle user typing stop event
   */
  private handleUserTypingStop(data: any) {
    try {
      if (!store) {
        console.error('❌ Store is not available');
        return;
      }

      // Import the chat store dynamically to avoid circular dependencies
      import('@app/store/chatStore').then(({ useChatStore }) => {
        const { setTypingUser } = useChatStore.getState();

        const userId = data.userId || data.user_id || data.senderId || data.sender_id;
        const conversationId = data.conversationId || data.conversation_id || data.conversationId;

        if (!userId || !conversationId) {
          console.error('❌ Missing userId or conversationId in typing event:', { userId, conversationId });
          return;
        }

        // Set the user as not typing
        setTypingUser(userId, conversationId, false);

      }).catch((error) => {
        console.error('❌ Error importing chat store:', error);
      });

    } catch (error) {
      console.error('❌ Error handling user typing stop:', error);
    }
  }

  /**
   * Handle join room event
   */
  private handleJoinRoom(data: any) {
    try {
      console.log('📍 Socket - Join room event:', data);

      // Extract room information
      const rooms = data.rooms;

      console.log('📍 Socket - Joined room:', { rooms });

      // You can add additional logic here for room management
      // For example, updating UI state, showing room status, etc.

    } catch (error) {
      console.error('❌ Error handling join room:', error);
    }
  }

  /**
   * Handle location update event
   */
  private handleLocationUpdate(data: any) {
    try {
      console.log('📍 Socket - Location update event:', data);

      // Extract location data from the nested structure
      const locationData = data.location || data;
      const driverId = locationData.userId || data.userId;
      const latitude = parseFloat(locationData.lat || locationData.latitude);
      const longitude = parseFloat(locationData.lng || locationData.longitude);
      const accuracy = locationData.accuracy;
      const heading = locationData.heading;
      const speed = locationData.speed;
      const battery = locationData.battery;
      const provider = locationData.provider;
      const timestamp = locationData.timestamp;

      console.log('📍 Socket - Parsed driver location:', {
        driverId,
        latitude,
        longitude,
        accuracy,
        heading,
        speed,
        battery,
        provider,
        timestamp
      });

      // Validate the location data
      if (driverId && latitude && longitude && !isNaN(latitude) && !isNaN(longitude)) {
        console.log('📍 Socket - Valid location data received for driver:', driverId);

        // You can add logic here to update driver location on map
        // For example, updating markers, showing real-time location, etc.
      } else {
        console.warn('📍 Socket - Invalid location data received:', {
          driverId,
          latitude,
          longitude,
          rawData: data
        });
      }

    } catch (error) {
      console.error('❌ Error handling location update:', error);
    }
  }

  /**
   * Handle online user list event
   */
  private handleOnlineUserList(data: any) {
    try {
      console.log('👥 Processing online user list:', data);

      if (!store) {
        console.error('❌ Store is not available');
        return;
      }

      // Import the chat store dynamically to avoid circular dependencies
      import('@app/store/chatStore').then(({ useChatStore }) => {
        const { setOnlineUsers } = useChatStore.getState();

        // Transform the API data to our OnlineUser format
        const transformedUsers = this.transformUsersData(data.users || data || []);

        // Set the online users list
        setOnlineUsers(transformedUsers);

        console.log('✅ Online users list updated in chat store:', transformedUsers);
      }).catch((error) => {
        console.error('❌ Error importing chat store:', error);
      });

    } catch (error) {
      console.error('❌ Error handling online user list:', error);
    }
  }

  /**
   * Handle online users updated event
   */
  private handleOnlineUsersUpdated(data: any) {
    try {
      console.log('👥 Processing online users updated:', data);

      if (!store) {
        console.error('❌ Store is not available');
        return;
      }

      // Import the chat store dynamically to avoid circular dependencies
      import('@app/store/chatStore').then(({ useChatStore }) => {
        const { updateOnlineUsers } = useChatStore.getState();

        // Transform the API data to our OnlineUser format
        const transformedUsers = this.transformUsersData(data.users || data || []);

        // Update the online users list
        updateOnlineUsers(transformedUsers);

        console.log('✅ Online users updated in chat store:', transformedUsers);
      }).catch((error) => {
        console.error('❌ Error importing chat store:', error);
      });

    } catch (error) {
      console.error('❌ Error handling online users updated:', error);
    }
  }

  /**
   * Transform API user data to our OnlineUser format
   */
  private transformUsersData(apiUsers: any[]): any[] {
    return apiUsers.map(user => ({
      id: user.userId?.toString() || user.id?.toString() || '',
      name: user.userName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User',
      avatar: user.profileImage || undefined,
      lastSeen: user.lastOnline ? user.lastOnline.toString() : new Date().toISOString(),
      isOnline: user.isOnline || false,
      email: user.email || undefined,
    }));
  }

  /**
   * Emit job assignment
   */
  assignJob(jobId: string, driverId: string) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    try {
      this.socket.emit('job:assign', {
        jobId,
        driverId,
        timestamp: new Date().toISOString(),
      });

      console.log('Job assignment emitted:', { jobId, driverId });
      return true;
    } catch (error) {
      console.error('Error emitting job assignment:', error);
      return false;
    }
  }

  /**
   * Emit driver status update
   */
  updateDriverStatus(driverId: string, isAvailable: boolean) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    try {
      this.socket.emit('driver:status', {
        driverId,
        isAvailable,
        timestamp: new Date().toISOString(),
      });

      console.log('Driver status update emitted:', { driverId, isAvailable });
      return true;
    } catch (error) {
      console.error('Error emitting driver status:', error);
      return false;
    }
  }

  /**
   * Emit job creation event (for testing)
   */
  emitJobCreated(jobData: any) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    try {
      this.socket.emit('job:created', {
        ...jobData,
        timestamp: new Date().toISOString(),
      });

      console.log('📤 Job created event emitted:', jobData);
      return true;
    } catch (error) {
      console.error('Error emitting job created:', error);
      return false;
    }
  }

  /**
   * Emit job assignment event (for testing)
   */
  emitJobAssigned(jobId: string, driverId: string, driverName?: string) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    try {
      this.socket.emit('job:assign', {
        jobId,
        driverId,
        driverName,
        timestamp: new Date().toISOString(),
      });

      console.log('📤 Job assignment event emitted:', { jobId, driverId, driverName });
      return true;
    } catch (error) {
      console.error('Error emitting job assignment:', error);
      return false;
    }
  }

  /**
   * Join room for specific job
   */
  joinJobRoom(jobId: string) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    try {
      this.socket.emit('join:job', { jobId });
      console.log('Joined job room:', jobId);
      return true;
    } catch (error) {
      console.error('Error joining job room:', error);
      return false;
    }
  }

  /**
   * Leave room for specific job
   */
  leaveJobRoom(jobId: string) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    try {
      this.socket.emit('leave:job', { jobId });
      console.log('Left job room:', jobId);
      return true;
    } catch (error) {
      console.error('Error leaving job room:', error);
      return false;
    }
  }

  /**
   * Join room for specific conversation
   */
  joinConversationRoom(conversationId: string) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    try {
      this.socket.emit('join:conversation', { conversationId });
      console.log('Joined conversation room:', conversationId);
      return true;
    } catch (error) {
      console.error('Error joining conversation room:', error);
      return false;
    }
  }

  /**
   * Leave room for specific conversation
   */
  leaveConversationRoom(conversationId: string) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    try {
      this.socket.emit('leave:conversation', { conversationId });
      console.log('Left conversation room:', conversationId);
      return true;
    } catch (error) {
      console.error('Error leaving conversation room:', error);
      return false;
    }
  }

  /**
   * Emit new message
   */
  emitNewMessage(messageData: any) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    try {
      this.socket.emit('send_message', messageData);
      console.log('📤 Message sent via socket:', messageData);
      return true;
    } catch (error) {
      console.error('Error emitting message:', error);
      return false;
    }
  }

  /**
   * Emit typing start event
   */
  emitTypingStart(conversationId: string) {
    if (!this.socket || !this.isConnected) {
      console.error('❌ Socket not connected, cannot emit typing start');
      return false;
    }

    try {
      this.socket.emit('typing_start', { conversationId });
      console.log('⌨️ Typing start emitted for conversation:', conversationId);
      return true;
    } catch (error) {
      console.error('❌ Error emitting typing start:', error);
      return false;
    }
  }

  /**
   * Emit typing stop event
   */
  emitTypingStop(conversationId: string) {
    if (!this.socket || !this.isConnected) {
      console.error('❌ Socket not connected, cannot emit typing stop');
      return false;
    }

    try {
      this.socket.emit('typing_stop', { conversationId });
      console.log('⌨️ Typing stop emitted for conversation:', conversationId);
      return true;
    } catch (error) {
      console.error('❌ Error emitting typing stop:', error);
      return false;
    }
  }

  /**
   * Disconnect socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('Socket disconnected');
    }
  }

  /**
   * Get connection status
   */
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  /**
   * Get socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Emit join room event
   */
  emitJoinRoom(roomData: any) {
    if (!this.socket || !this.isConnected) {
      console.error('❌ Socket not connected, cannot emit join_room');
      return false;
    }

    try {
      this.socket.emit('join_room', roomData);
      console.log('📍 Socket - Emitted join_room:', roomData);

      return true;
    } catch (error) {
      console.error('❌ Error emitting join_room:', error);
      return false;
    }
  }

  /**
   * Emit join tracking room for different user roles
   */
  emitJoinTrackingRoom(driverId: string, userRole: string, userId: string, jobId?: string) {
    if (!this.socket || !this.isConnected) {
      console.error('❌ Socket not connected, cannot emit join_room');
      return false;
    }

    try {
      const roomData = {
        rooms: `user_location_${driverId}`,
        userRole: userRole,
        userId: userId,
        jobId: jobId,
        timestamp: Date.now()
      };

      this.socket.emit('join_room', roomData);
      console.log('📍 Socket - Emitted join_room for tracking:', roomData);
      return true;
    } catch (error) {
      console.error('❌ Error emitting join_room for tracking:', error);
      return false;
    }
  }

  /**
   * Emit update_location event for driver location updates
   */
  emitUpdateLocation(locationData: {
    lat: number;
    lng: number;
    accuracy?: number;
    heading?: number;
    speed?: number;
    battery?: number;
    provider?: string;
  }) {
    if (!this.socket || !this.isConnected) {
      console.error('❌ Socket not connected, cannot emit update_location');
      return false;
    }

    try {
      this.socket.emit('update_location', {
        location: locationData,
        timestamp: new Date().toISOString(),
      });
      console.log('📍 Socket - Emitted update_location:', locationData);
      return true;
    } catch (error) {
      console.error('❌ Error emitting update_location:', error);
      return false;
    }
  }


  /**
   * Test job assignment (for debugging)
   */
  testJobAssignment(jobId: string, driverId: string, driverName: string) {
    console.log('🧪 Testing job assignment:', { jobId, driverId, driverName });
    const testData = {
      jobId,
      driverId,
      driverName,
      job: {
        id: jobId,
        title: 'Test Job Assignment'
      },
      driver: {
        id: driverId,
        name: driverName
      }
    };
    this.handleJobAssigned(testData);
  }



  /**
   * Get detailed connection info
   */
  getConnectionInfo() {
    if (!this.socket) {
      return {
        connected: false,
        id: null,
        transport: null,
        url: null,
        error: 'No socket instance'
      };
    }

    return {
      connected: this.socket.connected,
      id: this.socket.id,
      transport: this.socket.io.engine.transport.name,
      url: 'Connected',
      error: null
    };
  }

  /**
   * Log connection status
   */
  logConnectionStatus() {
    const info = this.getConnectionInfo();
    console.log('=== Socket Connection Status ===');
    console.log('Connected:', info.connected);
    console.log('Socket ID:', info.id);
    console.log('Transport:', info.transport);
    console.log('URL:', info.url);
    console.log('Error:', info.error);
    console.log('================================');
  }

  /**
   * Add custom event listener
   */
  on(event: string, callback: Function) {
    if (!this.customListeners[event]) {
      this.customListeners[event] = [];
    }
    this.customListeners[event].push(callback);
    console.log(`📡 Added custom listener for: ${event}`);
  }

  /**
   * Remove custom event listener
   */
  off(event: string, callback?: Function) {
    if (!this.customListeners[event]) return;

    if (callback) {
      this.customListeners[event] = this.customListeners[event].filter(cb => cb !== callback);
    } else {
      this.customListeners[event] = [];
    }
    console.log(`📡 Removed custom listener for: ${event}`);
  }

  /**
   * Emit custom event
   */
  emit(event: string, data?: any) {
    if (this.customListeners[event]) {
      this.customListeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Error in custom listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Set callback for new messages
   */
  setNewMessageCallback(callback: (data: any) => void) {
    this.newMessageCallback = callback;
    console.log('📱 Set new message callback');
  }

  /**
   * Remove new message callback
   */
  removeNewMessageCallback() {
    this.newMessageCallback = null;
    console.log('📱 Removed new message callback');
  }


}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;
