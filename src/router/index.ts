import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0, behavior: 'smooth' }
  },
  routes: [
    // ── Public Routes ──────────────────────────────────────────
    {
      path: '/',
      component: () => import('@/layouts/PublicLayout.vue'),
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('@/views/HomeView.vue'),
          meta: { title: 'Beranda | HMI Insan Cita' },
        },
        {
          path: 'tentang',
          name: 'about',
          component: () => import('@/views/AboutView.vue'),
          meta: { title: 'Tentang Kami | HMI Insan Cita' },
        },
        {
          path: 'berita',
          name: 'news',
          component: () => import('@/views/NewsView.vue'),
          meta: { title: 'Berita | HMI Insan Cita' },
        },
        {
          path: 'berita/:slug',
          name: 'news-detail',
          component: () => import('@/views/NewsDetailView.vue'),
          meta: { title: 'Berita | HMI Insan Cita' },
        },
        {
          path: 'agenda',
          name: 'agenda',
          component: () => import('@/views/AgendaView.vue'),
          meta: { title: 'Agenda | HMI Insan Cita' },
        },
        {
          path: 'galeri',
          name: 'gallery',
          component: () => import('@/views/GalleryView.vue'),
          meta: { title: 'Galeri | HMI Insan Cita' },
        },
        {
          path: 'daftar',
          name: 'register',
          component: () => import('@/views/RegisterView.vue'),
          meta: { title: 'Pendaftaran LK 1 | HMI Insan Cita' },
        },
        {
          path: 'kontak',
          name: 'contact',
          component: () => import('@/views/ContactView.vue'),
          meta: { title: 'Kontak | HMI Insan Cita' },
        },
      ],
    },
    // ── Auth Routes ────────────────────────────────────────────
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { title: 'Login Admin | HMI Insan Cita', guestOnly: true },
    },
    // ── Admin Routes (lazy-loaded, protected) ──────────────────
    {
      path: '/admin',
      component: () => import('@/layouts/AdminLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: '/admin/dashboard',
        },
        {
          path: 'dashboard',
          name: 'admin-dashboard',
          component: () => import('@/views/admin/DashboardView.vue'),
          meta: { title: 'Dashboard | Admin HMI' },
        },
        {
          path: 'berita',
          name: 'admin-articles',
          component: () => import('@/views/admin/ArticlesView.vue'),
          meta: { title: 'Kelola Berita | Admin HMI' },
        },
        {
          path: 'berita/baru',
          name: 'admin-article-create',
          component: () => import('@/views/admin/ArticleEditorView.vue'),
          meta: { title: 'Tulis Berita | Admin HMI' },
        },
        {
          path: 'berita/:id/edit',
          name: 'admin-article-edit',
          component: () => import('@/views/admin/ArticleEditorView.vue'),
          meta: { title: 'Edit Berita | Admin HMI' },
        },
        {
          path: 'agenda',
          name: 'admin-events',
          component: () => import('@/views/admin/EventsAdminView.vue'),
          meta: { title: 'Kelola Agenda | Admin HMI' },
        },
        {
          path: 'pendaftar-agenda',
          name: 'admin-event-registrations',
          component: () => import('@/views/admin/EventRegistrationsView.vue'),
          meta: { title: 'Pendaftar Agenda | Admin HMI' },
        },
        {
          path: 'galeri',
          name: 'admin-gallery',
          component: () => import('@/views/admin/GalleryAdminView.vue'),
          meta: { title: 'Kelola Galeri | Admin HMI' },
        },

        {
          path: 'pendaftar',
          name: 'admin-applicants',
          component: () => import('@/views/admin/ApplicantsView.vue'),
          meta: { title: 'Pendaftar LK 1 | Admin HMI' },
        },
        {
          path: 'pengurus',
          name: 'admin-members',
          component: () => import('@/views/admin/MembersAdminView.vue'),
          meta: { title: 'Kelola Pengurus | Admin HMI' },
        },
        {
          path: 'kelola-admin',
          name: 'admin-users',
          component: () => import('@/views/admin/AdminUsersView.vue'),
          meta: { title: 'Kelola Admin | Admin HMI', requiresSuperadmin: true },
        },
      ],
    },
    // ── 404 ────────────────────────────────────────────────────
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { title: 'Halaman Tidak Ditemukan | HMI Insan Cita' },
    },
  ],
})

// Navigation Guards
router.beforeEach((to, _from) => {
  const auth = useAuthStore()

  // Set document title
  if (to.meta.title) {
    document.title = to.meta.title as string
  }

  // Protect admin routes
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // Route khusus superadmin
  if (to.meta.requiresSuperadmin && auth.currentUser?.role !== 'superadmin') {
    return { name: 'admin-dashboard' }
  }

  // Redirect authenticated users away from login
  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'admin-dashboard' }
  }
})

export default router
