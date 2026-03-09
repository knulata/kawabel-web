export default function PrivacyPage() {
  return (
    <div className="px-4 py-8 max-w-2xl mx-auto prose prose-sm">
      <h1>Kebijakan Privasi</h1>
      <p className="text-muted-foreground">Terakhir diperbarui: 9 Maret 2026</p>

      <h2>1. Data yang Kami Kumpulkan</h2>
      <p>Saat Anda masuk dengan Google, kami menyimpan:</p>
      <ul>
        <li>Nama dan alamat email</li>
        <li>Foto profil Google</li>
        <li>Data belajar (progress, skor, pencapaian)</li>
      </ul>

      <h2>2. Penggunaan Data</h2>
      <p>Data Anda digunakan untuk:</p>
      <ul>
        <li>Menyimpan progress belajar Anda</li>
        <li>Menampilkan profil di papan juara</li>
        <li>Meningkatkan layanan Kawabel</li>
      </ul>

      <h2>3. Penyimpanan Data</h2>
      <p>Data disimpan di server yang aman (Supabase/Vercel) dan tidak dijual atau dibagikan ke pihak ketiga untuk tujuan iklan.</p>

      <h2>4. Hak Pengguna</h2>
      <p>Anda dapat:</p>
      <ul>
        <li>Menghapus akun dan semua data Anda kapan saja</li>
        <li>Meminta salinan data Anda</li>
        <li>Keluar dari akun kapan saja</li>
      </ul>

      <h2>5. Keamanan Anak</h2>
      <p>Kawabel dirancang untuk siswa SD, SMP, dan SMA. Kami tidak mengumpulkan data pribadi anak secara langsung tanpa persetujuan orang tua. Orang tua dapat menghubungi kami untuk mengelola data anak mereka.</p>

      <h2>6. Kontak</h2>
      <p>Pertanyaan tentang privasi? Hubungi kami melalui WhatsApp di <a href="https://wa.me/628131102445">+62 813 1102 445</a>.</p>
    </div>
  );
}
