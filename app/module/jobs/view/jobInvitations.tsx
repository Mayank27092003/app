/**
 * Job Invitations Screen
 * @format
 */

import React, { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  ArrowLeft,
  DollarSign,
  Truck,
  MapPin,
  Clock,
  Users,
  CheckCircle,
  XCircle,
} from "lucide-react-native";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";

import { Colors, useThemedStyle } from "@app/styles";
import { getStyles } from "./jobInvitationsStyles";
import Header from "@app/components/Header";
import { 
  fetchContractInvitations, 
  acceptInvitationRequest, 
  declineInvitationRequest,
  ContractInvitation 
} from "@app/module/contract-invitations";
import { useNavigation } from "@react-navigation/native";
import moment from "moment";

function JobInvitationsScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyle(getStyles);
  const dispatch = useDispatch();
  const navigation = useNavigation();

  // Get contract invitations from Redux state
  const contractInvitationsState = useSelector((state: any) => state.contractInvitationsReducer);
  const invitations: ContractInvitation[] = contractInvitationsState?.invitations || [];
  const loading = contractInvitationsState?.loading || false;

  // Fetch invitations when component mounts
  useEffect(() => {
    dispatch(fetchContractInvitations());
  }, [dispatch]);

  const handleAcceptInvitation = (invitationId: string, contractId: string) => {
    Alert.alert(
      t("common.acceptInvitation") || "Accept Invitation",
      t("common.acceptInvitationConfirm") || "Are you sure you want to accept this job invitation?",
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.accept"),
          onPress: () => {
            dispatch(acceptInvitationRequest({ 
              invitationId, 
              contractId,
              onSuccess: () => {
                navigation.goBack();
                console.log('Invitation accepted successfully');
              },
              onError: (error: string) => {
                console.error('Failed to accept invitation:', error);
              }
            }));
          }
        }
      ]
    );
  };

  const handleDeclineInvitation = (invitationId: string, contractId: string) => {
    Alert.alert(
      t("common.declineInvitation") || "Decline Invitation",
      t("common.declineInvitationConfirm") || "Are you sure you want to decline this job invitation?",
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.decline") || "Decline",
          style: "destructive",
          onPress: () => {
            dispatch(declineInvitationRequest({ 
              invitationId, 
              contractId,
              onSuccess: () => {
                navigation.goBack();

                console.log('Invitation declined successfully');
              },
              onError: (error: string) => {
                console.error('Failed to decline invitation:', error);
              }
            }));
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return Colors.warning;
      case 'accepted':
        return Colors.success;
      case 'declined':
        return Colors.error;
      case 'expired':
        return Colors.error;
      default:
        return Colors.gray500;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'accepted':
        return 'Accepted';
      case 'declined':
        return 'Declined';
      case 'expired':
        return 'Expired';
      default:
        return 'Unknown';
    }
  };

  const renderInvitationCard = (invitation: ContractInvitation) => (
    <View key={invitation.id} style={styles.invitationCard}>
      {/* Header with company info and status */}
      <View style={styles.cardHeader}>
        <View style={styles.companyInfo}>
          <View style={styles.companyLogo}>
            <Users size={24} color={Colors.white} />
          </View>
          <View style={styles.companyDetails}>
            <Text style={styles.companyName}>{invitation.companyName}</Text>
            <Text style={styles.invitationText}>invited you to a job</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(invitation.status) }]}>
          <Text style={styles.statusText}>{getStatusText(invitation.status)}</Text>
        </View>
      </View>

      {/* Job details */}
      <View style={styles.jobDetails}>
        <Text style={styles.jobTitle}>{invitation.jobTitle}</Text>
        <Text style={styles.jobDescription}>{invitation.description}</Text>
        <Text style={styles.jobDescription}>Jobid - {invitation.jobId}</Text>

        {/* Pay and vehicle type */}
        <View style={styles.jobInfoRow}>
          <View style={styles.jobInfoItem}>
            <DollarSign size={16} color={Colors.success} />
            <Text style={styles.jobInfoText}>${invitation.payAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.jobInfoItem}>
            <Truck size={16} color={Colors.primary} />
            <Text style={styles.jobInfoText}>{invitation.vehicleType}</Text>
          </View>
        </View>

        {/* Route */}
        <View style={styles.routeContainer}>
          <View style={styles.routeItem}>
            <MapPin size={16} color={Colors.primary} />
            <Text style={styles.routeText}>{invitation.pickupLocation}</Text>
          </View>
          <ArrowLeft size={16} color={Colors.gray400} style={styles.routeArrow} />
          <View style={styles.routeItem}>
            <MapPin size={16} color={Colors.primary} />
            <Text style={styles.routeText}>{invitation.dropoffLocation}</Text>
          </View>
        </View>

        {/* Message */}
        <View style={styles.messageContainer}>
          <Text style={styles.messageLabel}>Message:</Text>
          <Text style={styles.messageText}>{invitation.message}</Text>
        </View>

        {/* Dates */}
        <View style={styles.datesContainer}>
          <View style={styles.dateItem}>
            <Clock size={16} color={Colors.gray400} />
            <Text style={styles.dateText}>Invited {moment(invitation.invitedDate).format('DD-MM-YYYY hh:mm A')}</Text>
          </View>
          <View style={styles.dateItem}>
            <Clock size={16} color={Colors.warning} />
            <Text style={[styles.dateText, { color: Colors.warning }]}>
            Expires {moment(invitation.expiresDate).format('DD-MM-YYYY hh:mm A')}
              {/* Expires {new Date(invitation.expiresDate).toLocaleDateString()} */}
            </Text>
          </View>
        </View>
      </View>

      {/* Action buttons */}
      {invitation.status === 'pending' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.declineButton]}
            onPress={() => handleDeclineInvitation(invitation.id, invitation.contractId)}
          >
            <XCircle size={20} color={Colors.white} />
            <Text style={styles.declineButtonText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => handleAcceptInvitation(invitation.id, invitation.contractId)}
          >
            <CheckCircle size={20} color={Colors.white} />
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const pendingCount = invitations.filter(inv => inv.status === 'pending').length;

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Loading...</Text>
          <Text style={styles.emptyMessage}>
            Fetching your job invitations...
          </Text>
        </View>
      );
    }
    
    if (invitations.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Job Invitations</Text>
          <Text style={styles.emptyMessage}>
            You don't have any job invitations at the moment.
          </Text>
        </View>
      );
    }
    
    return invitations.map(renderInvitationCard);
  };

  return (
    <View style={styles.container}>
      <Header title="Job Invitations" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Job Invitations</Text>
        <Text style={styles.headerSubtitle}>
          {pendingCount} pending invitation{pendingCount !== 1 ? 's' : ''}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>
    </View>
  );
}

export { JobInvitationsScreen };
