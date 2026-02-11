import { User, CompanyUser, Company } from "../../models";
import { UserVerificationStatus, UserVerificationStatusType } from "../../constants/enum";
import { raw } from "objection";

type SortableColumn = "createdAt" | "updatedAt" | "userName" | "email" | "firstName" | "lastName" | "verificationStatus";

interface GetUsersOptions {
  userName?: string;
  role?: string;
  verificationStatus?: UserVerificationStatusType;
  page?: number;
  limit?: number;
  sortBy?: SortableColumn;
  sortOrder?: "asc" | "desc";
  lat?: number;
  lng?: number;
  radius?: number; // in miles, default 50
  ownCompany?: boolean; // Filter to show only company users of logged-in user
  excludeCompany?: boolean; // Filter to show users not in any company (or not in logged-in user's companies)
  loggedInUserId?: number; // ID of the logged-in user (required for ownCompany/excludeCompany filters)
}

interface PaginatedUsers {
  users: User[];
  page: number;
  limit: number;
  totalUsers: number;
  totalPages: number;
  counts: {
    pending: number;
    active: number;
    suspended: number;
    rejected: number;
  };
}

export class UserService {
    async getUsers(options: GetUsersOptions): Promise<PaginatedUsers> {
        const { 
          userName, 
          role, 
          verificationStatus, 
          page = 1, 
          limit = 10, 
          sortBy = "createdAt", 
          sortOrder = "desc",
          lat,
          lng,
          radius = 50, // default 50 miles
          ownCompany = false,
          excludeCompany = false,
          loggedInUserId
        } = options;
        const pageNum = Number(page);
        const limitNum = Number(limit);
      
        // Validate and map sortBy to database column
        const validSortColumns: Record<SortableColumn, string> = {
          createdAt: "createdAt",
          updatedAt: "updatedAt",
          userName: "userName",
          email: "email",
          firstName: "firstName",
          lastName: "lastName",
          verificationStatus: "verificationStatus",
        };
        
        const sortColumn = validSortColumns[sortBy] || validSortColumns.createdAt;
      
        // Base query
        let query = User.query()
          .whereNull("users.deletedAt")
          .joinRelated("roles.role") // inner join ensures only users with roles are included
          // .whereNot("roles:role.name", "admin") // exclude admin users
          .withGraphFetched("[roles.role , company , trucks.truckType, driver, location]")
      
        // Filter by username - search in userName, email, firstName, lastName, or fullName (case-insensitive)
        if (userName) {
          const searchTerm = `%${userName.toLowerCase()}%`;
          query = query.where((qb) => {
            qb.whereRaw("LOWER(users.\"userName\") LIKE ?", [searchTerm])
              .orWhereRaw("LOWER(users.email) LIKE ?", [searchTerm])
              .orWhereRaw("LOWER(users.\"firstName\") LIKE ?", [searchTerm])
              .orWhereRaw("LOWER(users.\"lastName\") LIKE ?", [searchTerm])
              .orWhereRaw(
                "LOWER(TRIM(CONCAT(COALESCE(users.\"firstName\", ''), ' ', COALESCE(users.\"middleName\", ''), ' ', COALESCE(users.\"lastName\", '')))) LIKE ?",
                [searchTerm]
              );
          });
        }
      
        // Filter by specific role if provided
        if (role) {
          query = query.andWhere("roles:role.name", role);
        }

        // Filter by company membership
        if (ownCompany && loggedInUserId) {
          // Step 1: Get all company IDs from companies table (where user is owner)
          const ownedCompanies = await Company.query()
            .where({ userId: loggedInUserId })
            .select("id");
          
          // Step 2: Get all company IDs from companyUsers table (where user is a member)
          const memberCompanies = await CompanyUser.query()
            .where({ userId: loggedInUserId })
            .select("companyId");
          
          // Combine both: companies owned by user + companies where user is a member
          const companyIds = [
            ...ownedCompanies.map(c => c.id),
            ...memberCompanies.map(cu => cu.companyId)
          ];
          
          // Remove duplicates
          const uniqueCompanyIds = [...new Set(companyIds)];
          
          if (uniqueCompanyIds.length > 0) {
            // Step 3: Find all users who are in these companies
            // Filter by companyId - find all userIds where companyId matches
            query = query.whereIn("users.id", 
              CompanyUser.query()
                .select("userId")
                .whereIn("companyId", uniqueCompanyIds)
            );
          } else {
            // If logged-in user has no companies, return empty result
            query = query.whereRaw("1 = 0");
          }
        } else if (excludeCompany) {
          if (loggedInUserId) {
            // Get company IDs from companies table (where user is owner)
            const ownedCompanies = await Company.query()
              .where({ userId: loggedInUserId })
              .select("id");
            
            // Get company IDs from companyUsers table (where user is a member)
            const memberCompanies = await CompanyUser.query()
              .where({ userId: loggedInUserId })
              .select("companyId");
            
            // Combine both
            const companyIds = [
              ...ownedCompanies.map(c => c.id),
              ...memberCompanies.map(cu => cu.companyId)
            ];
            
            const uniqueCompanyIds = [...new Set(companyIds)];
            
            if (uniqueCompanyIds.length > 0) {
              // Show users who are NOT in the logged-in user's companies
              // This excludes users even if they are in other companies too
              query = query.whereNotExists(
                CompanyUser.query()
                  .whereColumn("companyUsers.userId", "users.id")
                  .whereIn("companyUsers.companyId", uniqueCompanyIds)
              );
            }
            // If logged-in user has no companies, show all users (no filter)
          } else {
            // If no logged-in user, show users who are not in ANY company
            query = query.whereNotExists(
              CompanyUser.query()
                .whereColumn("companyUsers.userId", "users.id")
            );
          }
        }

        // Filter by verification status if provided
        if (verificationStatus) {
          query = query.andWhere("users.verificationStatus", verificationStatus);
        }

        // Filter by location if lat and lng are provided
        if (lat && lng) {
          const latNum = Number(lat);
          const lngNum = Number(lng);
          const radiusNum = Number(radius);

          if (isNaN(latNum) || isNaN(lngNum) || isNaN(radiusNum)) {
            throw new Error("Invalid lat, lng, or radius values");
          }

          // Join with userLocations table
          query = query
            .leftJoin("userLocations", "users.id", "userLocations.userId")
            .whereNotNull("userLocations.lat")
            .whereNotNull("userLocations.lng");

          // Haversine formula to calculate distance in miles
          // 3959 is Earth's radius in miles
          const distanceSql = raw(
            `3959 * acos(
              cos(radians(?)) * cos(radians(userLocations.lat)) *
              cos(radians(userLocations.lng) - radians(?)) +
              sin(radians(?)) * sin(radians(userLocations.lat))
            )`,
            [latNum, lngNum, latNum]
          );

          query = query
            .whereRaw(
              `3959 * acos(
                cos(radians(?)) * cos(radians(userLocations.lat)) *
                cos(radians(userLocations.lng) - radians(?)) +
                sin(radians(?)) * sin(radians(userLocations.lat))
              ) <= ?`,
              [latNum, lngNum, latNum, radiusNum]
            )
            .select(
              raw("users.*"),
              distanceSql.as("distance")
            );
        }
      
        // Get total count before pagination
        const totalUsers = await query.resultSize();
      
        // Get user status counts (pending, active, suspended)
        // Base query for counts (same filters but without pagination)
        const baseCountQuery = User.query()
          .whereNull("users.deletedAt")
          .joinRelated("roles.role")
          // .whereNot("roles:role.name", "admin");

        // Apply same filters as main query for counts
        if (userName) {
          const searchTerm = `%${userName.toLowerCase()}%`;
          baseCountQuery.where((qb) => {
            qb.whereRaw("LOWER(users.\"userName\") LIKE ?", [searchTerm])
              .orWhereRaw("LOWER(users.email) LIKE ?", [searchTerm])
              .orWhereRaw("LOWER(users.\"firstName\") LIKE ?", [searchTerm])
              .orWhereRaw("LOWER(users.\"lastName\") LIKE ?", [searchTerm])
              .orWhereRaw(
                "LOWER(TRIM(CONCAT(COALESCE(users.\"firstName\", ''), ' ', COALESCE(users.\"middleName\", ''), ' ', COALESCE(users.\"lastName\", '')))) LIKE ?",
                [searchTerm]
              );
          });
        }

        if (role) {
          baseCountQuery.andWhere("roles:role.name", role);
        }

        // Apply company membership filters to count query as well
        if (ownCompany && loggedInUserId) {
          // Get company IDs from companies table (where user is owner)
          const ownedCompanies = await Company.query()
            .where({ userId: loggedInUserId })
            .select("id");
          
          // Get company IDs from companyUsers table (where user is a member)
          const memberCompanies = await CompanyUser.query()
            .where({ userId: loggedInUserId })
            .select("companyId");
          
          // Combine both
          const companyIds = [
            ...ownedCompanies.map(c => c.id),
            ...memberCompanies.map(cu => cu.companyId)
          ];
          
          const uniqueCompanyIds = [...new Set(companyIds)];
          
          if (uniqueCompanyIds.length > 0) {
            // Filter by companyId - find all userIds where companyId matches
            baseCountQuery.whereIn("users.id", 
              CompanyUser.query()
                .select("userId")
                .whereIn("companyId", uniqueCompanyIds)
            );
          } else {
            baseCountQuery.whereRaw("1 = 0");
          }
        } else if (excludeCompany) {
          if (loggedInUserId) {
            // Get company IDs from companies table (where user is owner)
            const ownedCompanies = await Company.query()
              .where({ userId: loggedInUserId })
              .select("id");
            
            // Get company IDs from companyUsers table (where user is a member)
            const memberCompanies = await CompanyUser.query()
              .where({ userId: loggedInUserId })
              .select("companyId");
            
            // Combine both
            const companyIds = [
              ...ownedCompanies.map(c => c.id),
              ...memberCompanies.map(cu => cu.companyId)
            ];
            
            const uniqueCompanyIds = [...new Set(companyIds)];
            
            if (uniqueCompanyIds.length > 0) {
              // Exclude users who are in the logged-in user's companies
              // This excludes users even if they are in other companies too
              baseCountQuery.whereNotExists(
                CompanyUser.query()
                  .whereColumn("companyUsers.userId", "users.id")
                  .whereIn("companyUsers.companyId", uniqueCompanyIds)
              );
            }
          } else {
            baseCountQuery.whereNotExists(
              CompanyUser.query()
                .whereColumn("companyUsers.userId", "users.id")
            );
          }
        }

        if (verificationStatus) {
          baseCountQuery.andWhere("users.verificationStatus", verificationStatus);
        }

        // Apply location filter to count query as well
        if (lat && lng) {
          const latNum = Number(lat);
          const lngNum = Number(lng);
          const radiusNum = Number(radius);

          if (!isNaN(latNum) && !isNaN(lngNum) && !isNaN(radiusNum)) {
            baseCountQuery
              .leftJoin("userLocations", "users.id", "userLocations.userId")
              .whereNotNull("userLocations.lat")
              .whereNotNull("userLocations.lng")
              .whereRaw(
                `3959 * acos(
                  cos(radians(?)) * cos(radians(userLocations.lat)) *
                  cos(radians(userLocations.lng) - radians(?)) +
                  sin(radians(?)) * sin(radians(userLocations.lat))
                ) <= ?`,
                [latNum, lngNum, latNum, radiusNum]
              );
          }
        }

        // Get counts for each status
        const pendingCount = await baseCountQuery
          .clone()
          .where("users.verificationStatus", "pending")
          .resultSize();

        const activeCount = await baseCountQuery
          .clone()
          .whereIn("users.verificationStatus", [
            "profile_complete",
            "documents_verified",
            "admin_verified",
            "fully_verified"
          ])
          .resultSize();

        const suspendedCount = await baseCountQuery
          .clone()
          .where("users.verificationStatus", "suspended")
          .resultSize();
        
        const rejectedCount = await baseCountQuery
          .clone()
          .where("users.verificationStatus", "rejected")
          .resultSize();        
      
        // Apply sorting last, then pagination and eager load relations
        // If location filter is applied, sort by distance first, then by the specified column
        let orderQuery = query;
        if (lat && lng) {
          orderQuery = orderQuery.orderBy("distance", "asc").orderBy(sortColumn, sortOrder);
        } else {
          orderQuery = orderQuery.orderBy(sortColumn, sortOrder);
        }

        // If ownCompany filter was applied, we already have a groupBy, so we need to handle it
        const users = await orderQuery
          .offset((pageNum - 1) * limitNum)
          .limit(limitNum)
          .withGraphFetched("[roles.role, company, driver, location]"); // fetch roles, company, driver, location
      
        const totalPages = Math.ceil(totalUsers / limitNum);
      
        return {
          users,
          page: pageNum,
          limit: limitNum,
          totalUsers,
          totalPages,
          counts: {
            pending: pendingCount,
            active: activeCount,
            suspended: suspendedCount,
            rejected: rejectedCount,
          },
        };
      }
      
}

export default new UserService();
