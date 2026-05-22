import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/hooks/useAuth'
import ProtectedRoute from '@/components/shared/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Calculadora from '@/pages/Calculadora'
import Pedidos from '@/pages/Pedidos'
import NuevoPedido from '@/pages/NuevoPedido'
import DetallePedido from '@/pages/DetallePedido'
import Inventario from '@/pages/Inventario'
import Pagos from '@/pages/Pagos'
import Finanzas from '@/pages/Finanzas'
import Clientes from '@/pages/Clientes'
import DetalleCliente from '@/pages/DetalleCliente'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#1A1A2E',
              color: '#F5F5F5',
              border: '1px solid #2A2A4A',
              borderRadius: '10px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#27AE60', secondary: '#F5F5F5' } },
            error: { iconTheme: { primary: '#E74C3C', secondary: '#F5F5F5' } },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="calculadora" element={<Calculadora />} />
            <Route path="pedidos" element={<Pedidos />} />
            <Route path="pedidos/nuevo" element={<NuevoPedido />} />
            <Route path="pedidos/:id" element={<DetallePedido />} />
            <Route path="inventario" element={<Inventario />} />
            <Route path="pagos" element={<Pagos />} />
            <Route path="finanzas" element={<Finanzas />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="clientes/:id" element={<DetalleCliente />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
