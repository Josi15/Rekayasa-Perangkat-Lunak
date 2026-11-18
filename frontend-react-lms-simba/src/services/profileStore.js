import { teacherHome } from '../data/teacherHome'

export const profileStore = {
  name: 'Bu Ratna Wulandari', nip: teacherHome.nip, nuptk: '8443760662300052', subject: `${teacherHome.subject} (Fase E - Kelas X & XI)`,
  email: 'guru@simba.test', phone: '+62 812-9843-2210', address: 'Kebayoran Baru, Jakarta Selatan, DKI Jakarta 12130',
  photo: null, twoFA: true, updatedAt: null,
  otherSessions: [{ id: 2, device: 'Safari di iPhone', location: 'Semarang, Indonesia', lastActive: 'Kemarin 20:14' }],
}
