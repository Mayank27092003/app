/**
 * Document Screen
 * @format
 */

import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Alert, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import {
  selectDocumentTypes,
  fetchDocumentTypes,
  selectProfile,
  uploadDocument,
  uploadFile,
} from "@app/module/common";
import { DocumentUploader } from "@app/components/DocumentUploader";
import { Document } from "@app/types";
import { Colors, useThemedStyle } from "@app/styles";
import { getStyles } from "./documentStyle";
import { Calendar, FileText, Check } from "lucide-react-native";
import { useAuthStore } from "@app/store/authStore";
import Header from "@app/components/Header";
import DatePicker from "react-native-date-picker";
import { showMessage } from "react-native-flash-message";

// Expiry Date Picker Component for documents with sides
const ExpiryDatePicker: React.FC<{
  expiryDate?: string;
  onDateChange: (date: string) => void;
}> = ({ expiryDate, onDateChange }) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    expiryDate ? new Date(expiryDate) : null
  );
  const styles = useThemedStyle(getStyles);

  useEffect(() => {
    if (expiryDate) {
      setSelectedDate(new Date(expiryDate));
    }
  }, [expiryDate]);

  const handleDateConfirm = (date: Date) => {
    setSelectedDate(date);
    setShowDatePicker(false);
    // Format date as YYYY-MM-DD using local date components to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    onDateChange(formattedDate);
  };

  return (
    <View style={styles.expiryDatePickerContainer}>
      {selectedDate ? (
        <View style={styles.expiryDateDisplay}>
          <Calendar size={18} color={Colors.success} />
          <Text style={styles.expiryDateDisplayText}>
            Expires: {selectedDate.toLocaleDateString('en-US', {
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
      ) : (
        <TouchableOpacity
          style={styles.setExpiryButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Calendar size={18} color={Colors.warning} />
          <Text style={styles.setExpiryText}>
            ⚠️ Set Expiry Date (Required)
          </Text>
        </TouchableOpacity>
      )}

      {showDatePicker && (
        <DatePicker
          modal
          open={showDatePicker}
          date={selectedDate || new Date()}
          mode="date"
          minimumDate={new Date()}
          onConfirm={handleDateConfirm}
          onCancel={() => setShowDatePicker(false)}
        />
      )}
    </View>
  );
};

function DocumentsScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyle(getStyles);
  const navigation = useNavigation();
  const { updateProfile } = useAuthStore();
  const dispatch = useDispatch();
  const documentTypes = useSelector(selectDocumentTypes);
  const userProfile = useSelector(selectProfile) as any; // Type assertion for now

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocumentTypes, setLoadingDocumentTypes] = useState(false);
  // Store expiry dates for documents with sides (keyed by documentTypeId)
  const [documentExpiryDates, setDocumentExpiryDates] = useState<Record<number, string>>({});
  // Store text input values for documents with acceptsTextInput (keyed by documentTypeId)
  const [textInputValues, setTextInputValues] = useState<Record<number, string>>({});
  // Store loading states for text input submissions
  const [textInputLoading, setTextInputLoading] = useState<Record<number, boolean>>({});

  // Load documents from document types response when it changes
  // The /document/required endpoint returns existing user documents
  useEffect(() => {
    if (documentTypes && documentTypes.length > 0) {
      console.log(
        "Loading documents from document types response:",
        documentTypes
      );

      // For documents with sides, we need to include them even if they have sides array
      // Filter to get documents that are uploaded (either have fileUrl or have sides with fileUrl)
      const existingDocuments = documentTypes.filter((doc: any) => {
        // Document is uploaded if:
        // 1. It has a direct fileUrl, OR
        // 2. It has sides array with at least one side that has a fileUrl
        if (doc.fileUrl && doc.isUploaded) {
          return true;
        }
        if (doc.requiresSides && doc.sides && Array.isArray(doc.sides)) {
          // Check if any side has been uploaded
          return doc.sides.some((side: any) => side.fileUrl);
        }
        return false;
      });

      console.log("Existing documents:", existingDocuments);

      setDocuments(existingDocuments);

      // Initialize expiry dates from existing documents
      const expiryDates: Record<number, string> = {};
      const textValues: Record<number, string> = {};
      documentTypes.forEach((doc: any) => {
        if (doc.requiresSides && doc.expiryDate) {
          expiryDates[doc.id] = doc.expiryDate;
        }
        // Initialize text input values from existing documents
        if (doc.acceptsTextInput && doc.textValue) {
          textValues[doc.id] = doc.textValue;
        }
      });
      setDocumentExpiryDates(prev => ({ ...prev, ...expiryDates }));
      setTextInputValues(prev => ({ ...prev, ...textValues }));
    }
  }, [documentTypes]);

  // Fetch document types on component mount
  useEffect(() => {
    const fetchTypes = async () => {
      setLoadingDocumentTypes(true);
      try {
        dispatch(fetchDocumentTypes());
      } catch (error) {
        console.error("Error fetching document types:", error);
      } finally {
        setLoadingDocumentTypes(false);
      }
    };

    fetchTypes();
  }, [dispatch]);

  // Helper function to normalize expiry date to YYYY-MM-DD format
  const normalizeExpiryDate = (date: string | undefined): string | undefined => {
    if (!date) return undefined;
    
    // If already in YYYY-MM-DD format, return as-is
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dateRegex.test(date)) {
      return date;
    }
    
    // If it's an ISO string, convert to YYYY-MM-DD
    try {
      const dateObj = new Date(date);
      if (Number.isFinite(dateObj.getTime())) {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    } catch (e) {
      console.error('Error normalizing expiry date:', e);
    }
    
    return undefined;
  };

  // Function to update only the expiry date without uploading a new file
  const handleUpdateExpiryDate = (
    documentTypeId: number,
    expiryDate: string,
    side?: "front" | "back"
  ) => {
    // Find the existing document to get the fileUrl
    const existingDoc = documentTypes.find((doc: any) => doc.id === documentTypeId);
    
    if (!existingDoc) {
      console.warn('Cannot update expiry date: document not found');
      Alert.alert(
        t("common.error"),
        t("common.cannotUpdateExpiryDate")
      );
      return;
    }

    // Get fileUrl from the document or from sides
    let fileUrl: string | undefined;
    
    if (side) {
      // For documents with sides, get fileUrl from the specific side
      const sideData = existingDoc.sides?.find((s: any) => s.side === side);
      fileUrl = sideData?.fileUrl;
      
      // If this side doesn't have a fileUrl, try to get from any uploaded side
      if (!fileUrl && existingDoc.sides) {
        const anyUploadedSide = existingDoc.sides.find((s: any) => s.fileUrl);
        fileUrl = anyUploadedSide?.fileUrl;
      }
    } else {
      // For regular documents, get fileUrl directly
      fileUrl = existingDoc.fileUrl;
    }

    if (!fileUrl) {
      console.warn('Cannot update expiry date: fileUrl not found');
      Alert.alert(
        t("common.error"),
        t("common.cannotUpdateExpiryDateNoFile")
      );
      return;
    }

    // Normalize the expiry date
    const normalizedExpiryDate = normalizeExpiryDate(expiryDate);
    
    if (!normalizedExpiryDate) {
      console.warn('Cannot update expiry date: invalid date format');
      Alert.alert(
        t("common.error"),
        t("common.invalidDateFormat")
      );
      return;
    }

    // Prepare document data with existing fileUrl and new expiry date
    const documentData: any = {
      documentTypeId: documentTypeId,
      fileUrl: fileUrl,
      expiryDate: normalizedExpiryDate,
    };

    // Add side if provided (but only if we found a side-specific fileUrl)
    if (side && existingDoc.sides?.find((s: any) => s.side === side && s.fileUrl)) {
      documentData.side = side;
    }

    console.log('Updating expiry date:', documentData);

    // Call the document upload API (same endpoint, but with existing fileUrl)
    dispatch(
      uploadDocument(
        documentData,
        (response) => {
          console.log("Expiry date updated successfully:", response);
          // Refresh document list to get updated data
          dispatch(fetchDocumentTypes());
          showMessage({
            message: t("common.expiryDateUpdatedSuccess"),
            type: "success",
            duration: 2000,
          });
        },
        (error) => {
          console.error("Failed to update expiry date:", error);
          showMessage({
            message: t("common.error"),
            description: error?.message || t("common.failedToUpdateExpiryDate"),
            type: "danger",
            duration: 3000,
          });
        }
      )
    );
  };

  // Handle text input document submission
  const handleTextInputSubmit = (documentTypeId: number) => {
    const textValue = textInputValues[documentTypeId]?.trim();
    
    if (!textValue) {
      showMessage({
        message: t("common.error"),
        description: t("documents.pleaseEnterValue") || "Please enter a value",
        type: "warning",
        duration: 3000,
      });
      return;
    }

    // Set loading state for this document
    setTextInputLoading(prev => ({ ...prev, [documentTypeId]: true }));

    // Prepare the document data with text value
    const documentData: any = {
      documentTypeId: documentTypeId,
      textValue: textValue,
    };

    console.log('Submitting text input document:', documentData);

    // Call the document upload API
    dispatch(
      uploadDocument(
        documentData,
        (response) => {
          console.log("Text document submitted successfully:", response);
          // Refresh document list to get updated data
          dispatch(fetchDocumentTypes());
          setTextInputLoading(prev => ({ ...prev, [documentTypeId]: false }));
          showMessage({
            message: t("common.success"),
            description: t("documents.textSubmittedSuccess") || "Document submitted successfully",
            type: "success",
            duration: 2000,
          });
        },
        (error) => {
          console.error("Failed to submit text document:", error);
          setTextInputLoading(prev => ({ ...prev, [documentTypeId]: false }));
          showMessage({
            message: t("common.error"),
            description: error?.message || t("documents.failedToSubmitText") || "Failed to submit. Please try again.",
            type: "danger",
            duration: 3000,
          });
        }
      )
    );
  };

  const handleUploadDocument = (
    newDocument: Omit<Document, "id" | "verified">,
    documentTypeId: number,
    expiryDate?: string,
    side?: "front" | "back"
  ) => {
    // Check file size before upload (limit to 5MB to avoid 413 errors)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

    // For local files, we can't get size directly, but we can warn
    if (newDocument.url.startsWith("file://")) {
      console.log("Local file selected, proceeding with upload...");
    }

    // Detect file type from URL
    const getFileType = (url: string) => {
      if (url.includes(".jpg") || url.includes(".jpeg")) return "image/jpeg";
      if (url.includes(".png")) return "image/png";
      if (url.includes(".pdf")) return "application/pdf";
      return "image/jpeg"; // default
    };

    const getFileName = (url: string) => {
      const fileName = url.split("/").pop() || `document_${Date.now()}`;
      return fileName.includes(".") ? fileName : `${fileName}.jpg`;
    };

    // First, upload the file to get a URL
    const fileData = {
      uri: newDocument.url,
      type: getFileType(newDocument.url),
      name: getFileName(newDocument.url),
    };

    // Call the file upload API first
    dispatch(
      uploadFile(
        fileData,
        (uploadResponse) => {
          // File uploaded successfully, now call document upload API
          console.log("File uploaded successfully:", uploadResponse);

          const fileUrl = uploadResponse?.data?.url || uploadResponse?.url;

          if (!fileUrl) {
            Alert.alert(
              t("common.error"),
              t("common.fileUploadedNoUrl")
            );
            return;
          }

          // Now prepare the document data with the file URL
          const documentData: any = {
            documentTypeId: documentTypeId,
            fileUrl: fileUrl,
          };

          // Normalize and add expiry date if provided (only include if it exists, don't send null)
          // Log for debugging
          console.log('Document upload - expiryDate parameter (raw):', expiryDate);
          console.log('Document upload - documentTypeId:', documentTypeId);
          
          // Normalize the expiry date to YYYY-MM-DD format
          const normalizedExpiryDate = normalizeExpiryDate(expiryDate);
          
          if (normalizedExpiryDate) {
            documentData.expiryDate = normalizedExpiryDate;
            console.log('Adding normalized expiryDate to documentData:', normalizedExpiryDate);
          } else {
            console.warn('No valid expiry date provided for document upload');
          }
          
          console.log('Document data being sent:', JSON.stringify(documentData, null, 2));

          // Add side if provided (for documents with front/back)
          if (side) {
            documentData.side = side;
          }

          // Call the document upload API
          dispatch(
            uploadDocument(
              documentData,
              (response) => {
                // On successful document upload
                console.log("Document uploaded successfully:", response);

                // Refresh document list from API
                dispatch(fetchDocumentTypes());

                // Create the new document with API response data
                const uploadedDocument: Document = {
                  id: response?.data?.id?.toString() || `doc_${Date.now()}`,
                  type: newDocument.type,
                  title: newDocument.title,
                  url: fileUrl, // Use the uploaded file URL
                  verified: false,
                  uploadedAt: new Date().toISOString(),
                  // Add new API fields
                  documentId: response?.data?.id,
                  name: newDocument.type,
                  description: newDocument.title,
                  expiryDate: expiryDate,
                  fileUrl: fileUrl,
                  isUploaded: true,
                  requiresExpiry: !!expiryDate,
                };

                // Update local state with the uploaded document
                const updatedDocuments = [...documents, uploadedDocument];
                setDocuments(updatedDocuments);

                // Update the user profile
                if (userProfile) {
                  updateProfile({
                    ...userProfile,
                    documents: updatedDocuments,
                  } as any);
                }

                // Alert.alert(
                //   t("documents.uploadSuccessTitle") || "Success",
                //   t("documents.uploadSuccessMessage") ||
                //     "Document uploaded successfully!"
                // );
              },
              (error) => {
                // On document upload failure
                console.error("Document upload failed:", error);
                Alert.alert(
                  t("common.error"),
                  t("common.failedToUploadDocument") ||
                    "Failed to upload document. Please try again."
                );
              }
            )
          );
        },
        (uploadError) => {
          // On file upload failure
          console.error("File upload failed:", uploadError);

          // Check if it's a 413 error (file too large)
          if (uploadError?.status === 413) {
            Alert.alert(
              "File Too Large",
              "The selected file is too large. Please choose a smaller image or compress it before uploading.",
              [
                { text: t("common.ok") },
                {
                  text: t("common.help") || "Help",
                  onPress: () => {
                    Alert.alert(
                      t("common.fileSizeTips"),
                      t("common.fileSizeTipsMessage")
                    );
                  },
                },
              ]
            );
          } else {
            Alert.alert(
              t("common.error"),
              t("common.failedToUploadFile")
            );
          }
        }
      )
    );
  };

  // Render all document types without filtering
  const renderAllDocuments = () => {
    if (loadingDocumentTypes) {
      return (
        <View style={styles.noDocumentsContainer}>
          <Text style={styles.noDocumentsText}>Loading document types...</Text>
        </View>
      );
    }

    if (!documentTypes || documentTypes.length === 0) {
      return (
        <View style={styles.noDocumentsContainer}>
          <Text style={styles.noDocumentsText}>
            {t("documents.noDocumentTypes") || "No document types available."}
          </Text>
        </View>
      );
    }

    console.log("Rendering documents. Current documents state:", documents);
    console.log("Document types response:", documentTypes);

    return (
      <View style={styles.documentsContainer}>
        {documentTypes.map((docType: any) => {
          // Find existing document for this type
          const existingDocument = documents.find(
            (doc) => doc.name === docType.name
          );

          console.log(`Looking for document type: ${docType.name}`);
          console.log(`Found existing document:`, existingDocument);

          // Check if document accepts text input instead of file upload
          if (docType.acceptsTextInput === true) {
            const currentTextValue = textInputValues[docType.id] || docType.textValue || '';
            const isSubmitted = docType.isUploaded || docType.textValue;
            const isVerified = docType.verified === true || (existingDocument as any)?.verified === true;
            const isRejected = docType.status === 'rejected' || (existingDocument as any)?.status === 'rejected';
            const isPending = docType.status === 'pending' || (existingDocument as any)?.status === 'pending';
            const isLoading = textInputLoading[docType.id] || false;

            return (
              <View key={docType.id} style={styles.documentItem}>
                <View style={styles.textInputDocumentContainer}>
                  <View style={styles.textInputHeader}>
                    <FileText size={24} color={Colors.primary} />
                    <View style={styles.textInputTitleContainer}>
                      <Text style={styles.documentTypeTitle}>{docType.displayName}</Text>
                      {docType.description && (
                        <Text style={styles.documentTypeDescription}>
                          {docType.description}
                        </Text>
                      )}
                    </View>
                    {isVerified && (
                      <View style={styles.verifiedBadge}>
                        <Check size={14} color={Colors.white} />
                        <Text style={styles.verifiedBadgeText}>{t("profile.verifiedAccount") || "Verified"}</Text>
                      </View>
                    )}
                    {isPending && isSubmitted && !isVerified && !isRejected && (
                      <View style={styles.pendingBadge}>
                        <Text style={styles.pendingBadgeText}>{t("profile.verificationPending") || "Pending"}</Text>
                      </View>
                    )}
                    {isRejected && (
                      <View style={styles.rejectedBadge}>
                        <Text style={styles.rejectedBadgeText}>{t("common.rejected") || "Rejected"}</Text>
                      </View>
                    )}
                  </View>

                  {isRejected && (existingDocument as any)?.rejectionReason && (
                    <View style={styles.rejectionReasonContainer}>
                      <Text style={styles.rejectionReasonLabel}>
                        {t("documents.rejectionReason") || "Rejection Reason"}:
                      </Text>
                      <Text style={styles.rejectionReasonText}>
                        {(existingDocument as any)?.rejectionReason}
                      </Text>
                    </View>
                  )}

                  <View style={styles.textInputWrapper}>
                    <TextInput
                      style={[
                        styles.textInputField,
                        isVerified && styles.textInputFieldDisabled,
                      ]}
                      placeholder={docType.placeholder || t("documents.enterValue") || "Enter value..."}
                      placeholderTextColor={Colors.gray500}
                      value={currentTextValue}
                      onChangeText={(text) => {
                        setTextInputValues(prev => ({
                          ...prev,
                          [docType.id]: text,
                        }));
                      }}
                      editable={!isVerified && !isLoading}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  {!isVerified && (
                    <TouchableOpacity
                      style={[
                        styles.textInputSubmitButton,
                        (!currentTextValue?.trim() || isLoading) && styles.textInputSubmitButtonDisabled,
                      ]}
                      onPress={() => handleTextInputSubmit(docType.id)}
                      disabled={!currentTextValue?.trim() || isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color={Colors.white} />
                      ) : (
                        <Text style={styles.textInputSubmitButtonText}>
                          {isSubmitted 
                            ? (t("buttons.update") || "Update") 
                            : (t("buttons.submit") || "Submit")}
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }

          // Check if document requires sides (front and back)
          const requiresSides = docType.requiresSides === true;
          
          // Get sides from the document type definition or from existing document
          // If document is uploaded, use the actual sides array from the document
          // Otherwise, use the sides definition from docType
          const existingDocWithSides = existingDocument as any;
          const uploadedSides = existingDocWithSides?.sides || [];
          const sidesDefinition = docType.sides || [];
          
          // Determine which sides to show: use uploaded sides if available, otherwise use definition
          const sidesToShow = uploadedSides.length > 0 
            ? uploadedSides.map((s: any) => ({ side: s.side, status: s.status, verified: s.verified }))
            : sidesDefinition.map((s: any) => ({ side: s.side || s, status: 'pending', verified: false }));

          // If document requires sides, render separate uploaders for front and back
          if (requiresSides) {
            // Ensure we have at least front and back sides
            const allSides = ['front', 'back'];
            const sidesToRender = allSides.map(sideName => {
              const uploadedSide = uploadedSides.find((s: any) => s.side === sideName);
              const definitionSide = sidesDefinition.find((s: any) => (s.side || s) === sideName);
              
              return {
                side: sideName,
                uploaded: uploadedSide,
                definition: definitionSide,
                status: uploadedSide?.status || 'pending',
                verified: uploadedSide?.verified || false,
              };
            });

            // Get expiry date for this document type (from state or existing document)
            const currentExpiryDate = documentExpiryDates[docType.id] || docType.expiryDate;
            
            return (
              <View key={docType.id} style={styles.documentItem}>
                <View style={styles.documentTypeHeader}>
                  <Text style={styles.documentTypeTitle}>{docType.displayName}</Text>
                  {docType.description && (
                    <Text style={styles.documentTypeDescription}>
                      {docType.description}
                    </Text>
                  )}
                  {currentExpiryDate && (
                    <Text style={styles.expiryDateText}>
                      Expires: {new Date(currentExpiryDate).toLocaleDateString()}
                    </Text>
                  )}
                </View>

                {/* Show expiry date picker once for documents with sides */}
                {docType.requiresExpiry && (
                  <View style={styles.expiryDateSection}>
                    <ExpiryDatePicker
                      expiryDate={currentExpiryDate}
                      onDateChange={(date) => {
                        // Update local state immediately for UI responsiveness
                        setDocumentExpiryDates(prev => ({
                          ...prev,
                          [docType.id]: date,
                        }));
                        
                        // Check if document is already uploaded (has at least one side uploaded)
                        const hasUploadedSide = sidesToRender.some((sideInfo: any) => sideInfo.uploaded?.fileUrl);
                        
                        if (hasUploadedSide) {
                          // If document is uploaded, update expiry date via API
                          // Use the first uploaded side's fileUrl (or we can update all sides)
                          const firstUploadedSide = sidesToRender.find((sideInfo: any) => sideInfo.uploaded?.fileUrl);
                          if (firstUploadedSide) {
                            handleUpdateExpiryDate(docType.id, date, firstUploadedSide.side as "front" | "back");
                          } else {
                            // Fallback: try to update without side (for documents that might have been uploaded differently)
                            handleUpdateExpiryDate(docType.id, date);
                          }
                        }
                        // If document is not uploaded yet, just update local state (will be saved when document is uploaded)
                      }}
                    />
                    <Text style={styles.expiryDateNote}>
                      Set expiry date once for both sides
                    </Text>
                  </View>
                )}

                {sidesToRender.map((sideInfo: any) => {
                  // Create a document-like object for this side if it's uploaded
                  const sideDoc: any = sideInfo.uploaded
                    ? {
                        id: `doc_${sideInfo.uploaded.documentId}`,
                        type: docType.name,
                        title: `${docType.displayName} - ${sideInfo.side === "front" ? "Front" : "Back"}`,
                        url: sideInfo.uploaded.fileUrl,
                        fileUrl: sideInfo.uploaded.fileUrl,
                        verified: sideInfo.uploaded.verified,
                        status: sideInfo.uploaded.status,
                        uploadedAt: sideInfo.uploaded.createdAt,
                        documentId: sideInfo.uploaded.documentId,
                        side: sideInfo.side,
                        isUploaded: true,
                      }
                    : null;

                  return (
                    <View key={sideInfo.side} style={styles.sideContainer}>
                      <Text style={styles.sideLabel}>
                        {sideInfo.side === "front" ? "Front Side" : "Back Side"}
                        {sideInfo.uploaded && (
                          <Text
                            style={[
                              styles.sideStatus,
                              sideInfo.uploaded.status === "verified" || sideInfo.uploaded.verified
                                ? styles.sideStatusVerified
                                : sideInfo.uploaded.status === "rejected"
                                ? styles.sideStatusRejected
                                : styles.sideStatusPending,
                            ]}
                          >
                            {" "}
                            ({sideInfo.uploaded.status || (sideInfo.uploaded.verified ? "verified" : "pending")})
                          </Text>
                        )}
                      </Text>

                      <DocumentUploader
                        documentType={docType.name}
                        title={`${docType.displayName} - ${sideInfo.side === "front" ? "Front" : "Back"}`}
                        description={sideInfo.side === "front" ? "Upload the front side" : "Upload the back side"}
                        requiresExpiry={false}
                        rejectionReason={sideInfo.uploaded?.status === "rejected" ? sideInfo.uploaded?.rejectionReason : undefined}
                        onUpload={(document, expiryDate) => {
                          // Use the shared expiry date from state
                          const expiryToUse = currentExpiryDate || expiryDate;
                          // Normalize the expiry date before passing to handleUploadDocument
                          const normalizedExpiry = normalizeExpiryDate(expiryToUse);
                          handleUploadDocument(
                            document,
                            docType.id,
                            normalizedExpiry,
                            sideInfo.side
                          );
                        }}
                        onDelete={(documentId) => {
                          // Remove the deleted document from local state
                          setDocuments((prev) =>
                            prev.filter((doc: any) => {
                              // For documents with sides, check if any side matches
                              if (doc.sides && Array.isArray(doc.sides)) {
                                return !doc.sides.some((s: any) => s.documentId === documentId);
                              }
                              return doc.documentId !== documentId;
                            })
                          );
                          // Update user profile
                          if (userProfile) {
                            updateProfile({
                              ...userProfile,
                              documents: documents.filter((doc: any) => {
                                if (doc.sides && Array.isArray(doc.sides)) {
                                  return !doc.sides.some((s: any) => s.documentId === documentId);
                                }
                                return doc.documentId !== documentId;
                              }),
                            } as any);
                          }
                        }}
                        existingDocument={sideDoc}
                      />
                    </View>
                  );
                })}
              </View>
            );
          }

          // Regular document without sides
          // Check if document is pending (uploaded but not verified)
          const isPending =
            existingDocument?.status === "pending" &&
            existingDocument?.isUploaded;
          const isVerified = existingDocument?.verified === true;
          const isRejected = existingDocument?.status === "rejected";

          // Allow re-upload if:
          // 1. No document exists, OR
          // 2. Document exists but is NOT approved/verified
          const canUpload = !existingDocument || !existingDocument?.verified;

          // Get expiry date for this document type (from existing document or document type)
          // Check both the existing document and the document type for expiry date
          const currentExpiryDate = existingDocument?.expiryDate || docType.expiryDate;
          
          console.log(`Document ${docType.name} - existingDocument expiryDate:`, existingDocument?.expiryDate);
          console.log(`Document ${docType.name} - docType expiryDate:`, docType.expiryDate);
          console.log(`Document ${docType.name} - currentExpiryDate:`, currentExpiryDate);
          
          // Ensure existingDocument includes expiry date if available
          const existingDocumentWithExpiry = existingDocument
            ? {
                ...existingDocument,
                expiryDate: existingDocument.expiryDate || docType.expiryDate || undefined,
              }
            : undefined;
          
          return (
            <View key={docType.id} style={styles.documentItem}>
              <DocumentUploader
                documentType={docType.name}
                title={docType.displayName}
                description={docType.description}
                requiresExpiry={docType.requiresExpiry}
                rejectionReason={isRejected ? (existingDocument as any)?.rejectionReason : undefined}
                onUpload={(document, expiryDate) => {
                  // Use existing expiry date if available, otherwise use the one from DocumentUploader
                  const expiryToUse = currentExpiryDate || expiryDate;
                  // Normalize the expiry date before passing to handleUploadDocument
                  const normalizedExpiry = normalizeExpiryDate(expiryToUse);
                  console.log(`Uploading document ${docType.name} - expiryToUse (raw):`, expiryToUse);
                  console.log(`Uploading document ${docType.name} - normalizedExpiry:`, normalizedExpiry);
                  handleUploadDocument(document, docType.id, normalizedExpiry);
                }}
                onExpiryDateUpdate={(expiryDate) => {
                  // Update expiry date via API without uploading a new file
                  if (existingDocument) {
                    handleUpdateExpiryDate(docType.id, expiryDate);
                  }
                }}
                onDelete={(documentId) => {
                  // Remove the deleted document from local state
                  setDocuments((prev) =>
                    prev.filter((doc) => doc.documentId !== documentId)
                  );
                  // Update user profile
                  if (userProfile) {
                    updateProfile({
                      ...userProfile,
                      documents: documents.filter(
                        (doc) => doc.documentId !== documentId
                      ),
                    } as any);
                  }
                }}
                existingDocument={existingDocumentWithExpiry}
              />
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header title={t("profile.documents.title")} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>{t("documents.subtitle")}</Text>

        {renderAllDocuments()}
      </ScrollView>
    </View>
  );
}

export { DocumentsScreen };
