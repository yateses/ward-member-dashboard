export interface Member {
  id?: string // Firestore document ID
  preferredName: string
  headOfHouse: string
  addressStreet1: string
  age: number
  baptismDate?: string | null
  birthDate?: string | null
  callings?: string[]
  birthDay?: number | null
  birthMonth?: string | null
  birthYear?: number | null
  birthplace?: string | null
  gender: 'M' | 'F'
  individualPhone?: string | null
  individualEmail?: string | null
  marriageDate?: string | null
  priesthoodOffice?: string | null
  templeRecommendExpirationDate?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface MemberImportData {
  PREFERRED_NAME: string
  HEAD_OF_HOUSE: string
  ADDRESS_STREET_1: string
  AGE: string
  BAPTISM_DATE: string
  BIRTH_DATE: string
  CALLINGS: string
  BIRTH_DAY: string
  BIRTH_MONTH: string
  BIRTH_YEAR: string
  BIRTHPLACE: string
  GENDER: string
  INDIVIDUAL_PHONE: string
  INDIVIDUAL_EMAIL: string
  MARRIAGE_DATE: string
  PRIESTHOOD_OFFICE: string
  TEMPLE_RECOMMEND_EXPIRATION_DATE: string
}

export interface Household {
  id?: string
  headOfHouse: string
  address: string
  members: Member[]
  createdAt: Date
  updatedAt: Date
} 