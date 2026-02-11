import { User } from "../../models";
import { HttpException } from "../../utils/httpException";
import { UserVerificationService } from "./verification.service";
import documentService, { DocumentRequirement } from "../document";
import { DashboardService } from "../dashboard";

export class UserService {
  static async getByEmail(email: string) {
    const user = await User.query().findOne({ email });
    return user;
  }

  static async getById(id: number) {
    const user = await User.query().findById(id);
    return user;
  }

  static async requireByEmail(email: string) {
    const user = await User.query().findOne({ email });
    if (!user) {
      throw new HttpException("User not found", 404);
    }
    return user;
  }

  static async requireById(id: number) {
    const user = await User.query().findById(id);
    if (!user) {
      throw new HttpException("User not found", 404);
    }
    return user;
  }

  static async getProfileById(id: number) {
    const verificationService = new UserVerificationService();
    const dashboardService = new DashboardService();

    // Fetch user with all related data
    const user = await User.query()
      .findById(id)
      .withGraphFetched(
        "[roles.role, company, companyMemberships.role, driver, verifiedByUser]"
      );

    if (!user) {
      throw new HttpException("User not found", 404);
    }

    // Get verification summary
    const verificationSummary =
      await verificationService.getVerificationSummary(id);

    // Get required documents (includes pending ones)
    let requiredDocuments: DocumentRequirement[] = [];
    try {
      requiredDocuments = await documentService.getRequiredDocuments(id);
    } catch (error) {
      // If user has no roles, return empty array instead of throwing
      requiredDocuments = [];
    }

    // Get dashboard data (rating and completed jobs count)
    const dashboardData = await dashboardService.getUserDashboard(id);

    // Prepare comprehensive profile data
    const profileData = {
      // Basic user info
      userId: user.id,
      id: user.id,
      firstName: user.firstName,
      middleName: user.middleName,
      lastName: user.lastName,
      fullName: user.fullName,
      userName: user.userName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      phoneCountryCode: user.phoneCountryCode,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,

      // Email verification
      isEmailVerified: !!user.isEmailVerified,
      emailVerifiedAt: user.emailVerifiedAt,

      // Verification status
      verification: verificationSummary,

      // Roles and permissions
      roles:
        user.roles?.map((userRole) => ({
          id: userRole.roleId,
          role: userRole.role
            ? {
                id: userRole.role.id,
                name: userRole.role.name,
                description: userRole.role.description,
                isCompanyRole: userRole.role.isCompanyRole,
                jobPostFee: userRole.role.jobPostFee,
                sortOrder: userRole.role.sortOrder,
              }
            : null,
          sortOrder: userRole.sortOrder,
          assignedAt: userRole.assignedAt,
        })) || [],

      // Documents (includes pending requirements)
      documents: requiredDocuments.map((req) => ({
        id: req.documentId || null,
        documentType: {
          id: req.id,
          name: req.name,
          displayName: req.displayName,
          description: req.description,
          requiresExpiry: req.requiresExpiry,
          requiresSides: req.requiresSides,
          acceptsTextInput: req.acceptsTextInput,
        },
        isOptional: req.isOptional,
        isUploaded: req.isUploaded,
        fileUrl: req.fileUrl || null,
        textValue: req.textValue || null,
        expiryDate: req.expiryDate || null,
        verified: req.verified,
        status: req.status,
        verifiedAt: req.verifiedAt || null,
        rejectedAt: req.rejectedAt || null,
        verifiedBy: req.verifiedBy || null,
        rejectedBy: req.rejectedBy || null,
        rejectionReason: req.rejectionReason || null,
        createdAt: req.createdAt || null,
        updatedAt: req.updatedAt || null,
        sides: req.requiresSides ? (req.sides || []) : undefined,
      })),

      // Company information
      company: user.company
        ? {
            id: user.company.id,
            companyName: user.company.companyName,
            industryType: user.company.industryType,
            contactNumber: user.company.contactNumber,
            phoneNumber: user.company.phoneNumber,
            address: user.company.address,
            country: user.company.country,
            state: user.company.state,
            city: user.company.city,
            zipCode: user.company.zipCode,
            createdAt: user.company.createdAt,
            updatedAt: user.company.updatedAt,
          }
        : null,

      // Company memberships (if user is part of other companies)
      companyMemberships:
        user.companyMemberships?.map((membership) => ({
          id: membership.id,
          company: {
            id: membership.company?.id,
            companyName: membership.company?.companyName,
            industryType: membership.company?.industryType,
            contactNumber: membership.company?.contactNumber,
            phoneNumber: membership.company?.phoneNumber,
            address: membership.company?.address,
            country: membership.company?.country,
            state: membership.company?.state,
            city: membership.company?.city,
            zipCode: membership.company?.zipCode,
          },
          roleId: membership.roleId,
          role: membership.role ? {
            id: membership.role.id,
            name: membership.role.name,
            description: membership.role.description,
          } : null,
          isPrimary: membership.isPrimary,
        })) || [],

      // Driver information (if applicable)
      driver: user.driver
        ? {
            id: user.driver.id,
            licenseNumber: user.driver.licenseNumber,
            twicNumber: user.driver.twicNumber,
            medicalCertificate: user.driver.medicalCertificate,
            drugTestResult: user.driver.drugTestResult,
            verified: user.driver.verified,
            workRadius: user.driver.workRadius,
            createdAt: user.driver.createdAt,
            updatedAt: user.driver.updatedAt,
          }
        : null,

      // Verification metadata
      verifiedBy: user.verifiedByUser
        ? {
            id: user.verifiedByUser.id,
            fullName: user.verifiedByUser.fullName,
            email: user.verifiedByUser.email,
          }
        : null,

      // Rating information
      rating: dashboardData.ratings,

      // Total completed jobs count
      totalCompletedJobs: dashboardData.totalCompletedJobs,
    };

    return profileData;
  }

  // Add more reusable methods as needed
}

export default new UserService();
