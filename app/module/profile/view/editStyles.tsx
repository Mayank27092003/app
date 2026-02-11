import { Colors, ScaledSheet } from '@app/styles';

export const getStyles = () =>
    ScaledSheet.create({
container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: '100@ms',
  },
  title: {
    fontSize: '18@ms',
      fontWeight: '600',
    color: Colors.text,
    // left:20,
    // marginBottom: 14,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.gray400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  changePhotoText: {
    fontSize: 14,
    color: Colors.gray600,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: Colors.text,
  },
  merchantTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  merchantTypeOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.gray300,
    backgroundColor: Colors.white,
  },
  merchantTypeSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  merchantTypeText: {
    fontSize: 14,
    color: Colors.gray700,
  },
  merchantTypeTextSelected: {
    color: Colors.primary,
    fontWeight: '500',
  },
  industryTypeText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  saveButton: {
    marginTop: 8,
  },
  headerBack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: '20@ms',
    paddingVertical: '15@ms',
    // paddingTop: '40@ms',
    // paddingBottom: '20@ms',
    backgroundColor: Colors.backgroundLight,
  },
  backButton: {
    width: '40@ms',
    height: '40@ms',
    borderRadius: '20@ms',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContainer: {
    marginBottom: 16,
    zIndex: 3000,
    elevation: 5,
  },
  dropdown: {
    backgroundColor: Colors.backgroundCard,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 50,
  },
  dropdownContainerStyle: {
    backgroundColor: Colors.backgroundCard,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownText: {
    color: Colors.text,
    fontSize: 16,
  },
  placeholderStyle: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
  datePickerButton: {
    marginBottom: 16,
  },
  datePickerLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  datePickerInput: {
    backgroundColor: Colors.backgroundCard,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 50,
    justifyContent: 'center',
  },
  datePickerText: {
    fontSize: 16,
    color: Colors.text,
  },
  placeholderText: {
    color: Colors.textSecondary,
  },
  // Country picker styles
  countryContainer: {
    marginBottom: 16,
  },
  countryPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
    borderColor: Colors.gray300,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 48,
    justifyContent: 'space-between',
  },
  countryPickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  countryFlag: {
    fontSize: 20,
    marginRight: 12,
  },
  countryNameText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
    flex: 1,
  },


  phonePrefix: {
    paddingRight: 8,
    borderRightWidth: 1,
    borderRightColor: Colors.gray300,
    marginRight: 8,
  },
  phonePrefixText: {
    color: Colors.text,
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: Colors.backgroundCard,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  countryList: {
    maxHeight: 400,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    marginLeft: 12,
  },
  countryCode: {
    fontSize: 14,
    color: Colors.gray500,
  },
  autoFillNote: {
    fontSize: 12,
    color: Colors.primary,
    fontStyle: 'italic',
    marginBottom: 16,
    marginTop: -8,
  },
});