/**
 * JobDetails Screen
 * @format
 */

import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Image,
  Linking,
} from "react-native";
import {
  MapPin,
  Calendar,
  Truck,
  Package,
  Info,
  ArrowRight,
  User,
  Star,
  Phone,
  MessageCircle,
  Camera,
  CreditCard,
  X,
  Gavel,
  SquareCheck,
  Share,
} from "lucide-react-native";

//Screens
import { Colors, useThemedStyle } from "@app/styles";
import { useAuthStore } from "@app/store/authStore";
import { useJobStore } from "@app/store/jobStore";
import { useChatStore } from "@app/store/chatStore";
import { createDirectConversation } from "@app/service/conversations-service";
import { usePaymentStore } from "@app/store/paymentStore";
import { Button } from "@app/components/Button";
import { formatCurrency } from "@app/utils/formatters";
import { getStyles } from "./jobDetailsStyles";
import { Routes } from "@app/navigator";
import { useTranslation } from "react-i18next";
import Header from "@app/components/Header";
import { useDispatch, useSelector } from "react-redux";
import {
  selectProfile,
  selectCurrentJob,
  setCurrentJob,
} from "@app/module/common";
import {
  applyjob,
  fetchJobById,
  startInspection,
  completeInspection,
  getMyInspections,
} from "@app/module/jobs/slice";
import { httpRequest, endPoints } from "@app/service";
import { showMessage } from "react-native-flash-message";
import { useFocusEffect } from "@react-navigation/native";
import { JobDetailsSkeleton } from "@app/components/SkeletonLoader";

