import { create } from 'zustand'

export const useCalculadoraStore = create((set) => ({
  datosCalculadora: null,
  setDatosCalculadora: (datos) => set({ datosCalculadora: datos }),
  limpiarCalculadora: () => set({ datosCalculadora: null }),
}))
