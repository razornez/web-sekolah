<?php foreach($temaaktif as $tema){ ?><?php } ?>
<body class="background-<?php echo $tema->style ?>">
	<!-- [ Pre-loader ] start -->
	<div class="loader-bg">
		<div class="loader-track">
			<div class="loader-fill"></div>
		</div>
	</div>
  <!-- [ Pre-loader ] End -->

	<!-- [ navigation menu ] start -->
	<nav class="pcoded-navbar menu-light ">
		<div class="navbar-wrapper  ">
			<div class="navbar-content scroll-div " >
				<div class="">
					<div class="main-menu-header">
						<img class="img-radius" src="<?php echo base_url() ?>resources/images/pengguna/default.png" alt="User-Profile-Image">
						<div class="user-details">
							<div id="more-details"><?php echo $this->session->userdata("user_nama") ?></div>
						</div>
					</div>
				</div>
				
				<ul class="nav pcoded-inner-navbar ">
					
					<li class="nav-item pcoded-menu-caption">
						<label><strong>SMARTSCHOOL</strong> <span class="pcoded-badge badge badge-danger"><?php foreach($setting as $ver){ ?><?php echo $ver->version ?> <?php } ?></span></label>
						<span class="badge badge-info">PROSES <?php echo $this->benchmark->elapsed_time();?> | MEMORY <?php echo $this->benchmark->memory_usage();?></span>
					</li>

					<li class="nav-item">
						<a href="<?php echo base_url() ?>admin/dashboard" class="nav-link ">
							<span class="pcoded-micon"><i class="feather icon-home"></i></span>
							<span class="pcoded-mtext">Dashboard</span>
						</a>
					</li>

					<li class="nav-item pcoded-hasmenu">
						<a href="#!" class="nav-link ">
							<span class="pcoded-micon"><i class="fas fa-landmark"></i></span>
							<span class="pcoded-mtext">Kelembagaan</span>
						</a>
						<ul class="pcoded-submenu">
							<li><a href="<?php echo base_url() ?>master/profilkelembagaan/1">Profil Sekolah</a></li>
							<li><a href="<?php echo base_url() ?>master/datapengguna">Data Pengguna</a></li>
							<li><a href="<?php echo base_url() ?>master/datasarpras">Data Sarpras</a></li>
						</ul>
					</li>

					<li class="nav-item pcoded-hasmenu">
						<a href="#!" class="nav-link ">
							<span class="pcoded-micon"><i class="fas fa-database"></i></span>
							<span class="pcoded-mtext">Master Data</span>
						</a>
						<ul class="pcoded-submenu">
							<li><a href="<?php echo base_url() ?>master/datatingkat">Data Tingkat</a></li>
							<li><a href="<?php echo base_url() ?>master/datakelas">Data Kelas</a></li>
							<li><a href="<?php echo base_url() ?>master/datasiswa">Data Siswa</a></li>
							<li><a href="<?php echo base_url() ?>master/dataguru">Data Guru</a></li>
							<!--<li><a href="<?php echo base_url() ?>master/datawalikelas">Data Wali Kelas</a></li> -->
						</ul>
					</li>

