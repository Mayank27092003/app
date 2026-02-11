import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
  Platform,
  Linking,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { launchCamera, launchImageLibrary, MediaType } from 'react-native-image-picker';
import { PermissionService } from '@app/service/permission-service';
import {
  Camera as CameraIcon,
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  RotateCcw,
} from 'lucide-react-native';

// App Imports
import { Colors } from '@app/styles';
import { useJobStore } from '@app/store/jobStore';
import { Button } from '@app/components/Button';
import { useThemedStyle } from '@app/styles';
import { getStyles } from './styles';
import { uploadFileToServer, createFileDataFromAsset } from '@app/utils';
import { useDispatch } from 'react-redux';

const VerificationCameraScreen = () => {
  const { t } = useTranslation();
  const styles = useThemedStyle(getStyles);
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const { jobId, type, contractId, onComplete, existingInspections } = route.params;

  // Map verification types to display names
  const getInspectionTypeName = (type: string) => {
    switch (type) {
      case 'pre_trip': return 'Pre-Trip Inspection';
      case 'proof_doc_1': return 'Proof of Document 1';
      case 'post_trip': return 'Post-Trip Inspection';
      case 'proof_doc_2': return 'Proof of Document 2';
      default: return 'Inspection';
    }
  };

  const { fetchJobById, updateJobStatus } = useJobStore();

  const [photos, setPhotos] = useState<string[]>([]);
  const [photoAssets, setPhotoAssets] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showImageSource, setShowImageSource] = useState(false);
  const [uploadedPhotoUrls, setUploadedPhotoUrls] = useState<string[]>([]);
  const [preInspectionComment, setPreInspectionComment] = useState('');
  const [pod1Comment, setPod1Comment] = useState('');
  const [postInspectionComment, setPostInspectionComment] = useState('');
  const [pod2Comment, setPod2Comment] = useState('');

  const job = jobId ? fetchJobById(jobId) : undefined;

  useEffect(() => {
    // Show image source options when component mounts
    setShowImageSource(true);
  }, []);

  // Load existing comments from inspection data
  useEffect(() => {
    if (existingInspections && existingInspections.length > 0) {
      console.log('Loading existing inspection comments:', existingInspections);

      // Process all inspection records to find all comments
      existingInspections.forEach((inspection: any, index: number) => {
        console.log(`Processing inspection ${index}:`, {
          type: inspection.type,
          data: inspection.data
        });

        if (inspection.data) {
          // Load comments from each inspection record
          if (inspection.data.preInspectionComment) {
            console.log('Loading preInspectionComment:', inspection.data.preInspectionComment);
            setPreInspectionComment(inspection.data.preInspectionComment);
          }
          if (inspection.data.pod1Comment) {
            console.log('Loading pod1Comment:', inspection.data.pod1Comment);
            setPod1Comment(inspection.data.pod1Comment);
          }
          if (inspection.data.postInspectionComment) {
            console.log('Loading postInspectionComment:', inspection.data.postInspectionComment);
            setPostInspectionComment(inspection.data.postInspectionComment);
          }
          if (inspection.data.pod2Comment) {
            console.log('Loading pod2Comment:', inspection.data.pod2Comment);
            setPod2Comment(inspection.data.pod2Comment);
          }
        }
      });
    }
  }, [existingInspections]);

  // Debug logging
  useEffect(() => {
    console.log('Camera Screen - Photos state updated:', photos.length, 'photos');
    console.log('Camera Screen - Photo assets:', photoAssets.length, 'assets');
  }, [photos, photoAssets]);

  const getVerificationTitle = () => {
    return getInspectionTypeName(type);
  };

  const getVerificationInstructions = () => {
    const instructions = {
      pre_trip: 'Take clear photos of your truck from all angles (front, back, left, right) before starting the trip. Include any visible damage or issues.',
      pod1: 'Take clear photos of POD 1 documents. Ensure text is readable and documents are well-lit.',
      post_trip: 'Take clear photos of your truck from all angles (front, back, left, right) after completing the trip. Include any new damage or issues.',
      pod2: 'Take clear photos of POD 2 documents. Ensure text is readable and documents are well-lit.',
    };
    return instructions[type] || 'Take photos for verification.';
  };

  const checkCameraPermission = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        // Use PermissionService for Android
        const result = await PermissionService.requestCameraPermission();
        if (!result.granted) {
          Alert.alert(
            t("common.cameraPermissionRequired") || "Camera Permission Required",
            result.error || t("common.cameraPermissionMessage") || "This app needs access to your camera to take photos. Please enable camera permission in your device settings.",
            [
              { text: t("common.cancel"), style: 'cancel' },
              {
                text: t("common.openSettings") || "Open Settings",
                onPress: () => Linking.openSettings()
              },
            ]
          );
        }
        return result.granted;
      } else {
        // For iOS, react-native-image-picker handles permissions automatically
        // No need to check permissions manually - the picker will prompt if needed
        return true;
      }
    } catch (error) {
      console.error('Error checking camera permission:', error);
      // Allow camera to open - react-native-image-picker will handle permissions
      return true;
    }
  };

  const handleTakePhoto = async () => {
    // Check camera permission before launching camera
    const hasPermission = await checkCameraPermission();

    if (!hasPermission) {
      console.log('Camera permission denied');
      return;
    }

    const options = {
      mediaType: 'photo' as MediaType,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.5 as any,
    };

    launchCamera(options, (response) => {
      if (response.didCancel || response.errorMessage) {
        console.log('Camera cancelled or error:', response.errorMessage);
        if (response.errorMessage) {
          Alert.alert(t("common.cameraError") || "Camera Error", response.errorMessage);
        }
        return;
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        console.log('Camera - Photo captured:', asset.uri);
        setPhotos(prev => {
          const newPhotos = [...prev, asset.uri || ''];
          console.log('Camera - Updated photos array:', newPhotos.length, 'photos');
          return newPhotos;
        });
        setPhotoAssets(prev => {
          const newAssets = [...prev, asset];
          console.log('Camera - Updated assets array:', newAssets.length, 'assets');
          return newAssets;
        });
        setShowImageSource(false);
      }
    });
  };

  const handleSelectFromLibrary = () => {
    const options = {
      mediaType: 'photo' as MediaType,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.5 as any,
      selectionLimit: 10, // Allow up to 10 photos
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel || response.errorMessage) {
        console.log('Image picker cancelled or error:', response.errorMessage);
        return;
      }

      if (response.assets && response.assets.length > 0) {
        const newPhotos = response.assets.map(asset => asset.uri || '');
        const newAssets = response.assets;

        console.log('Library - Photos selected:', newPhotos.length, 'photos');
        console.log('Library - Photo URIs:', newPhotos);

        setPhotos(prev => {
          const updatedPhotos = [...prev, ...newPhotos];
          console.log('Library - Updated photos array:', updatedPhotos.length, 'photos');
          return updatedPhotos;
        });
        setPhotoAssets(prev => {
          const updatedAssets = [...prev, ...newAssets];
          console.log('Library - Updated assets array:', updatedAssets.length, 'assets');
          return updatedAssets;
        });
        setShowImageSource(false);
      }
    });
  };

  const handleUploadPhotos = async () => {
    if (photoAssets.length === 0) return;

    // Validate minimum photos for pre-trip and post-trip
    const minPhotosRequired = (type === 'pre_trip' || type === 'post_trip') ? 6 : 1;
    if (photoAssets.length < minPhotosRequired) {
      Alert.alert(
        t("common.insufficientPhotos") || "Insufficient Photos",
        `${type === 'pre_trip' ? t("common.preTrip") || "Pre-trip" : t("common.postTrip") || "Post-trip"} ${t("common.inspectionRequiresPhotos") || "inspection requires a minimum of"} ${minPhotosRequired} ${t("common.photos") || "photos"}. ${t("common.youHave") || "You have"} ${photoAssets.length} ${photoAssets.length !== 1 ? t("common.photos") || "photos" : t("common.photo") || "photo"}. ${t("common.pleaseAddMorePhotos") || "Please add more photos."}`,
        [{ text: t("common.ok") }]
      );
      return;
    }

    setUploading(true);

    try {
      console.log('Starting multiple photo upload process...', photoAssets.length, 'photos');

      const uploadedUrls: string[] = [];
      let completedUploads = 0;

      // Upload all photos sequentially
      for (let i = 0; i < photoAssets.length; i++) {
        const asset = photoAssets[i];
        const fileData = createFileDataFromAsset(
          asset,
          `verification_${type}_${Date.now()}_${i}.jpg`
        );

        console.log(`Uploading photo ${i + 1}/${photoAssets.length}:`, fileData);

        // Upload each photo
        await new Promise((resolve, reject) => {
          uploadFileToServer(
            fileData,
            dispatch,
            (uploadResponse) => {
              console.log(`Photo ${i + 1} upload successful:`, uploadResponse);

              if (uploadResponse?.url) {
                uploadedUrls.push(uploadResponse.url);
                completedUploads++;
                resolve(uploadResponse);
              } else {
                console.error(`Photo ${i + 1} upload successful but no URL:`, uploadResponse);
                reject(new Error('No URL returned'));
              }
            },
            (error) => {
              console.error(`Photo ${i + 1} upload failed:`, error);
              reject(error);
            }
          );
        });
      }

      console.log('All photos uploaded successfully:', uploadedUrls);
      setUploadedPhotoUrls(uploadedUrls);


      // Step 2: Create inspection data based on type
      let inspectionData: any = {
        data: {
          odometer: 12345
        }
      };

      // Handle main photos based on inspection type
      if (type === 'pre_trip' || type === 'post_trip') {
        // For main inspections, use the uploaded photos
        inspectionData.photos = uploadedUrls.map((url, index) => ({
          url: url,
          label: `${type}_${index + 1}`
        }));
      } else if (type === 'pod1' || type === 'pod2') {
        // For POD uploads, preserve existing main photos from inspection data
        const existingInspection = existingInspections?.find((inspection: any) => {
          if (type === 'pod1') {
            return inspection.type === 'pre' || inspection.type === 'pre_trip';
          } else if (type === 'pod2') {
            return inspection.type === 'post' || inspection.type === 'post_trip';
          }
          return false;
        });

        if (existingInspection && existingInspection.photos) {
          inspectionData.photos = existingInspection.photos;
          console.log('Preserving existing main photos for POD upload:', inspectionData.photos);
        }
      }

      // Add all comments to preserve existing data
      // This ensures we don't lose previously saved comments
      console.log('Current comment states before API call:', {
        preInspectionComment,
        pod1Comment,
        postInspectionComment,
        pod2Comment,
        type
      });

      if (preInspectionComment.trim()) {
        inspectionData.data.preInspectionComment = preInspectionComment.trim();
      }
      if (pod1Comment.trim()) {
        inspectionData.data.pod1Comment = pod1Comment.trim();
      }
      if (postInspectionComment.trim()) {
        inspectionData.data.postInspectionComment = postInspectionComment.trim();
      }
      if (pod2Comment.trim()) {
        inspectionData.data.pod2Comment = pod2Comment.trim();
      }

      console.log('Final inspection data being sent:', inspectionData);

      // Add POD photo based on inspection type
      // Only POD uploads should update podPhoto, not main inspection photos
      // For post_trip, preserve existing POD 2 data if it exists
      if (type === 'pod1') {
        inspectionData.podPhoto = {
          pod1: uploadedUrls.map((url, index) => ({
            url: url,
            label: `pod1_${index + 1}`
          }))
        };
        console.log('POD 1 photos being sent:', inspectionData.podPhoto.pod1);
      } else if (type === 'pod2') {
        // Preserve existing post-trip photos if they exist
        const existingPostInspection = existingInspections?.find((inspection: any) =>
          inspection.type === 'post' || inspection.type === 'post_trip'
        );

        inspectionData.podPhoto = {
          pod2: uploadedUrls.map((url, index) => ({
            url: url,
            label: `pod2_${index + 1}`
          }))
        };

        // If post-trip photos exist, preserve them
        if (existingPostInspection && existingPostInspection.photos) {
          inspectionData.photos = existingPostInspection.photos;
          console.log('Preserving existing post-trip photos for POD 2 upload:', inspectionData.photos);
        }

        console.log('POD 2 photos being sent:', inspectionData.podPhoto.pod2);
      } else if (type === 'post_trip') {
        // Preserve existing POD 2 data if it exists
        const existingPostInspection = existingInspections?.find((inspection: any) =>
          inspection.type === 'post' || inspection.type === 'post_trip'
        );

        if (existingPostInspection && existingPostInspection.podPhoto?.pod2) {
          inspectionData.podPhoto = {
            pod2: existingPostInspection.podPhoto.pod2
          };
          console.log('Preserving existing POD 2 photos for post-trip upload:', inspectionData.podPhoto.pod2);
        } else {
          // Initialize empty podPhoto object to prevent overwriting with undefined
          inspectionData.podPhoto = {};
        }
      } else if (type === 'pre_trip') {
        // Preserve existing POD 1 data if it exists
        const existingPreInspection = existingInspections?.find((inspection: any) =>
          inspection.type === 'pre' || inspection.type === 'pre_trip'
        );

        if (existingPreInspection && existingPreInspection.podPhoto?.pod1) {
          inspectionData.podPhoto = {
            pod1: existingPreInspection.podPhoto.pod1
          };
          console.log('Preserving existing POD 1 photos for pre-trip upload:', inspectionData.podPhoto.pod1);
        } else {
          // Initialize empty podPhoto object to prevent overwriting with undefined
          inspectionData.podPhoto = {};
        }
      }


      console.log('Inspection data created with all photos:', inspectionData);
      console.log('POD Photo data:', inspectionData.podPhoto);
      console.log('Proof Photos data:', inspectionData.proofPhotos);

      // If there's an onComplete callback, call it with the inspection data
      if (onComplete) {
        onComplete(inspectionData);
        navigation.goBack();
      } else {
        // Fallback to old behavior for other verification types
        if (type === 'start') updateJobStatus(jobId, 'in_progress');
        else if (type === 'finish') updateJobStatus(jobId, 'delivered');

        Alert.alert(t("common.success"), `${uploadedUrls.length} ${t("common.photosUploadedSuccess") || "photos uploaded and processed successfully!"}`, [
          { text: t("common.ok"), onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      console.error('Upload Error:', error);
      Alert.alert('Error', 'Failed to upload photos. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoAssets(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllPhotos = () => {
    setPhotos([]);
    setPhotoAssets([]);
    setUploadedPhotoUrls([]);
  };


  // Show image source selection modal
  if (showImageSource) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{getVerificationTitle()}</Text>
        </View>

        <View style={styles.instructionsContainer}>
          <Text style={styles.instructions}>{getVerificationInstructions()}</Text>
        </View>

        <View style={styles.sourceSelectionContainer}>
          <Text style={styles.sourceSelectionTitle}>
            Select Images ({photos.length} selected)
          </Text>

          <TouchableOpacity style={styles.sourceButton} onPress={handleTakePhoto}>
            <CameraIcon size={24} color={Colors.primary} />
            <Text style={styles.sourceButtonText}>Take Photo</Text>
          </TouchableOpacity>
          {/* 
          <TouchableOpacity style={styles.sourceButton} onPress={handleSelectFromLibrary}>
            <ImageIcon size={24} color={Colors.primary} />
            <Text style={styles.sourceButtonText}>Choose from Library</Text>
          </TouchableOpacity> */}

          {!!photos.length && (
            <TouchableOpacity style={styles.sourceButton} onPress={clearAllPhotos}>
              <Text style={styles.sourceButtonText}>Clear All Photos</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getVerificationTitle()}</Text>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructions}>{getVerificationInstructions()}</Text>
          <View style={styles.photoCountContainer}>
            <Text style={styles.photoCountText}>
              {photos.length} photo{photos.length !== 1 ? 's' : ''} selected
            </Text>
          </View>
        </View>

        {photos.length > 0 ? (
          <View style={styles.photosContainer}>
            <View style={styles.photosHeader}>
              <View style={styles.photosTitleContainer}>
                <Text style={styles.photosTitle}>
                  {type === 'pre_trip' ? 'Pre-Trip Vehicle Photos' :
                    type === 'pod1' ? 'POD 1 Document Photos' :
                      type === 'post_trip' ? 'Post-Trip Vehicle Photos' :
                        type === 'pod2' ? 'POD 2 Document Photos' :
                          'Photos'}
                </Text>
                <Text style={styles.photosSubtitle}>
                  {photos.length} photo{photos.length !== 1 ? 's' : ''} selected
                  {(type === 'pre_trip' || type === 'post_trip') && (
                    <Text style={{ color: photos.length >= 6 ? Colors.success : Colors.warning }}>
                      {' '}(Minimum 6 required)
                    </Text>
                  )}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.addMoreButton}
                onPress={() => setShowImageSource(true)}
              >
                <Text style={styles.addMoreButtonText}>Add More</Text>
              </TouchableOpacity>
            </View>



            <View style={styles.photosGrid}>
              {photos.map((photo, index) => (
                <View key={index} style={styles.photoItem}>
                  <Image
                    source={{ uri: photo }}
                    style={styles.photoPreview}
                    onError={(error) => console.log('Image load error:', error)}
                    onLoad={() => console.log('Image loaded successfully:', photo)}
                  />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => removePhoto(index)}
                  >
                    <Text style={styles.removePhotoButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>


            {/* Comment Input based on inspection type */}
            <View style={styles.commentContainer}>
              <Text style={styles.commentLabel}>
                {type === 'pre_trip' ? 'Pre-Trip Comment (Optional)' :
                  type === 'pod1' ? 'POD 1 Comment (Optional)' :
                    type === 'post_trip' ? 'Post-Trip Comment (Optional)' :
                      type === 'pod2' ? 'POD 2 Comment (Optional)' :
                        'Comment (Optional)'}
              </Text>
              <TextInput
                style={styles.commentInput}
                value={type === 'pre_trip' ? preInspectionComment :
                  type === 'pod1' ? pod1Comment :
                    type === 'post_trip' ? postInspectionComment :
                      type === 'pod2' ? pod2Comment :
                        ''}
                onChangeText={type === 'pre_trip' ? setPreInspectionComment :
                  type === 'pod1' ? setPod1Comment :
                    type === 'post_trip' ? setPostInspectionComment :
                      type === 'pod2' ? setPod2Comment :
                        () => { }}
                placeholder={type === 'pre_trip' ? "Enter any additional notes about the pre-trip inspection..." :
                  type === 'pod1' ? "Enter any additional notes about POD 1 documents..." :
                    type === 'post_trip' ? "Enter any additional notes about the post-trip inspection..." :
                      type === 'pod2' ? "Enter any additional notes about POD 2 documents..." :
                        "Enter any additional notes..."}
                placeholderTextColor={Colors.gray500}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>
        ) : (
          <View style={styles.noPhotoContainer}>
            <CameraIcon size={60} color={Colors.gray} />
            <Text style={styles.noPhotoText}>
              {type === 'pre_trip' ? 'No pre-trip vehicle photos selected' :
                type === 'pod1' ? 'No POD 1 document photos selected' :
                  type === 'post_trip' ? 'No post-trip vehicle photos selected' :
                    type === 'pod2' ? 'No POD 2 document photos selected' :
                      'No photos selected'}
            </Text>
            <Text style={styles.noPhotoSubtext}>
              {type === 'pre_trip' ? 'Take photos of your truck from all angles before the trip' :
                type === 'pod1' ? 'Take photos of POD 1 documents' :
                  type === 'post_trip' ? 'Take photos of your truck from all angles after the trip' :
                    type === 'pod2' ? 'Take photos of POD 2 documents' :
                      'Take photos for verification'}
            </Text>
            <Button
              title={type === 'pre_trip' ? 'Take Pre-Trip Photos' :
                type === 'pod1' ? 'Take POD 1 Photos' :
                  type === 'post_trip' ? 'Take Post-Trip Photos' :
                    type === 'pod2' ? 'Take POD 2 Photos' :
                      'Take Photos'}
              variant="primary"
              onPress={() => setShowImageSource(true)}
              style={styles.selectPhotoButton}
            />
          </View>
        )}

        {/* Upload Button - Always visible */}
        <View style={styles.submitContainer}>
          {(() => {
            const minPhotosRequired = (type === 'pre_trip' || type === 'post_trip') ? 6 : 1;
            const hasEnoughPhotos = photos.length >= minPhotosRequired;
            const isDisabled = uploading || photos.length === 0 || !hasEnoughPhotos;

            return (
              <>
                <Button
                  title={uploading ? `Uploading ${photos.length} Photos...` : `Submit ${photos.length} Photos`}
                  variant="primary"
                  onPress={handleUploadPhotos}
                  disabled={isDisabled}
                  style={[styles.submitButton, isDisabled && styles.submitButtonDisabled]}
                />
                {photos.length === 0 && (
                  <Text style={styles.submitHint}>
                    Please select at least one photo to continue
                  </Text>
                )}
                {!!(photos.length > 0 && photos.length < minPhotosRequired && (type === 'pre_trip' || type === 'post_trip')) && (
                  <Text style={styles.submitHint}>
                    {type === 'pre_trip' ? 'Pre-trip' : 'Post-trip'} inspection requires a minimum of {minPhotosRequired} photos. You have {photos.length} photo{photos.length !== 1 ? 's' : ''}. Please add {minPhotosRequired - photos.length} more photo{(minPhotosRequired - photos.length) !== 1 ? 's' : ''}.
                  </Text>
                )}
              </>
            );
          })()}
        </View>

        {job && (
          <View style={styles.jobInfoContainer}>
            <Text style={styles.jobInfoTitle}>Job: {job.title}</Text>
            <Text style={styles.jobInfoDetail}>
              {type === 'start' || type === 'pre_trip'
                ? `Pickup: ${job.pickup.address}, ${job.pickup.city}`
                : `Delivery: ${job.delivery.address}, ${job.delivery.city}`}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export { VerificationCameraScreen };