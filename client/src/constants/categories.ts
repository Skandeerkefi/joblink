export const CATEGORIES = [
  { value: 'SOFTWARE_ENGINEERING', label: 'Informatique / Software Engineering' },
  { value: 'DATA', label: 'Data & AI' },
  { value: 'CYBERSECURITY', label: 'Cybersecurity' },
  { value: 'PRODUCT', label: 'Product' },
  { value: 'UI_UX', label: 'UI/UX' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'SALES', label: 'Sales' },
  { value: 'BUSINESS_DEVELOPMENT', label: 'Business Development' },
  { value: 'FINANCE', label: 'Finance' },
  { value: 'HR', label: 'HR' },
  { value: 'OPERATIONS', label: 'Operations' },
  { value: 'CUSTOMER_SUCCESS', label: 'Customer Success' },
  { value: 'OTHER', label: 'Other' },
]

export const CATEGORY_SUBCATEGORIES: Record<string, Array<{ value: string; label: string }>> = {
  SOFTWARE_ENGINEERING: [
    { value: 'SE_WEB', label: 'Web Development' },
    { value: 'SE_MOBILE', label: 'Mobile Development' },
    { value: 'SE_BACKEND', label: 'Backend & APIs' },
    { value: 'SE_DEVOPS', label: 'Cloud & DevOps' },
    { value: 'SE_FINTECH', label: 'FinTech' },
    { value: 'SE_HEALTHTECH', label: 'HealthTech / Medical' },
    { value: 'SE_ECOMMERCE', label: 'E-commerce' },
  ],
  DATA: [
    { value: 'DATA_ANALYTICS', label: 'Analytics' },
    { value: 'DATA_SCIENCE', label: 'Data Science' },
    { value: 'DATA_ENGINEERING', label: 'Data Engineering' },
    { value: 'DATA_ML', label: 'Machine Learning' },
    { value: 'DATA_BI', label: 'Business Intelligence' },
  ],
  CYBERSECURITY: [
    { value: 'SEC_APP', label: 'Application Security' },
    { value: 'SEC_NETWORK', label: 'Network Security' },
    { value: 'SEC_GRC', label: 'GRC & Compliance' },
    { value: 'SEC_SOC', label: 'SOC & Incident Response' },
  ],
  FINANCE: [
    { value: 'FIN_ACCOUNTING', label: 'Accounting' },
    { value: 'FIN_AUDIT', label: 'Audit' },
    { value: 'FIN_FPNA', label: 'FP&A' },
    { value: 'FIN_INVEST', label: 'Investment' },
  ],
}

export const ALL_SUBCATEGORY_VALUES = Object.values(CATEGORY_SUBCATEGORIES).flat().map((item) => item.value)

export function getSubcategoriesByCategory(category: string) {
  return CATEGORY_SUBCATEGORIES[category] || []
}

export function getSubcategoryLabel(category: string, subCategory?: string) {
  if (!subCategory) return ''
  return getSubcategoriesByCategory(category).find((sc) => sc.value === subCategory)?.label || subCategory
}

export const JOB_TYPES = [
  { value: 'FULL_TIME', label: 'Full Time' },
  { value: 'PART_TIME', label: 'Part Time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'INTERNSHIP', label: 'Internship' },
  { value: 'REMOTE', label: 'Remote' },
]

export const EXPERIENCE_LEVELS = [
  { value: 'DEBUTANT', label: 'Débutant' },
  { value: 'JUNIOR', label: 'Junior' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'SENIOR', label: 'Senior' },
]

export const APPLICATION_STATUSES = [
  { value: 'APPLIED', label: 'Applied' },
  { value: 'VIEWED', label: 'Viewed' },
  { value: 'INTERVIEW', label: 'Interview' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'HIRED', label: 'Hired' },
]
