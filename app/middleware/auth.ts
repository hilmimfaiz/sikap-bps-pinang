import { defineNuxtRouteMiddleware, useCookie, navigateTo } from '#app'

export default defineNuxtRouteMiddleware((to: any) => {
  const token = useCookie('auth_token')

  // Ambil path saat ini
  const path = to.path

  // Cek apakah rute yang dituju adalah bagian dari Dashboard (Area Privat)
  // Ini akan mendeteksi: /dashboard, /en/dashboard, /dashboard/users, dll.
  // Termasuk jika ada prefix bahasa apapun.
  const isDashboardRoute = path.includes('/dashboard')

  // 1. Jika User SUDAH login (Punya Token)
  if (token.value) {
    // Jika user login mencoba akses halaman Publik (Home/Login), 
    // paksa masuk ke Dashboard agar tidak perlu login ulang.
    if (!isDashboardRoute) {
      return navigateTo('/dashboard')
    }
  }

  // 2. Jika User BELUM login (Tamu/Guest)
  if (!token.value) {
    // Jika tamu mencoba masuk ke area Dashboard, tendang ke Login
    if (isDashboardRoute) {
      return navigateTo('/login')
    }
    
    // Jika tamu akses halaman publik (/, /en, /login, /en/login), BIARKAN LEWAT.
    // Logika ini memperbaiki bug tombol ganti bahasa yang sebelumnya dianggap rute terlarang.
  }
})