const CATEGORIES = [
  'SOFTWARE_ENGINEERING',
  'DATA',
  'CYBERSECURITY',
  'PRODUCT',
  'UI_UX',
  'MARKETING',
  'SALES',
  'BUSINESS_DEVELOPMENT',
  'FINANCE',
  'HR',
  'OPERATIONS',
  'CUSTOMER_SUCCESS',
  'OTHER',
];

const CATEGORY_SUBCATEGORIES = {
  SOFTWARE_ENGINEERING: [
    'SE_WEB',
    'SE_MOBILE',
    'SE_BACKEND',
    'SE_DEVOPS',
    'SE_FINTECH',
    'SE_HEALTHTECH',
    'SE_ECOMMERCE',
  ],
  DATA: [
    'DATA_ANALYTICS',
    'DATA_SCIENCE',
    'DATA_ENGINEERING',
    'DATA_ML',
    'DATA_BI',
  ],
  CYBERSECURITY: [
    'SEC_APP',
    'SEC_NETWORK',
    'SEC_GRC',
    'SEC_SOC',
  ],
  FINANCE: [
    'FIN_ACCOUNTING',
    'FIN_AUDIT',
    'FIN_FPNA',
    'FIN_INVEST',
  ],
};

const ALL_SUBCATEGORY_VALUES = Object.values(CATEGORY_SUBCATEGORIES).flat();

const isValidSubCategory = (category, subCategory) => {
  if (!subCategory) return true;
  const allowed = CATEGORY_SUBCATEGORIES[String(category)] || [];
  return allowed.includes(String(subCategory));
};

module.exports = {
  CATEGORIES,
  CATEGORY_SUBCATEGORIES,
  ALL_SUBCATEGORY_VALUES,
  isValidSubCategory,
};
