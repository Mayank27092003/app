/**
 * Generate a unique contract number
 * Format: CON-YYYYMMDD-XXXXX
 */
export function generateContractNumber(): string {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0');
  
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
  
  return `CON-${dateStr}-${randomStr}`;
}

/**
 * Generate a unique job number
 * Format: JOB-YYYYMMDD-XXXXX
 */
export function generateJobNumber(): string {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0');
  
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
  
  return `JOB-${dateStr}-${randomStr}`;
}

/**
 * Validate contract number format
 */
export function validateContractNumber(contractNumber: string): boolean {
  const pattern = /^CON-\d{8}-[A-Z0-9]{5}$/;
  return pattern.test(contractNumber);
}

/**
 * Validate job number format
 */
export function validateJobNumber(jobNumber: string): boolean {
  const pattern = /^JOB-\d{8}-[A-Z0-9]{5}$/;
  return pattern.test(jobNumber);
}
