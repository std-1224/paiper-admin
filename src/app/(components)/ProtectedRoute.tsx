import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/context/AuthContext'
import type { UserRole } from '@/context/AuthContext'  // Asegúrate de exportar UserRole en tu AuthContext

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

// En lugar de usar React.FC, definimos el componente como una función normal con tipado explícito
const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  // const { user, loading } = useAuth()
  // const router = useRouter()

  // useEffect(() => {
  //   if (!loading) {
  //     // Si no hay usuario autenticado, redirigir al login
  //     if (!user) {
  //       router.push('/login')
  //       return
  //     }

  //     // Si hay roles permitidos especificados y el usuario no tiene uno de esos roles
  //     if (allowedRoles && !allowedRoles.includes(user.role)) {
  //       // Redirigir según el rol del usuario
  //       if (user.role === 'client') {
  //         router.push('/menu')
  //       } else {
  //         router.push('/dashboard')
  //       }
  //     }
  //   }
  // }, [user, loading, router, allowedRoles])

  // // Mostrar nada mientras carga
  // if (loading) return <div>Cargando...</div>

  // // Si no hay usuario o el usuario no tiene un rol permitido, no mostrar nada
  // if (!user || (allowedRoles && !allowedRoles.includes(user.role))) {
  //   return null
  // }

  // Si todo está bien, mostrar el contenido
  return <>{children}</>
}

export default ProtectedRoute