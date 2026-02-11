
import knex from 'knex';
import config from './src/database/knexfile';

const db = knex(config.development);

async function checkData() {
    try {
        console.log("Checking 'roleCategories'...");
        const cats = await db("roleCategories").select("*");
        console.log("RoleCategories:", cats);

        console.log("Checking 'roles'...");
        const roles = await db("roles").select("id", "name", "categoryId");
        console.log("Roles:", roles);

        const companyTypes = await db("companyTypes").select("*");
        console.log("CompanyTypes:", companyTypes);

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    } finally {
        await db.destroy();
    }
}

checkData();
