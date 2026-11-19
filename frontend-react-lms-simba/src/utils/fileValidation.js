export const ALLOWED_EXT = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png']
export const MAX_MB = 5
export const MAX_FILES = 3
export const fmtSize = (b) => (b < 1048576 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1048576).toFixed(1).replace('.', ',')} MB`)
export const extOf = (name) => (name.includes('.') ? name.split('.').pop().toLowerCase() : '')

// file: objek dengan { name, size } (File atau metadata).
export function validateFile(file, existing = []) {
  if (!ALLOWED_EXT.includes(extOf(file.name))) return `"${file.name}": tipe tidak didukung (hanya ${ALLOWED_EXT.join(', ').toUpperCase()}).`
  if (file.size > MAX_MB * 1048576) return `"${file.name}": ukuran ${fmtSize(file.size)} melebihi batas ${MAX_MB} MB.`
  if (file.size === 0) return `"${file.name}": berkas kosong.`
  if (existing.some((f) => f.name === file.name)) return `"${file.name}": sudah dilampirkan.`
  if (existing.length >= MAX_FILES) return `Maksimal ${MAX_FILES} lampiran.`
  return null
}

export function validateSubmission({ answer = '', files = [] }) {
  const errors = {}
  const text = answer.trim()
  if (!text && files.length === 0) errors.answer = 'Tulis jawaban atau lampirkan minimal satu berkas.'
  else if (text && text.length < 10) errors.answer = 'Jawaban minimal 10 karakter.'
  else if (text.length > 5000) errors.answer = 'Jawaban maksimal 5.000 karakter.'
  if (files.length > MAX_FILES) errors.files = `Maksimal ${MAX_FILES} lampiran.`
  files.forEach((f) => { const e = validateFile(f, []); if (e && !errors.files) errors.files = e })
  return errors
}