function JobDetailScreen({ navigation, route }) {
  const styles = useThemedStyle(getStyles);
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const profileData = useSelector(selectProfile);
  const { jobId } = route.params || {};
  const job = useSelector(selectCurrentJob);
  const isWithdrawn =
    job?.jobApplications?.find(
      (application) => application.applicantUserId === profileData?.id
    )?.status !== 'withdrawn';
  const currentUserRoleId = profileData?.roles?.[0]?.role?.id;
  const isEligiblePickJob = job?.visibilityRoles?.some(
    (role) => role.roleId === currentUserRoleId
  );
  const hasDriverAssigned =
    job?.jobApplications?.[0]?.contracts?.[0]?.contractParticipants?.some(
      (participant) => participant.status === "active"
    );

  // Example: Get the participants array
  const participants =
    job?.jobApplications?.[0]?.contracts?.[0]?.contractParticipants || [];
  const hasAcceptedDriver = participants.some(
    (p) => p.role === "driver" && p.status === "accepted"
  );
  // Extract unique roles
  const roles = Array.from(new Set(participants.map((p) => p.role)));
  const hasCarrierAssigned = roles.includes("carrier");
  const existsCarrier = job?.jobApplications?.[0]?.contracts?.some(
    (contract) => contract.hiredUserId === profileData.id
  );
  // ["driver", "manager", "admin"] (example output)
  const exists = job?.jobApplications?.some(
    (job) => job.applicantUserId === profileData.id
  );

  const userRole = profileData?.roles?.[0]?.role?.name;
  const { userProfile } = useAuthStore();
  const { updateJobStatus } = useJobStore();
  const { getOrCreateConversation, initiateCall } = useChatStore();
  const { processPayment, balance } = usePaymentStore();

  // Calculate earnings based on user role and contract chain
  const calculateEarnings = () => {
    const contract = job?.jobApplications?.[0]?.contracts?.[0];
    const participants = contract?.contractParticipants || [];
    const userId = profileData?.id;

    // Find user's participation in the contract
    const userParticipation = participants.find(p => p.userId === userId);

    if (!userParticipation) {
      // User is the job creator (shipper)
      if (job?.userId === userId) {
        return {
          role: 'Shipper',
          postedAmount: job?.payAmount || job?.compensation || 0,
          showPosted: true,
        };
      }
      return null;
    }

    const userRole = userParticipation.role;
    const assignedToMe = userParticipation.offeredRate || 0;

    // Find who the user assigned to (if any)
    const assignedByMe = participants.find(p =>
      p.invitedBy === userId && p.userId !== userId
    );
    const assignedAmount = assignedByMe?.offeredRate || 0;
    const profit = assignedToMe - assignedAmount;

    return {
      role: userRole.charAt(0).toUpperCase() + userRole.slice(1),
      pickedAmount: assignedToMe,
      assignedAmount: assignedAmount > 0 ? assignedAmount : null,
      profit: assignedAmount > 0 ? profit : null,
      earning: assignedAmount === 0 ? assignedToMe : null, // Final earning if not assigned further
    };
  };

  const earnings = calculateEarnings();

  const [loading, setLoading] = useState(false);
  const [isLoadingJob, setIsLoadingJob] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true); // Controls skeleton visibility with minimum display time
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [retryPaymentLoading, setRetryPaymentLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [currentInspectionId, setCurrentInspectionId] = useState<string | null>(
    null
  );
  const [inspections, setInspections] = useState<any[]>([]);
  const [countdown, setCountdown] = useState<string>("");
  const [loadingInspections, setLoadingInspections] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  // Bid related state
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [bidMessage, setBidMessage] = useState("");

  // Contract completion state
  const [isContractCompleted, setIsContractCompleted] = useState(false);
  const [completingContract, setCompletingContract] = useState(false);

  // Contract ratings state
  const [contractRatings, setContractRatings] = useState<any[]>([]);
  const [loadingRatings, setLoadingRatings] = useState(false);
  const [hasUserRated, setHasUserRated] = useState(false);

  // Track if payment success message has been shown
  const paymentMessageShownRef = useRef(false);
  // Track current job ID to prevent setting inspections for wrong job
  const currentJobIdRef = useRef<number | null>(null);
  // Track if we've already fetched inspections for this contract to prevent re-fetching
  const fetchedInspectionsRef = useRef<{ jobId: number | null; contractId: number | null }>({
    jobId: null,
    contractId: null,
  });

  // Fetch job by ID when component mounts or jobId changes
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 JobDetails: Starting to fetch job, showing skeleton');
      setIsLoadingJob(true);
      setShowSkeleton(true);
      dispatch(fetchJobById({ id: jobId }));

      // Reset payment message flag when leaving the screen
      return () => {
        paymentMessageShownRef.current = false;
      };
    }, [dispatch, jobId])
  );

  // Update loading state when job is loaded (with minimum display time for skeleton)
  useEffect(() => {
    // Only update if job matches the current jobId
    if (job?.id === Number(jobId)) {
      console.log('✅ JobDetails: Job loaded and matches jobId, hiding skeleton after minimum display time');
      setIsLoadingJob(false);

      // Update current job ID ref
      currentJobIdRef.current = job?.id || null;

      // Add minimum display time to ensure skeleton is visible for testing
      const hideTimer = setTimeout(() => {
        console.log('👋 JobDetails: Hiding skeleton now');
        setShowSkeleton(false);
      }, 800); // Minimum 800ms display time

      return () => clearTimeout(hideTimer);
    }
  }, [job, jobId]);

  // Clear job and inspections when jobId changes (navigating to a different job)
  useEffect(() => {
    // Clear the job from Redux to prevent showing stale data
    dispatch(setCurrentJob(null));
    setInspections([]);
    setLoadingInspections(false);
    currentJobIdRef.current = null; // Reset job ID ref
    // Reset fetch tracking
    fetchedInspectionsRef.current = { jobId: null, contractId: null };
    // Reset loading states to show skeleton
    setIsLoadingJob(true);
    setShowSkeleton(true);
  }, [jobId, dispatch]);


  // Handle deep link return after payment completion
  useEffect(() => {
    const params = route.params || {};
    const paymentSuccess = (params as any).paymentSuccess || (params as any).deepLink === 'jobpayment';

    // Only show message once and only if payment was successful
    if (paymentSuccess && job && !paymentMessageShownRef.current) {
      console.log('💰 Payment completed, refreshing job data');
      paymentMessageShownRef.current = true;

      // Refresh job data to update payout status
      dispatch(fetchJobById({ id: jobId }));

      showMessage({
        message: "Payment Successful",
        description: "Your payment has been processed successfully.",
        type: "success",
        duration: 4000,
      });
    }
  }, [route.params, jobId, dispatch, job?.id]);


  const fetchInspections = useCallback(() => {
    if (!job?.jobApplications?.[0]?.contracts?.[0]?.id) return;

    const contractId = job.jobApplications?.[0]?.contracts?.[0]?.id;
    const expectedJobId = job?.id;

    // Only prevent re-fetching if we've already fetched for this exact job and contract
    // This prevents duplicate fetches but allows initial fetch
    if (
      fetchedInspectionsRef.current.jobId === expectedJobId &&
      fetchedInspectionsRef.current.contractId === contractId
    ) {
      return;
    }

    // Mark that we're fetching for this job/contract
    fetchedInspectionsRef.current = {
      jobId: expectedJobId || null,
      contractId: contractId || null,
    };

    setLoadingInspections(true);

    dispatch(
      getMyInspections({
        contractId: contractId.toString(),
        onSuccess: (response) => {
          // Verify we're still on the same job before setting inspections
          // Also allow if ref is null (initial load)
          if (currentJobIdRef.current === expectedJobId || currentJobIdRef.current === null) {
            const inspectionData = response?.data || [];
            setInspections(inspectionData);
            // Update ref after successful fetch
            if (expectedJobId) {
              currentJobIdRef.current = expectedJobId;
            }
          }
          setLoadingInspections(false);
        },
        onError: (error) => {
          console.error("❌ JobDetails: Failed to fetch inspections:", error);
          setLoadingInspections(false);
        },
      })
    );
  }, [job?.id, job?.jobApplications?.[0]?.contracts?.[0]?.id, dispatch]);

  const fetchContractRatings = useCallback(async () => {
    if (!job?.jobApplications?.[0]?.contracts?.[0]?.id) return;

    const contractId = job.jobApplications?.[0]?.contracts?.[0]?.id;
    setLoadingRatings(true);

    try {
      const response: any = await httpRequest.get(endPoints.getContractRatings(contractId));

      console.log('⭐ JobDetails: Contract ratings API response:', response);

      if (response?.success && response?.data) {
        // API returns ratings array, not reviews
        const ratings = response.data.ratings || [];
        setContractRatings(ratings);

        // Check if current user has already rated
        const currentUserId = profileData?.id;
        const userHasRated = ratings.some((rating: any) =>
          Number(rating.raterUserId) === Number(currentUserId)
        );
        setHasUserRated(userHasRated);

        console.log('✅ JobDetails: Contract ratings fetched:', ratings);
        console.log('✅ JobDetails: User has rated:', userHasRated);
        console.log('✅ JobDetails: Ratings count:', ratings.length);
      } else {
        console.log('⚠️ JobDetails: No ratings data in response');
        setContractRatings([]);
        setHasUserRated(false);
      }
    } catch (error) {
      console.error("❌ JobDetails: Failed to fetch contract ratings:", error);
      setContractRatings([]);
      setHasUserRated(false);
    } finally {
      setLoadingRatings(false);
    }
  }, [job?.jobApplications?.[0]?.contracts?.[0]?.id, profileData?.id]);

  // Fetch inspections when job is loaded (only if job matches current jobId)
  // Use specific job properties instead of entire job object to prevent re-renders
  const jobIdValue = job?.id;
  const contractIdValue = job?.jobApplications?.[0]?.contracts?.[0]?.id;

  useEffect(() => {
    // Only fetch inspections if job matches the current jobId
    if (jobIdValue === Number(jobId)) {
      if (contractIdValue) {
        // Reset fetch tracking if job/contract changed to allow fresh fetch
        if (
          fetchedInspectionsRef.current.jobId !== jobIdValue ||
          fetchedInspectionsRef.current.contractId !== contractIdValue
        ) {
          fetchedInspectionsRef.current = { jobId: null, contractId: null };
        }
        fetchInspections();
        // Always try to fetch contract ratings if there's a contract
        // (ratings only exist for completed contracts, but API will return empty if not completed)
        fetchContractRatings();
      } else {
        // Clear inspections if job doesn't have a contract
        setInspections([]);
        setLoadingInspections(false);
        // Clear ratings if no contract
        setContractRatings([]);
        setHasUserRated(false);
        // Reset fetch tracking
        fetchedInspectionsRef.current = { jobId: null, contractId: null };
      }
    }
  }, [jobIdValue, jobId, contractIdValue, fetchInspections, fetchContractRatings]);

  // Refresh contract ratings when screen comes into focus (e.g., after submitting a rating)
  useFocusEffect(
    useCallback(() => {
      if (job?.status === "completed" && job?.jobApplications?.[0]?.contracts?.[0]?.id) {
        fetchContractRatings();
      }
    }, [job?.status, job?.jobApplications?.[0]?.contracts?.[0]?.id, fetchContractRatings])
  );

  const handleImagePress = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setSelectedImage(null);
  };


  const handleApplyForJob = async () => {
    if (!job) {
      Alert.alert(t("common.error"), t("common.jobInformationNotAvailable"));
      return;
    }

    // Check if user is verified
    const isFullyVerified = profileData?.verification?.isFullyVerified === true;

    if (!isFullyVerified) {
      showMessage({
        message: t("common.profileNotVerified"),
        description: t("common.profileNotVerifiedDescription"),
        type: "danger",
        icon: "warning",
        duration: 4000,
      });
      // Navigate to Profile screen
      // navigation.navigate(Routes.ProfileScreen);
      return;
    }

    setLoading(true);
    console.log("job.payAmount:", typeof (job.payAmount));
    try {
      const applicationData = {
        jobId: parseInt(jobId),
        coverLetter: message,
        proposedRate: Number(job?.payAmount),
        estimatedDuration: "",
        notes: bidMessage,
      };

      console.log("applicationData:", applicationData);

      // Dispatch the action (Redux saga will handle the API call)
      dispatch(applyjob(applicationData) as any);

      // Show success message and navigate back
      Alert.alert(
        t("common.applicationSubmitted"),
        t("common.applicationSubmittedSuccess"),
        [
          {
            text: t("common.ok"),
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error("Error applying for job:", error);
      Alert.alert(
        t("common.error"),
        t("common.errorSubmittingApplication")
      );
    } finally {
      setLoading(false);
    }
  };
  const handleCancelJob = () => {
    if (!job) return;

    Alert.alert(t("errors.cancelJobTitle"), t("errors.cancelJobMessage"), [
      { text: t("common.no"), style: "cancel" },
      {
        text: t("common.yesCancel"),
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          try {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            updateJobStatus(job.id, "cancelled");
            Alert.alert(
              t("errors.cancelJobSuccessTitle"),
              t("errors.cancelJobSuccessMessage")
            );
          } catch (error) {
            console.error("Error cancelling job:", error);
            Alert.alert(
              t("errors.cancelJobErrorTitle"),
              t("errors.cancelJobErrorMessage")
            );
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleWithdrawJob = async () => {
    if (!job) {
      Alert.alert(t("common.error"), t("common.jobInformationNotAvailable"));
      return;
    }

    // Find the user's job application dynamically based on current user
    const userJobApplication = job?.jobApplications?.find(
      (application) => application.applicantUserId === profileData?.id
    );

    if (!userJobApplication) {
      Alert.alert(t("common.error"), t("common.jobApplicationNotFound"));
      return;
    }

    console.log('Found user job application:', {
      applicationId: userJobApplication.id,
      userId: profileData?.id,
      jobId: job.id
    });

    Alert.alert(
      "Withdraw Job",
      "Are you sure you want to withdraw your application for this job?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Withdraw",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              console.log('Withdrawing job application ID:', userJobApplication.id);
              const response = await httpRequest.post(
                endPoints.withdrawJobApplication(userJobApplication.id),
                {}
              );

              console.log('Withdraw response:', response);

              showMessage({
                message: "Success",
                description: "Job application withdrawn successfully",
                type: "success",
                duration: 3000
              });

              // Refresh job data after withdrawal
              dispatch(fetchJobById({ id: jobId }));

              // Navigate back to jobs screen
              setTimeout(() => {
                navigation.goBack();
              }, 1500);
            } catch (error) {
              console.error("Error withdrawing job application:", error);
              showMessage({
                message: "Error",
                description: error?.response?.data?.message || "Failed to withdraw job application",
                type: "danger",
                duration: 3000
              });
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCompleteContract = async () => {
    if (!job) {
      Alert.alert(t("common.error"), t("common.jobInformationNotAvailable"));
      return;
    }

    const contractId = job?.jobApplications?.[0]?.contracts?.[0]?.id;
    if (!contractId) {
      Alert.alert(t("common.error"), t("common.contractNotFound"));
      return;
    }

    Alert.alert(
      "Complete Job",
      "Are you sure you want to mark this job as completed? This will release the payment.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Complete & Release Payment",
          onPress: async () => {
            setCompletingContract(true);
            try {
              console.log('Completing contract:', contractId);

              const response = await httpRequest.post(
                endPoints.completeContract(contractId),
                {}
              );

              console.log('Complete contract response:', response);

              showMessage({
                message: "Success",
                description: "Job completed and payment released successfully",
                type: "success",
                duration: 4000
              });

              setIsContractCompleted(true);

              // Refresh job data
              dispatch(fetchJobById({ id: jobId }));
            } catch (error) {
              console.error("Error completing contract:", error);
              showMessage({
                message: "Error",
                description: error?.response?.data?.message || "Failed to complete job",
                type: "danger",
                duration: 3000
              });
            } finally {
              setCompletingContract(false);
            }
          },
        },
      ]
    );
  };

  const handleStartChat = async () => {
    // if (!job || !userProfile) return;

    // Use job.userId as the poster's user ID
    const posterUserId = job.userId;

    if (!posterUserId) {
      Alert.alert(
        t("common.error"),
        t("errors.chatStartErrorMessage") || "Unable to start chat. Job poster information is missing."
      );
      return;
    }

    try {
      // Convert to number if needed
      const posterUserIdNumber = Number(posterUserId);

      if (Number.isNaN(posterUserIdNumber) || posterUserIdNumber <= 0) {
        Alert.alert(t("common.error"), "Invalid job poster ID");
        return;
      }

      console.log('💬 Starting chat with job poster:', {
        posterUserId,
        posterUserIdNumber,
        jobId: job.id,
      });

      // Create or get conversation with the poster using createDirectConversation
      const conversation = await createDirectConversation(posterUserIdNumber);
      console.log('💬 Conversation created/found:', conversation);

      if (!conversation) {
        throw new Error("No conversation data returned from server.");
      }

      if (!conversation.id) {
        console.error('❌ Conversation missing ID:', conversation);
        throw new Error("Failed to create conversation. Invalid response from server - missing conversation ID.");
      }

      const conversationId = conversation.id.toString();
      console.log('💬 Navigating to ChatScreen with conversationId:', conversationId);

      // Get poster name from contracts[0].hiredByUser.userName
      const hiredByUser = job?.contracts?.[0]?.hiredByUser;
      const posterName = hiredByUser?.userName


      // Try to get profile image from hiredByUser first, then from conversation participants
      let posterProfileImage = hiredByUser?.profileImage || null;

      if (!posterProfileImage && conversation.participants && Array.isArray(conversation.participants)) {
        const posterParticipant = conversation.participants.find(
          (p: any) => {
            const userId = (p as any).user?.id || (p as any).id || p.id;
            return userId?.toString() === posterUserId.toString();
          }
        );
        if (posterParticipant) {
          posterProfileImage = (posterParticipant as any).user?.profileImage ||
            (posterParticipant as any).profileImage ||
            posterParticipant.profileImage ||
            null;
        }
      }

      // Create selectedParticipant object with poster information for ChatScreen
      const selectedParticipant = {
        id: posterUserId.toString(),
        userName: posterName,
        firstName: posterName?.split(' ')[0] || '',
        lastName: posterName?.split(' ').slice(1).join(' ') || '',
        profileImage: posterProfileImage,
        phoneNumber: job.company?.phoneNumber || null,
        phoneCountryCode: null,
        role: 'merchant',
        isOnline: false,
        lastSeen: undefined,
      };

      console.log('💬 Selected participant data:', selectedParticipant);

      // Navigate to chat screen with conversation details and participant info
      navigation.navigate(Routes.ChatScreen, {
        id: conversationId,
        conversationId: conversationId,
        selectedParticipant: selectedParticipant,
        conversation: conversation,
      } as never);
    } catch (error) {
      console.error('❌ Error starting chat:', error);
      Alert.alert(
        t("common.error"),
        error?.message || t("errors.chatStartErrorMessage") || "Failed to start chat. Please try again."
      );
    }
  };

  const handleStartCall = () => {
    if (!job || !userProfile) return;

    const otherParticipantId =
      userRole === "driver" ? job.merchantId : job.assignedDriverId;
    const otherParticipantName =
      userRole === "driver" ? job.merchantName : "Driver";

    if (!otherParticipantId) {
      Alert.alert(
        t("errors.cancelJobErrorTitle"),
        t("errors.chatStartErrorMessage")
      );
      return;
    }

    const call = initiateCall(
      userProfile.id,
      userProfile.name,
      otherParticipantId,
      otherParticipantName,
      job.id
    );

    navigation.navigate(Routes.CallScreen, { id: call.id } as never);
  };

  const handleVerification = (
    verificationType: "pre_trip" | "pod1" | "post_trip" | "pod2"
  ) => {
    if (!job) return;

    const contractId = job?.jobApplications?.[0]?.contracts?.[0]?.id;

    if (!contractId) {
      Alert.alert(t("common.error"), t("common.contractIdNotFound"));
      return;
    }

    console.log("handleVerification - starting inspection:", {
      contractId,
      verificationType,
    });

    // Navigate to camera screen for all verification types
    navigation.navigate(Routes.VerificationCameraScreen, {
      jobId: job.id,
      type: verificationType,
      contractId: contractId.toString(),
      existingInspections: inspections, // Pass existing inspection data
      onComplete: (inspectionData: any) => {
        // This callback will be called from the camera screen with captured data
        handleStartInspection(inspectionData, verificationType);
      },
    } as never);
  };

  const handleStartInspection = (
    inspectionData: any,
    inspectionType: "pre_trip" | "pod1" | "post_trip" | "pod2"
  ) => {
    if (!job) return;

    const contractId = job?.jobApplications?.[0]?.contracts?.[0]?.id;

    if (!contractId) {
      Alert.alert(t("common.error"), t("common.contractIdNotFound"));
      return;
    }

    console.log(
      "handleStartInspection - starting inspection with data:",
      inspectionData,
      "type:",
      inspectionType
    );

    // Map inspection types to API types
    const apiType =
      inspectionType === "pre_trip" || inspectionType === "pod1"
        ? "pre"
        : "post";

    dispatch(
      startInspection({
        contractId: contractId.toString(),
        type: apiType, // Map to API expected types
        data: inspectionData.data || {
          odometer: inspectionData.odometer || 12345,
        },
        defects: {
          lights: inspectionData.defects?.lights || "ok",
          ...inspectionData.defects,
        },
        photos: inspectionData.photos || [],
        onSuccess: (response) => {
          console.log("Inspection started successfully:", response);
          // Store the inspection ID for later use in complete inspection
          if (response?.data?.id) {
            setCurrentInspectionId(response.data.id.toString());

            // After starting inspection, immediately complete it with the captured data
            handleCompleteInspection(
              inspectionData,
              response.data.id.toString()
            );
          }
        },
        onError: (error) => {
          console.error("Failed to start inspection:", error);
          Alert.alert(t("common.error"), error);
        },
      })
    );
  };

  const handleCompleteInspection = (
    inspectionData: any,
    inspectionId?: string
  ) => {
    if (!job) return;

    const contractId = job?.jobApplications?.[0]?.contracts?.[0]?.id;

    if (!contractId) {
      Alert.alert(t("common.error"), t("common.contractIdNotFound"));
      return;
    }

    console.log(
      "handleCompleteInspection - completing inspection with data:",
      inspectionData,
      "inspectionId:",
      inspectionId
    );

    // Use the provided inspection ID or the stored one
    const finalInspectionId =
      inspectionId || currentInspectionId || inspectionData.inspectionId;

    if (!finalInspectionId) {
      Alert.alert(
        t("common.error"),
        t("common.inspectionIdNotFound")
      );
      return;
    }

    dispatch(
      completeInspection({
        inspectionId: finalInspectionId,
        data: inspectionData.data || {
          odometer: inspectionData.odometer || 12345,
        },
        defects: {
          lights: inspectionData.defects?.lights || "ok",
          ...inspectionData.defects,
        },
        photos: inspectionData.photos || [],
        podPhoto: inspectionData.podPhoto || {
          photos: [],
        },
        onSuccess: (response) => {
          console.log("Inspection completed successfully:", response);
          // Refresh inspections to show the new data
          fetchInspections();
          // Navigate back or show success message
          Alert.alert(t("common.success"), t("common.inspectionCompletedSuccess"));
        },
        onError: (error) => {
          console.error("Failed to complete inspection:", error);
          Alert.alert(t("common.error"), error);
        },
      })
    );
  };

  const handlePayDriver = () => {
    if (!job) return;

    if (
      balance < parseFloat(job.payAmount || job.compensation?.toString() || "0")
    ) {
      Alert.alert(
        t("errors.insufficientBalanceTitle"),
        t("errors.insufficientBalanceMessage"),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("profile.balance.addFunds"),
            onPress: () => navigation.navigate(Routes.DepositScreen as never),
          },
        ]
      );
      return;
    }

    Alert.alert(
      t("common.payDriver"),
      `${t("common.payDriverConfirm")} ${formatCurrency(
        parseFloat(job.payAmount || job.compensation?.toString() || "0"),
        job.currency || "USD"
      )}?`,
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.payNow") || "Pay Now",
          onPress: async () => {
            setPaymentLoading(true);

            try {
              // In a real app, we would call an API to process the payment
              // For now, we'll just update the local state

              // Simulate network delay
              await new Promise((resolve) => setTimeout(resolve, 1500));

              // Process the payment
              const paymentResult = processPayment({
                amount: parseFloat(
                  job.payAmount || job.compensation?.toString() || "0"
                ),
                currency: job.currency || "USD",
                jobId: job.id,
                payerId: userProfile?.id || "",
                payeeId: job.assignedDriverId || "",
                description: `Payment for job: ${job.title}`,
                jobReference: job.title,
              });

              if (paymentResult) {
                // Update job status to completed
                updateJobStatus(job.id, "completed");

                // Job status will be updated by the store

                Alert.alert(
                  "Payment Successful",
                  "Your payment has been processed successfully.",
                  [
                    {
                      text: "View Receipt",
                      onPress: () =>
                        navigation.navigate(
                          Routes.TransactionDetailScreen as never,
                          {
                            id: paymentResult.id,
                          } as never
                        ),
                    },
                    { text: "OK" },
                  ]
                );
              } else {
                throw new Error("Payment failed");
              }
            } catch (error) {
              console.error("Error processing payment:", error);
              Alert.alert(
                "Error",
                "Failed to process payment. Please try again."
              );
            } finally {
              setPaymentLoading(false);
            }
          },
        },
      ]
    );
  };

  // Bid handling functions
  const handleOpenBidModal = () => {
    setShowBidModal(true);
    setBidAmount("");
    setBidMessage("");
  };

  const handleCloseBidModal = () => {
    setShowBidModal(false);
    setBidAmount("");
    setBidMessage("");
  };

  const handleSubmitBid = async () => {
    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      Alert.alert(t("common.error"), t("common.enterValidBidAmount"));
      return;
    }

    if (!job) {
      Alert.alert(t("common.error"), t("common.jobInformationNotAvailable"));
      return;
    }

    try {
      setLoading(true);

      const applicationData = {
        jobId: parseInt(jobId),
        coverLetter: message,
        proposedRate: parseFloat(bidAmount),
        estimatedDuration: "",
        notes: bidMessage,
      };

      console.log("Bid application data:", applicationData);

      // Dispatch the action (Redux saga will handle the API call)
      dispatch(applyjob(applicationData) as any);

      Alert.alert(
        t("common.bidSubmitted"),
        `${t("common.bidSubmittedSuccess")} ${formatCurrency(
          parseFloat(bidAmount),
          job.currency || "USD"
        )}`,
        [
          {
            text: t("common.ok"),
            onPress: () => {
              handleCloseBidModal();
              // Optionally refresh job data or navigate back
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error submitting bid:", error);
      Alert.alert(t("common.error"), t("common.failedToSubmitBid"));
    } finally {
      setLoading(false);
    }
  };

  const handleDriverManagement = () => {
    if (!job) return;

    // Check if there are any assigned drivers
    const assignedDrivers =
      job?.jobApplications?.[0]?.contracts?.[0]?.contractParticipants?.filter(
        (p) => p.role === "driver"
      ) || [];

    if (assignedDrivers.length === 0) {
      // No drivers assigned - navigate to driver listing
      navigation.navigate(Routes.DriverListingScreen, {
        jobId: jobId,
        jobTitle: job?.title || "Job Assignment",
        contractId: job?.jobApplications?.[0]?.contracts?.[0]?.id || "",
      });
    } else {
      // Drivers assigned - navigate to driver assignment
      navigation.navigate(Routes.DriverAssignmentScreen, {
        jobId: jobId,
        jobTitle: job?.title || "Job Assignment",
        contractId: job?.jobApplications?.[0]?.contracts?.[0]?.id || "",
      });
    }
  };
  const handleCarrierManagement = () => {
    console.log("handleCarrierManagement");
    if (!job) return;

    // Check if there are any assigned drivers
    const assignedDrivers =
      job?.jobApplications?.[0]?.contracts?.[0]?.contractParticipants?.filter(
        (p) => p.role === "driver"
      ) || [];

    if (assignedDrivers.length === 0) {
      // No drivers assigned - navigate to driver listing
      navigation.navigate(Routes.CarrierListingScreen, {
        jobId: jobId,
        jobTitle: job?.title || "Job Assignment",
        contractId: job?.jobApplications?.[0]?.contracts?.[0]?.id || "",
      });
    } else {
      // Drivers assigned - navigate to driver assignment
      // navigation.navigate(Routes.DriverAssignmentScreen, {
      //   jobId: jobId,
      //   jobTitle: job?.title || "Job Assignment",
      //   contractId: job?.jobApplications?.[0]?.contracts?.[0]?.id || "",
      // });
    }
  };
  const formatStatus = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "posted":
      case "draft":
        return Colors.primary;
      case "active":
        return Colors.primary;
      case "assigned":
        return Colors.warning;
      case "in_progress":
      case "arrived_pickup":
      case "loaded":
      case "in_transit":
      case "arrived_delivery":
        return Colors.secondary;
      case "delivered":
      case "completed":
        return Colors.success;
      case "cancelled":
        return Colors.error;
      default:
        return Colors.gray500;
    }
  };

  const renderInspectionImages = () => {
    if (!inspections || inspections.length === 0) return null;

    // Helper function to render a consistent inspection tile
    const renderInspectionTile = (
      title: string,
      date: string,
      photos: any[],
      comment: string,
      commentLabel: string,
      borderColor: string
    ) => {
      if (!photos || photos.length === 0) return null;

      return (
        <View
          key={title}
          style={[styles.inspectionTile, { borderLeftColor: borderColor }]}
        >
          <Text style={styles.inspectionTileTitle}>{title}</Text>
          <Text style={styles.inspectionTileDate}>{date}</Text>

          <View style={styles.photosContainer}>
            <View style={styles.photosGrid}>
              {photos.slice(0, 2).map((photo: any, photoIndex: number) => (
                <TouchableOpacity
                  key={photoIndex}
                  style={styles.photoItem}
                  onPress={() => handleImagePress(photo.url)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: photo.url }}
                    style={styles.inspectionPhoto}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}

              {photos.length > 2 && (
                <TouchableOpacity
                  style={styles.morePhotosButton}
                  onPress={() => handleImagePress(photos[2].url)}
                  activeOpacity={0.8}
                >
                  <View style={styles.morePhotosOverlay}>
                    <Text style={styles.morePhotosText}>
                      +{photos.length - 2}
                    </Text>
                    <Text style={styles.morePhotosSubtext}>{t("jobs.more")}</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {comment && (
            <View style={styles.commentContainer}>
              <Text style={styles.commentLabel}>{commentLabel}</Text>
              <Text style={styles.commentText}>{comment}</Text>
            </View>
          )}
        </View>
      );
    };

    return (
      <View style={styles.inspectionContainer}>
        {loadingInspections ? (
          <Text style={styles.loadingText}>{t("jobs.loadingInspections")}</Text>
        ) : (
          <View style={styles.inspectionList}>
            {(() => {
              // Find inspections by type
              const preTripInspection = inspections.find(
                (inspection) =>
                  inspection.type === "pre_trip" || inspection.type === "pre"
              );
              const pod1Inspection = inspections.find(
                (inspection) =>
                  inspection.type === "pod1" ||
                  (inspection.type === "pre" && inspection.podPhoto?.pod1)
              );
              const pod2Inspection = inspections.find(
                (inspection) =>
                  inspection.type === "pod2" ||
                  (inspection.type === "post" && inspection.podPhoto?.pod2)
              );
              const postTripInspection = inspections.find(
                (inspection) =>
                  inspection.type === "post_trip" || inspection.type === "post"
              );

              // Render in the specified sequence
              return (
                <>
                  {preTripInspection &&
                    renderInspectionTile(
                      "Pre-Trip Inspection",
                      new Date(
                        preTripInspection.createdAt
                      ).toLocaleDateString(),
                      preTripInspection.photos || [],
                      preTripInspection.data?.preInspectionComment ||
                      preTripInspection.preInspectionComment ||
                      "",
                      "Pre-Trip Comment:",
                      Colors.primary
                    )}

                  {pod1Inspection &&
                    renderInspectionTile(
                      "Proof of Document (POD 1)",
                      new Date(pod1Inspection.createdAt).toLocaleDateString(),
                      pod1Inspection.podPhoto?.pod1 || [],
                      pod1Inspection.data?.pod1Comment ||
                      pod1Inspection.pod1Comment ||
                      "",
                      "POD 1 Comment:",
                      Colors.success
                    )}

                  {pod2Inspection &&
                    renderInspectionTile(
                      "Proof of Document (POD 2)",
                      new Date(pod2Inspection.createdAt).toLocaleDateString(),
                      pod2Inspection.podPhoto?.pod2 || [],
                      pod2Inspection.data?.pod2Comment ||
                      pod2Inspection.pod2Comment ||
                      "",
                      "POD 2 Comment:",
                      Colors.success
                    )}

                  {postTripInspection &&
                    renderInspectionTile(
                      "Post-Trip Inspection",
                      new Date(
                        postTripInspection.createdAt
                      ).toLocaleDateString(),
                      postTripInspection.photos || [],
                      postTripInspection.data?.postInspectionComment ||
                      postTripInspection.postInspectionComment ||
                      "",
                      "Post-Trip Comment:",
                      Colors.warning
                    )}
                </>
              );
            })()}
          </View>
        )}
      </View>
    );
  };
  // Check if inspections already exist for each type - handle both old and new formats
  const hasPreTrip = inspections.some(
    (inspection) =>
      inspection.type === "pre_trip" || (inspection.type === "pre" && inspection.photos?.length > 0)
  );
  const hasPod1 = inspections.some(
    (inspection) =>
      inspection.type === "pod1" ||
      (inspection.type === "pre" && inspection.podPhoto?.pod1)
  );
  const hasPostTrip = inspections.some(
    (inspection) =>
      (inspection.type === "post_trip" || inspection.type === "post") && inspection.photos?.length > 0
  );
  const hasPod2 = inspections.some(
    (inspection) =>
      inspection.type === "pod2" ||
      (inspection.type === "post" && inspection.podPhoto?.pod2)
  );

  // Find post-trip inspection for countdown
  const postTripInspection = inspections.find(
    (inspection) =>
      (inspection.type === "post_trip" || inspection.type === "post") && inspection.photos?.length > 0
  );

  // Countdown timer from post-trip completion + 24 hours
  useEffect(() => {
    // Use completedAt if available, otherwise fall back to createdAt
    const completionTime = postTripInspection?.completedAt || postTripInspection?.createdAt;

    if (!completionTime) {
      setCountdown("");
      return;
    }

    const updateCountdown = () => {
      const completedAt = new Date(completionTime).getTime();
      const deadline = completedAt + 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      const now = Date.now();
      const remaining = deadline - now;

      if (remaining <= 0) {
        setCountdown("00:00:00");
        return;
      }

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

      const formatted = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
      setCountdown(formatted);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [postTripInspection?.completedAt, postTripInspection?.createdAt]);

  // Sequential validation: each step requires the previous one to be completed
  const canAccessPod1 = hasPreTrip; // POD 1 requires Pre-Trip
  const canAccessPod2 = hasPod1; // POD 2 requires POD 1
  const canAccessPostTrip = hasPod2; // Post-Trip requires POD 2
  const renderVerificationButtons = () => {
    if (
      !job ||
      userRole !== "driver" ||

      job.assignedDriverId !== userProfile?.id
    )
      return null;



    // Remove old verification logic - now using 4 separate buttons

    return (
      <View style={styles.verificationContainer}>
        <Text style={styles.verificationTitle}>{t("jobs.jobDetails")}</Text>

        <View style={styles.verificationButtons}>
          {/* Pre-Trip Button */}
          <TouchableOpacity
            style={[
              styles.verificationButton,
              hasPreTrip && styles.verificationButtonCompleted,
            ]}
            onPress={() => handleVerification("pre_trip")}
            disabled={hasPreTrip}
          >
            {!hasPreTrip && (
              <Camera
                size={20}
                color={Colors.primary}
                style={styles.verificationIcon}
              />
            )}
            {hasPreTrip && (
              <SquareCheck
                color={Colors.gray100}
                size={22}
                style={styles.verificationIcon}
              />
            )}
            <Text
              style={[
                styles.verificationButtonText,
                hasPreTrip && styles.verificationButtonTextCompleted,
              ]}
            >
              {t("jobs.verification.preTrip")}
            </Text>
          </TouchableOpacity>

          {/* POD 1 Button */}
          <TouchableOpacity
            style={[
              styles.verificationButton,
              hasPod1 && styles.verificationButtonCompleted,
              !canAccessPod1 && !hasPod1 && styles.verificationButtonDisabled,
            ]}
            onPress={() => {
              if (!canAccessPod1) {
                Alert.alert(
                  "Action Required",
                  "Please complete Pre-Trip Inspection before uploading POD 1.",
                  [{ text: "OK" }]
                );
                return;
              }
              handleVerification("pod1");
            }}
            disabled={hasPod1 || !canAccessPod1}
          >
            {!hasPod1 && (
              <Camera
                size={20}
                color={canAccessPod1 ? Colors.primary : Colors.gray400}
                style={styles.verificationIcon}
              />
            )}
            {hasPod1 && (
              <SquareCheck
                color={Colors.gray100}
                size={22}
                style={styles.verificationIcon}
              />
            )}
            <Text
              style={[
                styles.verificationButtonText,
                hasPod1 && styles.verificationButtonTextCompleted,
                !canAccessPod1 && !hasPod1 && styles.verificationButtonTextDisabled,
              ]}
            >
              {t("jobs.verification.proofOfDocument_1")}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.verificationButtons}>
          {/* POD 2 Button */}
          <TouchableOpacity
            style={[
              styles.verificationButton,
              hasPod2 && styles.verificationButtonCompleted,
              !canAccessPod2 && !hasPod2 && styles.verificationButtonDisabled,
            ]}
            onPress={() => {
              if (!canAccessPod2) {
                Alert.alert(
                  "Action Required",
                  "Please complete POD 1 before uploading POD 2.",
                  [{ text: "OK" }]
                );
                return;
              }
              handleVerification("pod2");
            }}
            disabled={hasPod2 || !canAccessPod2}
          >
            {!hasPod2 && (
              <Camera
                size={20}
                color={canAccessPod2 ? Colors.primary : Colors.gray400}
                style={styles.verificationIcon}
              />
            )}
            {hasPod2 && (
              <SquareCheck
                color={Colors.gray100}
                size={22}
                style={styles.verificationIcon}
              />
            )}
            <Text
              style={[
                styles.verificationButtonText,
                hasPod2 && styles.verificationButtonTextCompleted,
                !canAccessPod2 && !hasPod2 && styles.verificationButtonTextDisabled,
              ]}
            >
              {t("jobs.verification.proofOfDocument_2")}
            </Text>
          </TouchableOpacity>

          {/* Post-Trip Button */}
          <TouchableOpacity
            style={[
              styles.verificationButton,
              hasPostTrip && styles.verificationButtonCompleted,
              !canAccessPostTrip && !hasPostTrip && styles.verificationButtonDisabled,
            ]}
            onPress={() => {
              if (!canAccessPostTrip) {
                Alert.alert(
                  "Action Required",
                  "Please complete POD 2 before starting Post-Trip Inspection.",
                  [{ text: "OK" }]
                );
                return;
              }
              handleVerification("post_trip");
            }}
            disabled={hasPostTrip || !canAccessPostTrip}
          >
            {!hasPostTrip && (
              <Camera
                size={20}
                color={canAccessPostTrip ? Colors.primary : Colors.gray400}
                style={styles.verificationIcon}
              />
            )}
            {hasPostTrip && (
              <SquareCheck
                color={Colors.gray100}
                size={22}
                style={styles.verificationIcon}
              />
            )}
            <Text
              style={[
                styles.verificationButtonText,
                hasPostTrip && styles.verificationButtonTextCompleted,
                !canAccessPostTrip && !hasPostTrip && styles.verificationButtonTextDisabled,
              ]}
            >
              {t("jobs.verification.postTrip")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Show completion status if all are done */}
        {hasPreTrip && hasPod1 && hasPostTrip && hasPod2 && (
          <View style={styles.inspectionStatusContainer}>
            <Text style={styles.inspectionStatusText}>
              ✅ {t("jobs.allInspectionsCompleted")}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderCommunicationButtons = () => {
    if (!job) return null;

    // Only show communication buttons if the job is assigned and the user is either
    // the merchant who posted the job or the driver assigned to it
    const canCommunicate =
      job.status !== "posted" &&
      job.status !== "cancelled" &&
      job.status !== "completed" &&
      job.status !== "delivered" &&
      ((userRole === "driver" && job.assignedDriverId === userProfile?.id) ||
        (userRole === "merchant" && job.merchantId === userProfile?.id));

    if (!hasDriverAssigned) return null;

    return (
      <View style={styles.communicationContainer}>
        <TouchableOpacity
          style={styles.communicationButton}
          onPress={handleStartChat}
        >
          <MessageCircle size={20} color={Colors.primary} />
          <Text style={styles.communicationButtonText}>
            {t("common.message")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.communicationButton}
          onPress={handleStartCall}
        >
          <Phone size={20} color={Colors.primary} />
          <Text style={styles.communicationButtonText}>{t("common.call")}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderPaymentSection = () => {
    if (!job) return null;

    // Show retry payment button if payoutStatus is pending
    if (job.status === 'pending_funding') {
      return (
        <View style={styles.paymentContainer}>
          <View style={styles.paymentHeader}>
            <CreditCard
              size={20}
              color={Colors.warning}
              style={styles.paymentIcon}
            />
            <Text style={styles.paymentTitle}>
              {t("jobs.paymentPending")}
            </Text>
          </View>

          <Text style={styles.paymentDescription}>
            {t("jobs.paymentPendingDescription")}
          </Text>

          <View style={styles.paymentDetails}>
            <Text style={styles.paymentLabel}>{t("jobs.amountDue")}:</Text>
            <Text style={styles.paymentAmount}>
              {formatCurrency(
                parseFloat(job.payAmount || job.compensation?.toString() || "0"),
                job.currency || "USD"
              )}
            </Text>
          </View>

          <Button
            title="Retry Payment"
            variant="primary"
            fullWidth
            loading={retryPaymentLoading}
            onPress={handleRetryPayment}
          />
          <Text style={styles.note}>{t("jobs.note")}</Text>
        </View>
      );
    }

    // Only show payment section for merchants when job is delivered
    if (userRole !== "merchant" || job.status !== "delivered") return null;

    return (
      <View style={styles.paymentContainer}>
        <View style={styles.paymentHeader}>
          <CreditCard
            size={20}
            color={Colors.success}
            style={styles.paymentIcon}
          />
          <Text style={styles.paymentTitle}>
            {t("profile.paymentMethods.paymentRequired")}
          </Text>
        </View>

        <Text style={styles.paymentDescription}>
          The driver has completed this job. Please process the payment to
          finalize the job.
        </Text>

        <View style={styles.paymentDetails}>
          <Text style={styles.paymentLabel}>Amount Due:</Text>
          <Text style={styles.paymentAmount}>
            {formatCurrency(
              parseFloat(job.payAmount || job.compensation?.toString() || "0"),
              job.currency || "USD"
            )}
          </Text>
        </View>

        <Button
          title={`Pay ${formatCurrency(
            parseFloat(job.payAmount || job.compensation?.toString() || "0"),
            job.currency || "USD"
          )}`}
          variant="primary"
          fullWidth
          loading={paymentLoading}
          onPress={handlePayDriver}
        />
      </View>
    );
  };

  const renderDriverReshareSection = () => {
    if (!job) return null;

    if (!existsCarrier) return null;

    return (
      <View style={styles.reshareContainer}>
        <View style={styles.reshareHeader}>
          <View style={styles.reshareIcon}>
            <Share
              size={20}
              color={Colors.white}
            />
            {/* <Text style={styles.reshareIconText}>📤</Text> */}
          </View>
          <Text style={styles.reshareTitle}>{t("jobs.can'tFindDriver")}</Text>
        </View>

        <Text style={styles.reshareDescription}>
          {t("jobs.reshareDescription")}
        </Text>

        <TouchableOpacity
          style={styles.reshareButton}
          onPress={handleReshareJob}
        >
          <Text style={styles.reshareButtonText}>{t("jobs.reshareJob")}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const handleReshareJob = () => {
    if (!job) return;

    // Navigate to reshare screen with job data
    navigation.navigate(Routes.ReshareJobScreen, { job } as never);
  };

  const handleRetryPayment = async () => {
    if (!job || !jobId) return;

    setRetryPaymentLoading(true);

    try {
      console.log('Retrying payment for job:', jobId);
      const response = await httpRequest.post(endPoints.retryJobPayment(parseInt(jobId)), {});

      console.log('Retry payment response:', response);

      // Access paymentUrl from response data
      const paymentUrl = (response as any)?.data?.paymentUrl || (response as any)?.paymentUrl;

      if (paymentUrl) {
        console.log('Payment URL received, opening payment page:', paymentUrl);
        // Open payment URL in browser
        await Linking.openURL(paymentUrl);
        // Don't set loading to false - wait for payment to complete and deep link return
      } else {
        throw new Error('Payment URL not found in response');
      }
    } catch (error: any) {
      console.error('Error retrying payment:', error);
      setRetryPaymentLoading(false);
      showMessage({
        message: "Error",
        description: error?.message || "Failed to retry payment. Please try again.",
        type: "danger",
        duration: 5000,
      });
    }
  };

  const renderBidModal = () => {
    if (!job) return null;

    return (
      <Modal
        visible={showBidModal}
        transparent
        animationType="slide"
        onRequestClose={handleCloseBidModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bidModalContainer}>
            <View style={styles.bidModalHeader}>
              <Text style={styles.bidModalTitle}>{t("jobs.submitBid")}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCloseBidModal}
              >
                <X size={24} color={Colors.gray500} />
              </TouchableOpacity>
            </View>

            <View style={styles.bidModalContent}>
              <Text style={styles.bidJobTitle}>{job.title}</Text>
              <Text style={styles.jobId}>{t("jobs.jobId")}-{job.id}</Text>

              <Text style={styles.bidJobDescription}>{job.description}</Text>

              <View style={styles.bidForm}>
                <Text style={styles.bidLabel}>Your Bid Amount</Text>
                <View style={styles.bidAmountContainer}>
                  <Text style={styles.currencySymbol}>
                    {job.currency === "USD" ? "$" : job.currency || "$"}
                  </Text>
                  <TextInput
                    style={styles.bidAmountInput}
                    placeholderTextColor={Colors.gray500}
                    placeholder="0.00"
                    value={bidAmount}
                    onChangeText={setBidAmount}
                    keyboardType="numeric"
                    autoFocus
                  />
                </View>

                <Text style={styles.bidLabel}>Message (Optional)</Text>
                <TextInput
                  style={styles.bidMessageInput}
                  placeholderTextColor={Colors.gray500}
                  placeholder="Add a message to your bid..."
                  value={bidMessage}
                  onChangeText={setBidMessage}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.bidModalActions}>
                <TouchableOpacity
                  style={styles.cancelBidButton}
                  onPress={handleCloseBidModal}
                >
                  <Text style={styles.cancelBidButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitBidButton}
                  onPress={handleSubmitBid}
                  disabled={loading || !bidAmount}
                >
                  <Gavel
                    size={20}
                    color={Colors.white}
                    style={styles.bidIcon}
                  />
                  <Text style={styles.submitBidButtonText}>
                    {loading ? "Submitting..." : "Submit Bid"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Check if job is null, undefined, or doesn't match the current jobId
  const jobMatches = job && job.id === Number(jobId);
  const shouldShowSkeleton = !jobMatches && (isLoadingJob || showSkeleton);

  if (!jobMatches) {
    console.log('🔍 JobDetails: Render check - job:', job?.id, 'jobId:', jobId, 'jobMatches:', jobMatches, 'isLoadingJob:', isLoadingJob, 'showSkeleton:', showSkeleton, 'shouldShowSkeleton:', shouldShowSkeleton);

    return (
      <View style={styles.container}>
        <Header title={t("jobs.jobDetails")} />
        {shouldShowSkeleton ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <JobDetailsSkeleton />
          </ScrollView>
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Job not found</Text>
            <Button
              title="Go Back"
              variant="outline"
              onPress={() => navigation.goBack()}
            />
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title={t("jobs.jobDetails")} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{job.title}</Text>
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(job.status) },
              ]}
            >
              <Text style={styles.statusText}>{formatStatus(job.status)}</Text>
            </View>
            {hasPreTrip && hasPod1 && hasPostTrip && hasPod2 && <TouchableOpacity
              style={styles.tripTrackingButton}
              onPress={() =>
                navigation.navigate(Routes.TripTrackingScreen, {
                  job: job,
                  jobId: job.id,
                  hasPreTrip: hasPreTrip,
                  hasPod1: hasPod1,
                  hasPostTrip: hasPostTrip,
                  hasPod2: hasPod2,
                })
              }
            >
              <Truck size={16} color={Colors.white} />
              <Text style={styles.tripTrackingButtonText}>Trip Tracking</Text>
            </TouchableOpacity>}
          </View>
        </View>

        {/* Countdown timer - Show when post-trip is completed */}
        {job?.status !== "completed" &&
          hasPreTrip &&
          hasPod1 &&
          hasPostTrip &&
          hasPod2 &&
          (isContractCompleted == false) &&

          countdown && (
            <View style={styles.countdownContainer}>
              <Info size={20} color={Colors.primary} />
              <View style={styles.countdownContent}>
                <Text style={styles.countdownMessage}>
                  {t("jobs.paymentReleaseMessage")}
                </Text>
                {countdown > 0 && <View style={styles.countdownRow}>
                  <Text style={styles.countdownLabel}>
                    {t("jobs.paymentReleaseCountdown")}
                  </Text>
                  <Text style={styles.countdownTime}>{countdown}</Text>
                </View>}
                <TouchableOpacity
                  style={styles.chatButton}
                  onPress={handleStartChat}
                >
                  <MessageCircle size={16} color={Colors.white} />
                  <Text style={styles.chatButtonText}>
                    {t("jobs.chatWithPoster") || "Chat with Poster"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

        <Text style={styles.jobId}>Job ID-{job.id}</Text>

        <Text style={styles.description}>{job.description}</Text>

        {/* {renderCommunicationButtons()} */}

        {renderVerificationButtons()}

        {renderInspectionImages()}

        {job.userId == profileData.id && renderPaymentSection()}


        {/* Can't Find a Driver Section */}
        {(userRole === "carrier" || userRole === "broker" || userRole === "shipper") && renderDriverReshareSection()}

        {/* Earnings Breakdown */}
        {/* {earnings && (
          <View style={styles.earningsContainer}> */}
        {/* <Text style={styles.earningsTitle}>Your Earnings</Text> */}

        {/* Shipper View */}
        {/* {earnings.showPosted && (
              <View style={styles.earningsRow}>
                <Text style={styles.earningsLabel}>Posted Amount:</Text>
                <Text style={styles.earningsValue}>
                  {formatCurrency(earnings.postedAmount, job.currency || "USD")}
                </Text>
              </View>
            )} */}

        {/* Broker/Carrier/Driver View */}
        {/* {earnings.pickedAmount !== undefined && !earnings.showPosted && (
              <>
                <View style={styles.earningsRow}>
                  <Text style={styles.earningsLabel}>Picked for:</Text>
                  <Text style={styles.earningsValue}>
                    {formatCurrency(earnings.pickedAmount, job.currency || "USD")}
                  </Text>
                </View>

                {earnings.assignedAmount !== null && (
                  <>
                    <View style={styles.earningsRow}>
                      <Text style={styles.earningsLabel}>Assigned for:</Text>
                      <Text style={styles.earningsValue}>
                        {formatCurrency(earnings.assignedAmount, job.currency || "USD")}
                      </Text>
                    </View>

                    <View style={[styles.earningsRow, styles.profitRow]}>
                      <Text style={[styles.earningsLabel, styles.profitLabel]}>Your Profit:</Text>
                      <Text style={[styles.earningsValue, styles.profitValue]}>
                        {formatCurrency(earnings.profit, job.currency || "USD")}
                      </Text>
                    </View>
                  </>
                )}

                {earnings.earning !== null && (
                  <View style={[styles.earningsRow, styles.earningRow]}>
                    <Text style={[styles.earningsLabel, styles.earningLabel]}>Your Earning:</Text>
                    <Text style={[styles.earningsValue, styles.earningValue]}>
                      {formatCurrency(earnings.earning, job.currency || "USD")}
                    </Text>
                  </View>
                )}
              </>
            )} */}

        {/* Price per mile */}
        {/* <View style={styles.pricePerMileContainer}>
              <Text style={styles.pricePerMileText}>
                {job?.pricePerMile?.toFixed(2)}/{t("jobs.miles")}
              </Text>
            </View>
          </View>
        )} */}

        {/* Fallback for no earnings data */}
        {/* {!earnings && (
          <View style={styles.compensationContainer}>
            <Text style={styles.compensationText}>
              {formatCurrency(
                parseFloat(job.payAmount || job.compensation?.toString() || "0"),
                job.currency || "USD"
              )}
            </Text>
            <Text style={styles.compensationText}>
              {job?.pricePerMile?.toFixed(2)}/{t("jobs.miles")}
            </Text>
          </View>
        )} */}

        {/* Bids Information Section */}
        {job.userId == profileData.id &&
          job?.jobApplications &&
          job?.jobApplications.length > 0 && (
            <View style={styles.bidsContainer}>
              <View style={styles.bidsHeader}>
                <Text style={styles.bidsSectionTitle}>
                  Job Bids ({job.jobApplications.length})
                </Text>
                <TouchableOpacity
                  style={styles.viewAllBidsButton}
                  onPress={() =>
                    navigation.navigate(Routes.JobBidsScreen, { jobId: jobId })
                  }
                >
                  <Text style={styles.viewAllBidsText}>View All</Text>
                </TouchableOpacity>
              </View>
              {job?.jobApplications?.slice(0, 2).map((application, index) => (
                <View key={application.id || index} style={styles.bidItem}>
                  <View style={styles.bidHeader}>
                    <Text style={styles.bidTitle}>Bid #{index + 1}</Text>
                    <Text style={styles.bidStatus}>{application.status}</Text>
                  </View>
                  <Text style={styles.bidAmount}>
                    {formatCurrency(
                      parseFloat(application.proposedRate?.toString() || "0"),
                      job?.currency || "USD"
                    )}
                  </Text>
                  {application.coverLetter && (
                    <Text style={styles.bidMessage}>
                      "{application.coverLetter}"
                    </Text>
                  )}
                  {application.notes && (
                    <Text style={styles.bidNotes}>
                      Notes: {application.notes}
                    </Text>
                  )}
                  <Text style={styles.bidDate}>
                    Applied:{" "}
                    {new Date(application.appliedAt).toLocaleDateString()}
                  </Text>
                </View>
              ))}
              {job.jobApplications.length > 2 && (
                <TouchableOpacity
                  style={styles.showMoreBidsButton}
                  onPress={() =>
                    navigation.navigate(Routes.JobBidsScreen, { jobId: jobId })
                  }
                >
                  <Text style={styles.showMoreBidsText}>
                    +{job.jobApplications.length - 2} more bids
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

        <View style={styles.routeContainer}>
          <View style={styles.routePoint}>
            <View style={[styles.routeMarker, styles.pickupMarker]}>
              <MapPin size={16} color={Colors.white} />
            </View>
            <View style={styles.routeInfo}>
              <Text style={styles.routeLabel}>{t("jobs.pickup")}</Text>
              <Text style={styles.routeAddress}>
                {job.pickupLocation?.address || "Address not available"}
              </Text>
              <Text style={styles.routeCity}>
                {job.pickupLocation?.city || "City"},{" "}
                {job.pickupLocation?.state || "State"}{" "}
                {job.pickupLocation?.zipCode || ""}
              </Text>
              <Text style={styles.routeTime}>
                {job.pickupLocation?.date || "Date"} •{" "}
                {job.pickupLocation?.time || "Time"}
              </Text>
            </View>
          </View>

          <View style={styles.routeConnector} />

          <View style={styles.routePoint}>
            <View style={[styles.routeMarker, styles.deliveryMarker]}>
              <MapPin size={16} color={Colors.white} />
            </View>
            <View style={styles.routeInfo}>
              <Text style={styles.routeLabel}>{t("jobs.delivery")}</Text>
              <Text style={styles.routeAddress}>
                {job.dropoffLocation?.address || "Address not available"}
              </Text>
              <Text style={styles.routeCity}>
                {job.dropoffLocation?.city || "City"},{" "}
                {job.dropoffLocation?.state || "State"}{" "}
                {job.dropoffLocation?.zipCode || ""}
              </Text>
              <Text style={styles.routeTime}>
                {job.dropoffLocation?.date || "Date"} •{" "}
                {job.dropoffLocation?.time || "Time"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Calendar
                size={16}
                color={Colors.gray600}
                style={styles.detailIcon}
              />
              <View>
                <Text style={styles.detailLabel}>{t("jobs.pickupDate")}</Text>
                <Text style={styles.detailValue}>
                  {job.pickupLocation?.date || "Date not available"}
                </Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <ArrowRight size={16} color={Colors.gray400} />
            </View>

            <View style={styles.detailItem}>
              <Calendar
                size={16}
                color={Colors.gray600}
                style={styles.detailIcon}
              />
              <View>
                <Text style={styles.detailLabel}>{t("jobs.deliveryDate")}</Text>
                <Text style={styles.detailValue}>
                  {job.dropoffLocation?.date || "Date not available"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Truck
                size={16}
                color={Colors.gray600}
                style={styles.detailIcon}
              />
              <View>
                <Text style={styles.detailLabel}>
                  {t("jobs.filters.truckType")}
                </Text>
                <Text style={styles.detailValue}>
                  {job.requiredTruckType || "Any truck type"}
                </Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <Package
                size={16}
                color={Colors.gray600}
                style={styles.detailIcon}
              />
              <View>
                <Text style={styles.detailLabel}>{t("jobs.cargoWeight")}</Text>
                <Text style={styles.detailValue}>
                  {job?.cargo?.cargoWeight}{" "}
                  {job?.cargo?.cargoWeightUnit || "kg"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Package
                size={16}
                color={Colors.gray600}
                style={styles.detailIcon}
              />
              <View>
                <Text style={styles.detailLabel}>{t("jobs.cargoType")}</Text>
                <Text style={styles.detailValue}>
                  {job?.cargo?.cargoType || "Type not specified"}
                </Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <MapPin
                size={16}
                color={Colors.gray600}
                style={styles.detailIcon}
              />
              <View>
                <Text style={styles.detailLabel}>{t("jobs.distance")}</Text>
                <Text style={styles.detailValue}>
                  {(job?.cargo?.distance || 0).toFixed(1)} {t("jobs.miles")}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {job.specialRequirements && (
          <View style={styles.requirementsContainer}>
            <View style={styles.requirementsHeader}>
              <Info
                size={16}
                color={Colors.warning}
                style={styles.requirementsIcon}
              />
              <Text style={styles.requirementsTitle}>
                {t("jobs.specialRequirements")}
              </Text>
            </View>
            <Text style={styles.requirementsText}>
              {job.specialRequirements}
            </Text>
          </View>
        )}

        <View style={styles.merchantContainer}>
          <Text style={styles.sectionTitle}>{t("jobs.postedBy")}</Text>

          <View style={styles.merchantCard}>
            <View style={styles.merchantHeader}>
              <View style={styles.merchantAvatar}>
                <User size={24} color={Colors.white} />
              </View>

              <View style={styles.merchantInfo}>
                <Text style={styles.merchantName}>
                  {job.company?.companyName ||
                    job.merchantName ||
                    "Company Name"}
                </Text>
                <View style={styles.merchantRating}>
                  <Star size={14} color={Colors.warning} />
                  <Text style={styles.merchantRatingText}>
                    {(job.merchantRating || 0).toFixed(1)}
                  </Text>
                </View>
              </View>
            </View>

            {/* <View style={styles.merchantContact}>
              <TouchableOpacity
                style={styles.contactButton}
                onPress={handleStartCall}
              >
                <Phone size={16} color={Colors.primary} />
                <Text style={styles.contactButtonText}>{t("common.call")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.contactButton}
                onPress={handleStartChat}
              >
                <MessageCircle size={16} color={Colors.primary} />
                <Text style={styles.contactButtonText}>
                  {t("common.message")}
                </Text>
              </TouchableOpacity>
            </View> */}
          </View>
        </View>

        <View style={styles.messageContainer}>
          <Text style={styles.messageLabel}>
            Cover Letter / Message (Optional)
          </Text>
          <TextInput
            style={styles.messageInput}
            placeholder="Tell the employer why you're interested in this job..."
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            placeholderTextColor={Colors.gray400}
            textAlignVertical="top"
          />
        </View>
        {/* Contract Ratings Section - Show ratings given by users */}
        {!!contractRatings.length && (
          <View style={styles.ratingsSection}>
            <Text style={styles.ratingsSectionTitle}>Ratings & Reviews</Text>
            {contractRatings.map((rating: any) => {
              const rater = rating.rater || {};
              const raterName = rater.userName ||
                `${rater.firstName || ""} ${rater.lastName || ""}`.trim() ||
                `User ${rating.raterUserId}`;
              const raterImage = rater.profileImage;

              return (
                <View key={rating.id} style={styles.ratingCard}>
                  <View style={styles.ratingHeader}>
                    <View style={styles.ratingUserInfo}>
                      {raterImage ? (
                        <Image
                          source={{ uri: raterImage }}
                          style={styles.ratingAvatarImage}
                        />
                      ) : (
                        <View style={styles.ratingAvatar}>
                          <User size={20} color={Colors.primary} />
                        </View>
                      )}
                      <View style={styles.ratingUserDetails}>
                        <Text style={styles.ratingUserName}>
                          {raterName}
                        </Text>
                        <View style={styles.ratingStars}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={14}
                              color={star <= rating.stars ? Colors.warning : Colors.gray400}
                              fill={star <= rating.stars ? Colors.warning : "transparent"}
                            />
                          ))}
                        </View>
                      </View>
                    </View>
                    <Text style={styles.ratingDate}>
                      {new Date(rating.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  {rating.comment && (
                    <Text style={styles.ratingComment}>{rating.comment}</Text>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
      {/* {
!hasPreTrip &&
!hasPod1 &&
!hasPostTrip &&
!hasPod2 && (userRole === "shipper" ) &&
job.status === "active" &&
<View   style={{
              ...styles.footer,
              flexDirection: "row",
              flexWrap: "wrap", // ✅ allows wrapping to next line if needed

              gap: 10,
              justifyContent: "space-between",
            }}>
{(!hasAcceptedDriver || !hasDriverAssigned) && (
              <Button
                title={(() => {
                  const assignedDrivers =
                    job?.jobApplications?.[0]?.contracts?.[0]?.contractParticipants?.filter(
                      (p) => p.role === "driver"
                    ) || [];
                  return assignedDrivers.length === 0
                    ? t("common.assigndriver")
                    : t("common.managedrivers");
                })()}
                variant="primary"
                style={{ flex: 1 }}

                fullWidth={
                  hasCarrierAssigned ||
                    existsCarrier ||
                    job?.jobApplications?.find(
                      (application) => application.applicantUserId === profileData?.id
                    )?.status !== "withdrawn"
                    ? false
                    : true
                } loading={loading}
                onPress={handleDriverManagement}
              />
            )}
            {(!hasCarrierAssigned || !existsCarrier) && userRole !== "carrier" && (

              <Button
                title={(() => {
                  const assignedDrivers =
                    job?.jobApplications?.[0]?.contracts?.[0]?.contractParticipants?.filter(
                      (p) => p.role === "carrier"
                    ) || [];
                  return assignedDrivers.length === 0
                    ? t("common.assignCarrier")
                    : t("common.manageCarriers");
                })()}
                variant="primary"
                fullWidth
                loading={loading}
                onPress={() =>
                  navigation.navigate(Routes.CarrierListingScreen, {
                    jobId: jobId,
                    jobTitle: job?.title || "Job Assignment",
                    contractId:
                      job?.jobApplications?.[0]?.contracts?.[0]?.id || "",
                  })
                }
              />
            )}
</View>
} */}
      {!hasPreTrip &&
        !hasPod1 &&
        !hasPostTrip &&
        !hasPod2 && (userRole === "carrier" || userRole === "broker") &&
        job.status === "assigned" &&
        job.userId !== profileData.id && (
          <View
            style={{
              ...styles.footer,
              flexDirection: "row",
              flexWrap: "wrap", // ✅ allows wrapping to next line if needed

              gap: 10,
              justifyContent: "space-between",
            }}
          >
            {exists && job.status == "pending" &&
              job?.jobApplications?.find(
                (application) => application.applicantUserId === profileData?.id
              )?.status !== 'withdrawn' &&
              <Button
                title={'Withdraw Job'}
                variant="primary"
                style={{ flex: 1 }}

                loading={loading}
                onPress={handleWithdrawJob}
              />
            }

            {(!hasAcceptedDriver || !hasDriverAssigned) && (
              <Button
                title={(() => {
                  const assignedDrivers =
                    job?.jobApplications?.[0]?.contracts?.[0]?.contractParticipants?.filter(
                      (p) => p.role === "driver"
                    ) || [];
                  return assignedDrivers.length === 0
                    ? t("common.assigndriver")
                    : t("common.managedrivers");
                })()}
                variant="primary"
                style={{ flex: 1 }}

                fullWidth={
                  hasCarrierAssigned ||
                    existsCarrier ||
                    job?.jobApplications?.find(
                      (application) => application.applicantUserId === profileData?.id
                    )?.status !== "withdrawn"
                    ? false
                    : true
                } loading={loading}
                onPress={handleDriverManagement}
              />
            )}
            {(!hasCarrierAssigned || !existsCarrier) && userRole !== "carrier" && (

              <Button
                title={(() => {
                  const assignedDrivers =
                    job?.jobApplications?.[0]?.contracts?.[0]?.contractParticipants?.filter(
                      (p) => p.role === "carrier"
                    ) || [];
                  return assignedDrivers.length === 0
                    ? t("common.assignCarrier")
                    : t("common.manageCarriers");
                })()}
                variant="primary"
                fullWidth
                loading={loading}
                onPress={() =>
                  navigation.navigate(Routes.CarrierListingScreen, {
                    jobId: jobId,
                    jobTitle: job?.title || "Job Assignment",
                    contractId:
                      job?.jobApplications?.[0]?.contracts?.[0]?.id || "",
                  })
                }
              />
            )}
          </View>
        )}

      {userRole !== "shipper" && isEligiblePickJob && job.status === "active" && (!exists || job?.jobApplications?.find(
        (application) => application.applicantUserId === profileData?.id
      )?.status == 'withdrawn') && (
          <View style={styles.footer}>
            <View style={styles.buttonRow}>
              <Button
                title={t("buttons.pickjob")}
                variant="primary"
                fullWidth
                loading={loading}
                onPress={handleApplyForJob}
                style={styles.pickJobButton}
              />
              {(userRole === "carrier" || userRole === "broker") && (
                <Button
                  title={"Bid"}
                  variant="primary"
                  fullWidth
                  loading={loading}
                  onPress={handleOpenBidModal}
                  style={styles.pickJobButton}
                />
              )}
            </View>
          </View>
        )}

      {/* Note for driver to upload post-trip photos */}
      {job?.status !== "completed" &&
        hasPreTrip &&
        hasPod1 &&
        !hasPostTrip &&
        hasPod2 &&
        (isContractCompleted == false) &&
        job.contracts[0].hiredUserId == profileData.id && (
          <View style={styles.infoNoteContainer}>
            <Info size={20} color={Colors.warning} />
            <Text style={styles.infoNoteText}>
              {t("jobs.uploadPostTripNote")}
            </Text>
          </View>
        )}

      {/* Complete Job Button - Only show if no parentJobId and all inspections are done */}
      {job?.status !== "completed" &&
        hasPreTrip &&
        hasPod1 &&
        hasPostTrip &&
        hasPod2 &&
        (isContractCompleted == false) &&
        job.userId == profileData.id
        && (
          <View style={styles.footer}>
            <Button
              title="Complete Job & Release Payment"
              variant="primary"
              fullWidth
              loading={completingContract}
              onPress={handleCompleteContract}
            />
          </View>
        )}

      {/* Rate & Review Button - Show after contract is completed and user hasn't rated */}
      {(isContractCompleted || job?.status == "completed") && !hasUserRated && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.rateButton}
            onPress={() => {
              // Find the other party to rate (driver if user is merchant/broker/carrier, or merchant if user is driver)
              const contract = job?.jobApplications?.[0]?.contracts?.[0];
              const participants = contract?.contractParticipants || [];

              // If user is the job creator, rate the driver
              let userToRate = null;
              if (job.userId === profileData.id) {
                // Job creator - rate the driver
                const driver = participants.find(p => p.role === "driver");
                userToRate = driver?.userId;
                console.log('⭐ JobDetails: Job creator rating driver:', { driver, userToRate });
              } else {
                // Worker - rate the job creator
                userToRate = job.userId;
                console.log('⭐ JobDetails: Worker rating job creator:', { jobUserId: job.userId, userToRate });
              }

              console.log('⭐ JobDetails: Navigating to RatingScreen with:', {
                userId: userToRate,
                jobId: job.id,
                jobTitle: job.title,
                contractId: contract?.id
              });

              if (userToRate) {
                navigation.navigate(Routes.RatingScreen as never, {
                  userId: Number(userToRate), // Ensure it's a number
                  jobId: job.id,
                  jobTitle: job.title,
                  contractId: contract?.id || ""
                } as never);
              } else {
                console.error('⭐ JobDetails: userToRate is null/undefined');
                showMessage({
                  message: "Error",
                  description: "Unable to determine user to rate",
                  type: "danger",
                });
              }
            }}
          >
            <Star size={20} color={Colors.primary} />
            <Text style={styles.rateButtonText}>Rate & Review</Text>
          </TouchableOpacity>
        </View>
      )}



      {/* {((userRole === "driver" && job.assignedDriverId === userProfile?.id) ||
        (userRole === "merchant" && job.merchantId === userProfile?.id)) &&
        job.status !== "cancelled" &&
        job.status !== "completed" &&
        job.status !== "delivered" && (
          <View style={styles.footer}>
            <Button
              title={t("buttons.cancelJob")}
              variant="danger"
              fullWidth
              loading={loading}
              onPress={handleCancelJob}
            />
          </View>
        )} */}

      {renderBidModal()}

      {/* Image Modal */}
      <Modal
        visible={showImageModal}
        transparent
        animationType="fade"
        onRequestClose={closeImageModal}
      >
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity
            style={styles.imageModalCloseButton}
            onPress={closeImageModal}
          >
            <X size={24} color={Colors.white} />
          </TouchableOpacity>

          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.fullSizeImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

export { JobDetailScreen };
