/**
 * Rating & Reviews Screen
 * @format
 */

import React, { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
} from "react-native";
import { Star, User, Calendar, X, Send } from "lucide-react-native";
import { Colors, useThemedStyle } from "@app/styles";
import { getStyles } from "./ratingStyles";
import Header from "@app/components/Header";
import { useSelector } from "react-redux";
import { selectProfile } from "@app/module/common";
import { showMessage } from "react-native-flash-message";
import moment from "moment";
import { httpRequest, endPoints } from "@app/service";
import { RatingScreenSkeleton } from "@app/components/SkeletonLoader";
import { useTranslation } from "react-i18next";

interface Review {
  id: number;
  rating: number;
  comment: string;
  reviewerName: string;
  reviewerImage?: string;
  createdAt: string;
  jobTitle?: string;
}

interface RatingStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export default function RatingScreen({ route, navigation }: any) {
  const { t } = useTranslation();
  const styles = useThemedStyle(getStyles);
  const userProfile = useSelector(selectProfile);
  const { userId, jobId, jobTitle, contractId } = route?.params || {};
  const targetUserId = userId || userProfile?.id;
  const isOwnProfile = !userId || userId === userProfile?.id;

  console.log('RatingScreen params:', { userId, jobId, jobTitle, contractId, targetUserId, userProfileId: userProfile?.id });

