/**
 * Driver Assignment Screen
 * @format
 */

import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Delete, RefreshCw, UserCheck } from "lucide-react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";

import { Colors, useThemedStyle } from "@app/styles";
import { getStyles } from "./driverAssignmentStyles";
import Header from "@app/components/Header";
import { Routes } from "@app/navigator/constants";
import { selectCurrentJob } from "@app/module/common/selectors";
import { fetchJobById } from "@app/module/jobs/slice";
import { removeDriver } from "@app/module/drivers";
import { RemoveDriverModal } from "@app/components/RemoveDriverModal";

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  rating: number;
  vehicleType: string;
  location: string;
  profileImage?: string;
  isAvailable: boolean;
}

interface ContractParticipant {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  role: string;
  status: string;
  assignedAt: string;
  profileImage?: string;
  user?: {
    userName: string;
    email: string;
    phoneCountryCode: string;
    phoneNumber: string;
  };
}

interface RouteParams {
  jobId: string;
  jobTitle?: string;
  currentDriver?: Driver;
  contractId: string;
}

function DriverAssignmentScreen() {
  const styles = useThemedStyle(getStyles);
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();

  const {
    jobId,
    jobTitle = "Food Distribution Run",
    contractId,
  } = route.params as RouteParams;
  const job = useSelector(selectCurrentJob);

  const [loading] = useState(false);
  const [assignedDrivers, setAssignedDrivers] = useState<ContractParticipant[]>(
    []
  );
console.log("assignedDrivers", assignedDrivers);
  // Remove driver modal state
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedDriverForRemoval, setSelectedDriverForRemoval] =
    useState<ContractParticipant | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  useEffect(() => {
    // Fetch job data when screen loads
    if (jobId) {
      dispatch(fetchJobById({ id: jobId }));
    }
  }, [dispatch, jobId]);

  useEffect(() => {
    // Extract assigned drivers from job data
    if (job?.jobApplications?.[0]?.contracts?.[0]?.contractParticipants) {
      const participants =
        job.jobApplications[0].contracts[0].contractParticipants;
      const driverParticipants = participants.filter(
        (p) => p.role === "driver"
      );
      setAssignedDrivers(driverParticipants);
    }
  }, [job]);

  const handleChangeDriverForDriver = (currentDriver: ContractParticipant) => {
    console.log("Change driver clicked for:", currentDriver);
    console.log("Navigating to DriverListingScreen with jobId:", jobId);
    console.log("Routes.DriverListingScreen:", Routes.DriverListingScreen);
    (navigation as any).navigate(Routes.DriverListingScreen, {
      jobId,
      contractId,
      currentDriverId: currentDriver.id,
      currentDriver: currentDriver,
      onDriverSelect: (newDriver: Driver) => {
        console.log("Driver selected for change:", newDriver);
        // This callback is now handled in the driver listing screen
      },
    });
  };

  const handleRemoveDriver = (driver: ContractParticipant) => {
    console.log("Remove driver clicked for:", driver);
    setSelectedDriverForRemoval(driver);
    setShowRemoveModal(true);
  };

  const handleCloseRemoveModal = () => {
    setShowRemoveModal(false);
    setSelectedDriverForRemoval(null);
    setRemoveLoading(false);
  };

  const handleConfirmRemoveDriver = (reason: string) => {
    if (!selectedDriverForRemoval || !contractId) {
      console.error("Missing required data for driver removal");
      return;
    }

    setRemoveLoading(true);

    dispatch(
      removeDriver({
        contractId: contractId.toString(),
        driverId: selectedDriverForRemoval.userId,
        reason: reason,
        onSuccess: () => {
          console.log("Driver removal successful");
          setRemoveLoading(false);
          setShowRemoveModal(false);
          setSelectedDriverForRemoval(null);
          // Refresh the job data to get updated driver assignments
          if (jobId) {
            dispatch(fetchJobById({ id: jobId }));
          }
        },
        onError: (error: string) => {
          console.error("Driver removal failed:", error);
          setRemoveLoading(false);
        },
      })
    );
  };

  const handleAssignDriver = () => {
    // Navigate to driver listing to select a new driver
    (navigation as any).navigate(Routes.DriverListingScreen, {
      jobId,
      contractId,
    });
  };

  const renderAssignedDrivers = () => {
    if (assignedDrivers.length === 0) {
      return (
        <View style={styles.assignedDriversCard}>
          <Text style={styles.assignedDriversTitle}>Assigned Drivers</Text>
          <View style={styles.noDriverContainer}>
            <Text style={styles.noDriverText}>No drivers assigned</Text>
            <Text style={styles.noDriverSubtext}>
              Assign drivers to this job
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.assignedDriversCard}>
        <Text style={styles.assignedDriversTitle}>
          Assigned Drivers ({assignedDrivers.length})
        </Text>

        {assignedDrivers.map((driver, index) => (
          <View key={driver.id || index} style={styles.driverItem}>
            <View style={styles.driverItemContent}>
              <View style={styles.driverProfileContainer}>
                <View style={styles.driverAvatar}>
                  <Text style={styles.driverInitial}>
                    {driver?.user?.userName?.charAt(0).toUpperCase() || "D"}
                  </Text>
                </View>

                <View style={styles.driverDetails}>
                  <Text style={styles.driverName}>
                    {driver?.user?.userName || "Unknown Driver"}
                  </Text>
                  <Text style={styles.driverEmail}>{driver?.user?.email}</Text>
                  <Text style={styles.driverPhone}>
                    {driver?.user?.phoneCountryCode}
                    {driver?.user?.phoneNumber}
                  </Text>
                  <Text style={styles.assignmentDate}>
                    Assigned: {new Date(driver.joinedAt).toLocaleDateString()}
                  </Text>
                </View>

                <View style={styles.statusContainer}>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          driver.status === "active"
                            ? Colors.success + "20"
                            : Colors.warning + "20",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            driver.status === "active"
                              ? Colors.success
                              : Colors.warning,
                        },
                      ]}
                    >
                      {driver.status?.charAt(0).toUpperCase() +
                        driver.status?.slice(1) || "Unknown"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            {driver.status !== "removed" && (
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  style={styles.removeDriverButton}
                  onPress={() => handleRemoveDriver(driver)}
                >
                  <Delete size={16} color={Colors.white} />
                  <Text style={styles.removeDriverText}>Remove Driver</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.changeDriverButton}
                  onPress={() => handleChangeDriverForDriver(driver)}
                >
                  <RefreshCw size={16} color={Colors.white} />
                  <Text style={styles.changeDriverText}>Change Driver</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Driver Assignment" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Job Title */}
        <View style={styles.jobTitleContainer}>
          <Text style={styles.jobTitle}>{jobTitle}</Text>
        </View>

        {/* Assigned Drivers List */}
        {renderAssignedDrivers()}

        {/* Main Content Area - Job Details */}
        {/* <View style={styles.mainContentArea}>
          <View style={styles.jobDetailsCard}>
            <Text style={styles.jobDetailsTitle}>Job Details</Text>

            <View style={styles.jobInfoRow}>
              <Text style={styles.jobInfoLabel}>Pickup Location:</Text>
              <Text style={styles.jobInfoValue}>123 Main Street, Downtown</Text>
            </View>

            <View style={styles.jobInfoRow}>
              <Text style={styles.jobInfoLabel}>Delivery Location:</Text>
              <Text style={styles.jobInfoValue}>456 Oak Avenue, Uptown</Text>
            </View>

            <View style={styles.jobInfoRow}>
              <Text style={styles.jobInfoLabel}>Estimated Distance:</Text>
              <Text style={styles.jobInfoValue}>15.2 miles</Text>
            </View>

            <View style={styles.jobInfoRow}>
              <Text style={styles.jobInfoLabel}>Required Vehicle:</Text>
              <Text style={styles.jobInfoValue}>Large Truck</Text>
            </View>

            <View style={styles.jobInfoRow}>
              <Text style={styles.jobInfoLabel}>Payment:</Text>
              <Text style={styles.jobInfoValue}>$150.00</Text>
            </View>
          </View>
        </View> */}
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={styles.bottomActions}>
        {/* <TouchableOpacity
          style={styles.inviteDriverButton}
          onPress={handleInviteDriver}
        >
          <UserPlus size={20} color={Colors.white} />
          <Text style={styles.inviteDriverText}>Invite Driver</Text>
        </TouchableOpacity> */}

        {assignedDrivers.length < 2 && (
          <TouchableOpacity
            style={styles.assignDriverButton}
            onPress={handleAssignDriver}
            disabled={loading}
          >
            <UserCheck size={20} color={Colors.white} />
            <Text style={styles.inviteDriverText}>Invite Driver</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Remove Driver Modal */}
      <RemoveDriverModal
        visible={showRemoveModal}
        onClose={handleCloseRemoveModal}
        onConfirm={handleConfirmRemoveDriver}
        driverName={
          selectedDriverForRemoval?.user?.userName ||
          selectedDriverForRemoval?.userName ||
          "Unknown Driver"
        }
        loading={removeLoading}
      />
    </View>
  );
}

export default DriverAssignmentScreen;
