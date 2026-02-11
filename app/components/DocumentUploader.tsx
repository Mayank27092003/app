/**
 * DocumentUploaded Screen
 * @format
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  ActionSheetIOS,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { pick, types } from '@react-native-documents/picker';
import { Upload, X, FileText, Check, Calendar } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import DatePicker from "react-native-date-picker";
import { useDispatch } from 'react-redux';
import { deleteDocument } from '@app/module/common';
import { useTranslation } from 'react-i18next';

//Screens
import { Colors, ScaledSheet } from '@app/styles';
import { Document } from '@app/types';

interface DocumentUploaderProps {
  documentType: Document['type'];
  title: string;
  description?: string;
  onUpload: (document: Omit<Document, 'id' | 'verified'>, expiryDate?: string) => void;
  onDelete?: (documentId: number) => void;
  existingDocument?: Document;
  requiresExpiry?: boolean;
  onExpiryDateUpdate?: (expiryDate: string) => void; // Callback for when expiry date is updated without file upload
  rejectionReason?: string; // Rejection reason to display if document is rejected
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  documentType,
  title,
  description,
  onUpload,
  onDelete,
  existingDocument,
  requiresExpiry = false,
  onExpiryDateUpdate,
  rejectionReason,
}) => {
  const { t } = useTranslation();
  console.log('DocumentUploader rendered - existingDocument:', existingDocument);
  console.log('DocumentUploader rendered - existingDocument.expiryDate:', existingDocument?.expiryDate);
  const [document, setDocument] = useState<Document | null>(
    existingDocument || null,
  );
  const [uploading, setUploading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedExpiryDate, setSelectedExpiryDate] = useState<Date | null>(null);

  // Update local state when existingDocument changes
  useEffect(() => {
    if (existingDocument) {
      setDocument(existingDocument);
      // Set existing expiry date if available
      if (existingDocument.expiryDate) {
        setSelectedExpiryDate(new Date(existingDocument.expiryDate));
      }
    }
  }, [existingDocument]);

  // Use the current document state for display
  const currentDocument = document || existingDocument;

  // Helper function to format expiry date consistently (YYYY-MM-DD)
  // Uses local date components to avoid timezone issues
  // If expiryDate is already a string in YYYY-MM-DD format, preserve it
  const formatExpiryDate = (date: Date | string | null | undefined): string | undefined => {
    if (!date) return undefined;
    
    // If it's already a string in YYYY-MM-DD format, return it as-is
    if (typeof date === 'string') {
      // Validate it's in YYYY-MM-DD format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (dateRegex.test(date)) {
        return date;
      }
      // If not in correct format, try to parse it
      const parsedDate = new Date(date);
      if (Number.isFinite(parsedDate.getTime())) {
        date = parsedDate;
      } else {
        return undefined;
      }
    }
    
    // Format Date object to YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Helper to get expiry date for upload - preserves existing string format if available
  const getExpiryDateForUpload = (): string | undefined => {
    // Priority 1: Check existingDocument prop directly (most reliable for updates)
    if (existingDocument?.expiryDate && typeof existingDocument.expiryDate === 'string') {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (dateRegex.test(existingDocument.expiryDate)) {
        console.log('Using expiry date from existingDocument:', existingDocument.expiryDate);
        return existingDocument.expiryDate;
      }
    }
    
    // Priority 2: Check currentDocument (which might be the new document or existing)
    if (currentDocument?.expiryDate && typeof currentDocument.expiryDate === 'string') {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (dateRegex.test(currentDocument.expiryDate)) {
        console.log('Using expiry date from currentDocument:', currentDocument.expiryDate);
        return currentDocument.expiryDate;
      }
    }
    
    // Priority 3: Format the selected expiry date from state
    if (selectedExpiryDate) {
      const formatted = formatExpiryDate(selectedExpiryDate);
      console.log('Using formatted expiry date from selectedExpiryDate:', formatted);
      return formatted;
    }
    
    console.log('No expiry date found');
    return undefined;
  };

  const pickImage = async () => {
    // Check if expiry date is required but not set
    if (requiresExpiry && !selectedExpiryDate) {
      Alert.alert(
        t("common.expiryDateRequired"),
        t("common.expiryDateRequiredMessage"),
        [
          { text: t("common.ok") },
          { 
            text: t("common.setDateNow"), 
            onPress: () => setShowDatePicker(true) 
          }
        ]
      );
      return;
    }

    setUploading(true);

    launchImageLibrary(
      {
        mediaType: 'photo',
        includeBase64: false,
        quality: 0.5,
      },
      async response => {
        if (response.didCancel || response.errorCode) {
          Alert.alert(t("common.cancelledOrError"), t("common.noImageSelected"));
          setUploading(false);
          return;
        }

        if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          const newDocument: Document = {
            id: `doc_${Date.now()}`,
            type: documentType,
            title: title,
            url: asset.uri!,
            verified: false,
            uploadedAt: new Date().toISOString(),
          };

          setDocument(newDocument);
          const expiryDateForUpload = getExpiryDateForUpload();
          console.log('pickImage - expiryDateForUpload:', expiryDateForUpload);
          onUpload({
            type: documentType,
            title: title,
            url: asset.uri!,
            uploadedAt: new Date().toISOString(),
          }, expiryDateForUpload);
        }

        setUploading(false);
      },
    );
  };

  const pickPDF = async () => {
    // Check if expiry date is required but not set
    if (requiresExpiry && !selectedExpiryDate) {
      Alert.alert(
        t("common.expiryDateRequired"),
        t("common.expiryDateRequiredMessage"),
        [
          { text: t("common.ok") },
          { 
            text: t("common.setDateNow"), 
            onPress: () => setShowDatePicker(true) 
          }
        ]
      );
      return;
    }

    setUploading(true);

    try {
      const result = await pick({
        type: [types.pdf],
        copyTo: 'cachesDirectory',
      });

      if (result && result.length > 0) {
        const file = result[0];
        const newDocument: Document = {
          id: `doc_${Date.now()}`,
          type: documentType,
          title: title,
          url: file.uri,
          verified: false,
          uploadedAt: new Date().toISOString(),
          // Store file name and type for PDF detection
          name: file.name || '',
        } as any;
        
        // Also store file type if available
        if (file.type) {
          (newDocument as any).fileType = file.type;
        }

        setDocument(newDocument);
        const expiryDateForUpload = getExpiryDateForUpload();
        console.log('pickPDF - expiryDateForUpload:', expiryDateForUpload);
        onUpload({
          type: documentType,
          title: title,
          url: file.uri,
          uploadedAt: new Date().toISOString(),
        }, expiryDateForUpload);
      }
    } catch (error: any) {
      if (error.message && !error.message.includes('User canceled')) {
        Alert.alert(t("common.error"), t("common.failedToPickPDF"));
        console.error('PDF picker error:', error);
      }
    } finally {
      setUploading(false);
    }
  };

  const takePhoto = async () => {
    // Check if expiry date is required but not set
    if (requiresExpiry && !selectedExpiryDate) {
      Alert.alert(
        t("common.expiryDateRequired"),
        t("common.expiryDateRequiredMessage"),
        [
          { text: t("common.ok") },
          { 
            text: t("common.setDateNow"), 
            onPress: () => setShowDatePicker(true) 
          }
        ]
      );
      return;
    }

    setUploading(true);

    launchCamera(
      {
        mediaType: 'photo',
        includeBase64: false,
        quality: 0.5,
      },
      async response => {
        if (response.didCancel || response.errorCode) {
          Alert.alert(t("common.cancelledOrError"), t("common.cameraCancelled"));
          setUploading(false);
          return;
        }

        if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          const newDocument: Document = {
            id: `doc_${Date.now()}`,
            type: documentType,
            title: title,
            url: asset.uri!,
            verified: false,
            uploadedAt: new Date().toISOString(),
          };

          setDocument(newDocument);
          const expiryDateForUpload = getExpiryDateForUpload();
          console.log('pickImage - expiryDateForUpload:', expiryDateForUpload);
          onUpload({
            type: documentType,
            title: title,
            url: asset.uri!,
            uploadedAt: new Date().toISOString(),
          }, expiryDateForUpload);
        }

        setUploading(false);
      },
    );
  };

  const removeDocument = () => {
    Alert.alert(
      t("common.removeDocument"),
      t("common.removeDocumentConfirm"),
      [
        {
          text: t("common.cancel"),
          style: 'cancel',
        },
        {
          text: t("common.remove"),
          style: 'destructive',
          onPress: () => {
            if (document?.documentId) {
              dispatch(deleteDocument(
                document.documentId,
                () => {
                  // On successful deletion
                  setDocument(null);
                  if (onDelete) {
                    onDelete(document.documentId);
                  }
                },
                (error) => {
                  // On deletion error, show error but don't remove from UI
                  console.error('Failed to delete document:', error);
                  Alert.alert(
                    t("common.deleteFailed"),
                    t("common.failedToDeleteDocument"),
                    [{ text: t("common.ok") }]
                  );
                }
              ));
            } else {
              // If no documentId, just remove from local state
              setDocument(null);
            }
          },
        },
      ],
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const dispatch = useDispatch();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}

      {/* Expiry date requirement notice */}
      {requiresExpiry && (
        <View style={styles.expiryNotice}>
          <Calendar size={18} color={Colors.warning} />
          <Text style={styles.expiryNoticeText}>
            {t("common.documentRequiresExpiryDate")}
          </Text>
        </View>
      )}

      {/* Show selected expiry date if available */}
      {selectedExpiryDate && (
        <View style={styles.expiryDateDisplay}>
          <Calendar size={18} color={Colors.success} />
          <Text style={styles.expiryDateText}>
            Expires: {selectedExpiryDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={styles.changeDateButton}
          >
            <Text style={styles.changeDateText}>Change</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Set expiry date button for documents that require it */}
      {requiresExpiry && !selectedExpiryDate && (
        <TouchableOpacity
          style={[styles.setExpiryButton, styles.setExpiryButtonWarning]}
          onPress={() => setShowDatePicker(true)}
        >
          <Calendar size={18} color={Colors.warning} />
          <Text style={[styles.setExpiryText, styles.setExpiryTextWarning]}>
            ⚠️ Set Expiry Date (Required)
          </Text>
        </TouchableOpacity>
      )}

      {document ? (
        <View style={styles.documentContainer}>
          {(() => {
            const fileUrl = document.fileUrl || document.url || '';
            const fileName = (document as any).name || '';
            const fileType = (document as any).fileType || (document as any).type || '';
            
            // Check if it's a PDF by file extension, name, or MIME type
            const isPDF = 
              fileUrl.toLowerCase().endsWith('.pdf') || 
              fileUrl.toLowerCase().includes('.pdf') ||
              fileName.toLowerCase().endsWith('.pdf') ||
              fileType.toLowerCase().includes('pdf') ||
              fileType.toLowerCase() === 'application/pdf';
            
            // Check if it's an image (not PDF and has image-like URL or type)
            const isImage = !isPDF && (
              fileUrl.startsWith('http') || 
              fileUrl.startsWith('file') ||
              fileType.startsWith('image/')
            );
            
            if (isPDF) {
              // Show PDF icon for PDF files
              return (
                <View style={styles.documentIcon}>
                  <FileText size={40} color={Colors.primary} />
                  <Text style={styles.pdfLabel}>PDF</Text>
                </View>
              );
            } else if (isImage) {
              // Show image preview for image files
              try {
                return (
                  <Image
                    source={{ uri: fileUrl }}
                    style={styles.documentImage}
                  />
                );
              } catch (error) {
                return (
                  <View style={styles.documentIcon}>
                    <FileText size={40} color={Colors.gray500} />
                  </View>
                );
              }
            } else {
              // Default icon
              return (
                <View style={styles.documentIcon}>
                  <FileText size={40} color={Colors.gray500} />
                </View>
              );
            }
          })()}

          <View style={styles.documentInfo}>
            <View style={styles.documentHeader}>
              <Text style={styles.documentTitle} numberOfLines={1}>
                {document.title || document.description || title}
              </Text>
              <TouchableOpacity
                onPress={removeDocument}
                style={styles.removeButton}
              >
                <X size={16} color={Colors.error} />
              </TouchableOpacity>
            </View>

           

            <View
              style={[
                styles.verificationBadge,
                document.status === 'verified' ? styles.verifiedBadge : 
                document.status === 'expired' ? styles.expiredBadge :
                document.status === 'rejected' ? styles.rejectedBadge :
                styles.pendingBadge,
              ]}
            >
              {document.status === 'verified' ? (
                <>
                  <Check size={12} color={Colors.white} />
                  <Text style={styles.verificationText}>Verified</Text>
                </>
              ) : (
                <Text style={styles.verificationText}>
                  {document?.status || 'Pending'}
                </Text>
              )}
            </View>

            {/* Show rejection reason if document is rejected */}
            {document.status === 'rejected' && rejectionReason && (
              <View style={styles.rejectionReasonContainer}>
                <Text style={styles.rejectionReasonTitle}>
                  {t('documents.rejectionReason') || 'Rejection Reason'}:
                </Text>
                <Text style={styles.rejectionReasonText}>
                  {rejectionReason}
                </Text>
              </View>
            )}

            {/* Change Document Button - Single button with options */}
            <TouchableOpacity
              style={styles.changeDocumentButton}
              onPress={() => {
                // Check if expiry date is required but not set
                if (requiresExpiry && !selectedExpiryDate) {
                  Alert.alert(
                    'Expiry Date Required',
                    'This document requires an expiry date. Please set the expiry date before uploading.',
                    [
                      { text: 'OK' },
                      { 
                        text: 'Set Date Now', 
                        onPress: () => setShowDatePicker(true) 
                      }
                    ]
                  );
                  return;
                }
                
                // Show action sheet to choose between take photo, image and PDF
                if (Platform.OS === 'ios') {
                  ActionSheetIOS.showActionSheetWithOptions(
                    {
                      options: [t("common.cancel"), t("common.takePhoto"), t("common.chooseImage"), t("common.choosePDF")],
                      cancelButtonIndex: 0,
                    },
                    (buttonIndex) => {
                      if (buttonIndex === 1) {
                        takePhoto();
                      } else if (buttonIndex === 2) {
                        pickImage();
                      } else if (buttonIndex === 3) {
                        pickPDF();
                      }
                    }
                  );
                } else {
                  Alert.alert(
                    t("common.changeDocument"),
                    t("common.selectDocumentType"),
                    [
                      ...(Platform.OS !== 'web' ? [{
                        text: t("common.takePhoto"),
                        onPress: () => takePhoto(),
                      }] : []),
                      {
                        text: t("common.chooseImage"),
                        onPress: () => pickImage(),
                      },
                      {
                        text: t("common.choosePDF"),
                        onPress: () => pickPDF(),
                      },
                      {
                        text: t("common.cancel"),
                        style: 'cancel',
                      },
                    ],
                    { cancelable: true }
                  );
                }
              }}
              disabled={uploading}
            >
              <Upload size={16} color={Colors.white} />
              <Text style={styles.changeDocumentText}>
                {uploading ? t("common.uploading") : t("common.changeDocument")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.uploadContainer}>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => {
              // Check if expiry date is required but not set
              if (requiresExpiry && !selectedExpiryDate) {
                Alert.alert(
                  'Expiry Date Required',
                  'This document requires an expiry date. Please set the expiry date before uploading.',
                  [
                    { text: 'OK' },
                    { 
                      text: 'Set Date Now', 
                      onPress: () => setShowDatePicker(true) 
                    }
                  ]
                );
                return;
              }
              
              // Show action sheet to choose between image and PDF
              if (Platform.OS === 'ios') {
                ActionSheetIOS.showActionSheetWithOptions(
                  {
                    options: ['Cancel', 'Take Photo', 'Choose Image', 'Choose PDF'],
                    cancelButtonIndex: 0,
                  },
                  (buttonIndex) => {
                    if (buttonIndex === 1) {
                      takePhoto();
                    } else if (buttonIndex === 2) {
                      pickImage();
                    } else if (buttonIndex === 3) {
                      pickPDF();
                    }
                  }
                );
              } else {
                Alert.alert(
                  t("common.uploadDocument"),
                  t("common.selectUploadOption"),
                  [
                    ...(Platform.OS !== 'web' ? [{
                      text: t("common.takePhoto"),
                      onPress: () => takePhoto(),
                    }] : []),
                    {
                      text: t("common.chooseImage"),
                      onPress: () => pickImage(),
                    },
                    {
                      text: t("common.choosePDF"),
                      onPress: () => pickPDF(),
                    },
                    {
                      text: t("common.cancel"),
                      style: 'cancel',
                    },
                  ],
                  { cancelable: true }
                );
              }
            }}
            disabled={uploading}
          >
            <Upload size={20} color={Colors.text} />
            <Text style={styles.uploadText}>
              {uploading ? t("common.uploading") : t("common.uploadDocument")}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Inline Date Picker */}
      {showDatePicker && (
               <DatePicker
               modal
               open={showDatePicker}
               date={selectedExpiryDate || new Date()}
               mode="date"
               onConfirm={(date) => {
                if (date) {
                        setSelectedExpiryDate(date);
                        setShowDatePicker(false);
                        
                        const formattedDate = formatExpiryDate(date);
                        
                        // If we have an existing document, update the expiry date via API
                        if (currentDocument && formattedDate) {
                          // Use onExpiryDateUpdate callback if provided (for API update without file upload)
                          if (onExpiryDateUpdate) {
                            onExpiryDateUpdate(formattedDate);
                          } else {
                            // Fallback: call onUpload with existing document data
                            onUpload({
                              type: documentType,
                              title: title,
                              url: currentDocument.url || currentDocument.fileUrl || '',
                              uploadedAt: currentDocument.uploadedAt,
                            }, formattedDate);
                          }
                        }
                      }
               }}
               onCancel={() => {
                 setShowDatePicker(false);
               }}
             />
        // <DateTimePicker
        // value={selectedExpiryDate || new Date()}
        // mode="date"
        //   display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        //   // onChange={onChange}
        //   onChange={(event, date) => {
        //     if (date) {
        //       setSelectedExpiryDate(date);
        //     }
        //   }}
        //   minimumDate={new Date()}
        // />
      )}

      {/* {showDatePicker && (
        <View style={styles.datePickerWrapper}>
          <View style={styles.datePickerHeader}>
            <Text style={styles.datePickerTitle}>Select Expiry Date</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(false)}
              style={styles.closeButton}
            >
              <X size={20} color={Colors.gray500} />
            </TouchableOpacity>
          </View>
          
          <DateTimePicker
            value={selectedExpiryDate || new Date()}
            mode="date"
            display="spinner"
            onChange={(event, date) => {
              if (date) {
                setSelectedExpiryDate(date);
              }
            }}
            minimumDate={new Date()}
            style={styles.datePicker}
          />
          
          <View style={styles.datePickerButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => {
                if (selectedExpiryDate) {
                  setShowDatePicker(false);
                  const formattedDate = formatExpiryDate(selectedExpiryDate);
                  
                  // If we have an existing document, update the expiry date via API
                  if (currentDocument && formattedDate) {
                    // Use onExpiryDateUpdate callback if provided (for API update without file upload)
                    if (onExpiryDateUpdate) {
                      onExpiryDateUpdate(formattedDate);
                    } else {
                      // Fallback: call onUpload with existing document data
                      onUpload({
                        type: documentType,
                        title: title,
                        url: currentDocument.url,
                        uploadedAt: currentDocument.uploadedAt,
                      }, formattedDate);
                    }
                  }
                }
              }}
              disabled={!selectedExpiryDate}
            >
              <Text style={styles.confirmButtonText}>Confirm Date</Text>
            </TouchableOpacity>
          </View>
        </View>
      )} */}
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    backgroundColor: Colors.backgroundCard,
    padding: '16@ms',
    borderRadius: '8@ms',
  },
  title: {
    fontSize: '16@ms',
    fontWeight: '600',
    color: Colors.text,
    marginBottom: '4@ms',
  },
  description: {
    fontSize: '14@ms',
    color: Colors.gray600,
    marginBottom: '12@ms',
  },
  uploadContainer: {
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderStyle: 'dashed',
    borderRadius: '8@ms',
    padding: '16@ms',
    alignItems: 'center',
    // backgroundColor: Colors.gray50,
    backgroundColor: Colors.backgroundCard,

  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingVertical: '10@ms',
    paddingHorizontal: '16@ms',
    borderRadius: '6@ms',
    borderWidth: 1,
    borderColor: Colors.primary,
    marginBottom: '8@ms',
  },
  uploadText: {
    color: Colors.text,
    fontWeight: '500',
    marginLeft: '8@ms',
  },
  cameraButton: {
    paddingVertical: '8@ms',
  },
  cameraText: {
    color: Colors.primary,
    fontWeight: '500',
  },
  documentContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: 8,
    padding: '12@ms',
    backgroundColor: Colors.backgroundCard,
  },
  documentImage: {
    width: '80@ms',
    height: '80@ms',
    borderRadius: '8@ms',
    marginRight: '12@ms',
  },
  documentIcon: {
    width: '80@ms',
    height: '80@ms',
    borderRadius: '8@ms',
    marginRight: '12@ms',
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  documentTitle: {
    fontSize: '15@ms',
    fontWeight: '500',
    color: Colors.text,
    flex: 1,
  },
  removeButton: {
    padding: '4@ms',
  },
  documentDate: {
    fontSize: '13@ms',
    color: Colors.gray500,
    marginBottom: '8@ms',
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '8@ms',
    paddingVertical: '4@ms',
    borderRadius: '4@ms',
    alignSelf: 'flex-start',
  },
  verifiedBadge: {
    backgroundColor: Colors.success,
  },
  pendingBadge: {
    backgroundColor: Colors.warning,
  },
  expiredBadge: {
    backgroundColor: Colors.error,
  },
  rejectedBadge: {
    backgroundColor: Colors.error,
  },
  verificationText: {
    fontSize: '12@ms',
    fontWeight: '500',
    color: Colors.white,
    marginLeft: '4@ms',
  },
  rejectionReasonContainer: {
    backgroundColor: Colors.error + '15',
    padding: '8@ms',
    borderRadius: '6@ms',
    marginTop: '8@ms',
    borderLeftWidth: '3@ms',
    borderColor: Colors.error,
  },
  rejectionReasonTitle: {
    fontSize: '12@ms',
    fontWeight: '600',
    color: Colors.error,
    marginBottom: '2@ms',
  },
  rejectionReasonText: {
    fontSize: '12@ms',
    color: Colors.text,
    lineHeight: '16@ms',
  },
  expiryNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    paddingVertical: '8@ms',
    paddingHorizontal: '12@ms',
    borderRadius: '6@ms',
    marginBottom: '12@ms',
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  expiryNoticeText: {
    fontSize: '13@ms',
    color: Colors.warning,
    marginLeft: '8@ms',
  },
  expiryDateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingVertical: '8@ms',
    paddingHorizontal: '12@ms',
    borderRadius: '6@ms',
    marginBottom: '12@ms',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  expiryDateText: {
    fontSize: '14@ms',
    color: Colors.success,
    marginLeft: '8@ms',
    marginRight: '8@ms',
  },
  changeDateButton: {
    paddingVertical: '4@ms',
    paddingHorizontal: '8@ms',
    borderRadius: '4@ms',
    backgroundColor: Colors.primaryLight,
  },
  changeDateText: {
    fontSize: '13@ms',
    color: Colors.white,
    fontWeight: '500',
  },
  setExpiryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingVertical: '10@ms',
    paddingHorizontal: '16@ms',
    borderRadius: '6@ms',
    borderWidth: 1,
    borderColor: Colors.primary,
    marginVertical: '12@ms',
  },
  setExpiryText: {
    color: Colors.white,
    fontWeight: '500',
    marginLeft: '8@ms',
  },
  setExpiryButtonWarning: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  setExpiryTextWarning: {
    color: Colors.warning,
  },
  changeDocumentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: '10@ms',
    paddingHorizontal: '16@ms',
    borderRadius: '6@ms',
    marginTop: '12@ms',
  },
  changeDocumentText: {
    color: Colors.white,
    fontWeight: '500',
    marginLeft: '8@ms',
    fontSize: '14@ms',
  },
  pdfLabel: {
    fontSize: '10@ms',
    color: Colors.primary,
    fontWeight: '600',
    marginTop: '4@ms',
  },
  datePickerWrapper: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 8,
    padding: '16@ms',
    marginTop: '12@ms',
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12@ms',
  },
  datePickerTitle: {
    fontSize: '16@ms',
    fontWeight: '600',
    color: Colors.text,
  },
  closeButton: {
    padding: '4@ms',
  },
  datePicker: {
    width: '100%',
    backgroundColor: Colors.backgroundCard,
    borderRadius: 8,
    padding: '12@ms',
    marginBottom: '12@ms',
  },
  datePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: '12@ms',
  },
  cancelButton: {
    paddingVertical: '8@ms',
    paddingHorizontal: '16@ms',
    borderRadius: '6@ms',
    borderWidth: 1,
    borderColor: Colors.gray300,
    backgroundColor: Colors.gray100,
  },
  cancelButtonText: {
    color: Colors.text,
    fontWeight: '500',
  },
  confirmButton: {
    paddingVertical: '8@ms',
    paddingHorizontal: '16@ms',
    borderRadius: '6@ms',
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  confirmButtonText: {
    color: Colors.white,
    fontWeight: '500',
  },
});
