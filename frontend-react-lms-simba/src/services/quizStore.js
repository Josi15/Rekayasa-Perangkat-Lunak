import { quizSeeds } from '../data/quizzes'

export const quizStore = { quizzes: quizSeeds.map((q) => ({ ...q })), nextId: 7, updatedAt: Date.now(), token: { value: 'MTK-7829', issuedAt: Date.now() } }
