import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius, shadows } from '../theme/colors';
import { useAuth } from '../contexts/AuthContext';
import {
  subscribeToPendingInvitations,
  subscribeToSentInvitations,
  acceptInvitation,
  rejectInvitation,
  cancelInvitation,
  getDatabaseMembers,
  removeMember,
  leaveSharedDatabase,
} from '../services/invitationService';
import InviteUserModal from '../components/InviteUserModal';

const InvitationsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [sentInvitations, setSentInvitations] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [processingInvite, setProcessingInvite] = useState(null);

  useEffect(() => {
    loadData();

    // Subscribe to invitations
    const unsubscribePending = subscribeToPendingInvitations((invites) => {
      setPendingInvitations(invites);
    });

    const unsubscribeSent = subscribeToSentInvitations((invites) => {
      setSentInvitations(invites);
    });

    return () => {
      unsubscribePending();
      unsubscribeSent();
    };
  }, []);

  const loadData = async () => {
    try {
      const membersData = await getDatabaseMembers();
      setMembers(membersData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleAcceptInvite = async (invitationId) => {
    setProcessingInvite(invitationId);
    try {
      const result = await acceptInvitation(invitationId);
      if (result.success) {
        Alert.alert('Success', 'You have joined the shared database!', [
          {
            text: 'OK',
            onPress: () => {
              loadData();
              // Navigate to home to see the shared data
              navigation.navigate('Home');
            },
          },
        ]);
      } else {
        Alert.alert('Error', result.error || 'Failed to accept invitation');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to accept invitation');
    } finally {
      setProcessingInvite(null);
    }
  };

  const handleRejectInvite = async (invitationId) => {
    Alert.alert(
      'Reject Invitation',
      'Are you sure you want to reject this invitation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setProcessingInvite(invitationId);
            try {
              const result = await rejectInvitation(invitationId);
              if (result.success) {
                Alert.alert('Success', 'Invitation rejected');
              } else {
                Alert.alert('Error', result.error || 'Failed to reject invitation');
              }
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to reject invitation');
            } finally {
              setProcessingInvite(null);
            }
          },
        },
      ]
    );
  };

  const handleCancelInvite = async (invitationId) => {
    Alert.alert(
      'Cancel Invitation',
      'Are you sure you want to cancel this invitation?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              const result = await cancelInvitation(invitationId);
              if (result.success) {
                Alert.alert('Success', 'Invitation cancelled');
              } else {
                Alert.alert('Error', result.error || 'Failed to cancel invitation');
              }
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to cancel invitation');
            }
          },
        },
      ]
    );
  };

  const handleRemoveMember = async (memberId, memberName) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from the shared database?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await removeMember(memberId);
              if (result.success) {
                Alert.alert('Success', 'Member removed');
                loadData();
              } else {
                Alert.alert('Error', result.error || 'Failed to remove member');
              }
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to remove member');
            }
          },
        },
      ]
    );
  };

  const handleLeaveDatabase = async () => {
    Alert.alert(
      'Leave Shared Database',
      'Are you sure you want to leave this shared database? You will no longer have access to the shared data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await leaveSharedDatabase();
              if (result.success) {
                Alert.alert('Success', 'You have left the shared database', [
                  {
                    text: 'OK',
                    onPress: () => {
                      loadData();
                      navigation.navigate('Home');
                    },
                  },
                ]);
              } else {
                Alert.alert('Error', result.error || 'Failed to leave database');
              }
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to leave database');
            }
          },
        },
      ]
    );
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderPendingInvitation = (invitation) => {
    const isProcessing = processingInvite === invitation.id;

    return (
      <View key={invitation.id} style={styles.invitationCard}>
        <View style={styles.invitationHeader}>
          <LinearGradient
            colors={colors.primaryGradient}
            style={styles.invitationIcon}
          >
            <Ionicons name="mail" size={20} color={colors.text.primary} />
          </LinearGradient>
          <View style={styles.invitationInfo}>
            <Text style={styles.invitationTitle}>
              From {invitation.inviterName}
            </Text>
            <Text style={styles.invitationSubtitle}>
              {invitation.inviterEmail}
            </Text>
            <Text style={styles.invitationDate}>
              Sent {formatDate(invitation.createdAt)}
            </Text>
          </View>
        </View>

        <View style={styles.invitationActions}>
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={() => handleRejectInvite(invitation.id)}
            disabled={isProcessing}
          >
            <Ionicons name="close-circle" size={18} color={colors.error} />
            <Text style={styles.rejectButtonText}>Reject</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleAcceptInvite(invitation.id)}
            disabled={isProcessing}
            style={styles.acceptButtonWrapper}
          >
            <LinearGradient
              colors={colors.incomeGradient}
              style={styles.acceptButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isProcessing ? (
                <ActivityIndicator color={colors.text.primary} size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color={colors.text.primary} />
                  <Text style={styles.acceptButtonText}>Accept</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSentInvitation = (invitation) => {
    const statusColors = {
      pending: colors.warning,
      accepted: colors.success,
      rejected: colors.error,
      cancelled: colors.text.tertiary,
      expired: colors.text.tertiary,
    };

    const statusIcons = {
      pending: 'time',
      accepted: 'checkmark-circle',
      rejected: 'close-circle',
      cancelled: 'ban',
      expired: 'hourglass',
    };

    return (
      <View key={invitation.id} style={styles.sentCard}>
        <View style={styles.sentHeader}>
          <View style={styles.sentInfo}>
            <Text style={styles.sentTitle}>
              {invitation.inviteeName || invitation.inviteeEmail}
            </Text>
            <Text style={styles.sentSubtitle}>{invitation.inviteeEmail}</Text>
            <View style={styles.sentMeta}>
              <Ionicons
                name={statusIcons[invitation.status]}
                size={14}
                color={statusColors[invitation.status]}
              />
              <Text style={[styles.sentStatus, { color: statusColors[invitation.status] }]}>
                {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
              </Text>
              <Text style={styles.sentDate}>• {formatDate(invitation.createdAt)}</Text>
            </View>
          </View>

          {invitation.status === 'pending' && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleCancelInvite(invitation.id)}
            >
              <Ionicons name="close" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderMember = (member) => {
    const isCurrentUser = member.id === user.uid;
    const isOwner = member.isOwner;

    return (
      <View key={member.id} style={styles.memberCard}>
        <View style={styles.memberHeader}>
          <View style={styles.memberAvatar}>
            <Ionicons name="person" size={20} color={colors.primary} />
          </View>
          <View style={styles.memberInfo}>
            <View style={styles.memberNameRow}>
              <Text style={styles.memberName}>
                {member.displayName}
                {isCurrentUser && <Text style={styles.youTag}> (You)</Text>}
              </Text>
              {isOwner && (
                <View style={styles.ownerBadge}>
                  <Text style={styles.ownerBadgeText}>Owner</Text>
                </View>
              )}
            </View>
            <Text style={styles.memberEmail}>{member.email}</Text>
          </View>

          {!isCurrentUser && !isOwner && (
            <TouchableOpacity
              style={styles.removeMemberButton}
              onPress={() => handleRemoveMember(member.id, member.displayName)}
            >
              <Ionicons name="remove-circle-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading invitations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentUserMember = members.find((m) => m.id === user.uid);
  const isInSharedDatabase = members.length > 0;
  const isOwner = currentUserMember?.isOwner;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Invitations & Sharing</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Invite Button */}
        <TouchableOpacity
          onPress={() => setInviteModalVisible(true)}
          style={styles.inviteButtonWrapper}
        >
          <LinearGradient
            colors={colors.primaryGradient}
            style={styles.inviteButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="person-add" size={20} color={colors.text.primary} />
            <Text style={styles.inviteButtonText}>Invite User</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Pending Invitations */}
        {pendingInvitations.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="mail-unread" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Pending Invitations</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingInvitations.length}</Text>
              </View>
            </View>
            {pendingInvitations.map(renderPendingInvitation)}
          </View>
        )}

        {/* Database Members */}
        {isInSharedDatabase && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="people" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Database Members</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{members.length}</Text>
              </View>
            </View>
            {members.map(renderMember)}

            {!isOwner && (
              <TouchableOpacity
                style={styles.leaveButton}
                onPress={handleLeaveDatabase}
              >
                <Ionicons name="exit-outline" size={18} color={colors.error} />
                <Text style={styles.leaveButtonText}>Leave Shared Database</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Sent Invitations */}
        {sentInvitations.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="send" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Sent Invitations</Text>
            </View>
            {sentInvitations.map(renderSentInvitation)}
          </View>
        )}

        {/* Empty State */}
        {pendingInvitations.length === 0 &&
          sentInvitations.length === 0 &&
          !isInSharedDatabase && (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color={colors.text.tertiary} />
              <Text style={styles.emptyTitle}>No Collaborators Yet</Text>
              <Text style={styles.emptyText}>
                Invite others to share your expense database and Google Sheets
              </Text>
            </View>
          )}
      </ScrollView>

      <InviteUserModal
        visible={inviteModalVisible}
        onClose={() => setInviteModalVisible(false)}
        onSuccess={loadData}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.h2,
  },
  inviteButtonWrapper: {
    marginBottom: spacing.lg,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    ...shadows.md,
  },
  inviteButtonText: {
    ...typography.body,
    fontWeight: '600',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    fontSize: 18,
  },
  badge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    ...typography.small,
    color: colors.background,
    fontWeight: '600',
  },
  invitationCard: {
    backgroundColor: colors.glass.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  invitationHeader: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  invitationIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  invitationInfo: {
    flex: 1,
  },
  invitationTitle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: 4,
  },
  invitationSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  invitationDate: {
    ...typography.small,
    color: colors.text.tertiary,
  },
  invitationActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(255, 77, 77, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 77, 0.3)',
    gap: spacing.xs,
  },
  rejectButtonText: {
    ...typography.body,
    color: colors.error,
    fontWeight: '600',
  },
  acceptButtonWrapper: {
    flex: 1,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
  },
  acceptButtonText: {
    ...typography.body,
    fontWeight: '600',
  },
  sentCard: {
    backgroundColor: colors.glass.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.glass.borderLight,
  },
  sentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sentInfo: {
    flex: 1,
  },
  sentTitle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: 4,
  },
  sentSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: 6,
  },
  sentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sentStatus: {
    ...typography.small,
    fontWeight: '600',
  },
  sentDate: {
    ...typography.small,
    color: colors.text.tertiary,
  },
  cancelButton: {
    padding: spacing.xs,
  },
  memberCard: {
    backgroundColor: colors.glass.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.glass.borderLight,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    borderWidth: 1,
    borderColor: colors.glass.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: spacing.sm,
  },
  memberName: {
    ...typography.body,
    fontWeight: '600',
  },
  youTag: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  ownerBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  ownerBadgeText: {
    ...typography.small,
    color: colors.background,
    fontWeight: '600',
    fontSize: 10,
  },
  memberEmail: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  removeMemberButton: {
    padding: spacing.xs,
  },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 77, 77, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 77, 0.3)',
    gap: spacing.sm,
  },
  leaveButtonText: {
    ...typography.body,
    color: colors.error,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyTitle: {
    ...typography.h3,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.bodySecondary,
    textAlign: 'center',
    maxWidth: 300,
  },
});

export default InvitationsScreen;
