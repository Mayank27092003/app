/**
 * Home Styles
 * @format
 */

import { Colors, ITheme, ScaledSheet, Typography } from '@app/styles';
import { Platform } from 'react-native';

export const getStyles = (theme: ITheme) =>
  ScaledSheet.create({container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop:'20@ms'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: '20@ms',
    paddingBottom: 10,
    
  },
  greeting: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
  },
  userRole: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    maxWidth:'90%'
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    // margin:20
  },
  avatarPlaceholder: {
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: '100@ms',
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundLight,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchPlaceholder: {
    marginLeft: 8,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  filterButton: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: 8,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
        backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIconContaineNew: {
    width: "45@ms",
    height: "45@ms",
    borderRadius:"25@ms",
    justifyContent: 'center',
    alignItems: 'center',
    // marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textSecondary,
    marginTop: 20,
  },
actionButtons: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 20,
},

primaryActionButton: {
  flex: 1,
  backgroundColor: Colors.primary,
  flexDirection: 'row',
  justifyContent: 'center',
  borderRadius: 8,
  paddingVertical: 14,
  alignItems: 'center',
  marginHorizontal: 5,
},
  primaryActionButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
  },

secondaryActionButton: {
  flex: 1,
  backgroundColor: 'transparent',
  borderRadius: 8,
  paddingVertical: 14,
  alignItems: 'center',
  borderWidth: 1,
  borderColor: Colors.primary,
  marginHorizontal: 5,
},
  secondaryActionButtonText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  quickActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop:15
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 4,
  },
  quickActionDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
pickJobButton: {
  flex: 1,
  backgroundColor: Colors.statusDelivered,
  borderRadius: 8,
  paddingVertical: 14,
  alignItems: 'center',
  borderWidth: 1,
  borderColor: Colors.statusDelivered,
  marginHorizontal: 5,
},
  pickActionButtonText: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  jobInvitationsTile: {
    backgroundColor: Colors.primary,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
  },
  jobInvitationsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  jobInvitationsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  jobInvitationsIconContainer: {
    position: 'relative',
    marginRight: 12,
  },
  jobInvitationsBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: Colors.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  jobInvitationsBadgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  jobInvitationsTextContainer: {
    flex: 1,
  },
  jobInvitationsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 2,
  },
  jobInvitationsSubtitle: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.8,
  },
  });
