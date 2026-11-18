// Lapisan abstraksi data. Pada fase API, ganti isi createResource
// dengan pemanggilan fetch ke endpoint Laravel (mis. /api/classes)
// tanpa mengubah antarmuka (list/get/create/update/remove) yang dipakai halaman.
export const delay = (data, ms = 250) => new Promise((resolve) => setTimeout(() => resolve(structuredClone(data)), ms))

export function createResource(seed) {
  let items = [...seed]
  return {
    list: () => delay(items),
    get: (id) => delay(items.find((i) => i.id === id) ?? null),
    create: (payload) => {
      const item = { ...payload, id: Date.now() }
      items = [item, ...items]
      return delay(item)
    },
    update: (id, payload) => {
      items = items.map((i) => (i.id === id ? { ...i, ...payload } : i))
      return delay(items.find((i) => i.id === id))
    },
    remove: (id) => {
      items = items.filter((i) => i.id !== id)
      return delay({ id })
    },
  }
}
