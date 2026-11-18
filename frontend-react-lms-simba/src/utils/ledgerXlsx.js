// Ekspor leger ke .xlsx. exceljs dimuat lazy agar tidak membebani bundle awal.
export async function buildLedgerXlsx(rows, meta) {
  const { default: ExcelJS } = await import('exceljs')
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Leger')
  ws.addRow([`Leger ${meta.className} — ${meta.term}`]).font = { bold: true, size: 14 }
  ws.addRow([`KKTP: ${meta.kktp} · Rumus NA: ${meta.formula}`])
  ws.addRow([])
  ws.addRow(['No', 'NISN', 'Nama Siswa', 'Rata Tugas (30%)', 'Rata Kuis CBT (30%)', 'Skor PTS (40%)', 'Nilai Akhir', 'Predikat', 'Status']).font = { bold: true }
  rows.forEach((r) => ws.addRow([r.no, r.nisn, r.name, r.tugas, r.cbt, r.pts, r.na, r.predikat, r.tuntas ? 'Tuntas' : 'Belum Tuntas']))
  ws.columns.forEach((c, i) => { c.width = i === 2 ? 28 : 16 })
  ws.getColumn(2).numFmt = '@'
  return wb.xlsx.writeBuffer()
}

export async function downloadLedgerXlsx(rows, meta) {
  const buf = await buildLedgerXlsx(rows, meta)
  const url = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
  Object.assign(document.createElement('a'), { href: url, download: `leger-${meta.className.replace(/\s+/g, '-')}.xlsx` }).click()
  URL.revokeObjectURL(url)
}