  const [reviews, setReviews] = useState<Review[]>([]);
  const [ratingStats, setRatingStats] = useState<RatingStats>({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchRatings = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get fresh route params in case they changed
      const currentUserId = route?.params?.userId;
      const finalUserId = currentUserId ?? userId ?? userProfile?.id ?? null;
      
      console.log('⭐ RatingScreen: fetchRatings called with route userId:', currentUserId, 'userId param:', userId, 'finalUserId:', finalUserId);
      
      if (!finalUserId) {
        console.error("No target user ID provided");
        setLoading(false);
        return;
      }

      // Ensure userId is a number
      const userIdNumber = Number(finalUserId);
      if (Number.isNaN(userIdNumber) || userIdNumber <= 0) {
        console.error("Invalid user ID:", finalUserId);
        setLoading(false);
        return;
      }
      
      console.log('⭐ RatingScreen: Fetching ratings for userId:', userIdNumber);
      console.log('⭐ RatingScreen: API endpoint:', endPoints.getUserRatings(userIdNumber));

      const response: any = await httpRequest.get(endPoints.getUserRatings(userIdNumber));
      
      console.log('⭐ RatingScreen: API response:', response);
      
      if (response?.success && response?.data) {
        const apiReviews = response.data.reviews || [];
        const summary = response.data.summary || { average: 0, count: 0 };

        // Map API reviews to Review interface
        const mappedReviews: Review[] = apiReviews.map((review: any) => ({
          id: review.id,
          rating: review.stars,
          comment: review.comment || "",
          reviewerName: `User ${review.raterUserId}`, // Placeholder - can be enhanced to fetch actual user name
          createdAt: review.createdAt,
          jobTitle: undefined, // API doesn't provide job title in review
        }));

        // Calculate rating distribution
        const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        for (const review of apiReviews) {
          const stars = review.stars;
          if (stars >= 1 && stars <= 5) {
            distribution[stars as keyof typeof distribution]++;
          }
        }

        const stats: RatingStats = {
          averageRating: summary.average || 0,
          totalReviews: summary.count || 0,
          ratingDistribution: distribution,
        };

        setReviews(mappedReviews);
        setRatingStats(stats);
      } else {
        // No reviews found or empty response
        setReviews([]);
        setRatingStats({
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        });
      }
    } catch (error: any) {
      console.error("Error fetching ratings:", error);
      showMessage({
        message: t("common.failedToLoadRatings") || "Failed to load ratings",
        description: error?.response?.data?.message || error?.message || t("common.pleaseTryAgain") || "Please try again",
        type: "danger",
      });
      // Set empty state on error
      setReviews([]);
      setRatingStats({
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      });
    } finally {
      setLoading(false);
    }
  }, [route, userId, userProfile?.id]);

  // Refetch ratings when screen comes into focus (e.g., when navigating from job details)
  useFocusEffect(
    useCallback(() => {
      // Always get fresh route params when screen comes into focus
      const freshUserId = route?.params?.userId;
      const freshTargetUserId = freshUserId ?? userProfile?.id;
      console.log('⭐ RatingScreen: Screen focused, route params:', route?.params);
      console.log('⭐ RatingScreen: Fresh userId:', freshUserId, 'freshTargetUserId:', freshTargetUserId);
      
      // Only fetch if we have a valid userId
      if (freshTargetUserId) {
        fetchRatings();
      } else {
        console.warn('⭐ RatingScreen: No valid userId found, cannot fetch ratings');
      }
    }, [route?.params, userProfile?.id, fetchRatings])
  );

  // Also watch for route param changes directly
  React.useEffect(() => {
    const routeUserId = route?.params?.userId;
    console.log('⭐ RatingScreen: Route params changed, userId:', routeUserId);
    if (routeUserId) {
      fetchRatings();
    }
  }, [route?.params?.userId, fetchRatings]);

  const handleSubmitReview = async () => {
    if (newRating === 0) {
      showMessage({
        message: t("common.pleaseSelectRating") || "Please select a rating",
        type: "warning",
      });
      return;
    }

    if (newComment.trim().length < 10) {
      showMessage({
        message: t("common.pleaseWriteReview") || "Please write a review (at least 10 characters)",
        type: "warning",
      });
      return;
    }

    if (!contractId) {
      showMessage({
        message: "Contract ID is missing",
        type: "danger",
      });
      return;
    }

    if (!targetUserId) {
      showMessage({
        message: "User ID is missing",
        type: "danger",
      });
      return;
    }

    try {
      setSubmitting(true);
      
      console.log('Submitting rating:', {
        contractId,
        rateeUserId: targetUserId,
        stars: newRating,
        comment: newComment.trim()
      });

      // API call to submit review
      const response = await httpRequest.post(
        endPoints.rateContract(contractId),
        {
          rateeUserId: targetUserId,
          stars: newRating,
          comment: newComment.trim(),
        }
      );

      console.log('Rating response:', response);

      showMessage({
        message: "Review submitted successfully!",
        description: "Thank you for your feedback",
        type: "success",
        duration: 3000,
      });

      setShowReviewModal(false);
      setNewRating(0);
      setNewComment("");
      
      // Navigate back after successful submission
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
      
      // Optionally refresh ratings
      // fetchRatings();
    } catch (error) {
      console.error("Error submitting review:", error);
      showMessage({
        message: "Failed to submit review",
        description: error?.response?.data?.message || "Please try again",
        type: "danger",
        duration: 3000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, size: number = 20, interactive: boolean = false) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            disabled={!interactive}
            onPress={() => interactive && setNewRating(star)}
            activeOpacity={interactive ? 0.7 : 1}
          >
            <Star
              size={size}
              color={star <= rating ? Colors.warning : Colors.gray400}
              fill={star <= rating ? Colors.warning : "transparent"}
              style={styles.starIcon}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderRatingBar = (stars: number, count: number, total: number) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;

    return (
      <View style={styles.ratingBarContainer}>
        <Text style={styles.ratingBarLabel}>{stars} ★</Text>
        <View style={styles.ratingBarTrack}>
          <View
            style={[
              styles.ratingBarFill,
              { width: `${percentage}%` },
            ]}
          />
        </View>
        <Text style={styles.ratingBarCount}>{count}</Text>
      </View>
    );
  };

  const renderReviewModal = () => {
    return (
      <Modal
        visible={showReviewModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Write a Review</Text>
                {jobTitle && <Text style={styles.modalSubtitle}>For: {jobTitle}</Text>}
              </View>
              <TouchableOpacity
                onPress={() => setShowReviewModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.ratingLabel}>Your Rating</Text>
              {renderStars(newRating, 32, true)}

              <Text style={styles.commentLabel}>Your Review</Text>
              <TextInput
                style={styles.commentInput}
                placeholder="Share your experience..."
                placeholderTextColor={Colors.textSecondary}
                value={newComment}
                onChangeText={setNewComment}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  submitting && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmitReview}
                disabled={submitting}
              >
                <Send size={20} color={Colors.white} />
                <Text style={styles.submitButtonText}>
                  {submitting ? "Submitting..." : "Submit Review"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Ratings & Reviews" />
        <RatingScreenSkeleton />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Ratings & Reviews" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Rating Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.averageRatingSection}>
            <Text style={styles.averageRatingNumber}>
              {ratingStats.averageRating.toFixed(1)}
            </Text>
            {renderStars(Math.round(ratingStats.averageRating), 24)}
            <Text style={styles.totalReviewsText}>
              Based on {ratingStats.totalReviews} review{ratingStats.totalReviews === 1 ? '' : 's'}
            </Text>
          </View>

          <View style={styles.distributionSection}>
            {[5, 4, 3, 2, 1].map((stars) =>
              renderRatingBar(
                stars,
                ratingStats.ratingDistribution[stars as keyof typeof ratingStats.ratingDistribution],
                ratingStats.totalReviews
              )
            )}
          </View>
        </View>

        {/* Write Review Button (only show if viewing someone else's profile) */}
        {!isOwnProfile && (
          <TouchableOpacity
            style={styles.writeReviewButton}
            onPress={() => setShowReviewModal(true)}
          >
            <Star size={20} color={Colors.white} />
            <Text style={styles.writeReviewButtonText}>Write a Review</Text>
          </TouchableOpacity>
        )}

        {/* Reviews List */}
        <View style={styles.reviewsSection}>
          <Text style={styles.sectionTitle}>Reviews</Text>

          {reviews.length === 0 ? (
            <View style={styles.emptyState}>
              <Star size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyStateText}>No reviews yet</Text>
            </View>
          ) : (
            reviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewerInfo}>
                    {review.reviewerImage ? (
                      <Image
                        source={{ uri: review.reviewerImage }}
                        style={styles.reviewerAvatar}
                      />
                    ) : (
                      <View style={styles.reviewerAvatarPlaceholder}>
                        <User size={20} color={Colors.white} />
                      </View>
                    )}
                    <View style={styles.reviewerDetails}>
                      <Text style={styles.reviewerName}>{review.reviewerName}</Text>
                      <View style={styles.reviewMetadata}>
                        <Calendar size={12} color={Colors.textSecondary} />
                        <Text style={styles.reviewDate}>
                          {moment(review.createdAt).format("MMM DD, YYYY")}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {renderStars(review.rating, 16)}
                </View>

                {!!review.jobTitle && (
                  <Text style={styles.jobTitle}>Job: {review.jobTitle}</Text>
                )}

                <Text style={styles.reviewComment}>{review.comment}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {renderReviewModal()}
    </View>
  );
}