<!--
					<li class="nav-item pcoded-hasmenu">
						<a href="#!" class="nav-link ">
							<span class="pcoded-micon"><i class="fas fa-money-bill"></i></span>
							<span class="pcoded-mtext">PPDB</span>
						</a>
						<ul class="pcoded-submenu">
							<li><a href="<?php echo base_url() ?>master/settingppdb/1">Pengaturan PPDB</a></li>
							<li><a href="<?php echo base_url() ?>master/ketentuanppdb">Ketentuan PPDB</a></li>
							<li><a href="<?php echo base_url() ?>master/jalurppdb">Pengaturan Jalur</a></li>
							
						</ul>
					</li>

					<li class="nav-item pcoded-hasmenu">
						<a href="#!" class="nav-link ">
							<span class="pcoded-micon"><i class="feather icon-file-minus"></i></span>
							<span class="pcoded-mtext">Buku Tamu</span>
						</a>
						<ul class="pcoded-submenu">
							<li><a href="<?php echo base_url() ?>master/databukutamu">Data Buku Tamu</a></li>
						</ul>
					</li>-->

				

					<li class="nav-item pcoded-hasmenu">
						<a href="#!" class="nav-link ">
							<span class="pcoded-micon"><i class="feather icon-layers"></i></span>
							<span class="pcoded-mtext">Buku Induk</span>
						</a>
						<ul class="pcoded-submenu">
							<li><a href="<?php echo base_url() ?>master/bukuinduk">Cetak Buku Induk</a></li>
						</ul>
					</li>

				
					<li class="nav-item pcoded-hasmenu">
						<a href="#!" class="nav-link ">
							<span class="pcoded-micon"><i class="feather icon-clipboard"></i></span>
							<span class="pcoded-mtext"> E-Rapor</span>
						</a>
						<ul class="pcoded-submenu">
						 	<li><a href="<?php echo base_url() ?>master/tahunrapor">Setting Tahun Ajaran</a></li>
							<li><a href="<?php echo base_url() ?>master/datarapormapel">Mapel Umum</a></li>
							<!--<li><a href="<?php echo base_url() ?>master/dataraporekstra">Mapel Ekstra</a></li>-->
							<!--<li><a href="<?php echo base_url() ?>rapot/settingguru">Setting Guru</a></li>-->
						</ul>
					</li>




					<li class="nav-item pcoded-hasmenu">
						<a href="#!" class="nav-link ">
							<span class="pcoded-micon"><i class="feather icon-calendar"></i></span>
							<span class="pcoded-mtext">E-SmartBook</span>
						</a>
						<ul class="pcoded-submenu">
							<li><a href="<?php echo base_url() ?>master/videopembelajaran">Video Pembelajaran</a></li>
							<li><a href="<?php echo base_url() ?>master/databuku">Buku Pembelajaran</a></li>
						</ul>
					</li>

					<li class="nav-item pcoded-hasmenu">
						<a href="#!" class="nav-link ">
							<span class="pcoded-micon"><i class="feather icon-airplay"></i></span>
							<span class="pcoded-mtext">E-Osis</span>
						</a>
						<ul class="pcoded-submenu">
							<li><a href="<?php echo base_url() ?>master/monitorosis">Monitor Hasil</a></li>
							<li><a href="<?php echo base_url() ?>master/datacalonosis">Data Calon</a></li>
							<li><a href="<?php echo base_url() ?>master/datapemilihosis">Data Pemilih</a></li>
						</ul>
					</li>


					<li class="nav-item pcoded-hasmenu">
						<a href="#!" class="nav-link ">
							<span class="pcoded-micon"><i class="feather icon-airplay"></i></span>
							<span class="pcoded-mtext">E-Alumni</span>
						</a>
						<ul class="pcoded-submenu">
							<li><a href="<?php echo base_url() ?>master/dataalumni">Data Alumni</a></li>
						</ul>
					</li>

					<li class="nav-item pcoded-hasmenu">
						<a href="#!" class="nav-link ">
							<span class="pcoded-micon"><i class="feather icon-airplay"></i></span>
							<span class="pcoded-mtext">E-Kelulusan</span>
						</a>
						<ul class="pcoded-submenu">
							<li><a href="<?php echo base_url() ?>master/settingkelulusan">Pengaturan</a></li>
							<li><a href="<?php echo base_url() ?>master/datakelulusan">Data Kelulusan</a></li>
						</ul>
					</li>

					<li class="nav-item pcoded-hasmenu">
						<a href="#!" class="nav-link ">
							<span class="pcoded-micon"><i class="feather icon-watch"></i></span>
							<span class="pcoded-mtext">Presensi</span>
						</a>
						<ul class="pcoded-submenu">
							<li><a href="<?php echo base_url() ?>master/settingkehadiran">Setting Kehadiran</a></li>
							<li><a href="<?php echo base_url() ?>master/kehadiranguru">Kehadiran Guru</a></li>
							<li><a href="<?php echo base_url() ?>master/kehadiransiswa">Kehadiran Siswa</a></li>
						</ul>
					</li>


					<li class="nav-item pcoded-hasmenu">
						<a href="#!" class="nav-link ">
							<span class="pcoded-micon"><i class="feather icon-mail"></i></span>
							<span class="pcoded-mtext">Persuratan</span>
						</a>
						<ul class="pcoded-submenu">
							<li><a href="<?php echo base_url() ?>master/suratketeranganaktifsiswa">Surat Keterangan Aktif</a></li>
							<li><a href="<?php echo base_url() ?>master/dataundanganortu">Surat Panggilan</a></li>
							<li><a href="<?php echo base_url() ?>master/dataundanganwalimurid">Surat Undangan</a></li>
							<li><a href="<?php echo base_url() ?>master/datamutasisiswa">Mutasi Siswa</a></li>
							<li><a href="<?php echo base_url() ?>master/suratbaru">Surat Baru</a></li>
							<!-- <li><a href="<?php echo base_url() ?>master/datamutasisiswa">Keterangan Perubahan NISN Siswa</a></li>
							<li><a href="<?php echo base_url() ?>master/datamutasisiswa">Rekomendasi</a></li>
							<li><a href="<?php echo base_url() ?>master/datamutasisiswa">Keterangan Berkelakukan Baik</a></li>
							<li><a href="<?php echo base_url() ?>master/datamutasisiswa">Keterangan Kesalahan Penulisan Izazah</a></li>
							<li><a href="<?php echo base_url() ?>master/datamutasisiswa">Keputusan Kepala Madrasah</a></li>
							<li><a href="<?php echo base_url() ?>master/datamutasisiswa">Keterangan Kesalahan Biodata Izazah</a></li>
							<li><a href="<?php echo base_url() ?>master/datamutasisiswa">Keterangan Siswa Pindahan</a></li>
							<li><a href="<?php echo base_url() ?>master/datamutasisiswa">Keterangan Siswa</a></li>
							<li><a href="<?php echo base_url() ?>master/datamutasisiswa">Keterangan Keluar/Pindah</a></li> -->
						</ul>
					</li>


<!--
					<li class="nav-item pcoded-hasmenu">
						<a href="#!" class="nav-link ">
							<span class="pcoded-micon"><i class="feather icon-bar-chart"></i></span>
							<span class="pcoded-mtext">Manajemen BK</span>
						</a>
						<ul class="pcoded-submenu">
							<li><a href="<?php echo base_url() ?>master/dataprestasi">Prestasi Siswa</a></li>
							<li><a href="<?php echo base_url() ?>master/datakategoripelanggaran">Kategori Pelanggaran</a></li>
							<li><a href="<?php echo base_url() ?>master/datapelanggaran">Pelanggaran Siswa</a></li>
						</ul>
					</li> -->


					<li class="nav-item pcoded-hasmenu">
						<a href="#!" class="nav-link ">
							<span class="pcoded-micon"><i class="feather icon-settings"></i></span>
							<span class="pcoded-mtext">Pengaturan</span>
						</a>
						<ul class="pcoded-submenu">
							<li><a href="<?php echo base_url() ?>pengaturan/tema">Tema</a></li>
							<li><a href="<?php echo base_url() ?>pengaturan/gambarberanda/1">Gambar Banner</a></li>
							<li><a href="<?php echo base_url() ?>pengaturan/menulayanansiswa">Layanan Siswa</a></li>
						</ul>
					</li>
				

	

					<li class="nav-item">
						<a href="<?php echo base_url() ?>admin/dashboard/logout" class="nav-link ">
							<span class="pcoded-micon"><i class="feather icon-power"></i></span>
							<span class="pcoded-mtext">Keluar</span>
						</a>
					</li>
				</ul>
				
				<div class="card text-center">
					<div class="card-block">
						<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>
						<i class="feather icon-sunset f-40"></i>
						<h6 class="mt-3">Butuh Bantuan ?</h6>
						<p>Silahkan hubungi Administrator anda bila menemui masalah</p>
						<a href="#!" target="_blank" class="btn btn-primary btn-sm text-white m-0">Support XCode V.<?php foreach($setting as $ver){ ?><?php echo $ver->version ?> <?php } ?></a>
					</div>
				</div>
			</div>
		</div>
	</nav>
	
	

  	<header class="navbar pcoded-header navbar-expand-lg navbar-light header-blue">
				<div class="m-header">
					<a class="mobile-menu" id="mobile-collapse" href="#!"><span></span></a>
					<a href="#!" class="b-brand">
						<!-- ========   change your logo gambar di atas   ============ -->
					</a>
					<a href="#!" class="mob-toggler">
						<i class="feather icon-more-vertical"></i>
					</a>
				</div>
				<div class="collapse navbar-collapse">
					
					<ul class="navbar-nav ml-auto">
						<li>
							<div class="dropdown">
								<a class="dropdown-toggle" href="#" data-toggle="dropdown"><i class="icon feather icon-bell"></i></a>
								<div class="dropdown-menu dropdown-menu-right notification">
									<div class="noti-head">
										<h6 class="d-inline-block m-b-0">Notifications</h6>
										<div class="float-right">
											<a href="#!" class="m-r-10">mark as read</a>
											<a href="#!">clear all</a>
										</div>
									</div>
									<ul class="noti-body">
										<li class="n-title">
											<p class="m-b-0">Baru</p>
										</li>
										<li class="notification">
											<div class="media">
												<img class="img-radius" src="<?php echo base_url() ?>resources/images/pengguna/default.png" alt="Generic placeholder image">
												<div class="media-body">
													<p><strong>Exampremium</strong><span class="n-time text-muted"><i class="icon feather icon-clock m-r-10"></i>5 min</span></p>
													<p>SmartSchool V.<?php echo $ver->version ?></p>
												</div>
											</div>
										</li>
										
									</ul>
									<div class="noti-footer">
										<a href="#!">show all</a>
									</div>
								</div>
							</div>
						</li>
						<li>
							<div class="dropdown drp-user">
								<a href="#" class="dropdown-toggle" data-toggle="dropdown">
									<i class="feather icon-user"></i>
								</a>
								<div class="dropdown-menu dropdown-menu-right profile-notification">
									<div class="pro-head">
										<img src="<?php echo base_url() ?>resources/images/pengguna/default.png" class="img-radius" alt="User-Profile-Image">
										<span>User</span>
										<a href="<?php echo base_url() ?>admin/dashboard/logout" class="dud-logout" title="Logout">
											<i class="feather icon-log-out"></i>
										</a>
									</div>
									<ul class="pro-body">
										<li><a href="#" class="dropdown-item"><i class="feather icon-user"></i> Profile</a></li>
									</ul>
								</div>
							</div>
						</li>
					</ul>
				</div>
	</header>
	<!-- [ Header ] end -->

